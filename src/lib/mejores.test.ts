import { describe, expect, it } from 'vitest'
import {
  enComun,
  interaccionesDe,
  leerPercentil,
  mejores,
  pisoDeArrastre,
  rasgosDe,
  type Entrada,
} from './mejores'
import type { PostRow } from './posts-kpis'

const ZONA = 'America/Santiago'

function fila(overrides: Partial<PostRow>): PostRow {
  return {
    id: 'post-1',
    network: 'instagram',
    accountId: 'acc-1',
    externalId: 'ext-1',
    permalink: null,
    caption: null,
    thumbnailUrl: null,
    mediaType: null,
    publishedLabel: '1 ago',
    publishedAt: new Date('2026-08-01T12:00:00Z'),
    campaign: 'reel-1',
    archived: false,
    views: null,
    viewsChange: null,
    likesChange: null,
    commentsChange: null,
    sharesChange: null,
    isNew: false,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    reach: null,
    visits: null,
    uniques: null,
    clicks: null,
    ctr: null,
    pull: null,
    ...overrides,
  }
}

/** Veinte publicaciones con 100, 200, … 2000 views ganadas. */
function veinte(): Entrada[] {
  return Array.from({ length: 20 }, (_, i) => ({
    fila: fila({ id: `p${i + 1}`, viewsChange: (i + 1) * 100 }),
    atributos: null,
  }))
}

describe('leerPercentil', () => {
  it('acepta enteros de 1 a 50', () => {
    expect(leerPercentil('10')).toBe(10)
    expect(leerPercentil('1')).toBe(1)
    expect(leerPercentil('50')).toBe(50)
  })

  it('rechaza lo demás', () => {
    expect(leerPercentil('0')).toBeNull()
    expect(leerPercentil('51')).toBeNull()
    expect(leerPercentil('10.5')).toBeNull()
    expect(leerPercentil('diez')).toBeNull()
    expect(leerPercentil(null)).toBeNull()
  })
})

describe('mejores', () => {
  it('el 10 % de veinte son dos, de la más alta a la más baja', () => {
    const r = mejores(veinte(), 'viewsGanadas', 10, ZONA)
    expect(r.compiten).toBe(20)
    expect(r.mejores.map((m) => [m.puesto, m.fila.id, m.valor])).toEqual([
      [1, 'p20', 2000],
      [2, 'p19', 1900],
    ])
    expect(r.corte).toBe(1900)
  })

  it('redondea hacia arriba: el 10 % de once son dos', () => {
    const r = mejores(veinte().slice(0, 11), 'viewsGanadas', 10, ZONA)
    expect(r.mejores).toHaveLength(2)
  })

  it('entra al menos una aunque el porcentaje sea chico', () => {
    const r = mejores(veinte().slice(0, 3), 'viewsGanadas', 5, ZONA)
    expect(r.mejores.map((m) => m.fila.id)).toEqual(['p3'])
  })

  it('las empatadas con la última también entran', () => {
    const entradas = veinte()
    entradas[17]!.fila.viewsChange = 1900 // p18 empata con p19
    const r = mejores(entradas, 'viewsGanadas', 10, ZONA)
    expect(r.mejores.map((m) => m.fila.id).sort()).toEqual(['p18', 'p19', 'p20'])
  })

  it('un null no compite: YouTube en lo derivado', () => {
    const entradas = [...veinte(), { fila: fila({ id: 'yt', network: 'youtube', viewsChange: null }), atributos: null }]
    const r = mejores(entradas, 'viewsGanadas', 10, ZONA)
    expect(r.publicaciones).toBe(21)
    expect(r.compiten).toBe(20)
  })

  it('YouTube sí compite en visitas, que las mide Tu Parrilla', () => {
    const entradas = [
      { fila: fila({ id: 'ig', visits: 5 }), atributos: null },
      { fila: fila({ id: 'yt', network: 'youtube', visits: 40 }), atributos: null },
    ]
    const r = mejores(entradas, 'visitas', 50, ZONA)
    expect(r.mejores.map((m) => m.fila.id)).toEqual(['yt'])
  })

  it('nunca entra una con cero', () => {
    const entradas = Array.from({ length: 10 }, (_, i) => ({ fila: fila({ id: `p${i}`, visits: 0 }), atributos: null }))
    const r = mejores(entradas, 'visitas', 10, ZONA)
    expect(r.mejores).toEqual([])
    expect(r.corte).toBeNull()
    expect(r.rinden).toBeNull()
  })

  it('compara la mediana de arriba con la del resto', () => {
    const r = mejores(veinte(), 'viewsGanadas', 10, ZONA)
    // arriba 2000 y 1900 → 1950; resto 100…1800 → 950
    expect(r.medianas.mejores.viewsGanadas).toBe(1950)
    expect(r.medianas.resto.viewsGanadas).toBe(950)
    expect(r.rinden).toBeCloseTo(1950 / 950)
  })

  it('en el arrastre solo compite lo que ganó al menos la mediana de views', () => {
    const entradas: Entrada[] = [
      { fila: fila({ id: 'chico', viewsChange: 10, pull: 50 }), atributos: null },
      { fila: fila({ id: 'medio', viewsChange: 1000, pull: 3 }), atributos: null },
      { fila: fila({ id: 'grande', viewsChange: 5000, pull: 2 }), atributos: null },
    ]
    expect(pisoDeArrastre(entradas)).toBe(1000)
    const r = mejores(entradas, 'arrastre', 50, ZONA)
    expect(r.compiten).toBe(2)
    expect(r.mejores.map((m) => m.fila.id)).toEqual(['medio'])
  })
})

describe('interaccionesDe', () => {
  it('suma lo que se sabe', () => {
    expect(interaccionesDe(fila({ likesChange: 10, commentsChange: null, sharesChange: 2 }))).toBe(12)
  })

  it('sin ninguno, no se sabe', () => {
    expect(interaccionesDe(fila({}))).toBeNull()
  })
})

describe('rasgosDe', () => {
  it('trae los atributos sin la pieza, la red, el formato, el día y la franja en la zona del dueño', () => {
    const rasgos = rasgosDe(
      {
        // 2026-08-01 23:30 UTC es sábado 19:30 en Santiago (UTC-4 en agosto).
        fila: fila({ mediaType: 'reel', publishedAt: new Date('2026-08-01T23:30:00Z') }),
        atributos: { hook: 'pregunta', pieza: 'video-7' },
      },
      ZONA,
    )
    expect(rasgos).toEqual([
      { rasgo: 'hook', valor: 'pregunta' },
      { rasgo: 'red', valor: 'Instagram' },
      { rasgo: 'formato', valor: 'Reel' },
      { rasgo: 'día', valor: 'sábado' },
      { rasgo: 'hora', valor: 'noche (18 a 24)' },
    ])
  })
})

describe('enComun', () => {
  it('lo que se repite arriba más que en el resto', () => {
    const conHook = (id: string, hook: string): Entrada => ({ fila: fila({ id }), atributos: { hook } })
    const arriba = [conHook('a', 'pregunta'), conHook('b', 'pregunta'), conHook('c', 'lista')]
    const todas = [
      ...arriba,
      ...Array.from({ length: 9 }, (_, i) => conHook(`r${i}`, 'lista')),
    ]
    const rasgos = enComun(arriba, todas, ZONA)
    const pregunta = rasgos.find((r) => r.rasgo === 'hook' && r.valor === 'pregunta')
    expect(pregunta).toMatchObject({ enMejores: 2, mejores: 3, enTodas: 2, todas: 12 })
    expect(pregunta!.veces).toBeCloseTo(2 / 3 / (2 / 12))
    // «lista» está en una de tres arriba y en diez de doce en total: no se repite más arriba.
    expect(rasgos.some((r) => r.valor === 'lista')).toBe(false)
    // La red es la misma en todas: no distingue a nadie.
    expect(rasgos.some((r) => r.rasgo === 'red')).toBe(false)
  })

  it('con menos de tres arriba no hay con qué contar', () => {
    const e: Entrada = { fila: fila({}), atributos: { hook: 'x' } }
    expect(enComun([e, e], [e, e, e, e], ZONA)).toEqual([])
  })
})
