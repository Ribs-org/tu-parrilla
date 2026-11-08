import { describe, expect, it } from 'vitest'

import { RESPUESTA_PUBLICA_POR_DEFECTO, hayRegla, reglaInicial, reglaParaEnviar } from './regla'

describe('la palabra clave', () => {
  it('nace vacía, con la respuesta pública de siempre; o con lo del borrador', () => {
    expect(reglaInicial(null)).toEqual({ palabra: '', mensaje: '', respuestaPublica: RESPUESTA_PUBLICA_POR_DEFECTO })
    const guardada = { palabra: 'GUIA', mensaje: 'Toma', respuestaPublica: '' }
    expect(reglaInicial(guardada)).toBe(guardada)
  })

  it('sin palabra no hay regla, aunque el mensaje siga escrito', () => {
    const sinPalabra = { palabra: '  ', mensaje: 'Toma', respuestaPublica: 'Va' }
    expect(hayRegla(sinPalabra)).toBe(false)
    expect(reglaParaEnviar(sinPalabra)).toBeNull()
    const conPalabra = { ...sinPalabra, palabra: 'GUIA' }
    expect(reglaParaEnviar(conPalabra)).toEqual(conPalabra)
  })
})
