import { describe, expect, it } from 'vitest'

import { SERVIDOR_FALLO, fraseDeRechazo, limpiarCodigo, normalizarCorreo } from './ingreso'

describe('normalizarCorreo', () => {
  it('minúsculas y sin espacios, como lo busca el servidor', () => {
    expect(normalizarCorreo('  Ana@Correo.CL ')).toBe('ana@correo.cl')
  })

  it('rechaza lo que el servidor rechazaría', () => {
    expect(normalizarCorreo('')).toBeNull()
    expect(normalizarCorreo('ana@correo')).toBeNull()
    expect(normalizarCorreo('ana correo.cl')).toBeNull()
  })
})

describe('limpiarCodigo', () => {
  it('deja solo los dígitos de lo que se pega', () => {
    expect(limpiarCodigo(' 123-456 ')).toBe('123456')
  })

  it('no pasa de seis', () => {
    expect(limpiarCodigo('1234567')).toBe('123456')
  })
})

describe('fraseDeRechazo', () => {
  it('muestra la frase del servidor tal cual', () => {
    expect(fraseDeRechazo({ error: 'Ese código no es válido o ya venció.' })).toBe('Ese código no es válido o ya venció.')
  })

  it('sin frase, no culpa a la persona', () => {
    expect(fraseDeRechazo({})).toBe(SERVIDOR_FALLO)
    expect(fraseDeRechazo(null)).toBe(SERVIDOR_FALLO)
    expect(fraseDeRechazo({ error: '' })).toBe(SERVIDOR_FALLO)
    expect(fraseDeRechazo({ error: 503 })).toBe(SERVIDOR_FALLO)
  })
})
