import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// La puerta de `/api/pase/{código}`, sin base: el código abre su pase o es 404, cada rol hace solo lo
// suyo (403), y el pase sale en JSON o, con `?formato=texto`, como lista de tareas. Lo que hay detrás
// lo prueba `pase.integracion.test.ts`.
const entrar = vi.fn()
const comentar = vi.fn()
vi.mock('@/lib/pase/pase', () => ({
  entrarConCodigo: (...a: unknown[]) => entrar(...a),
  paseParaLaApi: async (_pase: unknown, rol: string) => ({ rol, titulo: 'Shorts', instrucciones: '', piezas: [] }),
  comentar: (...a: unknown[]) => comentar(...a),
  nuevaPieza: async () => ({ pieza: { id: 'p-2', grupo: 'g', version: 2, variante: 'A', url: 'u' }, resueltas: 1 }),
}))

const raiz = await import('./route')
const comentarios = await import('./comentarios/route')
const piezas = await import('./piezas/route')

const PASE = { id: 'pase-1', titulo: 'Shorts', instrucciones: '' }
const params = (codigo: string) => ({ params: Promise.resolve({ codigo }) })
const post = (cuerpo: unknown) =>
  new Request('https://tu-parrilla.cl/api/pase/x/comentarios', { method: 'POST', body: JSON.stringify(cuerpo), headers: { 'content-type': 'application/json' } })

beforeEach(() => {
  entrar.mockReset()
  comentar.mockReset()
})

describe('/api/pase/{código}', () => {
  it('un código que no abre es 404, con la frase', async () => {
    entrar.mockResolvedValueOnce(null)
    const r = await raiz.GET(new Request('https://tu-parrilla.cl/api/pase/rev_x'), params('rev_x'))
    expect(r.status).toBe(404)
    expect(await r.json()).toEqual({ error: 'Este enlace ya no sirve: pídele uno nuevo a quien te lo mandó.' })
  })

  it('el pase en JSON, o en texto para una IA, con la dirección para quien edita', async () => {
    entrar.mockResolvedValue({ pase: PASE, rol: 'editor' })
    const json = await raiz.GET(new Request('https://tu-parrilla.cl/api/pase/edi_x'), params('edi_x'))
    expect(await json.json()).toMatchObject({ rol: 'editor', titulo: 'Shorts' })
    const texto = await raiz.GET(new Request('https://tu-parrilla.cl/api/pase/edi_x?formato=texto'), params('edi_x'))
    expect(texto.headers.get('content-type')).toContain('text/markdown')
    expect(await texto.text()).toContain('https://tu-parrilla.cl/api/pase/edi_x')
  })

  it('comentar es de quien revisa; quien edita recibe 403 y no se escribe nada', async () => {
    entrar.mockResolvedValueOnce({ pase: PASE, rol: 'editor' })
    const r = await comentarios.POST(post({ pieza: 'p-1', autor: 'Ana', texto: 'Ojo' }), params('edi_x'))
    expect(r.status).toBe(403)
    expect(comentar).not.toHaveBeenCalled()
  })

  it('una crítica válida se guarda con los segundos en milisegundos; una inválida es 400', async () => {
    entrar.mockResolvedValue({ pase: PASE, rol: 'revisor' })
    comentar.mockResolvedValueOnce({ comentario: { id: 'c-1' } })
    const r = await comentarios.POST(post({ pieza: 'p-1', autor: 'Ana', texto: 'Ojo', desde: 1.5 }), params('rev_x'))
    expect(r.status).toBe(201)
    expect(comentar.mock.calls[0]![1]).toMatchObject({ piezaId: 'p-1', desdeMs: 1500 })
    expect((await comentarios.POST(post({ pieza: 'p-1', autor: 'Ana', texto: '' }), params('rev_x'))).status).toBe(400)
  })

  it('subir una pieza es de quien edita', async () => {
    entrar.mockResolvedValueOnce({ pase: PASE, rol: 'revisor' })
    expect((await piezas.POST(post({ url: 'u' }), params('rev_x'))).status).toBe(403)
    entrar.mockResolvedValueOnce({ pase: PASE, rol: 'editor' })
    const r = await piezas.POST(post({ url: 'u', responde_a: 'p-1', variante: 'A' }), params('edi_x'))
    expect(r.status).toBe(201)
    expect(await r.json()).toMatchObject({ id: 'p-2', version: 2, variante: 'A', resueltas: 1 })
  })
})
