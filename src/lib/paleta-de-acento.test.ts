import { describe, expect, it } from 'vitest'
import { hslAHex, leerHex, muestraDeColores } from './paleta-de-acento'

describe('el selector de color', () => {
  it('pasa de HSL a hex', () => {
    expect(hslAHex(0, 100, 50)).toBe('#ff0000')
    expect(hslAHex(120, 100, 50)).toBe('#00ff00')
    expect(hslAHex(240, 100, 50)).toBe('#0000ff')
    expect(hslAHex(0, 0, 100)).toBe('#ffffff')
    expect(hslAHex(0, 0, 0)).toBe('#000000')
  })

  it('la muestra trae seis filas de doce, sin repetir, con los grises al final', () => {
    const muestra = muestraDeColores()
    expect(muestra).toHaveLength(6)
    expect(muestra.every((fila) => fila.length === 12)).toBe(true)
    expect(new Set(muestra.flat()).size).toBe(72)
    expect(muestra[5]![0]).toBe('#ffffff')
    expect(muestra[5]![11]).toBe('#000000')
  })

  it('lee un código escrito a mano', () => {
    expect(leerHex('#3D7BFF')).toBe('#3d7bff')
    expect(leerHex('3d7bff')).toBe('#3d7bff')
    expect(leerHex(' #f80 ')).toBe('#ff8800')
    expect(leerHex('#3d7bf')).toBeNull()
    expect(leerHex('rojo')).toBeNull()
  })
})
