import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { hitoMasAlto, UMBRALES } = await import('./hitos')

describe('los hitos', () => {
  it('los umbrales van de diez en diez, de 100 a un millón', () => {
    expect(UMBRALES).toEqual([100, 1000, 10000, 100000, 1000000])
  })

  it('la llamita dice el más alto que pasó, o nada', () => {
    expect(hitoMasAlto([{ umbral: 100, alcanzadoEn: null }, { umbral: 1000, alcanzadoEn: new Date() }])).toBe(1000)
    expect(hitoMasAlto([])).toBeNull()
    expect(hitoMasAlto(undefined)).toBeNull()
  })
})
