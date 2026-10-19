import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseFilters } from './filters'

// `previousPeriod` vive en `analytics.ts`, que importa `server-only`: solo lo entiende el
// bundler de Next (mismo arreglo que en `sync.test.ts`).
vi.mock('server-only', () => ({}))

const ZONA = 'America/Santiago'

describe('parseFilters: el período', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 10:00 en Santiago (−03:00) del lunes 19 de octubre.
    vi.setSystemTime(new Date('2026-10-19T13:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sin nada, 30 días hasta ahora', () => {
    const f = parseFilters({}, 'u', ZONA)
    expect(f.range).toBe('30d')
    expect(f.to.toISOString()).toBe('2026-10-19T13:00:00.000Z')
    expect(f.from.toISOString()).toBe('2026-09-19T13:00:00.000Z')
    expect(f.periodo).toEqual({ rango: '30d', desde: '2026-09-19', hasta: '2026-10-19', hoy: '2026-10-19' })
  })

  it('las fechas a mano son días enteros en la zona del dueño, los dos incluidos', () => {
    const f = parseFilters({ desde: '2026-08-22', hasta: '2026-09-07' }, 'u', ZONA)
    expect(f.range).toBe('fechas')
    // Medianoche del 22 en Santiago, y medianoche del 8 (el corte es el día siguiente).
    expect(f.from.toISOString()).toBe('2026-08-22T04:00:00.000Z')
    expect(f.to.toISOString()).toBe('2026-09-08T03:00:00.000Z')
    expect(f.periodo).toEqual({ rango: 'fechas', desde: '2026-08-22', hasta: '2026-09-07', hoy: '2026-10-19' })
  })

  it('las fechas mandan sobre el atajo si vienen las dos cosas', () => {
    expect(parseFilters({ range: '7d', desde: '2026-08-22', hasta: '2026-09-07' }, 'u', ZONA).range).toBe('fechas')
  })

  it('unas fechas que no se entienden se ignoran: queda el atajo', () => {
    const f = parseFilters({ range: '7d', desde: '2026-02-30', hasta: '2026-09-07' }, 'u', ZONA)
    expect(f.range).toBe('7d')
    expect(f.periodo.rango).toBe('7d')
    expect(parseFilters({ desde: '2026-09-07', hasta: '2026-08-22' }, 'u', ZONA).range).toBe('30d')
  })

  it('solo «desde» llega hasta hoy', () => {
    const f = parseFilters({ desde: '2026-10-01' }, 'u', ZONA)
    expect(f.range).toBe('fechas')
    expect(f.periodo).toEqual({ rango: 'fechas', desde: '2026-10-01', hasta: '2026-10-19', hoy: '2026-10-19' })
  })

  it('«Todo» empieza el 1 de enero de 2020 en el selector, aunque en Chile esa medianoche UTC sea el 31', () => {
    const f = parseFilters({ range: 'all' }, 'u', ZONA)
    expect(f.periodo.desde).toBe('2020-01-01')
  })

  it('el período anterior de unas fechas a mano es uno del mismo largo, justo antes', async () => {
    const { previousPeriod } = await import('./analytics')
    const f = parseFilters({ desde: '2026-09-01', hasta: '2026-09-07' }, 'u', ZONA)
    const antes = previousPeriod(f)
    expect(antes.to.toISOString()).toBe(f.from.toISOString())
    expect(f.to.getTime() - f.from.getTime()).toBe(antes.to.getTime() - antes.from.getTime())
  })
})
