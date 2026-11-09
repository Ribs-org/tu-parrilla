import { describe, expect, it } from 'vitest'
import { DURACION_MS, valorA } from './contador-que-sube'

describe('el contador que sube', () => {
  it('parte de cero y llega justo a la cifra', () => {
    expect(valorA(1000, 0)).toBe(0)
    expect(valorA(1000, DURACION_MS)).toBe(1000)
    expect(valorA(1000, DURACION_MS * 3)).toBe(1000)
  })

  it('sube rápido al principio y frena al llegar, sin pasarse ni bajar', () => {
    const marcas = Array.from({ length: 19 }, (_, i) => valorA(1_000_000, (DURACION_MS * i) / 18))
    for (let i = 1; i < marcas.length; i++) expect(marcas[i]!).toBeGreaterThanOrEqual(marcas[i - 1]!)
    expect(Math.max(...marcas)).toBe(1_000_000)
    // A la mitad del tiempo ya va en más de la mitad.
    expect(valorA(1_000_000, DURACION_MS / 2)).toBeGreaterThan(500_000)
  })
})
