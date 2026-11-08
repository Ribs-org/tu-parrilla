import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'

// Lo que pasa cuando Google ya no da acceso a un canal: el dueño quitó Tu Parrilla en
// myaccount.google.com, y la única señal es el `invalid_grant` al renovar el token.

const desconectarCuenta = vi.fn(async () => true)
vi.mock('../desconectar', () => ({ desconectarCuenta }))

// La renovación que sí funciona guarda el token nuevo: acá basta con ver que se intentó.
const guardado = vi.fn()
vi.mock('@/db', async (original) => ({
  ...(await original<typeof import('@/db')>()),
  getDb: () => ({ update: () => ({ set: (valores: unknown) => ({ where: async () => guardado(valores) }) }) }),
}))

const { encryptToken } = await import('../crypto')
const { YOUTUBE_REVOCADO, ensureYoutubeCredential, esTokenRevocado, renovarYoutube } = await import('./youtube')

const DUENO = '0b9c7a3e-2f4d-4e6a-8b1c-9d2e3f4a5b6c'
const CANAL = '6f1c1f8e-3a5b-4c2d-9e0f-1a2b3c4d5e6f'

function cuenta(extra: Partial<SocialAccount> = {}): SocialAccount {
  return {
    id: CANAL,
    ownerId: DUENO,
    network: 'youtube',
    handle: 'Mi canal',
    accessToken: encryptToken('acceso-viejo'),
    refreshToken: encryptToken('refresco'),
    // Vencido: hay que renovarlo.
    expiresAt: new Date(Date.now() - 60_000),
    ...extra,
  } as SocialAccount
}

const respuesta = (status: number, cuerpo: unknown) =>
  new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), { status })

const REVOCADO = { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }

describe('esTokenRevocado', () => {
  it('invalid_grant con 400 es un token que ya no sirve', () => {
    expect(esTokenRevocado(400, JSON.stringify(REVOCADO))).toBe(true)
  })

  it('lo demás no dice nada del canal: una variable mal puesta, un 5xx, un cuerpo raro', () => {
    expect(esTokenRevocado(401, JSON.stringify({ error: 'invalid_client' }))).toBe(false)
    expect(esTokenRevocado(400, JSON.stringify({ error: 'invalid_request' }))).toBe(false)
    expect(esTokenRevocado(500, JSON.stringify(REVOCADO))).toBe(false)
    expect(esTokenRevocado(503, 'Service Unavailable')).toBe(false)
    expect(esTokenRevocado(400, '<html>Bad Request</html>')).toBe(false)
  })
})

describe('renovarYoutube', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_SECRET', 'secreto-de-prueba-con-largo-suficiente')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'cliente')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'secreto')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    desconectarCuenta.mockClear()
    guardado.mockClear()
  })

  it('con invalid_grant, desconecta el canal con su motivo, y solo si sigue con el token que falló', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta(400, REVOCADO)))
    const revocada = cuenta()

    expect(await renovarYoutube(revocada)).toEqual({ revocada: true })
    expect(desconectarCuenta).toHaveBeenCalledWith(DUENO, CANAL, {
      motivo: YOUTUBE_REVOCADO,
      refreshToken: revocada.refreshToken,
    })
    expect(guardado).not.toHaveBeenCalled()
  })

  it('para publicar y para el sondeo de comentarios, revocado es no tener credencial', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta(400, REVOCADO)))
    expect(await ensureYoutubeCredential(cuenta())).toBeNull()
    expect(desconectarCuenta).toHaveBeenCalledTimes(1)
  })

  it('un tropiezo de Google no desconecta nada', async () => {
    for (const r of [respuesta(503, 'Service Unavailable'), respuesta(401, { error: 'invalid_client' })]) {
      vi.stubGlobal('fetch', vi.fn(async () => r))
      expect(await renovarYoutube(cuenta())).toEqual({ sin: true })
    }
    expect(desconectarCuenta).not.toHaveBeenCalled()
  })

  it('la renovación que funciona guarda el token nuevo y no desconecta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta(200, { access_token: 'acceso-nuevo', expires_in: 3599 })))
    expect(await renovarYoutube(cuenta())).toEqual({ token: 'acceso-nuevo' })
    expect(guardado).toHaveBeenCalledTimes(1)
    expect(desconectarCuenta).not.toHaveBeenCalled()
  })

  it('con el token todavía vigente no le pregunta a Google', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await renovarYoutube(cuenta({ expiresAt: new Date(Date.now() + 30 * 60_000) }))).toEqual({
      token: 'acceso-viejo',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sin credencial no hay nada que renovar', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await renovarYoutube(cuenta({ refreshToken: null }))).toEqual({ sin: true })
    expect(await renovarYoutube(cuenta({ accessToken: null }))).toEqual({ sin: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('una fila sin dueño no se puede desconectar por dueño: se dice revocada y no se toca', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuesta(400, REVOCADO)))
    expect(await renovarYoutube(cuenta({ ownerId: null }))).toEqual({ revocada: true })
    expect(desconectarCuenta).not.toHaveBeenCalled()
  })
})
