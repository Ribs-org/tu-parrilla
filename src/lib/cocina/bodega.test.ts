import { describe, expect, it } from 'vitest'
import {
  CLASES,
  CORTES,
  CUOTA_ILEGIBLE,
  DERECHOS_FALTAN,
  GANCHOS,
  MAX_BYTES,
  NOMBRES_DE_PESO,
  SUBIDA_ILEGIBLE,
  USO_DESCONOCIDO,
  USOS_MATERIAL,
  claseDe,
  estadoDeLaCuota,
  extensionDe,
  ganchosOcupados,
  leerCuotaEnGb,
  leerNombre,
  leerSubida,
  muyGrande,
  noCabe,
  nombreDePeso,
  nivelDePeso,
  pesoEnPalabras,
  tipoDeArchivo,
  tipoNoAceptado,
} from './bodega'

const MB = 1024 ** 2
const GB = 1024 ** 3
const largo = { nombre: 'video9.mp4', tipo: 'video/mp4', bytes: 4 * GB, derechos: true }

describe('qué se guarda en la cámara', () => {
  it('videos, audios, imágenes y lo que una marca le lleva al chef, cada uno con su clase y su extensión', () => {
    expect(claseDe(tipoDeArchivo('obs.mkv', ''))).toBe('video')
    expect(claseDe(tipoDeArchivo('dji.MOV', ''))).toBe('video')
    expect(claseDe(tipoDeArchivo('tema.mp3', 'audio/mpeg'))).toBe('audio')
    expect(claseDe(tipoDeArchivo('logo.png', 'image/png'))).toBe('imagen')
    expect(claseDe(tipoDeArchivo('Letra.ttf', ''))).toBe('otro')
    expect(extensionDe('video/quicktime')).toBe('mov')
    expect(extensionDe('font/otf')).toBe('otf')
  })

  it('lo que cada navegador dice distinto se normaliza: el ZIP de Windows, el M4A de Safari, image/jpg', () => {
    expect(tipoDeArchivo('a.zip', 'application/x-zip-compressed')).toBe('application/zip')
    expect(tipoDeArchivo('a.m4a', 'audio/x-m4a')).toBe('audio/mp4')
    expect(tipoDeArchivo('a.jpg', 'image/jpg')).toBe('image/jpeg')
    // Un tipo que no conocemos, por su extensión; sin ninguna de las dos, nada.
    expect(tipoDeArchivo('subtitulos.srt', 'application/octet-stream')).toBe('application/x-subrip')
    expect(tipoDeArchivo('pagina.html', 'text/html')).toBe('')
  })
})

describe('leerSubida', () => {
  it('lee el archivo con su uso y la duración que leyó el navegador', () => {
    expect(leerSubida({ ...largo, uso: 'intro', duracionS: 20.5 })).toEqual({
      nombre: 'video9.mp4',
      tipoArchivo: 'video/mp4',
      bytes: 4 * GB,
      uso: 'intro',
      duracionS: 20.5,
    })
    expect(leerSubida(largo)).toMatchObject({ uso: null, duracionS: null })
  })

  it('sin la casilla de los derechos no se guarda nada', () => {
    expect(leerSubida({ ...largo, derechos: undefined })).toEqual({ error: DERECHOS_FALTAN })
    expect(leerSubida({ ...largo, derechos: 'sí' })).toEqual({ error: DERECHOS_FALTAN })
  })

  it('un uso que no existe se dice; los que existen, todos entran', () => {
    expect(leerSubida({ ...largo, uso: 'sorpresa' })).toEqual({ error: USO_DESCONOCIDO })
    for (const uso of USOS_MATERIAL) expect(leerSubida({ ...largo, uso }), uso).toMatchObject({ uso })
  })

  it('lo que no se guarda, con su frase: una página web no es material', () => {
    expect(leerSubida({ ...largo, nombre: 'x.html', tipo: 'text/html' })).toEqual({ error: tipoNoAceptado('x.html') })
  })

  it('cada clase tiene su tope', () => {
    expect(leerSubida({ ...largo, bytes: MAX_BYTES.video })).toMatchObject({ bytes: MAX_BYTES.video })
    expect(leerSubida({ ...largo, bytes: MAX_BYTES.video + 1 })).toEqual({ error: muyGrande('video9.mp4', 'video') })
    expect(leerSubida({ ...largo, nombre: 'a.png', tipo: 'image/png', bytes: MAX_BYTES.imagen + 1 })).toEqual({
      error: '«a.png» pesa más de 50 MB, el tope de una imagen.',
    })
    expect(leerSubida({ ...largo, nombre: 'a.wav', tipo: 'audio/wav', bytes: MAX_BYTES.audio + 1 })).toEqual({
      error: '«a.wav» pesa más de 2 GB, el tope de un audio.',
    })
  })

  it('una duración que no se entiende se deja vacía; lo que no tiene nombre o peso no se entiende', () => {
    expect(leerSubida({ ...largo, duracionS: 'larga' })).toMatchObject({ duracionS: null })
    expect(leerSubida({ ...largo, nombre: '  ' })).toEqual({ error: SUBIDA_ILEGIBLE })
    expect(leerSubida({ ...largo, bytes: 1.5 })).toEqual({ error: SUBIDA_ILEGIBLE })
    expect(leerSubida([largo])).toEqual({ error: SUBIDA_ILEGIBLE })
  })
})

describe('cómo se llama según lo que pesa', () => {
  it('un video va de un corte a la vaca entera, y de un trozo a un atún gigante', () => {
    expect(nombreDePeso('video', 80 * MB)).toEqual({ noche: 'un corte', dia: 'un trozo' })
    expect(nombreDePeso('video', 350 * MB)).toEqual({ noche: 'un lomo', dia: 'un filete' })
    expect(nombreDePeso('video', 2 * GB)).toEqual({ noche: 'un cuarto', dia: 'un salmón entero' })
    expect(nombreDePeso('video', 6 * GB)).toEqual({ noche: 'media res', dia: 'un atún' })
    expect(nombreDePeso('video', 10 * GB)).toEqual({ noche: 'la vaca entera', dia: 'un atún gigante' })
    expect(nombreDePeso('audio', 4 * MB)).toEqual({ noche: 'una longaniza', dia: 'un tentáculo' })
  })

  it('cada clase tiene un nombre por cada corte, y los cortes van de menor a mayor', () => {
    for (const clase of CLASES) {
      expect(NOMBRES_DE_PESO[clase]).toHaveLength(CORTES[clase].length + 1)
      expect([...CORTES[clase]].sort((a, b) => a - b)).toEqual(CORTES[clase])
      expect(nivelDePeso(clase, 1)).toBe(0)
      expect(nivelDePeso(clase, Number.MAX_SAFE_INTEGER)).toBe(CORTES[clase].length)
    }
  })
})

describe('la cuota', () => {
  it('holgada, llenándose desde el 85 % y llena al tope', () => {
    expect(estadoDeLaCuota(0, 20 * GB)).toBe('holgada')
    expect(estadoDeLaCuota(16.9 * GB, 20 * GB)).toBe('holgada')
    expect(estadoDeLaCuota(17 * GB, 20 * GB)).toBe('llenandose')
    expect(estadoDeLaCuota(20 * GB, 20 * GB)).toBe('llena')
    expect(estadoDeLaCuota(25 * GB, 20 * GB)).toBe('llena')
  })

  it('los ganchos: con algo adentro, al menos uno; llena, todos', () => {
    expect(ganchosOcupados(0, 20 * GB)).toBe(0)
    expect(ganchosOcupados(1, 20 * GB)).toBe(1)
    expect(ganchosOcupados(10 * GB, 20 * GB)).toBe(5)
    expect(ganchosOcupados(30 * GB, 20 * GB)).toBe(GANCHOS)
  })

  it('cuando no cabe, cuánto pesa, cuánto queda y qué hacer', () => {
    expect(noCabe('largo.mp4', 6 * GB, 3.1 * GB, 20 * GB)).toBe(
      'No hay espacio para «largo.mp4»: pesa 6 GB y te quedan 3,1 GB libres de 20 GB. Saca algo que ya no uses, o pide más espacio.',
    )
    expect(noCabe('x.mp4', GB, -5, 20 * GB)).toContain('te quedan 0 MB libres')
  })

  it('la que escribe el admin, en GB: con coma o punto; vacía es la de siempre', () => {
    expect(leerCuotaEnGb('50')).toBe(50 * GB)
    expect(leerCuotaEnGb('7,5')).toBe(7.5 * GB)
    expect(leerCuotaEnGb(' ')).toBeNull()
    for (const malo of ['0', '-3', 'mucho', '10001', '1e3']) expect(leerCuotaEnGb(malo), malo).toEqual({ error: CUOTA_ILEGIBLE })
  })
})

describe('las palabras', () => {
  it('el peso: GB desde un giga, MB bajo eso', () => {
    expect(pesoEnPalabras(4.2 * GB)).toBe('4,2 GB')
    expect(pesoEnPalabras(350.2 * MB)).toBe('350,2 MB')
    expect(pesoEnPalabras(20 * GB)).toBe('20 GB')
    expect(pesoEnPalabras(1000)).toBe('0,1 MB')
  })

  it('un nombre nuevo, sin espacios en las puntas y no vacío', () => {
    expect(leerNombre('  Mi intro ')).toBe('Mi intro')
    expect(leerNombre('   ')).toHaveProperty('error')
    expect(leerNombre('x'.repeat(201))).toHaveProperty('error')
  })
})
