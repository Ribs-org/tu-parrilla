import { describe, expect, it } from 'vitest'
import {
  altoDeLaLlama,
  cifrasDeUnaRed,
  circulito,
  diaDeLaBurbuja,
  etiquetaDeLaBurbuja,
  fraseDeLaRacha,
  fraseDelNuevo,
  renglonDelHito,
  seguidoresDeUnaRed,
  tituloDelHito,
  tituloDelNuevo,
  totalDe,
  umbralCorto,
} from './lo-que-trajo-frases'

describe('el circulito', () => {
  it('es corto para que quepa en la burbuja', () => {
    expect(circulito(37)).toBe('+37')
    expect(circulito(1000)).toBe('+1 mil')
    expect(circulito(1260)).toBe('+1,2 mil')
    expect(circulito(12_400)).toBe('+12 mil')
    expect(circulito(1_500_000)).toBe('+1,5 M')
  })

  it('suma los «me gusta», los comentarios y las visitas', () => {
    expect(totalDe({ meGusta: 3, comentarios: 2, visitas: 1 })).toBe(6)
  })
})

describe('el día de la burbuja', () => {
  it('dice hoy, ayer o el día de la semana con su número', () => {
    expect(diaDeLaBurbuja('2026-11-11', '2026-11-11')).toBe('hoy')
    expect(diaDeLaBurbuja('2026-11-10', '2026-11-11')).toBe('ayer')
    expect(diaDeLaBurbuja('2026-11-09', '2026-11-11')).toBe('lun 9')
    expect(diaDeLaBurbuja('2026-11-08', '2026-11-11')).toBe('dom 8')
  })

  it('ayer cruza el mes', () => {
    expect(diaDeLaBurbuja('2026-10-31', '2026-11-01')).toBe('ayer')
  })
})

describe('lo nuevo de un corte', () => {
  it('cuenta solo lo que subió, en singular cuando es uno', () => {
    expect(fraseDelNuevo({ meGusta: 31, comentarios: 4, visitas: 2 }, null)).toBe('+31 me gusta · +4 comentarios · +2 visitas')
    expect(fraseDelNuevo({ meGusta: 0, comentarios: 1, visitas: 0 }, null)).toBe('+1 comentario')
    expect(fraseDelNuevo({ meGusta: 1200, comentarios: 0, visitas: 1 }, null)).toBe('+1.200 me gusta · +1 visita')
  })

  it('sin nada nuevo, dice desde cuándo, con el mes como el resto del panel', () => {
    expect(fraseDelNuevo({ meGusta: 0, comentarios: 0, visitas: 0 }, { dia: '2026-11-09', hora: '21:40' })).toBe(
      'Nada nuevo desde el lun 9 de nov a las 21:40.',
    )
    expect(fraseDelNuevo({ meGusta: 0, comentarios: 0, visitas: 0 }, null)).toBe('Todavía no llega nada.')
  })

  it('el título cambia si nunca se miró', () => {
    expect(tituloDelNuevo(null)).toBe('Desde que salió')
    expect(tituloDelNuevo({ dia: '2026-11-09', hora: '21:40' })).toBe('Desde la última vez')
  })
})

describe('los hitos', () => {
  it('la llamita lleva el umbral corto', () => {
    expect(umbralCorto(100)).toBe('100')
    expect(umbralCorto(1000)).toBe('1 mil')
    expect(umbralCorto(100_000)).toBe('100 mil')
    expect(umbralCorto(1_000_000)).toBe('1 M')
  })

  it('la celebración dice corte de noche y pieza de día, y el millón con su nombre', () => {
    expect(tituloDelHito(1000, 'noche')).toBe('Tu corte pasó las 1.000 vistas')
    expect(tituloDelHito(10_000, 'dia')).toBe('Tu pieza pasó las 10.000 vistas')
    expect(tituloDelHito(1_000_000, 'noche')).toBe('Tu corte pasó el millón de vistas')
  })

  it('en el detalle va con su día, salvo los que el corte ya traía', () => {
    expect(renglonDelHito(1000, '2026-11-12')).toBe('1.000 vistas · jue 12 de nov')
    expect(renglonDelHito(100, null)).toBe('100 vistas')
  })

  it('un lector de pantalla lee la burbuja entera', () => {
    expect(etiquetaDeLaBurbuja('ayer', 'Asado del domingo', 37, 1000)).toBe(
      'ayer, Asado del domingo. +37 desde la última vez. Pasó las 1 mil vistas',
    )
    expect(etiquetaDeLaBurbuja('hoy', '', 0, null)).toBe('hoy, sin texto. Nada nuevo')
  })
})

describe('la racha', () => {
  it('con menos de dos días no se muestra', () => {
    expect(fraseDeLaRacha({ dias: 1, hoy: true }, 'noche')).toBeNull()
  })

  it('dice la parrilla de noche y la barra de día', () => {
    expect(fraseDeLaRacha({ dias: 5, hoy: true }, 'noche')).toEqual({ titulo: 'La parrilla lleva 5 días prendida', aviso: null })
    expect(fraseDeLaRacha({ dias: 5, hoy: true }, 'dia')?.titulo).toBe('La barra lleva 5 días abierta')
  })

  it('si hoy no salió nada, avisa que se apaga a medianoche', () => {
    expect(fraseDeLaRacha({ dias: 3, hoy: false }, 'noche')?.aviso).toBe('Hoy todavía no sale nada: la racha se apaga a medianoche.')
  })

  it('la llama crece hasta los diez días', () => {
    expect(altoDeLaLlama(2)).toBe(18)
    expect(altoDeLaLlama(10)).toBe(34)
    expect(altoDeLaLlama(40)).toBe(34)
  })
})

describe('lo que lleva cada red', () => {
  it('escribe solo los números que la red dio', () => {
    expect(cifrasDeUnaRed({ views: 1200, likes: 56, comments: 7 })).toBe('1200 vistas · 56 me gusta · 7 comentarios')
    expect(cifrasDeUnaRed({ views: null, likes: 3, comments: null })).toBe('3 me gusta')
    expect(cifrasDeUnaRed({ views: null, likes: null, comments: null })).toBeNull()
    expect(cifrasDeUnaRed(null)).toBeNull()
  })

  it('los seguidores, y en YouTube suscriptores', () => {
    expect(seguidoresDeUnaRed('instagram', 8)).toBe('+8 seguidores')
    expect(seguidoresDeUnaRed('youtube', 3)).toBe('+3 suscriptores')
    expect(seguidoresDeUnaRed('facebook', null)).toBeNull()
    expect(seguidoresDeUnaRed('tiktok', 0)).toBeNull()
  })
})
