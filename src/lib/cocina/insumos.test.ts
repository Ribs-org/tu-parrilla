import { describe, expect, it } from 'vitest'
import { MAX_BYTES } from './bodega'
import { TAMANO_PARTE, baseDeNombre, bytesDeParte, cuantasPartes, partesQueFaltan, rangoDeParte } from './insumos'

describe('las partes', () => {
  it('todas pesan lo mismo salvo la última, que lleva el resto', () => {
    const bytes = 2 * TAMANO_PARTE + 10
    expect(cuantasPartes(bytes)).toBe(3)
    expect(bytesDeParte(1, bytes)).toBe(TAMANO_PARTE)
    expect(bytesDeParte(3, bytes)).toBe(10)
    expect(rangoDeParte(3, bytes)).toEqual({ desde: 2 * TAMANO_PARTE, hasta: bytes })
    expect(cuantasPartes(TAMANO_PARTE)).toBe(1)
    expect(cuantasPartes(5)).toBe(1)
  })

  it('un largo de 20 GB son 320 partes', () => {
    expect(cuantasPartes(MAX_BYTES.video)).toBe(320)
  })

  it('falta lo que no llegó, y lo que llegó con otro peso se vuelve a subir', () => {
    const bytes = 2 * 10 + 4
    expect(partesQueFaltan(bytes, 10, [])).toEqual([1, 2, 3])
    expect(partesQueFaltan(bytes, 10, [{ numero: 1, bytes: 10 }, { numero: 3, bytes: 4 }])).toEqual([2])
    expect(partesQueFaltan(bytes, 10, [{ numero: 1, bytes: 7 }, { numero: 2, bytes: 10 }, { numero: 3, bytes: 4 }])).toEqual([1])
    // Una parte de más (un número fuera del archivo) no cuenta para nada.
    expect(partesQueFaltan(bytes, 10, [{ numero: 9, bytes: 10 }])).toEqual([1, 2, 3])
  })
})

describe('los nombres', () => {
  it('el nombre en la clave va sin extensión, sin tildes y sin espacios', () => {
    expect(baseDeNombre('Entrevista final (versión 2).MOV')).toBe('Entrevista-final-version-2')
    expect(baseDeNombre('…..mp4')).toBe('archivo')
  })
})
