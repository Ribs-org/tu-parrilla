import { describe, expect, it } from 'vitest'
import { MIN_DE_SU_CUENTA, cierreDe, contraSuCuenta, esReciente } from './igual-edad'
import type { PostRow } from './posts-kpis'

function fila(id: string, accountId: string, viewsA7Dias: number | null): PostRow {
  return {
    id,
    network: 'instagram',
    accountId,
    externalId: id,
    permalink: null,
    caption: null,
    thumbnailUrl: null,
    mediaType: null,
    publishedLabel: '1 ago',
    publishedAt: new Date('2026-08-01T12:00:00Z'),
    campaign: id,
    archived: false,
    views: null,
    viewsChange: null,
    viewsA7Dias,
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
  }
}

describe('contraSuCuenta', () => {
  it('cada una contra la mediana de su propia cuenta', () => {
    const r = contraSuCuenta([
      fila('a1', 'a', 400),
      fila('a2', 'a', 200),
      fila('a3', 'a', 200),
      fila('a4', 'a', 100),
      fila('a5', 'a', 50),
      fila('b1', 'b', 9000),
      fila('b2', 'b', 3000),
      fila('b3', 'b', 3000),
      fila('b4', 'b', 3000),
      fila('b5', 'b', 1500),
    ])
    expect(r.get('a1')).toBe(2)
    expect(r.get('a5')).toBe(0.25)
    expect(r.get('b1')).toBe(3)
    expect(r.get('b5')).toBe(0.5)
  })

  it(`una cuenta con menos de ${MIN_DE_SU_CUENTA} lecturas no tiene contra qué medir`, () => {
    const r = contraSuCuenta([
      fila('a1', 'a', 400),
      fila('a2', 'a', 200),
      fila('a3', 'a', 200),
      fila('a4', 'a', 100),
      // La quinta no tiene su lectura de los 7 días: no cuenta.
      fila('a5', 'a', null),
    ])
    expect(r.size).toBe(0)
  })

  it('con la mediana en cero no hay «lo normal»', () => {
    const r = contraSuCuenta(['1', '2', '3', '4', '5'].map((id) => fila(id, 'a', id === '5' ? 10 : 0)))
    expect(r.size).toBe(0)
  })
})

describe('esReciente y cierreDe', () => {
  const cierre = new Date('2026-08-10T12:00:00Z')

  it('menos de 7 días al cierre es reciente; 7 justos, ya no', () => {
    expect(esReciente(new Date('2026-08-04T12:00:01Z'), cierre)).toBe(true)
    expect(esReciente(new Date('2026-08-03T12:00:00Z'), cierre)).toBe(false)
  })

  it('el cierre es el final del período, o ahora si todavía no llega', () => {
    const ahora = new Date('2026-08-05T00:00:00Z')
    expect(cierreDe(cierre, ahora)).toBe(ahora)
    expect(cierreDe(new Date('2026-08-01T00:00:00Z'), ahora).toISOString()).toBe('2026-08-01T00:00:00.000Z')
  })
})
