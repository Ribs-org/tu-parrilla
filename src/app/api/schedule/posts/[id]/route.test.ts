import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BORRADO_YA_PUBLICADO } from '@/lib/schedule-api'

vi.mock('server-only', () => ({}))

// Se doblan solo las funciones que tocan la base: lo que se prueba acá es la puerta —que
// sin dueño no se toca nada, y que se borra a nombre del dueño de la llave— y el mapeo de
// cada resultado a su código. Qué llave es de quién lo prueba `llaves.test.ts`, y la regla
// de borrado tiene su propio test.
const dueno = vi.fn()
vi.mock('@/lib/llaves', () => ({
  duenoDeLaLlave: (...args: unknown[]) => dueno(...args),
}))
const borrar = vi.fn()
vi.mock('@/lib/social/publish/borrar', () => ({
  borrarPostProgramado: (...args: unknown[]) => borrar(...args),
}))

const { DELETE } = await import('./route')

function peticion(): Request {
  return new Request('https://ejemplo.cl/api/schedule/posts/p1', {
    method: 'DELETE',
    headers: { authorization: 'Bearer tp_llave' },
  })
}
const params = Promise.resolve({ id: 'p1' })

beforeEach(() => {
  dueno.mockReset()
  dueno.mockResolvedValue('usuario-7')
  borrar.mockReset()
})

describe('DELETE /api/schedule/posts/{id}', () => {
  it('sin una llave válida es 401 y no toca nada', async () => {
    dueno.mockResolvedValueOnce(null)
    expect((await DELETE(peticion(), { params })).status).toBe(401)
    expect(borrar).not.toHaveBeenCalled()
  })

  it('borra a nombre del dueño de la llave, con el id de la ruta', async () => {
    borrar.mockResolvedValueOnce('borrado')
    const r = await DELETE(peticion(), { params })
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, id: 'p1' })
    expect(borrar).toHaveBeenCalledWith('usuario-7', 'p1')
  })

  it('un post que no existe (o no es del dueño de la llave) es 404', async () => {
    borrar.mockResolvedValueOnce('no-existe')
    const r = await DELETE(peticion(), { params })
    expect(r.status).toBe(404)
    expect(await r.json()).toEqual({ error: 'Ese post no existe.' })
  })

  it('un post ya publicado o publicando es 409 con la frase del panel', async () => {
    borrar.mockResolvedValueOnce('publicado')
    const r = await DELETE(peticion(), { params })
    expect(r.status).toBe(409)
    expect(await r.json()).toEqual({ error: BORRADO_YA_PUBLICADO })
  })
})
