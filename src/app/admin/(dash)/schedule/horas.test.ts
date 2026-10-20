import { describe, expect, it } from 'vitest'
import { carriles, horasDeLaReja, minutoDelDia, rangoDeLaReja, rotuloDeHora } from './horas'

describe('minutoDelDia', () => {
  it('lee la hora en la zona del dueño, no en la del servidor', () => {
    // Las 17:20 en UTC son las 14:20 en Chile en octubre.
    expect(minutoDelDia(new Date('2026-10-20T17:20:00Z'), 'America/Santiago')).toBe(14 * 60 + 20)
  })
})

describe('rangoDeLaReja', () => {
  it('sin nada afuera, de 07:00 a 23:00', () => {
    expect(rangoDeLaReja([8 * 60, 20 * 60], 30)).toEqual({ desde: 420, hasta: 1380 })
    expect(rangoDeLaReja([], 30)).toEqual({ desde: 420, hasta: 1380 })
  })

  it('se estira en horas enteras para lo que cae antes o termina después', () => {
    expect(rangoDeLaReja([5 * 60 + 40, 23 * 60 + 10], 30)).toEqual({ desde: 300, hasta: 1440 })
  })

  it('en la de hoy, también para que «ahora» quepa', () => {
    expect(rangoDeLaReja([9 * 60], 30, 2 * 60 + 15)).toEqual({ desde: 120, hasta: 1380 })
  })
})

describe('carriles', () => {
  it('los que no se tocan van solos, a todo el ancho', () => {
    expect(carriles([60, 120], 30)).toEqual([
      { carril: 0, de: 1 },
      { carril: 0, de: 1 },
    ])
  })

  it('los que se pisan van lado a lado, y el grupo se reparte el ancho', () => {
    expect(carriles([60, 70, 80, 200], 30)).toEqual([
      { carril: 0, de: 3 },
      { carril: 1, de: 3 },
      { carril: 2, de: 3 },
      { carril: 0, de: 1 },
    ])
  })

  it('un carril que se libera se vuelve a usar dentro del mismo grupo', () => {
    // 60 y 80 se pisan; 95 ya no pisa a 60, pero sí a 80: va en el carril 0, otra vez.
    expect(carriles([60, 80, 95], 30)).toEqual([
      { carril: 0, de: 2 },
      { carril: 1, de: 2 },
      { carril: 0, de: 2 },
    ])
  })
})

describe('horasDeLaReja y rotuloDeHora', () => {
  it('cada hora entera del rango, con su rótulo', () => {
    expect(horasDeLaReja({ desde: 420, hasta: 600 }).map(rotuloDeHora)).toEqual(['07:00', '08:00', '09:00', '10:00'])
  })
})
