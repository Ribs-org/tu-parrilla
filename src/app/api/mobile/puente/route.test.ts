import { describe, expect, it, vi } from 'vitest'

// La ruta del puente: sin token no hay llave, y la llave va en el fragmento de la dirección.

vi.mock('server-only', () => ({}))
const { usuario } = vi.hoisted(() => ({ usuario: { actual: null as { id: string } | null } }))
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => usuario.actual }))
vi.mock('@/lib/limite-ip', () => ({ demasiadosIntentos: async () => false }))
const abrirPuente = vi.fn<(id: string) => Promise<string>>(async () => 'L'.repeat(43))
vi.mock('@/lib/puente', () => ({ abrirPuente: (id: string) => abrirPuente(id) }))

const { POST } = await import('./route')

describe('POST /api/mobile/puente', () => {
  it('sin la sesión del teléfono, 401 y ninguna llave', async () => {
    usuario.actual = null
    const respuesta = await POST(new Request('https://tu-parrilla.cl/api/mobile/puente', { method: 'POST' }))
    expect(respuesta.status).toBe(401)
    expect(abrirPuente).not.toHaveBeenCalled()
  })

  it('con ella, la dirección del puente con la llave en el fragmento', async () => {
    usuario.actual = { id: 'u-1' }
    const respuesta = await POST(new Request('https://tu-parrilla.cl/api/mobile/puente', { method: 'POST' }))
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ruta: `/ingresar/puente#t=${'L'.repeat(43)}` })
    expect(abrirPuente).toHaveBeenCalledWith('u-1')
  })
})
