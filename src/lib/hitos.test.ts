import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { esRaro, hitoMasAlto, UMBRALES } = await import('./hitos')

describe('los hitos', () => {
  it('los umbrales van de diez en diez, de 100 a un millón', () => {
    expect(UMBRALES).toEqual([100, 1000, 10000, 100000, 1000000])
  })

  it('la llamita dice el más alto que pasó, o nada', () => {
    expect(hitoMasAlto([{ umbral: 100, alcanzadoEn: null }, { umbral: 1000, alcanzadoEn: new Date() }])).toBe(1000)
    expect(hitoMasAlto([])).toBeNull()
    expect(hitoMasAlto(undefined)).toBeNull()
  })
  it('se celebra solo si menos de la mitad de los otros cortes del mes llegó a ese número', () => {
    // Sus cortes suelen pasar las 1.000: ni las 100 ni las 1.000 son raras; las 10.000, sí.
    const otros = [1500, 2200, 900, 3000, 1800]
    expect(esRaro(100, otros)).toBe(false)
    expect(esRaro(1000, otros)).toBe(false)
    expect(esRaro(10_000, otros)).toBe(true)
    // La mitad justa no es «menos de la mitad».
    expect(esRaro(1000, [500, 800, 1200, 1500])).toBe(false)
    expect(esRaro(1000, [500, 800, 900, 1500])).toBe(true)
  })

  it('con menos de tres cortes para comparar, todo se celebra', () => {
    expect(esRaro(100, [])).toBe(true)
    expect(esRaro(100, [5000, 5000])).toBe(true)
  })
})
