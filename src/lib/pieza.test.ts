import { describe, expect, it } from 'vitest'
import {
  claveElegida,
  clavePieza,
  clavesDeAtributos,
  compararPorAtributo,
  esTrialReel,
  ordenarVersiones,
  repartirAtributos,
  textoDeAtributo,
} from './pieza'
import type { PostRow } from './posts-kpis'
import type { Atributos } from './social/publish/atributos'

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

describe('clavePieza', () => {
  it('lee el valor de «pieza», texto o número', () => {
    expect(clavePieza({ pieza: 'chimichurri', hook: 'pregunta' })).toBe('chimichurri')
    expect(clavePieza({ pieza: 12 })).toBe('12')
  })

  it('sin atributos, sin la clave, vacía o booleana: no hay pieza', () => {
    expect(clavePieza(null)).toBeNull()
    expect(clavePieza({ hook: 'pregunta' })).toBeNull()
    expect(clavePieza({ pieza: '  ' })).toBeNull()
    expect(clavePieza({ pieza: true })).toBeNull()
  })
})

describe('esTrialReel', () => {
  it('solo la opción de Instagram, bien formada', () => {
    expect(esTrialReel('instagram', { trialReel: true })).toBe(true)
    expect(esTrialReel('instagram', null)).toBe(false)
    expect(esTrialReel('instagram', { trialReel: 'sí' })).toBe(false)
    expect(esTrialReel('tiktok', { trialReel: true })).toBe(false)
  })
})

describe('textoDeAtributo', () => {
  it('booleanos en palabras, la falta como raya', () => {
    expect(textoDeAtributo(true)).toBe('sí')
    expect(textoDeAtributo(false)).toBe('no')
    expect(textoDeAtributo(42)).toBe('42')
    expect(textoDeAtributo(undefined)).toBe('—')
  })

  it('sin espacios en los bordes, y un texto vacío es no tener valor', () => {
    expect(textoDeAtributo(' pregunta ')).toBe('pregunta')
    expect(textoDeAtributo('  ')).toBe('—')
  })
})

describe('repartirAtributos', () => {
  it('lo igual arriba, lo que cambia en columnas, y «pieza» en ninguna', () => {
    const { comunes, queCambian } = repartirAtributos([
      { atributos: { pieza: 'p', tema: 'asado', hook: 'pregunta' } },
      { atributos: { pieza: 'p', tema: 'asado', hook: 'listado' } },
    ])
    expect(comunes).toEqual([['tema', 'asado']])
    expect(queCambian).toEqual(['hook'])
  })

  it('un atributo que le falta a una versión también es una diferencia', () => {
    const { comunes, queCambian } = repartirAtributos([{ atributos: { serie: 'mut' } }, { atributos: null }])
    expect(comunes).toEqual([])
    expect(queCambian).toEqual(['serie'])
  })

  it('una sola versión: todo es común', () => {
    expect(repartirAtributos([{ atributos: { hook: 'pregunta' } }]).comunes).toEqual([['hook', 'pregunta']])
    expect(repartirAtributos([]).comunes).toEqual([])
  })
})

describe('ordenarVersiones', () => {
  it('con números primero, de más a menos views; después las demás por fecha', () => {
    const v = (id: string, views: number | null, dia: number | null) => ({
      id,
      fila: views === null ? null : fila({ views }),
      fecha: dia === null ? null : new Date(2026, 9, dia),
    })
    const orden = ordenarVersiones([v('sin-fila-tarde', null, 20), v('poca', 10, 1), v('sin-fila', null, 5), v('mucha', 900, 2)])
    expect(orden.map((x) => x.id)).toEqual(['mucha', 'poca', 'sin-fila', 'sin-fila-tarde'])
  })
})

describe('clavesDeAtributos y claveElegida', () => {
  const lista: Array<Atributos | null> = [{ tema: 'a', pieza: 'x' }, { tema: 'b', serie: 'mut', pieza: 'y' }, { pieza: 'z' }, null]

  it('de la más usada a la menos, con «pieza» al final', () => {
    expect(clavesDeAtributos(lista)).toEqual(['tema', 'serie', 'pieza'])
  })

  it('la de la URL si existe; si no, hook; si no, la primera', () => {
    expect(claveElegida('serie', ['tema', 'serie'])).toBe('serie')
    expect(claveElegida('inventada', ['tema', 'hook'])).toBe('hook')
    expect(claveElegida(undefined, ['tema', 'serie'])).toBe('tema')
    expect(claveElegida(undefined, [])).toBeNull()
  })
})

describe('compararPorAtributo', () => {
  it('medianas por valor, del más usado al menos, y «sin el atributo» al final', () => {
    const filas = compararPorAtributo(
      [
        { atributos: { hook: 'pregunta' }, fila: fila({ viewsChange: 100, visits: 4, pull: 4 }) },
        { atributos: { hook: 'pregunta ' }, fila: fila({ viewsChange: 300, visits: 6, pull: 2 }) },
        { atributos: { hook: 'pregunta' }, fila: fila({ viewsChange: 50_000, visits: 10, pull: 0.02 }) },
        { atributos: { hook: 'listado' }, fila: fila({ viewsChange: 80, visits: null, pull: null }) },
        { atributos: null, fila: fila({ viewsChange: 10, visits: 1, pull: 10 }) },
      ],
      'hook',
    )
    expect(filas).toEqual([
      { valor: 'pregunta', publicaciones: 3, viewsGanadas: 300, visitas: 6, arrastre: 2 },
      { valor: 'listado', publicaciones: 1, viewsGanadas: 80, visitas: null, arrastre: null },
      { valor: null, publicaciones: 1, viewsGanadas: 10, visitas: 1, arrastre: 10 },
    ])
  })

  it('un null no es un cero: YouTube cuenta en visitas y no en views', () => {
    const [unica] = compararPorAtributo(
      [
        { atributos: { tema: 'asado' }, fila: fila({ network: 'youtube', viewsChange: null, visits: 20, pull: null }) },
        { atributos: { tema: 'asado' }, fila: fila({ viewsChange: 500, visits: 2, pull: 0.4 }) },
      ],
      'tema',
    )
    expect(unica).toEqual({ valor: 'asado', publicaciones: 2, viewsGanadas: 500, visitas: 11, arrastre: 0.4 })
  })
})
