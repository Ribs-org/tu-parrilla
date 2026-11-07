import { beforeEach, describe, expect, it, vi } from 'vitest'

// La 1.1.0 no trae el permiso de la cámara ni el del micrófono, y La Cocina le llega por aire: la
// pantalla tiene que esconder «Grabar video» y «Sacar foto» ahí, y mostrarlos en la 1.2.0.
const entorno = vi.hoisted(() => ({ os: 'android', runtimeVersion: null as string | null }))
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return entorno.os
    },
  },
}))
vi.mock('expo-updates', () => ({
  get runtimeVersion() {
    return entorno.runtimeVersion
  },
}))

const { binarioConCamara, sePuedeGrabar } = await import('./grabar')

beforeEach(() => {
  entorno.os = 'android'
  entorno.runtimeVersion = null
})

describe('si el teléfono puede grabar para La Cocina', () => {
  it('la 1.1.0, sin los permisos en el binario: no', () => {
    entorno.runtimeVersion = '1.1.0'
    expect(sePuedeGrabar()).toBe(false)
    expect(binarioConCamara('android', '1.0.3')).toBe(false)
    expect(binarioConCamara('ios', '1.1.9')).toBe(false)
  })

  it('desde la 1.2.0: sí', () => {
    entorno.runtimeVersion = '1.2.0'
    expect(sePuedeGrabar()).toBe(true)
    expect(binarioConCamara('android', '1.10.0')).toBe(true)
    expect(binarioConCamara('android', '2.0')).toBe(true)
  })

  it('en la web, en desarrollo (sin versión) o con una versión que no se entiende: sí, como hasta ahora', () => {
    entorno.os = 'web'
    entorno.runtimeVersion = '1.1.0'
    expect(sePuedeGrabar()).toBe(true)
    expect(binarioConCamara('android', null)).toBe(true)
    expect(binarioConCamara('android', 'exposdk:57.0.0')).toBe(true)
  })
})
