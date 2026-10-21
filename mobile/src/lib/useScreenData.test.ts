import { describe, expect, it } from 'vitest'

import { sirveLoGuardado } from './useScreenData'

describe('sirveLoGuardado', () => {
  it('sin nada en pantalla, lo del disco se muestra', () => {
    expect(sirveLoGuardado(null, 'calendario', 1_000)).toBe(true)
  })

  it('si la red ya contestó para esa clave, lo del disco (más viejo) no la pisa', () => {
    expect(sirveLoGuardado({ key: 'calendario', en: 2_000 }, 'calendario', 1_000)).toBe(false)
    expect(sirveLoGuardado({ key: 'calendario', en: 1_000 }, 'calendario', 1_000)).toBe(false)
  })

  it('lo que está en pantalla es de otra clave —otro rango—: lo del disco es el de la clave de ahora', () => {
    expect(sirveLoGuardado({ key: 'numeros:7d:todas', en: 9_000 }, 'numeros:30d:todas', 1_000)).toBe(true)
  })

  it('lo del disco es más nuevo que lo de la pantalla: se muestra', () => {
    expect(sirveLoGuardado({ key: 'calendario', en: 1_000 }, 'calendario', 2_000)).toBe(true)
  })
})
