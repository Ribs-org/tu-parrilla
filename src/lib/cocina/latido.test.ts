import { describe, expect, it } from 'vitest'
import { COCINA_A_MANO, COCINA_CERRADA, COCINA_SOLA, clasificarCocina, cocinaEnPalabras, duracionEnPalabras, etaEnLaFila } from './latido'

const AHORA = new Date('2026-11-06T12:00:00Z')
const hace = (minutos: number) => new Date(AHORA.getTime() - minutos * 60_000)

describe('cómo atiende la cocina', () => {
  it('sin latidos, cerrada', () => {
    expect(clasificarCocina([], AHORA)).toEqual({ abierta: false, atiende: 'cerrada', ultimoLatido: null, trabajos: null, minutosPorComanda: null })
  })

  it('late pero nadie toma solo: abierta, a mano, y sin datos para la hora estimada', () => {
    // El 2026-11-02 latía así el temporizador mientras una comanda esperaba cuatro días.
    const cocina = clasificarCocina([{ en: hace(1), datos: { trabajos: 2, minutosPorComanda: 240 } }], AHORA)
    expect(cocina).toEqual({ abierta: true, atiende: 'a-mano', ultimoLatido: hace(1), trabajos: null, minutosPorComanda: null })
  })

  it('un trabajador que toma solo y latió hace poco: sola, con lo que contó él', () => {
    const cocina = clasificarCocina(
      [
        { en: hace(1), datos: { version: 'temporizador' } },
        { en: hace(3), datos: { automatico: true, trabajos: 2, minutosPorComanda: 240 } },
      ],
      AHORA,
    )
    expect(cocina).toEqual({ abierta: true, atiende: 'sola', ultimoLatido: hace(1), trabajos: 2, minutosPorComanda: 240 })
  })

  it('el que toma solo, callado por más de diez minutos, ya no cuenta; `automatico` tiene que ser true', () => {
    expect(clasificarCocina([{ en: hace(11), datos: { automatico: true } }, { en: hace(2), datos: null }], AHORA).atiende).toBe('a-mano')
    expect(clasificarCocina([{ en: hace(2), datos: { automatico: 'si' } }], AHORA).atiende).toBe('a-mano')
    expect(clasificarCocina([{ en: hace(11), datos: { automatico: true } }], AHORA)).toMatchObject({ abierta: false, atiende: 'cerrada', ultimoLatido: hace(11) })
  })
})

describe('la hora estimada de lo que espera', () => {
  const sola = clasificarCocina([{ en: hace(1), datos: { automatico: true, trabajos: 2, minutosPorComanda: 240 } }], AHORA)

  it('sola: las que van antes y ella, repartidas entre los trabajos, a lo que tarda una', () => {
    // Dos antes y ella: tres comandas en dos trabajos son dos vueltas de cuatro horas.
    expect(etaEnLaFila(2, sola, AHORA)).toEqual(new Date('2026-11-06T20:00:00Z'))
  })

  it('a mano, cerrada o sin cuánto tarda, no se adivina', () => {
    expect(etaEnLaFila(0, { ...sola, atiende: 'a-mano' }, AHORA)).toBeNull()
    expect(etaEnLaFila(0, { ...sola, atiende: 'cerrada', abierta: false }, AHORA)).toBeNull()
    expect(etaEnLaFila(0, { ...sola, minutosPorComanda: null }, AHORA)).toBeNull()
  })
})

describe('la línea de arriba de La Cocina', () => {
  it('sola, con cuánto tarda una si lo contó; a mano, que puede ser al día hábil siguiente; cerrada, como siempre', () => {
    expect(cocinaEnPalabras({ atiende: 'sola', minutosPorComanda: 240 })).toBe(`${COCINA_SOLA} Cada una tarda unas 4 horas.`)
    expect(cocinaEnPalabras({ atiende: 'sola', minutosPorComanda: null })).toBe('La cocina está abierta: el chef toma las comandas apenas llegan.')
    expect(cocinaEnPalabras({ atiende: 'a-mano', minutosPorComanda: null })).toBe(COCINA_A_MANO)
    expect(COCINA_A_MANO).toBe('La cocina atiende a mano: una persona toma las comandas, así que la tuya puede tardar hasta el próximo día hábil.')
    expect(cocinaEnPalabras({ atiende: 'cerrada', minutosPorComanda: null })).toBe(COCINA_CERRADA)
  })

  it('lo que tarda, redondeado', () => {
    expect(duracionEnPalabras(38)).toBe('unos 40 minutos')
    expect(duracionEnPalabras(70)).toBe('una hora')
    expect(duracionEnPalabras(150)).toBe('unas 3 horas')
  })
})
