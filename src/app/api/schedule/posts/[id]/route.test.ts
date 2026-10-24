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

const leer = vi.fn()
vi.mock('@/lib/schedule-leer', () => ({
  leerProgramados: (...args: unknown[]) => leer(...args),
}))
vi.mock('@/lib/usuarios', () => ({
  buscarPorId: async () => ({ zona: 'America/Santiago' }),
}))

const { DELETE, GET } = await import('./route')

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
  leer.mockReset()
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

describe('GET /api/schedule/posts/{id}', () => {
  const ID = '3f2a9c4e-1b2d-4e5f-8a9b-0c1d2e3f4a5b'
  const conId = Promise.resolve({ id: ID })
  function lectura(): Request {
    return new Request(`https://ejemplo.cl/api/schedule/posts/${ID}`, { headers: { authorization: 'Bearer tp_llave' } })
  }

  it('sin una llave válida es 401 y no lee nada', async () => {
    dueno.mockResolvedValueOnce(null)
    expect((await GET(lectura(), { params: conId })).status).toBe(401)
    expect(leer).not.toHaveBeenCalled()
  })

  it('devuelve el post, leído a nombre del dueño de la llave y en su zona', async () => {
    const post = { id: ID, redes: [{ red: 'tiktok', opciones: { modo: 'directo', ia: true } }] }
    leer.mockResolvedValueOnce([post])
    const r = await GET(lectura(), { params: conId })
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual(post)
    expect(leer.mock.calls[0]![0]).toBe('usuario-7')
    expect(leer.mock.calls[0]![2]).toBe('America/Santiago')
  })

  it('sin fila (no existe o no es del dueño) es 404', async () => {
    leer.mockResolvedValueOnce([])
    const r = await GET(lectura(), { params: conId })
    expect(r.status).toBe(404)
    expect(await r.json()).toEqual({ error: 'Ese post no existe.' })
  })

  it('un id sin forma de uuid es 404 sin ir a la base', async () => {
    const r = await GET(lectura(), { params })
    expect(r.status).toBe(404)
    expect(leer).not.toHaveBeenCalled()
  })
})
