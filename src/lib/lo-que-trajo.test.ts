import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { loNuevoDe, sumarSinYoutube, totalDe } = await import('./lo-que-trajo')

describe('lo nuevo de un corte', () => {
  it('suma las redes sin YouTube, y lo que una red no dio cuenta como cero', () => {
    expect(
      sumarSinYoutube([
        { red: 'instagram', likes: 10, comments: 2 },
        { red: 'tiktok', likes: null, comments: 4 },
        { red: 'youtube', likes: 500, comments: 70 },
      ]),
    ).toEqual({ meGusta: 10, comentarios: 6 })
  })

  it('un corte que nunca se miró cuenta todo; uno mirado, lo de después', () => {
    expect(loNuevoDe({ meGusta: 31, comentarios: 4 }, null, 0, 2)).toEqual({ meGusta: 31, comentarios: 4, visitas: 2 })
    expect(loNuevoDe({ meGusta: 31, comentarios: 4 }, { meGusta: 20, comentarios: 4 }, 1, 0)).toEqual({ meGusta: 11, comentarios: 1, visitas: 0 })
  })

  it('un contador que bajó cuenta cero, no un negativo', () => {
    const nuevo = loNuevoDe({ meGusta: 8, comentarios: 1 }, { meGusta: 10, comentarios: 3 }, 0, 0)
    expect(nuevo).toEqual({ meGusta: 0, comentarios: 0, visitas: 0 })
    expect(totalDe(nuevo)).toBe(0)
    expect(totalDe({ meGusta: 1, comentarios: 2, visitas: 3 })).toBe(6)
  })
})
