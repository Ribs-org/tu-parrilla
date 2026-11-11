import { beforeEach, describe, expect, it, vi } from 'vitest'

// El número del ícono sin teléfono: el módulo nativo es de mentira. Lo que se prueba: que sin él (la
// 1.1.0) no pasa nada, que con él se le pasa el número una vez por cambio, y que la pestaña se entera.
const h = vi.hoisted(() => ({
  nativo: null as { setBadgeCountAsync: (n: number) => Promise<boolean> } | null,
  puestos: [] as number[],
}))

vi.mock('expo', () => ({ requireOptionalNativeModule: () => h.nativo }))
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }))

const { escucharNumero, leerNumero, ponerNumero } = await import('./numero-del-icono')

beforeEach(() => {
  h.nativo = {
    setBadgeCountAsync: async (n) => {
      h.puestos.push(n)
      return true
    },
  }
  h.puestos.length = 0
})

describe('el número del ícono', () => {
  it('lo pasa al ícono una vez por cambio, y avisa a la pestaña', async () => {
    let avisos = 0
    const dejar = escucharNumero(() => avisos++)
    ponerNumero(3)
    ponerNumero(3)
    ponerNumero(0)
    await Promise.resolve()
    expect(h.puestos).toEqual([3, 0])
    expect(avisos).toBe(2)
    expect(leerNumero()).toBe(0)
    dejar()
    ponerNumero(5)
    expect(avisos).toBe(2)
  })

  it('sin el módulo nativo (la 1.1.0) la pestaña lo tiene igual, y el ícono no', async () => {
    h.nativo = null
    ponerNumero(7)
    await Promise.resolve()
    expect(leerNumero()).toBe(7)
    expect(h.puestos).toEqual([])
  })

  it('un número raro queda en cero', () => {
    ponerNumero(Number.NaN)
    expect(leerNumero()).toBe(0)
    ponerNumero(-2)
    expect(leerNumero()).toBe(0)
  })
})
