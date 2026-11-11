import { describe, expect, it } from 'vitest'
import {
  altoDeLaLlama,
  circulito,
  diaDeLaBurbuja,
  fraseDeLaRacha,
  fraseDelNuevo,
  quedanPorCelebrar,
  renglonDelHito,
  sumarCelebrado,
  totalDe,
  tituloDelHito,
  tituloDelNuevo,
  umbralCorto,
  type HitoPorCelebrar,
} from './lo-que-trajo'

describe('el circulito', () => {
  it('cuenta corto, para que quepa', () => {
    expect(circulito(37)).toBe('+37')
    expect(circulito(999)).toBe('+999')
    expect(circulito(1000)).toBe('+1 mil')
    expect(circulito(1250)).toBe('+1,2 mil')
    expect(circulito(12_345)).toBe('+12 mil')
    expect(circulito(1_500_000)).toBe('+1,5 M')
  })

  it('suma los «me gusta», los comentarios y las visitas', () => {
    expect(totalDe({ meGusta: 31, comentarios: 4, visitas: 2 })).toBe(37)
  })
})

describe('el día bajo la burbuja', () => {
  it('hoy, ayer, y si no el día de la semana', () => {
    expect(diaDeLaBurbuja('2026-11-10T21:40:00-03:00', '2026-11-10')).toBe('hoy')
    expect(diaDeLaBurbuja('2026-11-09T08:00:00-03:00', '2026-11-10')).toBe('ayer')
    expect(diaDeLaBurbuja('2026-11-04T08:00:00-03:00', '2026-11-10')).toBe('mié 4')
    // Ayer, aunque cambie el mes.
    expect(diaDeLaBurbuja('2026-10-31T23:00:00-03:00', '2026-11-01')).toBe('ayer')
  })
})

describe('lo nuevo en el detalle', () => {
  it('solo lo que subió, en singular cuando es uno', () => {
    expect(fraseDelNuevo({ meGusta: 31, comentarios: 4, visitas: 2 }, null)).toBe('+31 me gusta · +4 comentarios · +2 visitas')
    expect(fraseDelNuevo({ meGusta: 0, comentarios: 1, visitas: 1 }, null)).toBe('+1 comentario · +1 visita')
    expect(fraseDelNuevo({ meGusta: 1200, comentarios: 0, visitas: 0 }, null)).toBe('+1.200 me gusta')
  })

  it('sin nada: desde cuándo, o que todavía no llega nada', () => {
    expect(fraseDelNuevo({ meGusta: 0, comentarios: 0, visitas: 0 }, '2026-11-09T21:40:00-03:00')).toBe('Nada nuevo desde el lun 9 a las 21:40.')
    expect(fraseDelNuevo({ meGusta: 0, comentarios: 0, visitas: 0 }, null)).toBe('Todavía no llega nada.')
  })

  it('el título dice si es desde la última vez o desde que salió', () => {
    expect(tituloDelNuevo('2026-11-09T21:40:00-03:00')).toBe('Desde la última vez')
    expect(tituloDelNuevo(null)).toBe('Desde que salió')
  })
})

describe('los hitos', () => {
  it('la llamita lleva el umbral corto', () => {
    expect([100, 1000, 10000, 100000, 1000000].map(umbralCorto)).toEqual(['100', '1 mil', '10 mil', '100 mil', '1 M'])
  })

  it('la celebración dice corte de noche y pieza de día', () => {
    expect(tituloDelHito(1000, 'noche')).toBe('Tu corte pasó las 1.000 vistas')
    expect(tituloDelHito(100, 'dia')).toBe('Tu pieza pasó las 100 vistas')
    expect(tituloDelHito(1_000_000, 'noche')).toBe('Tu corte pasó el millón de vistas')
  })

  it('en el detalle, con su día, o sin él si ya lo traía', () => {
    expect(renglonDelHito({ umbral: 10000, alcanzadoEn: '2026-11-11T10:30:00-03:00' })).toBe('10.000 vistas · mié 11')
    expect(renglonDelHito({ umbral: 100, alcanzadoEn: null })).toBe('100 vistas')
  })

  it('no vuelve a celebrar lo que este teléfono ya celebró', () => {
    const corte = { id: 'c', texto: '', cuando: '2026-11-11T10:00', redes: [] }
    const hitos: HitoPorCelebrar[] = [
      { id: 'a', umbral: 1000, corte },
      { id: 'b', umbral: 100, corte },
    ]
    expect(quedanPorCelebrar(hitos, new Set(['a'])).map((h) => h.id)).toEqual(['b'])
    expect(quedanPorCelebrar(undefined, new Set())).toEqual([])
  })

  it('guarda los últimos celebrados, sin repetir', () => {
    expect(sumarCelebrado(['a', 'b'], 'a')).toEqual(['b', 'a'])
    const muchos = Array.from({ length: 50 }, (_, i) => String(i))
    const con = sumarCelebrado(muchos, 'nuevo')
    expect(con).toHaveLength(50)
    expect(con[0]).toBe('1')
    expect(con.at(-1)).toBe('nuevo')
  })
})

describe('la racha', () => {
  it('de noche la parrilla prendida, de día la barra abierta', () => {
    expect(fraseDeLaRacha({ dias: 5, hoy: true }, 'noche')).toEqual({ titulo: 'La parrilla lleva 5 días prendida', aviso: null })
    expect(fraseDeLaRacha({ dias: 3, hoy: true }, 'dia')).toEqual({ titulo: 'La barra lleva 3 días abierta', aviso: null })
  })

  it('si hoy no salió nada, avisa que se apaga a medianoche', () => {
    expect(fraseDeLaRacha({ dias: 4, hoy: false }, 'noche')?.aviso).toBe('Hoy todavía no sale nada: la racha se apaga a medianoche.')
  })

  it('con menos de dos días, o sin racha del servidor, no se muestra', () => {
    expect(fraseDeLaRacha({ dias: 1, hoy: true }, 'noche')).toBeNull()
    expect(fraseDeLaRacha(undefined, 'noche')).toBeNull()
  })

  it('la llama crece con la racha, hasta un tope', () => {
    expect(altoDeLaLlama(2)).toBe(18)
    expect(altoDeLaLlama(5)).toBe(24)
    expect(altoDeLaLlama(40)).toBe(34)
  })
})
