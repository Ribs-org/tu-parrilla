import { beforeEach, describe, expect, it, vi } from 'vitest'

// La ruta que firma las subidas del teléfono. Sin almacén ni sesión de verdad: la firma se dobla,
// y lo que importa es con qué tipo firma y que se lo devuelva al teléfono, que tiene que mandar
// ese mismo en el PUT.

vi.mock('server-only', () => ({}))
const sesion = vi.hoisted(() => ({ adentro: true }))
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => (sesion.adentro ? { id: 'u-1' } : null) }))
vi.mock('@/lib/storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/storage')>()),
  urlParaSubir: async (key: string, tipo: string) => ({ subir: `https://r2.ejemplo/${key}?tipo=${tipo}`, publica: `https://cdn.ejemplo.cl/${key}` }),
}))

const { POST } = await import('./route')

const pedir = (cuerpo: Record<string, unknown>) =>
  POST(new Request('https://ejemplo.cl/api/mobile/upload-url', { method: 'POST', body: JSON.stringify(cuerpo) }))

beforeEach(() => {
  sesion.adentro = true
})

describe('POST /api/mobile/upload-url', () => {
  it('sin sesión, 401', async () => {
    sesion.adentro = false
    expect((await pedir({ nombre: 'a.mp4', tipo: 'video/mp4', bytes: 10 })).status).toBe(401)
  })

  it('devuelve el tipo con que firmó, ya canónico: un image/jpg se firma y se devuelve image/jpeg', async () => {
    const respuesta = await pedir({ nombre: 'foto.jpg', tipo: 'image/jpg', bytes: 1000 })
    expect(respuesta.status).toBe(200)
    const cuerpo = await respuesta.json()
    expect(cuerpo).toMatchObject({ mediaType: 'image', tipo: 'image/jpeg' })
    expect(cuerpo.subir).toContain('tipo=image/jpeg')
    expect(cuerpo.publica).toMatch(/^https:\/\/cdn\.ejemplo\.cl\/scheduled\/[0-9a-f-]{36}-foto\.jpg$/)
  })

  it('un formato que no se publica se rechaza con su frase', async () => {
    const respuesta = await pedir({ nombre: 'foto.heic', tipo: 'image/heic', bytes: 1000 })
    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({ error: 'Ese tipo de archivo no se puede publicar.' })
  })
})
