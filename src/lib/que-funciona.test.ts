import { describe, expect, it } from 'vitest'
import { contraSuCuenta } from './igual-edad'
import type { PostRow } from './posts-kpis'
import { PARA_DESTACAR, fraseDe, queFunciona, queFuncionaApi, veces, type Veredicto } from './que-funciona'
import type { Atributos } from './social/publish/atributos'

let siguiente = 0

function fila(overrides: Partial<PostRow>): PostRow {
  siguiente += 1
  return {
    id: `post-${siguiente}`,
    network: 'instagram',
    accountId: 'acc-1',
    externalId: `ext-${siguiente}`,
    permalink: null,
    caption: null,
    thumbnailUrl: null,
    mediaType: 'reel',
    publishedLabel: '1 ago',
    publishedAt: new Date('2026-08-01T12:00:00Z'),
    campaign: `reel-${siguiente}`,
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

type Entrada = { fila: PostRow; atributos: Atributos | null }

/** `n` publicaciones de una cuenta con estos atributos y estas views a los 7 días. */
function varias(n: number, atributos: Atributos | null, viewsA7Dias: number | null, extra: Partial<PostRow> = {}): Entrada[] {
  return Array.from({ length: n }, () => ({ atributos, fila: fila({ viewsA7Dias, ...extra }) }))
}

function veredictos(entradas: Entrada[]): Record<string, Veredicto> {
  const lista = queFunciona(entradas, contraSuCuenta(entradas.map((e) => e.fila)))
  return Object.fromEntries(lista.map((v) => [v.clave, v]))
}

describe('queFunciona', () => {
  it('dice qué tema gana, contra lo normal de cada cuenta y no por el tamaño de la cuenta', () => {
    // Una cuenta chica y una grande. «recetas» duplica lo normal en las dos; en views a secas,
    // «humor», que solo sale en la grande, taparía todo.
    const entradas = [
      ...varias(5, { tema: 'recetas' }, 200, { accountId: 'chica' }),
      ...varias(5, { tema: 'recetas' }, 20_000, { accountId: 'grande' }),
      ...varias(6, { tema: 'humor' }, 100, { accountId: 'chica' }),
      ...varias(6, { tema: 'humor' }, 10_000, { accountId: 'grande' }),
    ]
    const { tema } = veredictos(entradas)
    expect(tema!.estado).toBe('gana')
    expect(tema!.primero!.valor).toBe('recetas')
    expect(tema!.primero!.medidas).toBe(10)
    expect(tema!.segundo!.valor).toBe('humor')
    expect(tema!.primero!.contraSuCuenta! / tema!.segundo!.contraSuCuenta!).toBeCloseTo(2)
    expect(fraseDe(tema!)).toBe(
      'Lo de tema «recetas» tuvo ×2,0 las views normales de su cuenta a los 7 días (10 publicaciones). ' +
        'Le sigue «humor», con ×1,0 (12 publicaciones).',
    )
  })

  it('con menos de 10 medidas no declara ganador, aunque la diferencia sea enorme', () => {
    const entradas = [
      ...varias(2, { tema: 'recetas' }, 5_000),
      ...varias(12, { tema: 'humor' }, 100),
    ]
    const { tema } = veredictos(entradas)
    expect(tema!.estado).toBe('faltan')
    expect(tema!.primero).toBeNull()
    expect(fraseDe(tema!)).toBe(
      'Todavía no alcanza para decirlo: hacen falta dos temas con al menos 10 publicaciones medidas a los 7 ' +
        'días cada uno. Hoy: «humor» 12 y «recetas» 2.',
    )
  })

  it('la muestra son las medidas: lo que no tiene sus 7 días no cuenta para el mínimo', () => {
    const entradas = [
      ...varias(4, { tema: 'recetas' }, 400),
      ...varias(8, { tema: 'recetas' }, null),
      ...varias(10, { tema: 'humor' }, 100),
    ]
    const { tema } = veredictos(entradas)
    expect(tema!.valores.find((v) => v.valor === 'recetas')).toMatchObject({ publicaciones: 12, medidas: 4 })
    expect(tema!.estado).toBe('faltan')
  })

  it('parejo cuando el mejor no llega a destacar', () => {
    const entradas = [...varias(10, { tema: 'recetas' }, 110), ...varias(10, { tema: 'humor' }, 100)]
    const { tema } = veredictos(entradas)
    expect(tema!.primero!.contraSuCuenta!).toBeLessThan(PARA_DESTACAR)
    expect(tema!.estado).toBe('parejo')
    expect(fraseDe(tema!)).toMatch(/^Ningún tema se sale de lo normal: el que mejor anduvo, «recetas», tuvo ×1,0/)
  })

  it('el formato sale de la red, no de un atributo', () => {
    const entradas = [
      ...varias(10, null, 300, { mediaType: 'carousel' }),
      ...varias(10, null, 100, { mediaType: 'reel' }),
    ]
    const { formato, tema, estilo } = veredictos(entradas)
    expect(formato!.estado).toBe('gana')
    expect(formato!.primero!.valor).toBe('Carrusel')
    expect(formato!.segundo!.valor).toBe('Reel')
    expect(tema!.estado).toBe('sinValor')
    expect(fraseDe(tema!)).toBe('Nada de lo publicado en el período lleva «tema» en sus atributos.')
    expect(estilo!.estado).toBe('sinValor')
  })

  it('un solo valor no tiene con qué compararse', () => {
    const { formato } = veredictos(varias(20, null, 100, { network: 'tiktok', mediaType: 'video' }))
    expect(formato!.estado).toBe('faltan')
    expect(fraseDe(formato!)).toBe('Hay un solo formato en el período, «Video»: no hay con qué compararlo.')
  })

  it('sin lecturas de los 7 días (YouTube, o lo de la última semana) no hay cómo medir', () => {
    const entradas = [
      ...varias(10, { estilo: 'tutorial' }, null, { network: 'youtube', mediaType: 'short' }),
      ...varias(10, { estilo: 'storytime' }, null, { network: 'youtube', mediaType: 'video' }),
    ]
    const { estilo } = veredictos(entradas)
    expect(estilo!.estado).toBe('faltan')
    expect(fraseDe(estilo!)).toMatch(/^Todavía no hay cómo medirlo: .* al menos 5 publicaciones medidas/)
  })

  it('«sin tema» no compite: es la vara, no un valor', () => {
    const entradas = [...varias(10, null, 1_000), ...varias(10, { tema: 'recetas' }, 100)]
    const { tema } = veredictos(entradas)
    expect(tema!.valores.map((v) => v.valor)).toEqual(['recetas'])
    expect(tema!.estado).toBe('faltan')
  })
})

describe('queFuncionaApi', () => {
  it('una clave por dimensión, con la frase del tablero y los valores sin «sin valor»', () => {
    const entradas = [
      ...varias(10, { tema: 'recetas' }, 300, { mediaType: 'carousel' }),
      ...varias(10, { tema: 'humor' }, 100),
      ...varias(3, null, 100),
    ]
    const api = queFuncionaApi(entradas, contraSuCuenta(entradas.map((e) => e.fila)))
    expect(Object.keys(api)).toEqual(['tema', 'estilo', 'formato'])
    expect(api.tema.estado).toBe('gana')
    expect(api.tema.frase).toBe(fraseDe(veredictos(entradas).tema!))
    expect(api.tema.primero).toEqual({ valor: 'recetas', publicaciones: 10, medidas: 10, contraSuCuenta: 3 })
    expect(api.tema.valores.map((v) => v.valor).sort()).toEqual(['humor', 'recetas'])
    expect(api.estilo).toMatchObject({ estado: 'sinValor', primero: null, segundo: null, valores: [] })
  })
})

describe('veces', () => {
  it('como en «Comparar por atributo»', () => {
    expect(veces(2.14)).toBe('×2,1')
    expect(veces(0.666)).toBe('×0,67')
  })
})
