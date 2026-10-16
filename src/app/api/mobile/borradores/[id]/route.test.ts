import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '@/db'
import { BORRADOR_NO_EXISTE } from '@/lib/mobile-api'

vi.mock('server-only', () => ({}))

const USUARIO: Usuario = {
  id: 'owner-1',
  correo: 'dueno@example.com',
  nombre: null,
  rol: 'usuario',
  zona: 'America/Santiago',
  sesionVersion: 1,
  invitadoEn: new Date('2026-01-01'),
  primerIngresoEn: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

let usuario: Usuario | null = USUARIO
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => usuario }))

const cargarBorrador = vi.fn()
const borrarBorrador = vi.fn()
vi.mock('@/lib/borradores', () => ({
  cargarBorrador: (...args: unknown[]) => cargarBorrador(...args),
  borrarBorrador: (...args: unknown[]) => borrarBorrador(...args),
}))

// `abrirEnElTelefono` es real: es la forma que la app lee.
vi.mock('@/lib/borradores-movil', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/borradores-movil')>()
  return {
    ...real,
    cuentasParaElTelefono: async () => ({ propias: new Set(['ig-1']), ajenas: new Map([['tt-1', 'TikTok']]) }),
  }
})

const { GET, DELETE } = await import('./route')

const ID = '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'
const pedido = (metodo: string) => new Request(`https://tu-parrilla.cl/api/mobile/borradores/${ID}`, { method: metodo })
const con = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  usuario = USUARIO
  cargarBorrador.mockReset()
  borrarBorrador.mockReset()
})

describe('GET /api/mobile/borradores/[id]', () => {
  it('devuelve lo que Publicar sabe mostrar, sin las cuentas que el teléfono no publica', async () => {
    cargarBorrador.mockResolvedValue({
      id: ID,
      campos: {
        caption: ['Hola'],
        cuentas: ['ig-1', 'tt-1'],
        'instagramTrial:ig-1': ['on'],
        reglaPalabra: ['GUIA'],
      },
      fecha: new Date('2026-10-20T22:00:00.000Z'),
      media: [{ url: 'https://cdn.ejemplo.cl/scheduled/a.mp4', mediaType: 'video', nombre: 'a.mp4' }],
    })
    const respuesta = await GET(pedido('GET'), con(ID))
    expect(respuesta.status).toBe(200)
    expect(cargarBorrador).toHaveBeenCalledWith('owner-1', ID)
    expect(await respuesta.json()).toEqual({
      id: ID,
      texto: 'Hola',
      cuentas: ['ig-1'],
      trial: ['ig-1'],
      cuando: '2026-10-20T19:00:00-03:00',
      media: [{ url: 'https://cdn.ejemplo.cl/scheduled/a.mp4', mediaType: 'video', nombre: 'a.mp4' }],
      soloEnElPanel: 'Este borrador va también a TikTok y tiene la palabra clave «GUIA»: eso se programa en el panel web.',
    })
  })

  it('uno que no existe, o un id sin forma de id, es 404', async () => {
    cargarBorrador.mockResolvedValue(null)
    for (const id of [ID, 'nada']) {
      const respuesta = await GET(pedido('GET'), con(id))
      expect(respuesta.status).toBe(404)
      expect(await respuesta.json()).toEqual({ error: BORRADOR_NO_EXISTE })
    }
    expect(cargarBorrador).toHaveBeenCalledTimes(1)
  })

  it('sin sesión, 401', async () => {
    usuario = null
    expect((await GET(pedido('GET'), con(ID))).status).toBe(401)
  })
})

describe('DELETE /api/mobile/borradores/[id]', () => {
  it('lo borra atado al dueño, y responde que salió aunque ya no estuviera', async () => {
    const respuesta = await DELETE(pedido('DELETE'), con(ID))
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(borrarBorrador).toHaveBeenCalledWith('owner-1', ID)
  })

  it('un id sin forma de id no llega a la base', async () => {
    expect((await DELETE(pedido('DELETE'), con('nada'))).status).toBe(200)
    expect(borrarBorrador).not.toHaveBeenCalled()
  })

  it('sin sesión, 401', async () => {
    usuario = null
    expect((await DELETE(pedido('DELETE'), con(ID))).status).toBe(401)
    expect(borrarBorrador).not.toHaveBeenCalled()
  })
})
