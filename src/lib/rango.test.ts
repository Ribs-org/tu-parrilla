import { describe, expect, it } from 'vitest'
import {
  FECHAS_AL_REVES,
  FECHAS_ANTES_DE_TODO,
  FECHAS_FUTURAS,
  FECHAS_INCOMPLETAS,
  atajosDeFechas,
  etiquetaDeFechas,
  problemaDeFechas,
} from './rango'

describe('atajosDeFechas', () => {
  // Lunes 19 de octubre de 2026; el 18 es domingo.
  const atajos = Object.fromEntries(atajosDeFechas('2026-10-19').map((a) => [a.etiqueta, a.fechas]))

  it('la semana empieza el lunes y termina hoy', () => {
    expect(atajos['Esta semana']).toEqual({ desde: '2026-10-19', hasta: '2026-10-19' })
    expect(atajosDeFechas('2026-10-18').find((a) => a.etiqueta === 'Esta semana')!.fechas).toEqual({
      desde: '2026-10-12',
      hasta: '2026-10-18',
    })
  })

  it('la semana pasada es de lunes a domingo', () => {
    expect(atajos['La semana pasada']).toEqual({ desde: '2026-10-12', hasta: '2026-10-18' })
  })

  it('el mes, del 1 a hoy; el pasado, entero, aunque cruce el año', () => {
    expect(atajos['Este mes']).toEqual({ desde: '2026-10-01', hasta: '2026-10-19' })
    expect(atajos['El mes pasado']).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' })
    const enero = Object.fromEntries(atajosDeFechas('2027-01-05').map((a) => [a.etiqueta, a.fechas]))
    expect(enero['El mes pasado']).toEqual({ desde: '2026-12-01', hasta: '2026-12-31' })
  })

  it('en el mismo orden en que se muestran', () => {
    expect(atajosDeFechas('2026-10-19').map((a) => a.etiqueta)).toEqual([
      'Esta semana',
      'La semana pasada',
      'Este mes',
      'El mes pasado',
    ])
  })
})

describe('etiquetaDeFechas', () => {
  it('sin año cuando las dos puntas son de este año', () => {
    expect(etiquetaDeFechas({ desde: '2026-08-22', hasta: '2026-09-07' }, '2026-10-19')).toBe('22 ago – 7 sept')
  })

  it('un solo día, una sola fecha', () => {
    expect(etiquetaDeFechas({ desde: '2026-09-07', hasta: '2026-09-07' }, '2026-10-19')).toBe('7 sept')
  })

  it('con el año en las dos puntas si alguna es de otro año', () => {
    expect(etiquetaDeFechas({ desde: '2025-12-22', hasta: '2026-01-07' }, '2026-10-19')).toBe(
      '22 dic 2025 – 7 ene 2026',
    )
  })
})

describe('problemaDeFechas', () => {
  const hoy = '2026-10-19'

  it('unas fechas en orden, desde 2020 y hasta hoy, se pueden ver', () => {
    expect(problemaDeFechas({ desde: '2026-08-22', hasta: '2026-09-07' }, hoy)).toBeNull()
    expect(problemaDeFechas({ desde: '2020-01-01', hasta: hoy }, hoy)).toBeNull()
  })

  it('pide las dos', () => {
    expect(problemaDeFechas({ desde: '', hasta: '2026-09-07' }, hoy)).toBe(FECHAS_INCOMPLETAS)
  })

  it('no al revés, no antes de 2020, no después de hoy', () => {
    expect(problemaDeFechas({ desde: '2026-09-07', hasta: '2026-08-22' }, hoy)).toBe(FECHAS_AL_REVES)
    expect(problemaDeFechas({ desde: '2019-12-31', hasta: '2026-08-22' }, hoy)).toBe(FECHAS_ANTES_DE_TODO)
    expect(problemaDeFechas({ desde: '2026-10-01', hasta: '2026-10-20' }, hoy)).toBe(FECHAS_FUTURAS)
  })
})
