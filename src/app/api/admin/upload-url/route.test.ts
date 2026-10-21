import { beforeEach, describe, expect, it, vi } from 'vitest'

// La ruta que firma las subidas del panel: el compositor, el editor y las imágenes del perfil
// suben directo al almacén con lo que esto devuelve. Sin almacén ni sesión de verdad: la firma
// se dobla, y lo que importa es qué key y qué tipo firma para cada destino.

vi.mock('server-only', () => ({}))
const sesion = vi.hoisted(() => ({ adentro: true }))
vi.mock('@/lib/auth', () => ({ usuarioActual: async () => (sesion.adentro ? { id: 'u-1' } : null) }))
vi.mock('@/lib/storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/storage')>()),
  urlParaSubir: async (key: string, tipo: string) => ({ subir: `https://r2.ejemplo/${key}?firma&tipo=${tipo}`, publica: `https://cdn.ejemplo.cl/${key}` }),
}))

const { POST } = await import('./route')

const pedir = (cuerpo: Record<string, unknown>) =>
  POST(new Request('https://ejemplo.cl/api/admin/upload-url', { method: 'POST', body: JSON.stringify(cuerpo) }))

beforeEach(() => {
  sesion.adentro = true
})

describe('POST /api/admin/upload-url', () => {
  it('sin sesión, 401', async () => {
    sesion.adentro = false
    expect((await pedir({ nombre: 'a.mp4', tipo: 'video/mp4', bytes: 10 })).status).toBe(401)
  })

  it('por defecto firma un archivo de publicación, bajo scheduled/', async () => {
    const respuesta = await pedir({ nombre: 'clip.mp4', tipo: 'video/mp4', bytes: 1000 })
    expect(respuesta.status).toBe(200)
    const cuerpo = await respuesta.json()
    expect(cuerpo.publica).toMatch(/^https:\/\/cdn\.ejemplo\.cl\/scheduled\/[0-9a-f-]{36}-clip\.mp4$/)
    expect(cuerpo).toMatchObject({ mediaType: 'video', tipo: 'video/mp4' })
  })

  it('con destino «imagen» firma una imagen del perfil, bajo uploads/', async () => {
    const respuesta = await pedir({ nombre: 'avatar.png', tipo: 'image/png', bytes: 1000, destino: 'imagen' })
    expect(respuesta.status).toBe(200)
    const cuerpo = await respuesta.json()
    expect(cuerpo.publica).toMatch(/^https:\/\/cdn\.ejemplo\.cl\/uploads\/[0-9a-f-]{36}-avatar\.png$/)
    expect(cuerpo).toMatchObject({ mediaType: 'image', tipo: 'image/png' })
  })

  it('una imagen del perfil con un formato que no va, o de más de 8 MB, se rechaza con su frase', async () => {
    const svg = await pedir({ nombre: 'logo.svg', tipo: 'image/svg+xml', bytes: 1000, destino: 'imagen' })
    expect(svg.status).toBe(400)
    expect(await svg.json()).toEqual({ error: 'Formato no soportado.' })

    const grande = await pedir({ nombre: 'foto.jpg', tipo: 'image/jpeg', bytes: 9 * 1024 * 1024, destino: 'imagen' })
    expect(grande.status).toBe(400)
    expect(await grande.json()).toEqual({ error: 'La imagen supera los 8 MB.' })
  })
})
