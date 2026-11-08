import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'

vi.mock('server-only', () => ({}))

// La base doblada al nivel de drizzle, como en `sync.test.ts`: cada `select` devuelve la
// siguiente respuesta de la cola —primero las cuentas, después las publicaciones de cada
// dueño— y cada `insert` anota lo que escribió.
const { escrituras, respuestas } = vi.hoisted(() => ({
  escrituras: [] as unknown[][],
  respuestas: [] as unknown[][],
}))

vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  const eslabon = (filas: () => unknown[]) => {
    const paso = {
      values: (valores: unknown[]) => {
        escrituras.push(valores)
        return paso
      },
      onConflictDoUpdate: () => paso,
      from: () => paso,
      where: () => paso,
      orderBy: () => paso,
      then: (ok?: never, err?: never) => Promise.resolve(filas()).then(ok, err),
    }
    return paso
  }
  return {
    ...real,
    getDb: () => ({
      select: () => {
        const filas = respuestas.shift() ?? []
        return eslabon(() => filas)
      },
      insert: () => eslabon(() => []),
      delete: () => eslabon(() => []),
    }),
  }
})

// El token guardado es el texto mismo: lo que importa acá es cuál se usó.
vi.mock('./crypto', () => ({ decryptToken: (t: string) => t }))

const { ordenDeTokens, sincronizarAnuncios } = await import('./anuncios-sync')

function cuenta(id: string, network: string, ownerId: string, creada: string): SocialAccount {
  return {
    id,
    ownerId,
    network,
    handle: id,
    externalId: `ext-${id}`,
    metaUserId: null,
    login: null,
    accessToken: `tok-${id}`,
    refreshToken: null,
    expiresAt: null,
    lastSyncedAt: null,
    lastSyncError: null,
    caidaAvisadaEn: null,
    pushFierro: null,
    trialReels: null,
    trialReelsMotivo: null,
    trialReelsEn: null,
    tiktokMusica: null,
    scopes: null,
    analiticaVerificadaEn: null,
    createdAt: new Date(creada),
  }
}

/** Graph de mentira: el token `tok-ig` no tiene el permiso; los demás ven una cuenta con un anuncio. */
function graphConTokens(sinPermiso: string[]) {
  const usados: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (texto: string) => {
      const url = new URL(texto)
      const token = url.searchParams.get('access_token')!
      usados.push(`${token} ${url.pathname}`)
      if (sinPermiso.includes(token)) {
        return new Response(JSON.stringify({ error: { message: 'Requires ads_read permission', code: 200 } }), { status: 403 })
      }
      if (url.pathname.endsWith('/me/adaccounts')) {
        return Response.json({ data: [{ id: 'act_1', name: 'Mi cuenta', currency: 'CLP' }] })
      }
      return Response.json({
        data: [
          {
            id: 'AD_1',
            creative: { effective_instagram_media_id: 'IG_MEDIA' },
            insights: { data: [{ spend: '1000', impressions: '50', date_start: '2026-10-01', date_stop: '2026-10-02' }] },
          },
        ],
      })
    }),
  )
  return usados
}

beforeEach(() => {
  escrituras.length = 0
  respuestas.length = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ordenDeTokens', () => {
  it('primero Instagram, que guarda el token de usuario; dentro de cada red, la más antigua', () => {
    const orden = ordenDeTokens([
      cuenta('fb-viejo', 'facebook', 'd', '2026-01-01'),
      cuenta('ig-nuevo', 'instagram', 'd', '2026-06-01'),
      cuenta('ig-viejo', 'instagram', 'd', '2026-02-01'),
    ])
    expect(orden.map((c) => c.id)).toEqual(['ig-viejo', 'ig-nuevo', 'fb-viejo'])
  })

  it('deja fuera el Instagram del login de Instagram: su token no sirve para la Marketing API', () => {
    const orden = ordenDeTokens([
      { ...cuenta('ig-sin-pagina', 'instagram', 'd', '2026-01-01'), login: 'instagram' as const },
      cuenta('ig-de-facebook', 'instagram', 'd', '2026-02-01'),
      cuenta('fb', 'facebook', 'd', '2026-03-01'),
    ])
    expect(orden.map((c) => c.id)).toEqual(['ig-de-facebook', 'fb'])
  })
})

describe('sincronizarAnuncios', () => {
  it('lee solo a los dueños que la variable nombra', async () => {
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', 'revisor')
    const usados = graphConTokens([])
    respuestas.push([cuenta('ig', 'instagram', 'revisor', '2026-01-01'), cuenta('otra', 'instagram', 'otro', '2026-01-01')])
    respuestas.push([{ id: 'post-1', network: 'instagram', externalId: 'IG_MEDIA' }])

    expect(await sincronizarAnuncios()).toBe(1)
    expect(usados.every((u) => u.startsWith('tok-ig '))).toBe(true)
    // El anuncio queda en la cuenta cuyo token lo leyó, atado a la publicación que promocionó.
    expect(escrituras).toHaveLength(1)
    expect(escrituras[0]).toEqual([expect.objectContaining({ accountId: 'ig', externalId: 'AD_1', postId: 'post-1', gasto: 1000 })])
  })

  it('si el token de Instagram no sirve, prueba el de Facebook', async () => {
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', '1')
    const usados = graphConTokens(['tok-ig'])
    respuestas.push([cuenta('fb', 'facebook', 'd', '2026-01-01'), cuenta('ig', 'instagram', 'd', '2026-03-01')])
    respuestas.push([])

    expect(await sincronizarAnuncios()).toBe(1)
    expect(usados[0]).toMatch(/^tok-ig /)
    expect(escrituras[0]).toEqual([expect.objectContaining({ accountId: 'fb', postId: null })])
  })

  it('sin ningún token que sirva no lanza: lo orgánico ya quedó guardado', async () => {
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', '1')
    graphConTokens(['tok-ig', 'tok-fb'])
    respuestas.push([cuenta('ig', 'instagram', 'd', '2026-01-01'), cuenta('fb', 'facebook', 'd', '2026-01-01')])

    expect(await sincronizarAnuncios()).toBe(0)
    expect(escrituras).toHaveLength(0)
    // El error queda en el registro, sin el token: la URL nunca entra en el mensaje.
    const registrado = String(vi.mocked(console.error).mock.calls[0]?.[1])
    expect(registrado).toContain('ads_read')
    expect(registrado).not.toContain('tok-')
  })

  it('con la variable vacía no le pide nada a Meta', async () => {
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', '')
    const usados = graphConTokens([])
    respuestas.push([cuenta('ig', 'instagram', 'd', '2026-01-01')])

    expect(await sincronizarAnuncios()).toBe(0)
    expect(usados).toEqual([])
  })
})
