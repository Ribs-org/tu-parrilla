import { beforeEach, describe, expect, it, vi } from 'vitest'

const { duenoDeLaLlave, archivarQuemados } = vi.hoisted(() => ({
  duenoDeLaLlave: vi.fn<(request: Request) => Promise<string | null>>(),
  archivarQuemados: vi.fn(),
}))
// `mobile-api` llega a `usuarios` por `batch.ts`, y `usuarios` importa `server-only`, que bajo
// Vitest no existe.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/llaves', () => ({ duenoDeLaLlave }))
vi.mock('@/lib/social/publish/archivar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/social/publish/archivar')>()),
  archivarQuemados,
}))

const { cuentaDelCuerpo, responderArchivo } = await import('./archivar-api')
const { CUERPO_ILEGIBLE } = await import('./mobile-api')
const { FRASE_DE_FALLA } = await import('@/lib/social/publish/archivar')

const ID = '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'
const CUENTA = '0d6e3b1a-2c4f-4b8e-9a7d-5f1e2d3c4b5a'

function pedido(cuerpo?: string): Request {
  return new Request(`https://tu-parrilla.cl/api/schedule/posts/${ID}/archivar`, {
    method: 'POST',
    headers: { authorization: 'Bearer tp_x' },
    ...(cuerpo === undefined ? {} : { body: cuerpo }),
  })
}

describe('cuentaDelCuerpo', () => {
  it('sin cuerpo, o sin cuentaId, es todo lo quemado del post', () => {
    expect(cuentaDelCuerpo('')).toEqual({ cuentaId: null })
    expect(cuentaDelCuerpo('  ')).toEqual({ cuentaId: null })
    expect(cuentaDelCuerpo('{}')).toEqual({ cuentaId: null })
    expect(cuentaDelCuerpo('{"cuentaId":null}')).toEqual({ cuentaId: null })
  })

  it('con cuentaId, ese destino', () => {
    expect(cuentaDelCuerpo(`{"cuentaId":"${CUENTA}"}`)).toEqual({ cuentaId: CUENTA })
  })

  it('lo que no es un objeto con cuentaId de texto no se entiende', () => {
    for (const malo of ['no es json', '[]', '"texto"', '{"cuentaId":7}']) {
      expect(cuentaDelCuerpo(malo)).toEqual({ error: CUERPO_ILEGIBLE })
    }
  })
})

describe('responderArchivo', () => {
  beforeEach(() => {
    duenoDeLaLlave.mockReset().mockResolvedValue('dueno-1')
    archivarQuemados.mockReset()
  })

  it('sin llave: 401, y no toca nada', async () => {
    duenoDeLaLlave.mockResolvedValue(null)
    const r = await responderArchivo(pedido(), Promise.resolve({ id: ID }), true)
    expect(r.status).toBe(401)
    expect(archivarQuemados).not.toHaveBeenCalled()
  })

  it('un cuerpo que no se entiende: 400, y no toca nada', async () => {
    const r = await responderArchivo(pedido('[1]'), Promise.resolve({ id: ID }), true)
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({ error: CUERPO_ILEGIBLE })
    expect(archivarQuemados).not.toHaveBeenCalled()
  })

  it('archiva a nombre del dueño de la llave, con la cuenta del cuerpo', async () => {
    archivarQuemados.mockResolvedValue({ cambiados: 1, postId: ID })
    const r = await responderArchivo(pedido(`{"cuentaId":"${CUENTA}"}`), Promise.resolve({ id: ID }), true)
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, id: ID, archivados: 1 })
    expect(archivarQuemados).toHaveBeenCalledWith('dueno-1', ID, { cuentaId: CUENTA, archivar: true })
  })

  it('desarchivar cuenta lo que devolvió', async () => {
    archivarQuemados.mockResolvedValue({ cambiados: 2, postId: ID })
    const r = await responderArchivo(pedido(), Promise.resolve({ id: ID }), false)
    expect(await r.json()).toEqual({ ok: true, id: ID, desarchivados: 2 })
    expect(archivarQuemados).toHaveBeenCalledWith('dueno-1', ID, { cuentaId: null, archivar: false })
  })

  it('lo que no existe es 404, y lo que no está quemado es 409, con su frase', async () => {
    const casos = [
      ['no-existe', 404],
      ['sin-destino', 404],
      ['nada-quemado', 409],
      ['no-quemado', 409],
    ] as const
    for (const [falla, estado] of casos) {
      archivarQuemados.mockResolvedValueOnce({ falla })
      const r = await responderArchivo(pedido(), Promise.resolve({ id: ID }), true)
      expect(r.status, falla).toBe(estado)
      expect(await r.json()).toEqual({ error: FRASE_DE_FALLA[falla] })
    }
  })
})
