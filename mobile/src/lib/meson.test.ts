import { describe, expect, it } from 'vitest'
import { datosDelCreativo, fraseEnBorradores, fraseQueEspera, imagenesDe, rotuloDePieza, rutaDelMeson, sePuedeDescartar, videoDe } from './meson'

describe('el mesón en el teléfono', () => {
  it('pide el mesón entero o el de una comanda', () => {
    expect(rutaDelMeson(null)).toBe('/api/mobile/cocina/meson')
    expect(rutaDelMeson('c 1')).toBe('/api/mobile/cocina/meson?comanda=c%201')
  })

  it('dice el estilo y la duración como la tarjeta del panel', () => {
    expect(datosDelCreativo({ estilo: 'golpes', duracionS: 41.6 })).toBe('Estilo: golpes · 42 s')
    expect(datosDelCreativo({ estilo: null, duracionS: null })).toBe('Sin estilo')
  })

  it('la pieza, con cuántos estilos si hay más de uno', () => {
    expect(rotuloDePieza('video9/08', 3)).toBe('Pieza «video9/08» · 3 estilos')
    expect(rotuloDePieza('video9/08', 1)).toBe('Pieza «video9/08»')
    expect(rotuloDePieza(null, 2)).toBeNull()
  })

  it('cuenta lo que espera en los borradores y en el mesón', () => {
    expect(fraseEnBorradores(0, 'La Parrilla')).toBeNull()
    expect(fraseEnBorradores(1, 'La Parrilla')).toBe('1 espera en tus borradores de La Parrilla, con sus cuentas y su hora por elegir.')
    expect(fraseEnBorradores(2, 'La Barra')).toBe('2 esperan en tus borradores de La Barra, con sus cuentas y su hora por elegir.')
    expect(fraseQueEspera(1, 'El mesón')).toBe('Te espera 1 creativo en el mesón.')
    expect(fraseQueEspera(3, 'La bandeja')).toBe('Te esperan 3 creativos en la bandeja.')
  })

  it('«Descartar» pide el motivo y una nota que quepa', () => {
    expect(sePuedeDescartar(null, '', 500)).toBe(false)
    expect(sePuedeDescartar('corte', '', 500)).toBe(true)
    expect(sePuedeDescartar('corte', 'x'.repeat(501), 500)).toBe(false)
  })

  it('separa el video de las láminas', () => {
    const video = { media: [{ url: 'v.mp4', mediaType: 'video' as const }] }
    const carrusel = { media: [{ url: 'a.jpg', mediaType: 'image' as const }, { url: 'b.jpg', mediaType: 'image' as const }] }
    expect(videoDe(video)).toBe('v.mp4')
    expect(videoDe(carrusel)).toBeNull()
    expect(imagenesDe(carrusel)).toEqual(['a.jpg', 'b.jpg'])
    expect(imagenesDe({ media: [] })).toEqual([])
  })
})
