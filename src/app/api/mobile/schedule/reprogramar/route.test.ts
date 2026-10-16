import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '@/db'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { DESTINO_NO_EXISTE, REPROGRAMAR_PASADO } from '@/lib/social/publish/reprogramar'

// `@/lib/mobile-api` llega a `@/lib/usuarios` por `publish/batch`, que trae `server-only`
// (no resuelve bajo Vitest). Mismo arreglo que `../route.test.ts`.
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

const reprogramarDestino = vi.fn()
vi.mock('@/lib/social/publish/reprogramar', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/social/publish/reprogramar')>()
  return { ...real, reprogramarDestino: (...args: unknown[]) => reprogramarDestino(...args) }
})

const { POST } = await import('./route')

function pedir(cuerpo: unknown): Request {
  return new Request('https://tu-parrilla.cl/api/mobile/schedule/reprogramar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  })
}

const EN_UNA_HORA = () => new Date(Date.now() + 3_600_000).toISOString()

beforeEach(() => {
  usuario = USUARIO
  reprogramarDestino.mockReset()
  reprogramarDestino.mockResolvedValue('reprogramado')
})

describe('POST /api/mobile/schedule/reprogramar', () => {
  it('reprograma el destino del dueño a la hora pedida', async () => {
    const cuando = EN_UNA_HORA()
    const respuesta = await POST(pedir({ destino: 'destino-1', cuando }))
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(reprogramarDestino).toHaveBeenCalledWith('owner-1', 'destino-1', new Date(cuando))
  })

  it('sin sesión, 401', async () => {
    usuario = null
    expect((await POST(pedir({ destino: 'destino-1', cuando: EN_UNA_HORA() }))).status).toBe(401)
  })

  it('una hora pasada o ilegible es la frase del panel', async () => {
    for (const cuando of [new Date(Date.now() - 60_000).toISOString(), 'mañana', null]) {
      const respuesta = await POST(pedir({ destino: 'destino-1', cuando }))
      expect(respuesta.status).toBe(400)
      expect(await respuesta.json()).toEqual({ error: REPROGRAMAR_PASADO })
    }
    expect(reprogramarDestino).not.toHaveBeenCalled()
  })

  it('un cuerpo sin destino, o ilegible, no se entiende', async () => {
    for (const cuerpo of [{ cuando: EN_UNA_HORA() }, '{no es json']) {
      const respuesta = await POST(pedir(cuerpo))
      expect(respuesta.status).toBe(400)
      expect(await respuesta.json()).toEqual({ error: CUERPO_ILEGIBLE })
    }
  })

  it('un destino que no existe, o que no es del dueño, es 404', async () => {
    reprogramarDestino.mockResolvedValue('no-existe')
    const respuesta = await POST(pedir({ destino: 'ajeno', cuando: EN_UNA_HORA() }))
    expect(respuesta.status).toBe(404)
    expect(await respuesta.json()).toEqual({ error: DESTINO_NO_EXISTE })
  })
})
