import { beforeEach, describe, expect, it, vi } from 'vitest'

// Sin el módulo nativo de `expo-video` (un binario de antes de la 1.2.0), cargarlo revienta: lo que
// se prueba es que `video.ts` solo pregunta por el nativo, sin cargar `expo-video`.
const nativo = vi.hoisted(() => ({ modulo: null as object | null, pedidos: [] as string[], os: 'android' }))
vi.mock('expo', () => ({
  requireOptionalNativeModule: (nombre: string) => {
    nativo.pedidos.push(nombre)
    return nativo.modulo
  },
}))
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return nativo.os
    },
  },
}))
vi.mock('expo-video', () => {
  throw new Error('expo-video no se debía cargar')
})

const { hayVideoNativo } = await import('./video')

beforeEach(() => {
  nativo.modulo = null
  nativo.pedidos.length = 0
  nativo.os = 'android'
})

describe('el video del mesón', () => {
  it('sin el módulo nativo, no hay video adentro, y no se carga expo-video', () => {
    expect(hayVideoNativo()).toBe(false)
    expect(nativo.pedidos).toEqual(['ExpoVideo'])
  })

  it('con el módulo nativo (la 1.2.0), sí', () => {
    nativo.modulo = {}
    expect(hayVideoNativo()).toBe(true)
  })

  it('en la web, el del navegador', () => {
    nativo.os = 'web'
    expect(hayVideoNativo()).toBe(true)
    expect(nativo.pedidos).toEqual([])
  })
})
