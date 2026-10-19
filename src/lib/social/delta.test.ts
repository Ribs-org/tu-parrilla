import { describe, expect, it } from 'vitest'
import { periodChange, publicationPeriodChange, type Snapshot } from './delta'

describe('publicationPeriodChange', () => {
  const lecturas: Snapshot[] = [
    { day: '2026-08-01', value: 100 },
    { day: '2026-08-20', value: 900 },
    { day: '2026-08-21', value: null },
  ]

  it('con lectura adentro, lo mismo que periodChange', () => {
    expect(publicationPeriodChange(lecturas, '2026-08-05', '2026-08-25')).toEqual(
      periodChange(lecturas, '2026-08-05', '2026-08-25'),
    )
  })

  it('sin lectura adentro, el contador de la última de antes, y lo ganado no se sabe', () => {
    // Lo viejo se lee cada una a cuatro semanas: una semana sin lectura no es una
    // publicación sin números.
    expect(publicationPeriodChange(lecturas, '2026-09-01', '2026-09-07', '2026-07-30')).toEqual({
      current: 900,
      change: null,
      isNew: false,
    })
  })

  it('una lectura de después del período no cuenta, y sin ninguna de antes no hay dato', () => {
    expect(publicationPeriodChange(lecturas, '2026-07-01', '2026-07-31')).toEqual({
      current: null,
      change: null,
      isNew: false,
    })
  })
})

const snapshots: Snapshot[] = [
  { day: '2026-08-01', value: 100 },
  { day: '2026-08-10', value: 400 },
  { day: '2026-08-20', value: 900 },
]

describe('periodChange', () => {
  it('resta el último snapshot previo al período', () => {
    expect(periodChange(snapshots, '2026-08-05', '2026-08-25')).toEqual({
      current: 900,
      change: 800,
      isNew: false,
    })
  })

  it('sin snapshot previo, el crecimiento es el acumulado y el post es nuevo', () => {
    expect(periodChange(snapshots, '2026-07-01', '2026-08-25')).toEqual({
      current: 900,
      change: 900,
      isNew: true,
    })
  })

  it('sin snapshots dentro del período no hay dato', () => {
    expect(periodChange(snapshots, '2026-09-01', '2026-09-30')).toEqual({
      current: null,
      change: null,
      isNew: false,
    })
  })

  it('usa el snapshot más cercano al borde, no uno exacto', () => {
    // El cron se saltó el 2026-08-15; el borde cae en un día sin fila.
    expect(periodChange(snapshots, '2026-08-15', '2026-08-25').change).toBe(500)
  })

  it('piso en cero cuando el contador retrocede', () => {
    const corrected: Snapshot[] = [
      { day: '2026-08-01', value: 500 },
      { day: '2026-08-10', value: 450 },
    ]
    expect(periodChange(corrected, '2026-08-05', '2026-08-25').change).toBe(0)
  })

  it('ignora los snapshots con la métrica ausente', () => {
    const partial: Snapshot[] = [
      { day: '2026-08-01', value: null },
      { day: '2026-08-10', value: 300 },
    ]
    expect(periodChange(partial, '2026-08-05', '2026-08-25')).toEqual({
      current: 300,
      change: 300,
      isNew: true,
    })
  })

  it('sin snapshots no revienta', () => {
    expect(periodChange([], '2026-08-01', '2026-08-25')).toEqual({
      current: null,
      change: null,
      isNew: false,
    })
  })
})

describe('periodChange con fecha de publicación', () => {
  const sinPrevio: Snapshot[] = [{ day: '2026-08-26', value: 2220 }]

  it('publicado dentro del período: todo su acumulado lo ganó ahí', () => {
    expect(periodChange(sinPrevio, '2026-08-20', '2026-09-03', '2026-08-25')).toEqual({
      current: 2220,
      change: 2220,
      isNew: true,
    })
  })

  it('publicado antes y nunca medido antes: el crecimiento es desconocido, no su historia entera', () => {
    expect(periodChange(sinPrevio, '2026-08-20', '2026-09-03', '2026-02-04')).toEqual({
      current: 2220,
      change: null,
      isNew: false,
    })
  })

  it('con lectura previa la fecha de publicación no cambia nada', () => {
    expect(periodChange(snapshots, '2026-08-05', '2026-08-25', '2026-01-01')).toEqual({
      current: 900,
      change: 800,
      isNew: false,
    })
  })

  it('sin fecha de publicación conserva el comportamiento anterior', () => {
    expect(periodChange(sinPrevio, '2026-08-20', '2026-09-03')).toEqual({
      current: 2220,
      change: 2220,
      isNew: true,
    })
  })
})
