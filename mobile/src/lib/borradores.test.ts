import { describe, expect, it } from 'vitest'

import {
  FRASE_BORRADOR,
  cuentasDelBorrador,
  cuerpoDelBorrador,
  detalleDelBorrador,
  fraseDelBorrador,
  tieneContenido,
  type Formulario,
} from './borradores'
import { archivoDelBorrador, archivoElegido } from './publicar'
import type { CuentaApp } from './tipos'

const VIDEO = { uri: 'file:///v.mp4', nombre: 'v.mp4', tipo: 'video/mp4', bytes: 10, mediaType: 'video' as const }

function formulario(cambios: Partial<Formulario> = {}): Formulario {
  return {
    texto: 'Hola',
    cuentas: ['ig-1'],
    trial: [],
    fecha: new Date('2026-10-20T22:00:00.000Z'),
    fechaPuesta: false,
    archivos: [],
    ...cambios,
  }
}

describe('tieneContenido', () => {
  it('hace falta texto o un archivo ya subido', () => {
    expect(tieneContenido('  ', [])).toBe(false)
    expect(tieneContenido('Hola', [])).toBe(true)
    expect(tieneContenido('', [{ url: 'https://cdn/x.jpg', mediaType: 'image', nombre: 'x.jpg' }])).toBe(true)
  })
})

describe('cuerpoDelBorrador', () => {
  it('la fecha de partida no viaja; la que alguien puso, sí', () => {
    expect(cuerpoDelBorrador(formulario()).cuando).toBeNull()
    expect(cuerpoDelBorrador(formulario({ fechaPuesta: true })).cuando).toBe('2026-10-20T22:00:00.000Z')
  })

  it('dice si es post o historia; en historia guarda igual el texto y el trial, para cuando se vuelva a Post', () => {
    expect(cuerpoDelBorrador(formulario()).modo).toBe('post')
    const historia = formulario({ historia: true, texto: 'Hola', trial: ['ig-1'], archivos: [archivoElegido(VIDEO)] })
    expect(cuerpoDelBorrador(historia)).toMatchObject({ modo: 'historia', texto: 'Hola', opciones: { 'ig-1': { trialReel: true } } })
  })

  it('lleva solo los archivos ya subidos, con su nombre', () => {
    const subido = archivoDelBorrador({ url: 'https://cdn/scheduled/a.jpg', mediaType: 'image', nombre: 'a.jpg' })
    const subiendo = archivoElegido(VIDEO)
    expect(cuerpoDelBorrador(formulario({ archivos: [subido, subiendo] })).media).toEqual([
      { url: 'https://cdn/scheduled/a.jpg', mediaType: 'image', nombre: 'a.jpg' },
    ])
  })

  it('el trial reel viaja con un solo video y la cuenta marcada, aunque todavía no haya subido', () => {
    const conVideo = formulario({ trial: ['ig-1', 'ig-2'], archivos: [archivoElegido(VIDEO)] })
    expect(cuerpoDelBorrador(conVideo).opciones).toEqual({ 'ig-1': { trialReel: true } })
    expect(cuerpoDelBorrador(formulario({ trial: ['ig-1'] })).opciones).toEqual({})
  })

  it('la música de Instagram viaja con el trial, con un solo video y la cuenta marcada; y dice que la app sabe de música', () => {
    const musica = { audioId: '1', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }
    const conVideo = formulario({
      trial: ['ig-1'],
      musica: { 'ig-1': musica, 'ig-2': musica },
      archivos: [archivoElegido(VIDEO)],
    })
    expect(cuerpoDelBorrador(conVideo).opciones).toEqual({ 'ig-1': { trialReel: true, musica } })
    expect(cuerpoDelBorrador(formulario({ musica: { 'ig-1': musica } })).opciones).toEqual({})
    // Sin canción igual lo dice: así quitarla en el teléfono la quita del borrador.
    expect(cuerpoDelBorrador(formulario()).conMusica).toBe(true)
  })
})

describe('cuentasDelBorrador', () => {
  const disponibles: CuentaApp[] = [
    { id: 'ig-1', red: 'instagram', handle: '@a', conectada: true },
    { id: 'fb-1', red: 'facebook', handle: '@b', conectada: false },
  ]

  it('marca las conectadas; sin la lista todavía, deja todas', () => {
    expect(cuentasDelBorrador(['ig-1', 'fb-1', 'otra'], disponibles)).toEqual(['ig-1'])
    expect(cuentasDelBorrador(['ig-1', 'fb-1'], null)).toEqual(['ig-1', 'fb-1'])
  })
})

describe('detalleDelBorrador', () => {
  it('dice para cuándo, cuántos archivos y cuándo se guardó, en la zona del dueño', () => {
    expect(
      detalleDelBorrador({
        id: 'b',
        texto: '',
        cuando: '2026-10-16T19:00:00-03:00',
        guardado: '2026-10-13T14:05:00-03:00',
        archivos: 2,
      }),
    ).toBe('para el vie 16 de oct a las 19:00 · 2 archivos · guardado el mar 13 de oct a las 14:05')
  })

  it('sin fecha ni archivos', () => {
    expect(detalleDelBorrador({ id: 'b', texto: '', cuando: null, guardado: '2026-10-13T14:05:00-03:00', archivos: 0 })).toBe(
      'sin fecha · guardado el mar 13 de oct a las 14:05',
    )
  })
})

describe('fraseDelBorrador', () => {
  it('de día, el borrador perdido manda a mirar La Barra; las demás frases no cambian', () => {
    expect(fraseDelBorrador('perdido', 'noche')).toBe(FRASE_BORRADOR.perdido)
    expect(fraseDelBorrador('perdido', 'dia')).toBe(
      'Este borrador ya no existe: se programó o se descartó. Mira cómo quedó en La Barra.',
    )
    expect(fraseDelBorrador('guardado', 'dia')).toBe(FRASE_BORRADOR.guardado)
  })
})
