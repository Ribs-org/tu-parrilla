import { describe, expect, it } from 'vitest'
import { duracionMaxima, problemasTikTok, segundosLegibles, videoMuyLargo, type MediaMedida } from './limites'

const foto = (extra: Partial<MediaMedida> = {}): MediaMedida => ({
  nombre: 'foto.jpg',
  tipo: 'foto',
  bytes: 200_000,
  ancho: 1080,
  alto: 1920,
  segundos: null,
  ...extra,
})

const video = (extra: Partial<MediaMedida> = {}): MediaMedida => ({
  nombre: 'corto.mp4',
  tipo: 'video',
  bytes: 5_000_000,
  ancho: 1080,
  alto: 1920,
  segundos: 30,
  ...extra,
})

describe('fotos', () => {
  it('una vertical de 1080×1920 pasa', () => {
    expect(problemasTikTok(foto())).toEqual([])
  })

  it('el caso que falló en producción: más de 1080p de lado corto', () => {
    const problemas = problemasTikTok(foto({ ancho: 1440, alto: 2560 }))
    expect(problemas).toHaveLength(1)
    expect(problemas[0]).toContain('1080p')
    expect(problemas[0]).toContain('1440×2560')
  })

  it('una horizontal de 1920×1080 pasa: el límite es el lado corto', () => {
    expect(problemasTikTok(foto({ ancho: 1920, alto: 1080 }))).toEqual([])
  })

  it('más de veinte megas no pasa', () => {
    const problemas = problemasTikTok(foto({ bytes: 25 * 1024 * 1024 }))
    expect(problemas).toHaveLength(1)
    expect(problemas[0]).toContain('25 MB')
  })

  it('acumula los dos problemas cuando los tiene', () => {
    expect(problemasTikTok(foto({ bytes: 30 * 1024 * 1024, ancho: 3000, alto: 4000 }))).toHaveLength(2)
  })

  it('sin medidas legibles no inventa un problema', () => {
    expect(problemasTikTok(foto({ ancho: null, alto: null }))).toEqual([])
  })
})

describe('videos', () => {
  it('un vertical corriente pasa', () => {
    expect(problemasTikTok(video())).toEqual([])
  })

  it('un video de 1440×2560 pasa: en video el techo es 4096, no 1080', () => {
    expect(problemasTikTok(video({ ancho: 1440, alto: 2560 }))).toEqual([])
  })

  it('demasiado chico o demasiado grande no pasa', () => {
    expect(problemasTikTok(video({ ancho: 240, alto: 320 }))[0]).toContain('360')
    expect(problemasTikTok(video({ ancho: 5000, alto: 8000 }))[0]).toContain('4096')
  })

  it('más de diez minutos no pasa', () => {
    expect(problemasTikTok(video({ segundos: 15 * 60 }))[0]).toContain('10')
  })

  it('sin duración legible no inventa un problema', () => {
    expect(problemasTikTok(video({ segundos: null }))).toEqual([])
  })
})

describe('el largo máximo de la cuenta', () => {
  it('dice el máximo que da creator_info, o nada sin dato', () => {
    expect(duracionMaxima(600)).toBe('En esta cuenta, TikTok publica videos de hasta 10 min.')
    expect(duracionMaxima(180)).toBe('En esta cuenta, TikTok publica videos de hasta 3 min.')
    expect(duracionMaxima(null)).toBeNull()
    expect(duracionMaxima(undefined)).toBeNull()
    expect(duracionMaxima(0)).toBeNull()
  })

  it('avisa del video que se pasa del máximo de esa cuenta', () => {
    expect(videoMuyLargo([video({ segundos: 601 })], 600)).toBe(
      'Este video dura 10 min 1 s y TikTok publica en esta cuenta videos de hasta 10 min.',
    )
    // El caso del bug: el límite general de la API son 10 minutos, pero la cuenta tiene 3.
    expect(problemasTikTok(video({ segundos: 240 }))).toEqual([])
    expect(videoMuyLargo([video({ segundos: 240 })], 180)).toBe(
      'Este video dura 4 min y TikTok publica en esta cuenta videos de hasta 3 min.',
    )
  })

  it('calla si cabe, si no hay video, si no se midió o si no se sabe el máximo', () => {
    expect(videoMuyLargo([video({ segundos: 600 })], 600)).toBeNull()
    expect(videoMuyLargo([foto()], 600)).toBeNull()
    expect(videoMuyLargo([], 600)).toBeNull()
    expect(videoMuyLargo([video({ segundos: null })], 600)).toBeNull()
    expect(videoMuyLargo([video({ segundos: 9999 })], null)).toBeNull()
  })

  it('mira el primer video medido', () => {
    expect(videoMuyLargo([foto(), video({ segundos: null }), video({ segundos: 200 })], 180)).toBe(
      'Este video dura 3 min 20 s y TikTok publica en esta cuenta videos de hasta 3 min.',
    )
  })

  it('en palabras', () => {
    expect(segundosLegibles(45)).toBe('45 s')
    expect(segundosLegibles(60)).toBe('1 min')
    expect(segundosLegibles(210)).toBe('3 min 30 s')
    expect(segundosLegibles(599.6)).toBe('10 min')
  })
})
