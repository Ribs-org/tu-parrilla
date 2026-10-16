import { describe, expect, it } from 'vitest'
import { PAGINA_QUEMADOS, quemadosVisibles, redesQuemadas } from './filtro-quemados'

const fila = (id: number, red: string) => ({ id: String(id), red })

describe('redesQuemadas', () => {
  it('una por red, con cuántas tiene, en el orden en que aparecen', () => {
    const filas = [fila(1, 'tiktok'), fila(2, 'instagram'), fila(3, 'tiktok')]
    expect(redesQuemadas(filas)).toEqual([
      { red: 'tiktok', cuantas: 2 },
      { red: 'instagram', cuantas: 1 },
    ])
  })
})

describe('quemadosVisibles', () => {
  const muchas = Array.from({ length: 40 }, (_, i) => fila(i, i % 4 === 0 ? 'instagram' : 'tiktok'))

  it('de entrada, las primeras diez, y cuántas quedan', () => {
    const { visibles, total, quedan } = quemadosVisibles(muchas, new Set(), PAGINA_QUEMADOS)
    expect(PAGINA_QUEMADOS).toBe(10)
    expect(visibles.map((f) => f.id)).toEqual(muchas.slice(0, 10).map((f) => f.id))
    expect(total).toBe(40)
    expect(quedan).toBe(30)
  })

  it('«Ver más» suma otra tanda, y al final no queda nada', () => {
    expect(quemadosVisibles(muchas, new Set(), 30).quedan).toBe(10)
    expect(quemadosVisibles(muchas, new Set(), 45)).toMatchObject({ quedan: 0 })
  })

  it('una red apagada sale de la vista y de la cuenta', () => {
    const { visibles, total } = quemadosVisibles(muchas, new Set(['tiktok']), 15)
    expect(total).toBe(10)
    expect(visibles.every((f) => f.red === 'instagram')).toBe(true)
  })

  it('con todo apagado no se ve nada', () => {
    expect(quemadosVisibles(muchas, new Set(['tiktok', 'instagram']), PAGINA_QUEMADOS)).toEqual({ visibles: [], total: 0, quedan: 0 })
  })
})
