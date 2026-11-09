import { describe, expect, it } from 'vitest'
import { A_LAS_48_HORAS, A_LOS_7_DIAS, MIN_DE_SU_CUENTA, cierreDe, contraSuCuenta, esReciente } from './igual-edad'
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
    viewsA48h: null,
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

describe('contraSuCuenta a las 48 horas', () => {
  const temprana = (id: string, views: number | null, a7: number | null = null): PostRow => ({
    ...fila(id, 'a', a7),
    viewsA48h: views,
  })

  it('mide con las views a las 48 horas, no con las de los 7 días', () => {
    const filas = [temprana('t1', 400, 10), ...['t2', 't3', 't4', 't5'].map((id) => temprana(id, 100, 10))]
    const r = contraSuCuenta(filas, A_LAS_48_HORAS)
    expect(r.get('t1')).toBe(4)
    expect(r.get('t2')).toBe(1)
    // A los 7 días son todas iguales: cada una es lo normal.
    expect(contraSuCuenta(filas).get('t1')).toBe(1)
  })

  it(`con menos de ${MIN_DE_SU_CUENTA} lecturas a las 48 horas, la cuenta no tiene contra qué medir`, () => {
    const filas = [...['t1', 't2', 't3', 't4'].map((id) => temprana(id, 100)), temprana('t5', null, 500)]
    expect(contraSuCuenta(filas, A_LAS_48_HORAS).size).toBe(0)
  })

  it('las ventanas: de 48 a 72 horas, y de 7 a 9 días', () => {
    expect(A_LAS_48_HORAS).toEqual({ campo: 'viewsA48h', desdeHoras: 48, hastaHoras: 72 })
    expect(A_LOS_7_DIAS).toEqual({ campo: 'viewsA7Dias', desdeHoras: 168, hastaHoras: 216 })
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
