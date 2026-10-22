import { describe, expect, it } from 'vitest'
import { TIPOS_INSUMO } from '@/db/schema'
import {
  DERECHOS_FALTAN,
  INSUMO_DESCONOCIDO,
  MAX_BYTES_IMAGEN,
  MAX_BYTES_VIDEO,
  SUBIDA_ILEGIBLE,
  SUBTIPO_FALTA,
  TAMANO_PARTE,
  baseDeNombre,
  bytesDeParte,
  cuantasPartes,
  leerSubida,
  muyGrande,
  partesQueFaltan,
  rangoDeParte,
  tipoDeArchivo,
  tipoNoAceptado,
} from './insumos'

const largo = { nombre: 'video9.mp4', tipo: 'video/mp4', bytes: 4_000_000_000, insumo: 'principal', subtipo: 'largo', derechos: true }

describe('leerSubida', () => {
  it('lee el plato principal, con su subtipo y la duración que leyó el navegador', () => {
    expect(leerSubida({ ...largo, duracionS: 1800.5 })).toEqual({
      nombre: 'video9.mp4',
      tipoArchivo: 'video/mp4',
      bytes: 4_000_000_000,
      tipo: 'principal',
      subtipo: 'largo',
      duracionS: 1800.5,
    })
  })

  it('el plato principal dice qué es; lo que acompaña no lleva subtipo', () => {
    expect(leerSubida({ ...largo, subtipo: undefined })).toEqual({ error: SUBTIPO_FALTA })
    expect(leerSubida({ ...largo, subtipo: 'otro' })).toEqual({ error: SUBTIPO_FALTA })
    expect(leerSubida({ ...largo, insumo: 'camara', subtipo: 'largo' })).toMatchObject({ tipo: 'camara', subtipo: null })
  })

  it('sin la casilla de los derechos no se sube nada', () => {
    expect(leerSubida({ ...largo, derechos: undefined })).toEqual({ error: DERECHOS_FALTAN })
    expect(leerSubida({ ...largo, derechos: 'sí' })).toEqual({ error: DERECHOS_FALTAN })
  })

  it('el plato principal es un video; las imágenes o el b-roll también aceptan fotos', () => {
    const foto = { ...largo, nombre: 'evento.jpg', tipo: 'image/jpeg', bytes: 3_000_000 }
    expect(leerSubida(foto)).toEqual({ error: tipoNoAceptado('evento.jpg', 'principal') })
    expect(leerSubida({ ...foto, insumo: 'imagen' })).toMatchObject({ tipo: 'imagen', tipoArchivo: 'image/jpeg' })
    expect(leerSubida({ ...largo, nombre: 'notas.pdf', tipo: 'application/pdf' })).toEqual({
      error: tipoNoAceptado('notas.pdf', 'principal'),
    })
  })

  it('el MKV de OBS entra aunque no se pueda publicar tal cual, y un tipo vacío sale de la extensión', () => {
    expect(leerSubida({ ...largo, nombre: 'obs.mkv', tipo: '' })).toMatchObject({ tipoArchivo: 'video/x-matroska' })
    expect(leerSubida({ ...largo, nombre: 'dji.MOV', tipo: '' })).toMatchObject({ tipoArchivo: 'video/quicktime' })
  })

  it('cada tipo tiene su tope: 20 GB un video, 50 MB una foto', () => {
    expect(leerSubida({ ...largo, bytes: MAX_BYTES_VIDEO })).toMatchObject({ bytes: MAX_BYTES_VIDEO })
    expect(leerSubida({ ...largo, bytes: MAX_BYTES_VIDEO + 1 })).toEqual({ error: muyGrande('video9.mp4', 'video/mp4') })
    const foto = { ...largo, insumo: 'imagen', nombre: 'a.png', tipo: 'image/png', bytes: MAX_BYTES_IMAGEN + 1 }
    expect(leerSubida(foto)).toEqual({ error: '«a.png» pesa más de 50 MB, el tope de una foto.' })
  })

  it('una duración que no se entiende se deja vacía, no rechaza el archivo', () => {
    expect(leerSubida({ ...largo, duracionS: 'larga' })).toMatchObject({ duracionS: null })
    expect(leerSubida({ ...largo, duracionS: -3 })).toMatchObject({ duracionS: null })
  })

  it('lo que no tiene nombre, peso o tipo de insumo no se entiende', () => {
    expect(leerSubida({ ...largo, nombre: '  ' })).toEqual({ error: SUBIDA_ILEGIBLE })
    expect(leerSubida({ ...largo, bytes: 0 })).toEqual({ error: SUBIDA_ILEGIBLE })
    expect(leerSubida({ ...largo, bytes: 1.5 })).toEqual({ error: SUBIDA_ILEGIBLE })
    expect(leerSubida({ ...largo, insumo: 'condimento' })).toEqual({ error: INSUMO_DESCONOCIDO })
    expect(leerSubida([largo])).toEqual({ error: SUBIDA_ILEGIBLE })
  })

  it('acepta los mismos tipos de insumo que el esquema, ni uno más', () => {
    for (const tipo of TIPOS_INSUMO) {
      expect(leerSubida({ ...largo, insumo: tipo }), tipo).not.toEqual({ error: INSUMO_DESCONOCIDO })
    }
  })
})

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
    expect(cuantasPartes(MAX_BYTES_VIDEO)).toBe(320)
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

  it('el tipo de archivo se normaliza como al programar: image/jpg es image/jpeg', () => {
    expect(tipoDeArchivo('a.jpg', 'image/jpg')).toBe('image/jpeg')
    expect(tipoDeArchivo('a.raro', '')).toBe('')
  })
})
