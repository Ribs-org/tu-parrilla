import { describe, expect, it } from 'vitest'
import {
  admiteMusica,
  cuentasConMusica,
  moverVolumen,
  musicaDelEnvio,
  musicaElegida,
  nombreDeCancion,
} from './musica'
import { opcionesDelBorrador } from './publicar'
import type { CuentaApp } from './tipos'

const IG: CuentaApp = { id: 'ig-1', red: 'instagram', handle: '@a', conectada: true }
const IG_LOGIN: CuentaApp = { id: 'ig-2', red: 'instagram', handle: '@b', conectada: true, login: 'instagram' }
const FB: CuentaApp = { id: 'fb-1', red: 'facebook', handle: 'Página', conectada: true }
const VIDEO = [{ mediaType: 'video' as const }]
const musica = { audioId: '1', titulo: 'Tusa', artista: 'Karol G', volumenMusica: 50, volumenVideo: 100 }

describe('cuentasConMusica', () => {
  it('las de Instagram marcadas, con un solo video; las de login de Instagram también, para decir por qué no', () => {
    expect(cuentasConMusica([IG, IG_LOGIN, FB], ['ig-1', 'ig-2', 'fb-1'], VIDEO)).toEqual([IG, IG_LOGIN])
    expect(cuentasConMusica([IG], [], VIDEO)).toEqual([])
    expect(cuentasConMusica([IG], ['ig-1'], [{ mediaType: 'image' }])).toEqual([])
    expect(cuentasConMusica([IG], ['ig-1'], [...VIDEO, ...VIDEO])).toEqual([])
    expect(admiteMusica(IG)).toBe(true)
    expect(admiteMusica(IG_LOGIN)).toBe(false)
  })
})

describe('musicaDelEnvio y opcionesDelBorrador', () => {
  it('al programar viaja solo la de cuentas que la admiten, marcadas, con un video', () => {
    const elegidas = { 'ig-1': musica, 'ig-2': musica }
    expect(musicaDelEnvio([IG, IG_LOGIN], ['ig-1', 'ig-2'], VIDEO, elegidas)).toEqual({ 'ig-1': musica })
    expect(opcionesDelBorrador([IG, IG_LOGIN], ['ig-1', 'ig-2'], ['ig-1'], VIDEO, elegidas)).toEqual({
      'ig-1': { trialReel: true, musica },
    })
    expect(opcionesDelBorrador([IG], ['ig-1'], [], [{ mediaType: 'image' }], elegidas)).toEqual({})
  })
})

describe('los pasos de volumen', () => {
  it('de a 10, sin salirse de 1–100', () => {
    expect(moverVolumen(50, 1)).toBe(60)
    expect(moverVolumen(55, -1)).toBe(50)
    expect(moverVolumen(10, -1)).toBe(1)
    expect(moverVolumen(1, 1)).toBe(10)
    expect(moverVolumen(100, 1)).toBe(100)
    expect(moverVolumen(1, -1)).toBe(1)
  })
})

describe('la canción elegida', () => {
  it('nace con la canción a la mitad y el video entero, y conserva los volúmenes al cambiarla', () => {
    const c = { id: '9', titulo: 'Flowers', artista: null, duracionMs: null, portada: null, muestra: null }
    expect(musicaElegida(c)).toEqual({ audioId: '9', titulo: 'Flowers', artista: null, volumenMusica: 50, volumenVideo: 100 })
    expect(musicaElegida(c, 20, 90)).toMatchObject({ volumenMusica: 20, volumenVideo: 90 })
    expect(nombreDeCancion(musica)).toBe('«Tusa» de Karol G')
  })
})
