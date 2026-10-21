import { describe, expect, it } from 'vitest'
import { MAX_CLAVES, sumarIntento, type Cuentas } from './limite'

describe('sumarIntento', () => {
  it('cuenta los intentos de la ventana y frena al pasar el tope', () => {
    const cuentas: Cuentas = new Map()
    expect([1, 2, 3].map(() => sumarIntento(cuentas, 'pedir:1.2.3.4', 2, 1000, 0))).toEqual([false, false, true])
  })

  it('una ventana vencida empieza de cero', () => {
    const cuentas: Cuentas = new Map()
    sumarIntento(cuentas, 'x', 1, 1000, 0)
    expect(sumarIntento(cuentas, 'x', 1, 1000, 500)).toBe(true)
    expect(sumarIntento(cuentas, 'x', 1, 1000, 1001)).toBe(false)
  })

  it('lleno, barre lo vencido antes de guardar otra clave', () => {
    const cuentas: Cuentas = new Map()
    for (let i = 0; i < MAX_CLAVES; i++) sumarIntento(cuentas, `vieja-${i}`, 5, 1000, 0)
    expect(cuentas.size).toBe(MAX_CLAVES)

    sumarIntento(cuentas, 'nueva', 5, 1000, 5000)

    expect(cuentas.size).toBe(1)
    expect(cuentas.has('nueva')).toBe(true)
  })

  it('lleno de claves vigentes, se olvidan las más viejas y nunca pasa del tope', () => {
    const cuentas: Cuentas = new Map()
    for (let i = 0; i < MAX_CLAVES; i++) sumarIntento(cuentas, `vigente-${i}`, 5, 60_000, 0)

    sumarIntento(cuentas, 'nueva', 5, 60_000, 10)

    expect(cuentas.size).toBe(MAX_CLAVES)
    expect(cuentas.has('vigente-0')).toBe(false)
    expect(cuentas.has('nueva')).toBe(true)
  })
})
