import { describe, expect, it } from 'vitest'

import {
  HISTORIA_JPG,
  SE_VE_CON_BORDES,
  avisosDeHistoria,
  cuentasQueVan,
  detalleDeHistorias,
  duracionLegible,
  etiquetaProgramar,
  medidasDe,
  moverArchivo,
  opcionesDeHistoria,
  puedeEnviarHistoria,
  seCortaEn60,
} from './historias'
import { archivoDelBorrador, archivoElegido } from './publicar'
import type { CuentaApp } from './tipos'

const cuenta = (id: string, red: string): CuentaApp => ({ id, red, handle: `@${id}`, conectada: true })
const DISPONIBLES = [cuenta('ig', 'instagram'), cuenta('fb', 'facebook'), cuenta('yt', 'youtube')]

const vertical = { ancho: 1080, alto: 1920, duracionMs: null }
const foto = (nombre: string, tipo: string) =>
  archivoElegido({ uri: `file:///${nombre}`, nombre, tipo, bytes: 10, mediaType: 'image' }, vertical)
const video = (duracionMs: number, ancho = 1080, alto = 1920) =>
  archivoElegido({ uri: 'file:///v.mp4', nombre: 'v.mp4', tipo: 'video/mp4', bytes: 10, mediaType: 'video' }, {
    ancho,
    alto,
    duracionMs,
  })

describe('cuentasQueVan', () => {
  it('en Post van todas las marcadas; en Historia, solo las de Instagram y Facebook', () => {
    expect(cuentasQueVan('post', ['ig', 'yt'], DISPONIBLES)).toEqual(['ig', 'yt'])
    expect(cuentasQueVan('historia', ['ig', 'fb', 'yt'], DISPONIBLES)).toEqual(['ig', 'fb'])
  })

  it('sin la lista de cuentas todavía, una historia no manda ninguna: no se sabe de qué red es cada una', () => {
    expect(cuentasQueVan('historia', ['ig'], [])).toEqual([])
  })
})

describe('avisosDeHistoria', () => {
  it('una foto que no es JPG hacia Instagram bloquea con la frase del servidor; hacia Facebook sola, no', () => {
    const png = foto('a.png', 'image/png')
    expect(avisosDeHistoria(png, true, false)).toEqual([{ texto: HISTORIA_JPG, bloquea: true }])
    expect(avisosDeHistoria(png, false, true)).toEqual([])
    expect(avisosDeHistoria(foto('a.jpg', 'image/jpeg'), true, true)).toEqual([])
  })

  it('una foto de un borrador se juzga por la extensión de su archivo', () => {
    const webp = archivoDelBorrador({ url: 'https://cdn/scheduled/x.webp', mediaType: 'image', nombre: 'x.webp' })
    expect(avisosDeHistoria(webp, true, false)).toEqual([{ texto: HISTORIA_JPG, bloquea: true }])
  })

  it('un video de más de 60 s se avisa sin bloquear, con la red que lo corta', () => {
    expect(avisosDeHistoria(video(75_000), true, true)).toEqual([{ texto: seCortaEn60(true), bloquea: false }])
    expect(avisosDeHistoria(video(75_000), false, true)[0]!.texto).toBe('Facebook corta en 60 s: súbelo partido.')
    expect(avisosDeHistoria(video(60_000), true, false)).toEqual([])
  })

  it('lo que no es 9:16 se va a ver con bordes; sin medidas no se dice nada', () => {
    expect(avisosDeHistoria(video(10_000, 1920, 1080), true, false)).toEqual([{ texto: SE_VE_CON_BORDES, bloquea: false }])
    expect(avisosDeHistoria(video(10_000, 720, 1280), true, false)).toEqual([])
    const sinMedidas = archivoDelBorrador({ url: 'https://cdn/scheduled/v.mp4', mediaType: 'video', nombre: 'v.mp4' })
    expect(avisosDeHistoria(sinMedidas, true, true)).toEqual([])
  })
})

describe('medidasDe', () => {
  it('toma ancho, alto y duración del selector; un 0 es que no lo sabe', () => {
    expect(medidasDe({ width: 1080, height: 1920, duration: 12_000 })).toEqual({ ancho: 1080, alto: 1920, duracionMs: 12_000 })
    expect(medidasDe({ width: 1080, height: 1920, duration: null })).toEqual({ ancho: 1080, alto: 1920, duracionMs: null })
    expect(medidasDe({ width: 0, height: 1920 })).toBeNull()
  })
})

describe('lo que dice la pantalla', () => {
  it('el botón cuenta las historias', () => {
    expect(etiquetaProgramar('post', 3)).toBe('Programar')
    expect(etiquetaProgramar('historia', 1)).toBe('Programar historia')
    expect(etiquetaProgramar('historia', 3)).toBe('Programar 3 historias')
    expect(detalleDeHistorias(1)).toBe('Sale una historia.')
    expect(detalleDeHistorias(2)).toBe('Salen 2 historias, una detrás de otra, en este orden.')
  })

  it('la duración del video, en minutos y segundos', () => {
    expect(duracionLegible(45_000)).toBe('0:45')
    expect(duracionLegible(80_400)).toBe('1:20')
  })

  it('una historia pide un archivo, una cuenta y nada que bloquee', () => {
    expect(puedeEnviarHistoria(1, 1, false)).toBe(true)
    expect(puedeEnviarHistoria(0, 1, false)).toBe(false)
    expect(puedeEnviarHistoria(2, 0, false)).toBe(false)
    expect(puedeEnviarHistoria(2, 1, true)).toBe(false)
  })
})

describe('opcionesDeHistoria y moverArchivo', () => {
  it('cada cuenta que va lleva { historia: true }', () => {
    expect(opcionesDeHistoria(['ig', 'fb'])).toEqual({ ig: { historia: true }, fb: { historia: true } })
  })

  it('mueve un lugar y en las puntas no hace nada', () => {
    const lista = [{ clave: 'a' }, { clave: 'b' }, { clave: 'c' }]
    expect(moverArchivo(lista, 'b', -1).map((a) => a.clave)).toEqual(['b', 'a', 'c'])
    expect(moverArchivo(lista, 'b', 1).map((a) => a.clave)).toEqual(['a', 'c', 'b'])
    expect(moverArchivo(lista, 'a', -1)).toBe(lista)
    expect(moverArchivo(lista, 'c', 1)).toBe(lista)
  })
})
