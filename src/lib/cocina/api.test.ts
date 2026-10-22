import { afterEach, describe, expect, it, vi } from 'vitest'

// `mobile-api` llega a `usuarios` por `batch.ts`, y `usuarios` importa `server-only`.
vi.mock('server-only', () => ({}))

const { ESTADO_DESCONOCIDO, ETA_ILEGIBLE, TANDAS_ILEGIBLES, cambioDe, cocinaAutorizada, cuerpoDe, trabajadorDe } = await import('./api')

const pedido = (authorization?: string) =>
  new Request('https://tu-parrilla.cl/api/cocina/comandas', authorization ? { headers: { authorization } } : {})

describe('cocinaAutorizada', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('abre solo con la credencial de la cocina', () => {
    vi.stubEnv('COCINA_SECRET', 'secreto-de-la-cocina')
    expect(cocinaAutorizada(pedido('Bearer secreto-de-la-cocina'))).toBe(true)
    expect(cocinaAutorizada(pedido('Bearer otro'))).toBe(false)
    expect(cocinaAutorizada(pedido())).toBe(false)
  })

  it('sin la variable, la cocina queda cerrada, no abierta', () => {
    vi.stubEnv('COCINA_SECRET', '')
    expect(cocinaAutorizada(pedido('Bearer '))).toBe(false)
  })
})

describe('cambioDe', () => {
  it('lee el estado, el mensaje, la hora estimada con su zona y las tandas', () => {
    expect(
      cambioDe({ estado: 'sirviendo', mensaje: 'Va la base', eta: '2026-10-23T14:00:00-03:00', tandas: { servidas: 1, total: 5 } }),
    ).toEqual({ estado: 'sirviendo', mensaje: 'Va la base', eta: new Date('2026-10-23T17:00:00Z'), tandas: { servidas: 1, total: 5 } })
  })

  it('una hora sin zona no se adivina', () => {
    expect(cambioDe({ estado: 'en_el_horno', eta: '2026-10-23T14:00:00' })).toEqual({ error: ETA_ILEGIBLE })
    expect(cambioDe({ estado: 'en_el_horno', eta: 'mañana' })).toEqual({ error: ETA_ILEGIBLE })
    expect(cambioDe({ estado: 'en_el_horno', eta: null })).toEqual({ estado: 'en_el_horno', eta: null })
  })

  it('las tandas son enteros, y no se sirven más de las que hay', () => {
    expect(cambioDe({ estado: 'sirviendo', tandas: { servidas: 2, total: null } })).toMatchObject({ tandas: { servidas: 2, total: null } })
    expect(cambioDe({ estado: 'sirviendo', tandas: { servidas: 6, total: 5 } })).toEqual({ error: TANDAS_ILEGIBLES })
    expect(cambioDe({ estado: 'sirviendo', tandas: { servidas: 1.5 } })).toEqual({ error: TANDAS_ILEGIBLES })
  })

  it('un estado que no existe no entra', () => {
    expect(cambioDe({ estado: 'horneando' })).toEqual({ error: ESTADO_DESCONOCIDO })
  })
})

describe('el cuerpo y el trabajador', () => {
  it('vacío vale un objeto, y lo que no es un objeto no', async () => {
    const con = (cuerpo: string) => new Request('https://x', { method: 'POST', body: cuerpo })
    expect(await cuerpoDe(con(''))).toEqual({})
    expect(await cuerpoDe(con('{"a":1}'))).toEqual({ a: 1 })
    expect(await cuerpoDe(con('[1]'))).toBeNull()
    expect(await cuerpoDe(con('no es json'))).toBeNull()
  })

  it('el trabajador es un texto corto', () => {
    expect(trabajadorDe({ trabajador: ' servidor-casa ' })).toBe('servidor-casa')
    expect(trabajadorDe({ trabajador: '' })).toBeNull()
    expect(trabajadorDe({})).toBeNull()
  })
})
