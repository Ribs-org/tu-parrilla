import { beforeEach, describe, expect, it, vi } from 'vitest'

// La 1.1.0 no tiene el módulo nativo de `expo-audio`, y cargar `expo-audio` ahí revienta. Lo que
// se prueba: que sin el módulo nativo `reproductor.ts` ni siquiera carga `expo-audio` y abre la
// muestra afuera, y que con el módulo nativo lo reconoce.
const nativo = vi.hoisted(() => ({ modulo: null as object | null, pedidos: [] as string[] }))
vi.mock('expo', () => ({
  requireOptionalNativeModule: (nombre: string) => {
    nativo.pedidos.push(nombre)
    return nativo.modulo
  },
}))
const abrir = vi.hoisted(() => vi.fn(async () => true))
vi.mock('react-native', () => ({ Platform: { OS: 'android' }, Linking: { openURL: abrir } }))
vi.mock('expo-audio', () => {
  throw new Error('expo-audio no se debía cargar sin su módulo nativo')
})

const { crearReproductor, hayAudioNativo, muestraSeAbreAfuera } = await import('./reproductor')

beforeEach(() => {
  nativo.modulo = null
  nativo.pedidos.length = 0
  abrir.mockClear()
})

describe('el reproductor de la muestra', () => {
  it('sin el módulo nativo (la 1.1.0): abre la muestra afuera, sin cargar expo-audio', async () => {
    expect(hayAudioNativo()).toBe(false)
    expect(nativo.pedidos).toEqual(['ExpoAudio'])
    expect(muestraSeAbreAfuera()).toBe(true)
    const reproductor = crearReproductor()
    const fin = vi.fn()
    expect(await reproductor.tocar('https://cdn/x.mp3', fin)).toBe('afuera')
    expect(abrir).toHaveBeenCalledWith('https://cdn/x.mp3')
    expect(() => reproductor.parar()).not.toThrow()
  })

  it('con el módulo nativo (la 1.2.0) lo reconoce, y no abre nada afuera', () => {
    nativo.modulo = {}
    expect(hayAudioNativo()).toBe(true)
    expect(muestraSeAbreAfuera()).toBe(false)
    crearReproductor()
    expect(abrir).not.toHaveBeenCalled()
  })
})
