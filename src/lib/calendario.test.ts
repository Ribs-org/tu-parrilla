import { describe, expect, it } from 'vitest'
import {
  acotar,
  cifra,
  dentro,
  diaEnPalabras,
  esValor,
  girar,
  mismoDiaEnOtroMes,
  moverDia,
  nombreDelMes,
  semanasDelMes,
  soloDigitos,
  sumarMeses,
  textoDelValor,
} from './calendario'

describe('el calendario del panel', () => {
  it('reconoce los valores enteros de cada modo, y nada a medias ni que no exista', () => {
    expect(esValor('2026-11-03', 'fecha')).toBe(true)
    expect(esValor('2026-11-03T18:30', 'fecha-hora')).toBe(true)
    expect(esValor('2026-11-03', 'fecha-hora')).toBe(false)
    expect(esValor('', 'fecha')).toBe(false)
    expect(esValor('2026-02-30', 'fecha')).toBe(false)
    expect(esValor('2026-11-0', 'fecha')).toBe(false)
  })

  it('pasa de mes y de año', () => {
    expect(sumarMeses('2026-11', 1)).toBe('2026-12')
    expect(sumarMeses('2026-12', 1)).toBe('2027-01')
    expect(sumarMeses('2026-01', -1)).toBe('2025-12')
    expect(sumarMeses('2026-03', -14)).toBe('2025-01')
  })

  it('el mismo día en otro mes, y si no existe, el último', () => {
    expect(mismoDiaEnOtroMes('2026-01-31', 1)).toBe('2026-02-28')
    expect(mismoDiaEnOtroMes('2028-01-31', 1)).toBe('2028-02-29')
    expect(mismoDiaEnOtroMes('2026-03-15', -1)).toBe('2026-02-15')
  })

  it('arma seis semanas de lunes a domingo, desde la del día 1', () => {
    const semanas = semanasDelMes('2026-11')
    expect(semanas).toHaveLength(6)
    expect(semanas.every((s) => s.length === 7)).toBe(true)
    // El 1 de noviembre de 2026 es domingo: la primera semana parte el lunes 26 de octubre.
    expect(semanas[0]![0]).toBe('2026-10-26')
    expect(semanas[0]![6]).toBe('2026-11-01')
    expect(semanas[5]![6]).toBe('2026-12-06')
  })

  it('dice los días y los meses en castellano, igual en el servidor y en el navegador', () => {
    expect(nombreDelMes('2026-11')).toBe('noviembre de 2026')
    expect(diaEnPalabras('2026-11-03')).toBe('martes 3 de noviembre de 2026')
    expect(textoDelValor('2026-11-03')).toBe('mar 3 nov 2026')
    expect(textoDelValor('2026-11-01T09:05')).toBe('dom 1 nov 2026 · 09:05')
  })

  it('respeta los topes de un campo de fecha', () => {
    expect(dentro('2026-11-03', '2026-11-01', '2026-11-30')).toBe(true)
    expect(dentro('2026-10-31', '2026-11-01')).toBe(false)
    expect(dentro('2026-12-01', undefined, '2026-11-30')).toBe(false)
    expect(acotar('2019-05-01', '2020-01-01', '2026-11-01')).toBe('2020-01-01')
    expect(acotar('2027-05-01', '2020-01-01', '2026-11-01')).toBe('2026-11-01')
  })

  it('mueve el foco del mes con las teclas de un calendario de escritorio', () => {
    expect(moverDia('2026-11-01', 'ArrowLeft')).toBe('2026-10-31')
    expect(moverDia('2026-11-30', 'ArrowRight')).toBe('2026-12-01')
    expect(moverDia('2026-11-03', 'ArrowUp')).toBe('2026-10-27')
    expect(moverDia('2026-11-03', 'ArrowDown')).toBe('2026-11-10')
    expect(moverDia('2026-11-05', 'Home')).toBe('2026-11-02')
    expect(moverDia('2026-11-05', 'End')).toBe('2026-11-08')
    expect(moverDia('2026-03-31', 'PageUp')).toBe('2026-02-28')
    expect(moverDia('2026-11-05', 'PageDown')).toBe('2026-12-05')
    expect(moverDia('2026-11-05', 'Enter')).toBeNull()
  })

  it('la hora escrita queda dentro de su rango, con dos cifras, y da la vuelta', () => {
    expect(soloDigitos('1a8:')).toBe('18')
    expect(cifra('7', 23)).toBe('07')
    expect(cifra('75', 59)).toBe('59')
    expect(cifra('', 23)).toBe('00')
    expect(girar('23', 1, 23)).toBe('00')
    expect(girar('00', -1, 59)).toBe('59')
    expect(girar('9', 1, 23)).toBe('10')
  })
})
