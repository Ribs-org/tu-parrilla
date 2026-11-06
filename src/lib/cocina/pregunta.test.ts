import { describe, expect, it } from 'vitest'
import {
  MAX_RESPUESTA,
  OPCIONES_ILEGIBLES,
  PLAZO_ILEGIBLE,
  POR_DEFECTO_ILEGIBLE,
  RESPUESTA_FALTA,
  RESPUESTA_LARGA,
  RESPUESTA_NO_ES_OPCION,
  TEXTO_FALTA,
  leerRespuesta,
  mensajeDeRespuesta,
  plazoEnPalabras,
  preguntaDe,
  siNoContestas,
} from './pregunta'

const AHORA = new Date('2026-11-06T15:00:00Z') // 12:00 en Santiago
const ZONA = 'America/Santiago'
const valida = {
  texto: '  ¿Qué tema destaco?  ',
  opciones: ['La parte de ventas', 'La anécdota del final'],
  plazo: '2026-11-06T18:00:00-03:00',
  porDefecto: 'la parte de ventas',
}

describe('una pregunta del chef', () => {
  it('con opciones: el texto limpio, el plazo leído con su zona y la de por defecto escrita como la opción', () => {
    expect(preguntaDe(valida, AHORA)).toEqual({
      texto: '¿Qué tema destaco?',
      opciones: ['La parte de ventas', 'La anécdota del final'],
      plazo: new Date('2026-11-06T21:00:00Z'),
      porDefecto: 'La parte de ventas',
    })
  })

  it('sin opciones, la respuesta es libre y la de por defecto es cualquier texto', () => {
    expect(preguntaDe({ ...valida, opciones: null, porDefecto: 'Sigo con lo que yo elija.' }, AHORA)).toMatchObject({
      opciones: null,
      porDefecto: 'Sigo con lo que yo elija.',
    })
    expect(preguntaDe({ texto: 'x', plazo: valida.plazo, porDefecto: 'y' }, AHORA)).toMatchObject({ opciones: null })
  })

  it('el texto es obligatorio y corto', () => {
    expect(preguntaDe({ ...valida, texto: '   ' }, AHORA)).toEqual({ error: TEXTO_FALTA })
    expect(preguntaDe({ ...valida, texto: 'a'.repeat(501) }, AHORA)).toEqual({ error: TEXTO_FALTA })
  })

  it('las opciones: de dos a cuatro, distintas, cortas', () => {
    for (const opciones of [['una'], ['a', 'b', 'c', 'd', 'e'], ['a', 'A'], ['a', ''], ['a', 3], 'a,b', ['a', 'x'.repeat(101)]]) {
      expect(preguntaDe({ ...valida, opciones, porDefecto: 'a' }, AHORA), JSON.stringify(opciones)).toEqual({ error: OPCIONES_ILEGIBLES })
    }
  })

  it('el plazo, con su zona, entre un cuarto de hora y tres días', () => {
    for (const plazo of ['2026-11-06T18:00:00', 'mañana', 12, '2026-11-06T12:10:00-03:00', '2026-11-09T13:00:00-03:00', '2026-11-06T11:00:00-03:00']) {
      expect(preguntaDe({ ...valida, plazo }, AHORA), String(plazo)).toEqual({ error: PLAZO_ILEGIBLE })
    }
    expect(preguntaDe({ ...valida, plazo: '2026-11-06T12:15:00-03:00' }, AHORA)).not.toHaveProperty('error')
    expect(preguntaDe({ ...valida, plazo: '2026-11-09T12:00:00-03:00' }, AHORA)).not.toHaveProperty('error')
  })

  it('la de por defecto es obligatoria y, con opciones, una de ellas', () => {
    expect(preguntaDe({ ...valida, porDefecto: undefined }, AHORA)).toEqual({ error: POR_DEFECTO_ILEGIBLE })
    expect(preguntaDe({ ...valida, porDefecto: 'Otra cosa' }, AHORA)).toEqual({ error: POR_DEFECTO_ILEGIBLE })
  })
})

describe('la respuesta del dueño', () => {
  const opciones = ['La parte de ventas', 'La anécdota del final']

  it('con opciones, una de ellas, guardada como la escribió el chef', () => {
    expect(leerRespuesta(opciones, ' la anécdota del final ')).toBe('La anécdota del final')
    expect(leerRespuesta(opciones, 'Otra')).toEqual({ error: RESPUESTA_NO_ES_OPCION })
    expect(leerRespuesta(opciones, '')).toEqual({ error: RESPUESTA_NO_ES_OPCION })
  })

  it('libre, un texto de hasta 500 caracteres', () => {
    expect(leerRespuesta(null, '  Destaca la parte de precios. ')).toBe('Destaca la parte de precios.')
    expect(leerRespuesta(null, '   ')).toEqual({ error: RESPUESTA_FALTA })
    expect(leerRespuesta(null, 7)).toEqual({ error: RESPUESTA_FALTA })
    expect(leerRespuesta(null, 'a'.repeat(MAX_RESPUESTA + 1))).toEqual({ error: RESPUESTA_LARGA })
  })

  it('en la línea de tiempo: lo que respondió, o que pasó el plazo', () => {
    expect(mensajeDeRespuesta('Ventas', false)).toBe('Respondiste: «Ventas».')
    expect(mensajeDeRespuesta('Ventas', true)).toBe('Pasó el plazo: el chef sigue con «Ventas».')
  })
})

describe('el plazo en palabras', () => {
  it('hoy, mañana o el día con su nombre, en la zona de quien lo lee', () => {
    expect(plazoEnPalabras(new Date('2026-11-06T21:00:00Z'), AHORA, ZONA)).toBe('hoy antes de las 18:00')
    expect(plazoEnPalabras(new Date('2026-11-07T12:30:00Z'), AHORA, ZONA)).toBe('mañana antes de las 09:30')
    expect(plazoEnPalabras(new Date('2026-11-08T21:00:00Z'), AHORA, ZONA)).toBe('el domingo 8 de noviembre antes de las 18:00')
    // Las 23:30 de Santiago ya son mañana en UTC: manda la zona.
    expect(plazoEnPalabras(new Date('2026-11-07T02:30:00Z'), AHORA, ZONA)).toBe('hoy antes de las 23:30')
  })

  it('y lo que pasa si nadie contesta', () => {
    expect(siNoContestas(new Date('2026-11-06T21:00:00Z'), 'La parte de ventas', AHORA, ZONA)).toBe(
      'Si no contestas hoy antes de las 18:00, el chef sigue con «La parte de ventas».',
    )
  })
})
