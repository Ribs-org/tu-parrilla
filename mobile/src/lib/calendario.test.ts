import { describe, expect, it } from 'vitest'
import { armar, diaDe, diaEnPalabras, minutosOfrecidos, nombreDelMes, semanasDelMes, sumarMeses } from './calendario'

describe('el calendario de la app', () => {
  it('lee y arma fechas en el reloj del teléfono, sin pasar por UTC', () => {
    const fecha = armar('2026-11-03', 18, 30)
    expect(fecha.getFullYear()).toBe(2026)
    expect(fecha.getMonth()).toBe(10)
    expect(fecha.getDate()).toBe(3)
    expect(fecha.getHours()).toBe(18)
    expect(fecha.getMinutes()).toBe(30)
    expect(diaDe(fecha)).toBe('2026-11-03')
    expect(diaDe(armar('2026-12-31', 23, 59))).toBe('2026-12-31')
  })

  it('pasa de mes y de año', () => {
    expect(sumarMeses('2026-12', 1)).toBe('2027-01')
    expect(sumarMeses('2026-01', -1)).toBe('2025-12')
  })

  it('arma seis semanas de lunes a domingo', () => {
    const semanas = semanasDelMes('2026-11')
    expect(semanas).toHaveLength(6)
    expect(semanas[0]![0]).toBe('2026-10-26')
    expect(semanas[0]![6]).toBe('2026-11-01')
  })

  it('nombra el mes y el día en castellano', () => {
    expect(nombreDelMes('2026-11')).toBe('noviembre de 2026')
    expect(diaEnPalabras('2026-11-03')).toBe('3 de noviembre de 2026')
  })

  it('ofrece los minutos de cinco en cinco, y el que ya traía la fecha', () => {
    expect(minutosOfrecidos(0)).toHaveLength(12)
    expect(minutosOfrecidos(7)).toEqual([0, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
  })
})
