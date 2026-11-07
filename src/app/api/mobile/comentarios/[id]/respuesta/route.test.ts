import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const usuario = vi.hoisted(() => ({ actual: { id: 'owner-1' } as { id: string } | null }))
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => usuario.actual }))

const responder = vi.hoisted(() => vi.fn())
vi.mock('@/lib/social/comentarios/responder', () => ({ responderComentario: responder }))

const { POST } = await import('./route')

const ID = '00000000-0000-4000-8000-000000000001'

function enviar(cuerpo: string, id = ID) {
  return POST(new Request(`https://ejemplo.cl/api/mobile/comentarios/${id}/respuesta`, { method: 'POST', body: cuerpo }), {
    params: Promise.resolve({ id }),
  })
}

beforeEach(() => {
  usuario.actual = { id: 'owner-1' }
  responder.mockReset()
})

describe('POST /api/mobile/comentarios/[id]/respuesta', () => {
  it('sin sesión del teléfono, 401 y nada sale', async () => {
    usuario.actual = null
    expect((await enviar('{"texto":"hola"}')).status).toBe(401)
    expect(responder).not.toHaveBeenCalled()
  })

  it('un id sin forma de uuid es un comentario que no está, sin ir a la base', async () => {
    const res = await enviar('{"texto":"hola"}', 'no-es-un-id')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'El comentario ya no está en la red.' })
    expect(responder).not.toHaveBeenCalled()
  })

  it('un cuerpo sin texto es un 400 con la frase de siempre', async () => {
    const res = await enviar('{"otra":1}')
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'El cuerpo no se entendió.' })
  })

  it('manda con el dueño del token y devuelve la frase del panel con su código', async () => {
    responder.mockResolvedValueOnce({ error: 'Esa cuenta ya no está conectada.' })
    const res = await enviar('{"texto":"¡Gracias!"}')
    expect(responder).toHaveBeenCalledWith('owner-1', ID, '¡Gracias!')
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Esa cuenta ya no está conectada.' })

    responder.mockResolvedValueOnce({ ok: true })
    const bien = await enviar('{"texto":"¡Gracias!"}')
    expect(bien.status).toBe(200)
    expect(await bien.json()).toEqual({ ok: true })
  })
})
