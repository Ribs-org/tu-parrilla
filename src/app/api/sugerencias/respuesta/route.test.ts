import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// La puerta de `POST /api/sugerencias/respuesta`: sin llave, 401; con la de otra cuenta, 403; y
// con la del admin, la respuesta se guarda y el aviso sale después. Se doblan la llave, la
// lectura del usuario y lo que toca la base; guardar y avisar lo prueba la integración.
const dueno = vi.fn()
vi.mock('@/lib/llaves', () => ({ duenoDeLaLlave: (...a: unknown[]) => dueno(...a) }))
const usuario = vi.fn()
vi.mock('@/lib/usuarios', () => ({ buscarPorId: (...a: unknown[]) => usuario(...a) }))
const responder = vi.fn()
const avisar = vi.fn()
vi.mock('@/lib/sugerencias/responder', () => ({
  responderSugerencia: (...a: unknown[]) => responder(...a),
  avisarDeLaRespuesta: (...a: unknown[]) => avisar(...a),
}))
vi.mock('@/lib/sugerencias/github', () => ({ clienteGithub: () => null }))
const despues: Array<() => Promise<void>> = []
vi.mock('next/server', async (original) => ({
  ...(await original<typeof import('next/server')>()),
  after: (fn: () => Promise<void>) => despues.push(fn),
}))

const { POST } = await import('./route')
const { RESPUESTA_SIN_CUAL, SOLO_EL_ADMIN, SUGERENCIA_NO_EXISTE } = await import('@/lib/sugerencias/respuestas')

function peticion(cuerpo: unknown): Request {
  return new Request('https://ejemplo.cl/api/sugerencias/respuesta', {
    method: 'POST',
    headers: { authorization: 'Bearer tp_llave', 'content-type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  })
}

beforeEach(() => {
  despues.length = 0
  dueno.mockReset().mockResolvedValue('admin-1')
  usuario.mockReset().mockResolvedValue({ id: 'admin-1', rol: 'admin' })
  responder.mockReset().mockResolvedValue({ id: 's-1', issue: 321, primera: true, cambio: true })
  avisar.mockReset().mockResolvedValue({ correo: true, comentario: true })
})

describe('POST /api/sugerencias/respuesta', () => {
  it('sin una llave válida es 401 y no toca nada', async () => {
    dueno.mockResolvedValueOnce(null)
    const r = await POST(peticion({ issue: 321, respuesta: 'Hola' }))
    expect(r.status).toBe(401)
    expect(await r.text()).toBe('No autorizado')
    expect(responder).not.toHaveBeenCalled()
  })

  it('con la llave de alguien que no es el admin es 403 con la frase', async () => {
    usuario.mockResolvedValueOnce({ id: 'u-2', rol: 'usuario' })
    const r = await POST(peticion({ issue: 321, respuesta: 'Hola' }))
    expect(r.status).toBe(403)
    expect(await r.json()).toEqual({ error: SOLO_EL_ADMIN })
    expect(responder).not.toHaveBeenCalled()
  })

  it('sin cuál, 400 con la frase; con un cuerpo roto, 400', async () => {
    const r = await POST(peticion({ respuesta: 'Hola' }))
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({ error: RESPUESTA_SIN_CUAL })
    expect((await POST(peticion('{roto'))).status).toBe(400)
  })

  it('responde por el número del issue y avisa después de responder', async () => {
    const r = await POST(peticion({ issue: 321, respuesta: ' Buena idea. ' }))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, sugerencia: { id: 's-1', issue: 321, primera: true, cambio: true } })
    expect(responder).toHaveBeenCalledWith({ id: 'admin-1', rol: 'admin' }, { issue: 321 }, 'Buena idea.')
    expect(avisar).not.toHaveBeenCalled()
    await despues[0]!()
    expect(avisar).toHaveBeenCalledWith('s-1', true, null)
  })

  it('la misma respuesta de antes no avisa; una que no existe es 404', async () => {
    responder.mockResolvedValueOnce({ id: 's-1', issue: 321, primera: false, cambio: false })
    expect((await POST(peticion({ issue: 321, respuesta: 'Igual' }))).status).toBe(200)
    expect(despues).toHaveLength(0)
    responder.mockResolvedValueOnce({ error: SUGERENCIA_NO_EXISTE, status: 404 })
    const r = await POST(peticion({ issue: 9, respuesta: 'x' }))
    expect(r.status).toBe(404)
    expect(await r.json()).toEqual({ error: SUGERENCIA_NO_EXISTE })
  })
})
