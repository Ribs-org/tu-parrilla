import { describe, expect, it } from 'vitest'
import { circulito, diaDeLaBurbuja, fraseDelNuevo, totalDe, tituloDelNuevo } from './lo-que-trajo'

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
