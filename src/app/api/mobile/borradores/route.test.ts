import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '@/db'
import { ARCHIVO_AJENO, BORRADOR_NO_EXISTE, CUERPO_ILEGIBLE } from '@/lib/mobile-api'

// `@/lib/mobile-api` llega a `server-only` por `publish/batch`: mismo arreglo que
// `../schedule/route.test.ts`.
vi.mock('server-only', () => ({}))

const USUARIO: Usuario = {
  id: 'owner-1',
  correo: 'dueno@example.com',
  nombre: null,
  rol: 'usuario',
  zona: 'America/Santiago',
  tema: 'noche',
  sesionVersion: 1,
  invitadoEn: new Date('2026-01-01'),
  primerIngresoEn: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

let usuario: Usuario | null = USUARIO
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => usuario }))

const cargarBorrador = vi.fn()
const guardarBorrador = vi.fn()
vi.mock('@/lib/borradores', () => ({
  cargarBorrador: (...args: unknown[]) => cargarBorrador(...args),
  guardarBorrador: (...args: unknown[]) => guardarBorrador(...args),
}))

vi.mock('@/lib/borradores-movil', () => ({
  cuentasParaElTelefono: async () => ({
    propias: new Set(['ig-1', 'fb-1']),
    ajenas: new Map([['tt-1', 'TikTok']]),
  }),
}))

vi.mock('@/lib/storage', () => ({
  basePublica: () => 'https://cdn.ejemplo.cl',
  keyDesdeUrl: (base: string, url: string) => (url.startsWith(`${base}/`) ? url.slice(base.length + 1) : null),
}))

const { POST } = await import('./route')

const ID = '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'

function pedir(cuerpo: unknown): Request {
  return new Request('https://tu-parrilla.cl/api/mobile/borradores', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  })
}

beforeEach(() => {
  usuario = USUARIO
  cargarBorrador.mockReset()
  guardarBorrador.mockReset()
  guardarBorrador.mockResolvedValue({ id: ID })
})

describe('POST /api/mobile/borradores', () => {
  it('sin id, crea el borrador con los campos que lee el panel', async () => {
    const respuesta = await POST(
      pedir({
        texto: 'Hola',
        cuentas: ['ig-1'],
        cuando: '2026-10-20T22:00:00.000Z',
        opciones: { 'ig-1': { trialReel: true } },
        media: [{ url: 'https://cdn.ejemplo.cl/scheduled/a.mp4', mediaType: 'video', nombre: 'a.mp4' }],
      }),
    )
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ id: ID })
    expect(guardarBorrador).toHaveBeenCalledWith('owner-1', {
      id: null,
      // 22:00 UTC son las 19:00 en Santiago, que es lo que muestra el campo del panel.
      campos: {
        caption: ['Hola'],
        cuentas: ['ig-1'],
        scheduledAt: ['2026-10-20T19:00'],
        'instagramTrial:ig-1': ['on'],
      },
      fecha: new Date('2026-10-20T22:00:00.000Z'),
      media: [{ url: 'https://cdn.ejemplo.cl/scheduled/a.mp4', mediaType: 'video', nombre: 'a.mp4' }],
    })
    expect(cargarBorrador).not.toHaveBeenCalled()
  })

  it('con id, conserva lo que solo el panel sabe y deja fuera cuentas que no son del dueño', async () => {
    cargarBorrador.mockResolvedValue({
      id: ID,
      campos: { caption: ['Viejo'], cuentas: ['fb-1', 'tt-1'], 'tiktokModo:tt-1': ['directo'], reglaPalabra: ['GUIA'] },
      fecha: null,
      media: [],
    })
    const respuesta = await POST(pedir({ id: ID, texto: 'Nuevo', cuentas: ['ig-1', 'ajena'], cuando: null, media: [] }))
    expect(respuesta.status).toBe(200)
    expect(cargarBorrador).toHaveBeenCalledWith('owner-1', ID)
    expect(guardarBorrador).toHaveBeenCalledWith('owner-1', {
      id: ID,
      campos: {
        caption: ['Nuevo'],
        cuentas: ['ig-1', 'tt-1'],
        scheduledAt: [''],
        'tiktokModo:tt-1': ['directo'],
        reglaPalabra: ['GUIA'],
      },
      fecha: null,
      media: [],
    })
  })

  it('un archivo sin nombre toma el de su URL', async () => {
    await POST(pedir({ texto: 'Hola', media: [{ url: 'https://cdn.ejemplo.cl/scheduled/x-foto.jpg', mediaType: 'image' }] }))
    expect(guardarBorrador.mock.calls[0]![1].media).toEqual([
      { url: 'https://cdn.ejemplo.cl/scheduled/x-foto.jpg', mediaType: 'image', nombre: 'x-foto.jpg' },
    ])
  })

  it('un id que ya no existe, o que no tiene forma de id, es 404 y no se recrea', async () => {
    cargarBorrador.mockResolvedValue(null)
    for (const id of [ID, 'no-es-uuid']) {
      const respuesta = await POST(pedir({ id, texto: 'Hola' }))
      expect(respuesta.status).toBe(404)
      expect(await respuesta.json()).toEqual({ error: BORRADOR_NO_EXISTE })
    }
    expect(guardarBorrador).not.toHaveBeenCalled()
  })

  it('si se borra entre la lectura y el guardado, también es 404', async () => {
    cargarBorrador.mockResolvedValue({ id: ID, campos: {}, fecha: null, media: [] })
    guardarBorrador.mockResolvedValue({ perdido: true })
    const respuesta = await POST(pedir({ id: ID, texto: 'Hola' }))
    expect(respuesta.status).toBe(404)
    expect(await respuesta.json()).toEqual({ error: BORRADOR_NO_EXISTE })
  })

  it('un archivo de otro lado se rechaza', async () => {
    const respuesta = await POST(pedir({ texto: 'Hola', media: [{ url: 'https://otro.cl/scheduled/a.jpg', mediaType: 'image' }] }))
    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({ error: ARCHIVO_AJENO })
    expect(guardarBorrador).not.toHaveBeenCalled()
  })

  it('un cuerpo ilegible no se entiende, y sin sesión es 401', async () => {
    const respuesta = await POST(pedir('{no es json'))
    expect(respuesta.status).toBe(400)
    expect(await respuesta.json()).toEqual({ error: CUERPO_ILEGIBLE })
    usuario = null
    expect((await POST(pedir({ texto: 'Hola' }))).status).toBe(401)
    expect(guardarBorrador).not.toHaveBeenCalled()
  })
})
