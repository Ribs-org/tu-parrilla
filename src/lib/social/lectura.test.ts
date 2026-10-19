import { describe, expect, it } from 'vitest'
import {
  DIAS_DE_LECTURA_DIARIA,
  MIN_LISTADAS,
  diasEntre,
  intervaloDeLectura,
  laMasVieja,
  porLeerHoy,
  sigueListando,
  tocaLeer,
  type Conocida,
} from './lectura'

const HOY = '2026-10-20'

/** Una publicación de hace `edad` días, leída por última vez hace `hace` días (null: nunca). */
function conocida(id: string, edad: number, hace: number | null): Conocida {
  const dia = (n: number) => new Date(Date.parse(`${HOY}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10)
  return { externalId: id, publicadaDia: dia(edad), ultimaLectura: hace === null ? null : dia(hace) }
}

describe('intervaloDeLectura', () => {
  it('a diario mientras es nueva, y cada vez más espaciado después', () => {
    expect(intervaloDeLectura(0)).toBe(1)
    expect(intervaloDeLectura(DIAS_DE_LECTURA_DIARIA)).toBe(1)
    expect(intervaloDeLectura(DIAS_DE_LECTURA_DIARIA + 1)).toBe(7)
    expect(intervaloDeLectura(30)).toBe(7)
    expect(intervaloDeLectura(31)).toBe(14)
    expect(intervaloDeLectura(90)).toBe(14)
    expect(intervaloDeLectura(91)).toBe(28)
    expect(intervaloDeLectura(2000)).toBe(28)
  })

  it('nunca deja pasar 30 días sin lectura: la retención de YouTube borra las más viejas', () => {
    for (let edad = 0; edad < 1000; edad++) expect(intervaloDeLectura(edad)).toBeLessThan(30)
  })

  it('el día 7 de cada publicación tiene su lectura', () => {
    expect(DIAS_DE_LECTURA_DIARIA).toBeGreaterThanOrEqual(7)
  })
})

describe('diasEntre', () => {
  it('cuenta días de calendario, en los dos sentidos', () => {
    expect(diasEntre('2026-10-01', '2026-10-20')).toBe(19)
    expect(diasEntre('2026-10-20', '2026-10-20')).toBe(0)
    expect(diasEntre('2026-10-20', '2026-10-19')).toBe(-1)
  })

  it('no se corre con el cambio de hora', () => {
    // Chile pasa al horario de verano el primer domingo de septiembre: las llaves son
    // días, no instantes, y entre ellas siempre hay días enteros.
    expect(diasEntre('2026-09-05', '2026-09-07')).toBe(2)
  })
})

describe('tocaLeer', () => {
  it('lo que nunca se leyó, siempre', () => {
    expect(tocaLeer(conocida('a', 400, null), HOY)).toBe(true)
  })

  it('lo nuevo, todos los días', () => {
    expect(tocaLeer(conocida('a', 5, 1), HOY)).toBe(true)
    expect(tocaLeer(conocida('a', 5, 0), HOY)).toBe(false)
  })

  it('lo de dos semanas, una vez por semana', () => {
    expect(tocaLeer(conocida('a', 20, 6), HOY)).toBe(false)
    expect(tocaLeer(conocida('a', 20, 7), HOY)).toBe(true)
  })

  it('lo de dos meses, cada catorce días; lo de más de tres, cada veintiocho', () => {
    expect(tocaLeer(conocida('a', 60, 13), HOY)).toBe(false)
    expect(tocaLeer(conocida('a', 60, 14), HOY)).toBe(true)
    expect(tocaLeer(conocida('a', 200, 27), HOY)).toBe(false)
    expect(tocaLeer(conocida('a', 200, 28), HOY)).toBe(true)
  })

  it('un día perdido no salta la lectura: mira la última, no el calendario', () => {
    // Le tocaba ayer y la corrida no llegó; hoy le sigue tocando.
    expect(tocaLeer(conocida('a', 20, 8), HOY)).toBe(true)
  })

  it('una lectura con fecha posterior a hoy (otra zona) no toca', () => {
    expect(tocaLeer(conocida('a', 5, -1), HOY)).toBe(false)
  })
})

describe('porLeerHoy', () => {
  it('deja fuera lo que ya trajo el listado y lo que no le toca', () => {
    const conocidas = [conocida('listada', 3, 1), conocida('reciente', 20, 2), conocida('toca', 20, 7)]
    expect(porLeerHoy(conocidas, new Set(['listada']), HOY)).toEqual(['toca'])
  })

  it('de la más nueva a la más vieja: si el plazo no alcanza, queda lo que menos se mueve', () => {
    const conocidas = [conocida('vieja', 300, 30), conocida('nueva', 15, 7), conocida('media', 60, 14)]
    expect(porLeerHoy(conocidas, new Set(), HOY)).toEqual(['nueva', 'media', 'vieja'])
  })

  it('con el mismo día, un orden fijo', () => {
    const conocidas = [conocida('b', 40, null), conocida('a', 40, null)]
    expect(porLeerHoy(conocidas, new Set(), HOY)).toEqual(['a', 'b'])
  })
})

describe('sigueListando', () => {
  const desde = new Date('2026-10-10T00:00:00Z')

  it('hasta juntar el mínimo, siempre', () => {
    expect(sigueListando(0, null, undefined)).toBe(true)
    expect(sigueListando(MIN_LISTADAS - 1, new Date('2020-01-01'), desde)).toBe(true)
  })

  it('con el mínimo y sin ventana, para: es lo que se leía antes', () => {
    expect(sigueListando(MIN_LISTADAS, new Date('2026-10-19'), undefined)).toBe(false)
  })

  it('con el mínimo, sigue mientras lo más viejo que trajo sea de la ventana', () => {
    expect(sigueListando(MIN_LISTADAS, new Date('2026-10-12'), desde)).toBe(true)
    expect(sigueListando(MIN_LISTADAS, desde, desde)).toBe(true)
    expect(sigueListando(MIN_LISTADAS, new Date('2026-10-09T23:59:00Z'), desde)).toBe(false)
  })
})

describe('laMasVieja', () => {
  it('se queda con la fecha más antigua', () => {
    const a = new Date('2026-10-01')
    const b = new Date('2026-09-01')
    expect(laMasVieja(null, a)).toBe(a)
    expect(laMasVieja(a, b)).toBe(b)
    expect(laMasVieja(b, a)).toBe(b)
  })
})
