import { describe, expect, it } from 'vitest'
import {
  METRICA_ERROR,
  ORDEN_METRICAS,
  enComun,
  interaccionesDe,
  leerPercentil,
  pisoDeArrastre,
  rasgosDe,
  tajada,
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
    viewsA7Dias: null,
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

describe('METRICA_ERROR', () => {
  it('nombra todas las métricas que se aceptan', () => {
    for (const m of ORDEN_METRICAS) expect(METRICA_ERROR).toContain(m)
  })
})

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

describe('tajada: lo mejor', () => {
  it('el 10 % de veinte son dos, de la más alta a la más baja', () => {
    const r = tajada(veinte(), 'viewsGanadas', 10, ZONA)
    expect(r.lado).toBe('mejor')
    expect(r.compiten).toBe(20)
    expect(r.grupo.map((m) => [m.puesto, m.fila.id, m.valor])).toEqual([
      [1, 'p20', 2000],
      [2, 'p19', 1900],
    ])
    expect(r.corte).toBe(1900)
  })

  it('redondea hacia arriba: el 10 % de once son dos', () => {
    const r = tajada(veinte().slice(0, 11), 'viewsGanadas', 10, ZONA)
    expect(r.grupo).toHaveLength(2)
  })

  it('entra al menos una aunque el porcentaje sea chico', () => {
    const r = tajada(veinte().slice(0, 3), 'viewsGanadas', 5, ZONA)
    expect(r.grupo.map((m) => m.fila.id)).toEqual(['p3'])
  })

  it('las empatadas con la última también entran', () => {
    const entradas = veinte()
    entradas[17]!.fila.viewsChange = 1900 // p18 empata con p19
    const r = tajada(entradas, 'viewsGanadas', 10, ZONA)
    expect(r.grupo.map((m) => m.fila.id).sort()).toEqual(['p18', 'p19', 'p20'])
  })

  it('un null no compite: YouTube en lo derivado', () => {
    const entradas = [...veinte(), { fila: fila({ id: 'yt', network: 'youtube', viewsChange: null }), atributos: null }]
    const r = tajada(entradas, 'viewsGanadas', 10, ZONA)
    expect(r.publicaciones).toBe(21)
    expect(r.compiten).toBe(20)
  })

  it('YouTube sí compite en visitas, que las mide Tu Parrilla', () => {
    const entradas = [
      { fila: fila({ id: 'ig', visits: 5 }), atributos: null },
      { fila: fila({ id: 'yt', network: 'youtube', visits: 40 }), atributos: null },
    ]
    const r = tajada(entradas, 'visitas', 50, ZONA)
    expect(r.grupo.map((m) => m.fila.id)).toEqual(['yt'])
  })

  it('nunca entra una con cero', () => {
    const entradas = Array.from({ length: 10 }, (_, i) => ({ fila: fila({ id: `p${i}`, visits: 0 }), atributos: null }))
    const r = tajada(entradas, 'visitas', 10, ZONA)
    expect(r.grupo).toEqual([])
    expect(r.corte).toBeNull()
    expect(r.rinden).toBeNull()
  })

  it('compara la mediana de arriba con la del resto', () => {
    const r = tajada(veinte(), 'viewsGanadas', 10, ZONA)
    // arriba 2000 y 1900 → 1950; resto 100…1800 → 950
    expect(r.medianas.grupo.viewsGanadas).toBe(1950)
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
    const r = tajada(entradas, 'arrastre', 50, ZONA)
    expect(r.compiten).toBe(2)
    expect(r.grupo.map((m) => m.fila.id)).toEqual(['medio'])
  })
})

describe('tajada: lo peor', () => {
  it('el 10 % de veinte son las dos más bajas, de la más baja a la más alta', () => {
    const r = tajada(veinte(), 'viewsGanadas', 10, ZONA, { lado: 'peor' })
    expect(r.lado).toBe('peor')
    expect(r.grupo.map((m) => [m.puesto, m.fila.id, m.valor])).toEqual([
      [1, 'p1', 100],
      [2, 'p2', 200],
    ])
    // Abajo, el corte es lo más que sacó una de las que entraron.
    expect(r.corte).toBe(200)
  })

  it('abajo sí entra una con cero, y las empatadas con la última también', () => {
    const entradas = veinte()
    entradas[0]!.fila.viewsChange = 0
    entradas[2]!.fila.viewsChange = 200 // p3 empata con p2
    const r = tajada(entradas, 'viewsGanadas', 10, ZONA, { lado: 'peor' })
    expect(r.grupo.map((m) => m.fila.id).sort()).toEqual(['p1', 'p2', 'p3'])
    expect(r.grupo[0]!.valor).toBe(0)
  })

  it('la mediana de abajo contra la del resto queda por debajo de uno', () => {
    const r = tajada(veinte(), 'viewsGanadas', 10, ZONA, { lado: 'peor' })
    // abajo 100 y 200 → 150; resto 300…2000 → 1150
    expect(r.medianas.grupo.viewsGanadas).toBe(150)
    expect(r.rinden).toBeCloseTo(150 / 1150)
  })
})

describe('tajada: las de menos de 7 días', () => {
  const CIERRE = new Date('2026-08-10T12:00:00Z')

  /** Diez de hace nueve días con 100…1000 views, y tres de hace dos días con muy poco. */
  function conRecientes(): Entrada[] {
    const viejas = Array.from({ length: 10 }, (_, i) => ({
      fila: fila({ id: `v${i + 1}`, viewsChange: (i + 1) * 100, publishedAt: new Date('2026-08-01T12:00:00Z') }),
      atributos: null,
    }))
    const nuevas = Array.from({ length: 3 }, (_, i) => ({
      fila: fila({ id: `n${i + 1}`, viewsChange: i + 1, publishedAt: new Date('2026-08-08T12:00:00Z') }),
      atributos: null,
    }))
    return [...viejas, ...nuevas]
  }

  it('apagadas, no compiten: abajo no se llena de lo que recién salió', () => {
    const r = tajada(conRecientes(), 'viewsGanadas', 10, ZONA, { lado: 'peor', conRecientes: false, cierre: CIERRE })
    expect(r.compiten).toBe(10)
    expect(r.fueraPorRecientes).toBe(3)
    expect(r.grupo.map((m) => m.fila.id)).toEqual(['v1'])
  })

  it('prendidas, compiten como siempre', () => {
    const r = tajada(conRecientes(), 'viewsGanadas', 10, ZONA, { lado: 'peor', conRecientes: true, cierre: CIERRE })
    expect(r.compiten).toBe(13)
    expect(r.fueraPorRecientes).toBe(0)
    expect(r.grupo.map((m) => m.fila.id)).toEqual(['n1', 'n2'])
  })

  it('justo a los 7 días ya no es reciente', () => {
    const entradas = [{ fila: fila({ id: 'justo', viewsChange: 5, publishedAt: new Date('2026-08-03T12:00:00Z') }), atributos: null }]
    expect(tajada(entradas, 'viewsGanadas', 10, ZONA, { conRecientes: false, cierre: CIERRE }).compiten).toBe(1)
  })

  it('no tocan las métricas a igual edad, que ya dejan fuera lo que no cumple 7 días', () => {
    const entradas = [{ fila: fila({ id: 'a7', viewsA7Dias: 300, publishedAt: new Date('2026-08-09T12:00:00Z') }), atributos: null }]
    const r = tajada(entradas, 'viewsA7Dias', 10, ZONA, { conRecientes: false, cierre: CIERRE })
    expect(r.compiten).toBe(1)
    expect(r.fueraPorRecientes).toBe(0)
  })

  it('el piso del arrastre sale de lo que compite: sin las recientes, sus pocas views no lo bajan', () => {
    const nueva = new Date('2026-08-09T12:00:00Z')
    const entradas: Entrada[] = [
      { fila: fila({ id: 'nueva', viewsChange: 10, pull: 90, publishedAt: nueva }), atributos: null },
      { fila: fila({ id: 'nueva2', viewsChange: 20, pull: 80, publishedAt: nueva }), atributos: null },
      { fila: fila({ id: 'medio', viewsChange: 1000, pull: 3 }), atributos: null },
      { fila: fila({ id: 'grande', viewsChange: 5000, pull: 2 }), atributos: null },
    ]
    // Con las nuevas, el piso sería 510 y «medio» le ganaría a «grande»; sin ellas, es 3000.
    const r = tajada(entradas, 'arrastre', 50, ZONA, { conRecientes: false, cierre: CIERRE })
    expect(r.grupo.map((m) => m.fila.id)).toEqual(['grande'])
  })
})

describe('tajada: a igual edad', () => {
  it('views a los 7 días: un null no compite', () => {
    const entradas = [
      { fila: fila({ id: 'con', viewsA7Dias: 800 }), atributos: null },
      { fila: fila({ id: 'sin', viewsA7Dias: null, viewsChange: 99_000 }), atributos: null },
    ]
    const r = tajada(entradas, 'viewsA7Dias', 50, ZONA)
    expect(r.compiten).toBe(1)
    expect(r.grupo.map((m) => m.fila.id)).toEqual(['con'])
  })

  it('contra su cuenta: una cuenta chica le puede ganar a una grande', () => {
    const de = (cuenta: string, id: string, views: number): Entrada => ({
      fila: fila({ id, accountId: cuenta, viewsA7Dias: views }),
      atributos: null,
    })
    const entradas = [
      de('chica', 'c-triple', 300),
      ...['c1', 'c2', 'c3', 'c4'].map((id) => de('chica', id, 100)),
      de('grande', 'g-doble', 20_000),
      ...['g1', 'g2', 'g3', 'g4'].map((id) => de('grande', id, 10_000)),
    ]
    const r = tajada(entradas, 'contraSuCuenta', 10, ZONA)
    expect(r.grupo.map((m) => [m.fila.id, m.valor])).toEqual([['c-triple', 3]])
    expect(r.medianas.grupo.contraSuCuenta).toBe(3)
    expect(r.medianas.resto.contraSuCuenta).toBe(1)
    expect(r.medianas.grupo.viewsA7Dias).toBe(300)
  })

  it('contra su cuenta: con menos de 5 lecturas, la cuenta no compite', () => {
    const entradas = ['a', 'b', 'c', 'd'].map((id) => ({ fila: fila({ id, viewsA7Dias: 100 }), atributos: null }))
    const r = tajada(entradas, 'contraSuCuenta', 10, ZONA)
    expect(r.compiten).toBe(0)
    expect(r.grupo).toEqual([])
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
    expect(pregunta).toMatchObject({ enElGrupo: 2, grupo: 3, enTodas: 2, todas: 12 })
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
