import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Como `meta/meta.test.ts`: se dobla solo lo que toca la base, y se prueba la puerta. Lo que
// cambia acá es el secreto con que se firma, el del caso de uso de Instagram, y el origen que
// llega al borrado: solo las cuentas del login de Instagram.
const baja = vi.fn()
const borrado = vi.fn()
vi.mock('@/lib/social/meta-bajas', () => ({
  darDeBaja: (...args: unknown[]) => baja(...args),
  borrarDatosDe: (...args: unknown[]) => borrado(...args),
}))

const { POST: POST_baja } = await import('./baja/route')
const { POST: POST_borrado } = await import('./borrado/route')

const SECRETO = 'secreto-del-login-de-instagram'
const USUARIO = '17841400000000001'

const b64url = (s: string) => Buffer.from(s).toString('base64url')
function firmar(payload: object, secreto = SECRETO): string {
  const cuerpo = b64url(JSON.stringify(payload))
  const firma = createHmac('sha256', secreto).update(cuerpo).digest('base64url')
  return `${firma}.${cuerpo}`
}
const FIRMADO = firmar({ algorithm: 'HMAC-SHA256', user_id: USUARIO, issued_at: Math.floor(Date.now() / 1000) })

function peticion(ruta: string, signedRequest: string): Request {
  return new Request(`https://ejemplo.cl/api/social/instagram/${ruta}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ signed_request: signedRequest }).toString(),
  })
}

beforeEach(() => {
  vi.stubEnv('INSTAGRAM_LOGIN_APP_SECRET', SECRETO)
  // El secreto de la app de Meta no abre estas rutas: son de otro caso de uso.
  vi.stubEnv('INSTAGRAM_APP_SECRET', 'secreto-de-la-app-de-meta')
  baja.mockReset()
  borrado.mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/social/instagram/baja', () => {
  it('con la firma del login de Instagram da de baja solo las cuentas de ese login', async () => {
    baja.mockResolvedValueOnce(1)
    expect((await POST_baja(peticion('baja', FIRMADO))).status).toBe(200)
    expect(baja).toHaveBeenCalledWith(USUARIO, 'instagram')
  })

  it('firmado con el secreto de la app de Meta es 400', async () => {
    const otro = firmar({ algorithm: 'HMAC-SHA256', user_id: USUARIO, issued_at: Math.floor(Date.now() / 1000) }, 'secreto-de-la-app-de-meta')
    expect((await POST_baja(peticion('baja', otro))).status).toBe(400)
    expect(baja).not.toHaveBeenCalled()
  })

  it('sin su secreto configurado la ruta queda cerrada', async () => {
    vi.stubEnv('INSTAGRAM_LOGIN_APP_SECRET', '')
    expect((await POST_baja(peticion('baja', FIRMADO))).status).toBe(400)
    expect(baja).not.toHaveBeenCalled()
  })
})

describe('POST /api/social/instagram/borrado', () => {
  it('borra lo del login de Instagram y responde el código y la URL de estado', async () => {
    borrado.mockResolvedValueOnce({ codigo: 'abcdefghijklmnop', cuentas: 1 })
    const r = await POST_borrado(peticion('borrado', FIRMADO))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      url: 'https://ejemplo.cl/borrado/abcdefghijklmnop',
      confirmation_code: 'abcdefghijklmnop',
    })
    expect(borrado).toHaveBeenCalledWith(USUARIO, 'instagram')
  })

  it('si la base falla es 500, para que Meta reintente', async () => {
    borrado.mockRejectedValueOnce(new Error('sin base'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await POST_borrado(peticion('borrado', FIRMADO))).status).toBe(500)
    vi.restoreAllMocks()
  })
})
