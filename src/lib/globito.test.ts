import { describe, expect, it } from 'vitest'
import { posicionDelGlobito } from './globito'

const PANTALLA = { width: 390, height: 800 }
const GLOBITO = { width: 200, height: 40 }

describe('posicionDelGlobito', () => {
  it('va encima y centrado sobre lo que explica', () => {
    expect(posicionDelGlobito({ left: 100, top: 300, width: 100, height: 20 }, GLOBITO, PANTALLA)).toEqual({
      left: 50,
      top: 252,
      abajo: false,
    })
  })

  it('va debajo si arriba no cabe', () => {
    expect(posicionDelGlobito({ left: 100, top: 20, width: 100, height: 20 }, GLOBITO, PANTALLA)).toEqual({
      left: 50,
      top: 48,
      abajo: true,
    })
  })

  it('no se sale por los lados', () => {
    expect(posicionDelGlobito({ left: 0, top: 300, width: 20, height: 20 }, GLOBITO, PANTALLA).left).toBe(8)
    expect(posicionDelGlobito({ left: 370, top: 300, width: 20, height: 20 }, GLOBITO, PANTALLA).left).toBe(182)
  })
})
