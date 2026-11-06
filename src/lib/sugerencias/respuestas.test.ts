import { describe, expect, it } from 'vitest'
import {
  FIRMA_DEL_EQUIPO,
  MAX_RESPUESTA,
  NOMBRE_QUITADO,
  RESPUESTA_LARGA,
  RESPUESTA_SIN_CUAL,
  RESPUESTA_VACIA,
  comentarioDeRespuesta,
  correoDeRespuesta,
  fechaCorta,
  paraElLibro,
  pedidoDeRespuesta,
  quitarNombre,
  validarRespuesta,
} from './respuestas'

// La respuesta del equipo sin base ni red: qué se acepta, el correo y el comentario del issue.

const ID = '9692387a-41cc-4a81-9f8f-7b07135d742a'

describe('la respuesta que se acepta', () => {
  it('limpia los saltos y los blancos de las puntas, y rechaza la vacía y la larga', () => {
    expect(validarRespuesta('  Hola\r\nchao  ')).toEqual({ texto: 'Hola\nchao' })
    expect(validarRespuesta('   ')).toEqual({ error: RESPUESTA_VACIA })
    expect(validarRespuesta(42)).toEqual({ error: RESPUESTA_VACIA })
    expect(validarRespuesta('x'.repeat(MAX_RESPUESTA))).toHaveProperty('texto')
    expect(validarRespuesta('x'.repeat(MAX_RESPUESTA + 1))).toEqual({ error: RESPUESTA_LARGA })
  })

  it('el pedido de la API busca por issue o por id; con los dos, manda el id', () => {
    expect(pedidoDeRespuesta({ issue: 321, respuesta: 'Listo' })).toEqual({ cual: { issue: 321 }, texto: 'Listo' })
    expect(pedidoDeRespuesta({ issue: '#321', respuesta: 'Listo' })).toEqual({ cual: { issue: 321 }, texto: 'Listo' })
    expect(pedidoDeRespuesta({ id: ID.toUpperCase(), issue: 5, respuesta: 'Listo' })).toEqual({ cual: { id: ID }, texto: 'Listo' })
  })

  it('sin cuál, o con uno que no sirve, dice qué falta; sin respuesta, la frase de vacía', () => {
    for (const cuerpo of [{ respuesta: 'x' }, { issue: 0, respuesta: 'x' }, { issue: 1.5, respuesta: 'x' }, { id: 'abc', respuesta: 'x' }, null]) {
      expect(pedidoDeRespuesta(cuerpo)).toEqual({ error: RESPUESTA_SIN_CUAL })
    }
    expect(pedidoDeRespuesta({ issue: 3 })).toEqual({ error: RESPUESTA_VACIA })
  })
})

describe('las fechas y el libro', () => {
  it('escribe la fecha corta en la zona de quien la lee, y una zona rota cae en la de Chile', () => {
    // Las 01:30 UTC del 7 son todavía el 6 en Santiago.
    expect(fechaCorta('2026-11-07T01:30:00.000Z', 'America/Santiago')).toBe('6 nov 2026')
    expect(fechaCorta(new Date('2026-11-07T01:30:00.000Z'), 'Europe/Madrid')).toBe('7 nov 2026')
    expect(fechaCorta('2026-11-07T01:30:00.000Z', 'No/Existe')).toBe('6 nov 2026')
  })

  it('una sugerencia es nueva si tiene respuesta y no se abrió', () => {
    const base = { id: ID, tipo: 'idea' as const, texto: 'x', creadaEn: new Date('2026-11-06T12:00:00Z'), respondidaEn: null }
    expect(paraElLibro({ ...base, respuesta: null, respuestaLeidaEn: null }).nueva).toBe(false)
    expect(paraElLibro({ ...base, respuesta: 'Sí', respuestaLeidaEn: null }).nueva).toBe(true)
    expect(paraElLibro({ ...base, respuesta: 'Sí', respuestaLeidaEn: new Date() })).toMatchObject({
      nueva: false,
      creadaEn: '2026-11-06T12:00:00.000Z',
    })
  })
})

describe('el nombre de la persona no llega al issue', () => {
  it('quita el nombre entero y cada palabra suya, como palabra y sin importar mayúsculas', () => {
    expect(quitarNombre('Hola Juan Pérez, gracias juan.', 'Juan Pérez')).toBe(`Hola ${NOMBRE_QUITADO}, gracias ${NOMBRE_QUITADO}.`)
    // «Juana» no es «Juan»: solo palabras enteras.
    expect(quitarNombre('Juana dijo', 'Juan')).toBe('Juana dijo')
    expect(quitarNombre('Hola, Ana', null)).toBe('Hola, Ana')
  })
})

describe('el correo a la persona', () => {
  const s = {
    texto: 'Quiero que cuando apriete Programar me avise.',
    respuesta: 'Buena idea: lo hicimos, ya está en el panel.',
    creadaEn: new Date('2026-11-06T15:00:00Z'),
    nombre: 'Juan Pérez',
    zona: 'America/Santiago',
  }

  it('dice que respondimos, lleva lo que escribió, la respuesta entera y dónde leerla', () => {
    const correo = correoDeRespuesta(s, 'https://tu-parrilla.cl')
    expect(correo.subject).toBe('Te respondimos en el libro de sugerencias')
    expect(correo.text).toContain('Hola Juan:')
    expect(correo.text).toContain(`«${s.texto}»`)
    expect(correo.text).toContain(s.respuesta)
    expect(correo.text).toContain('Ajustes → El libro de sugerencias → «Lo que nos escribiste» (https://tu-parrilla.cl/admin)')
  })

  it('de día es la caja; sin nombre ni sitio, sin saludo con nombre ni enlace', () => {
    const correo = correoDeRespuesta({ ...s, nombre: null }, '', 'dia')
    expect(correo.subject).toBe('Te respondimos en la caja de sugerencias')
    expect(correo.text.startsWith('Hola:')).toBe(true)
    expect(correo.text).not.toContain('http')
  })

  it('recorta lo que escribió si es largo', () => {
    const correo = correoDeRespuesta({ ...s, texto: 'a'.repeat(1000) }, '')
    expect(correo.text).toContain(`«${'a'.repeat(299)}…»`)
  })
})

describe('el comentario del issue', () => {
  it('cita la respuesta sin el nombre, sin correos ni menciones, y termina con la firma del equipo', () => {
    const c = comentarioDeRespuesta('Hola Juan: escríbenos a juan@ejemplo.cl, @vicente lo mira en #12.', {
      cambiada: false,
      nombre: 'Juan',
    })
    expect(c).toContain('**Le respondimos a quien escribió esta sugerencia.**')
    expect(c).not.toContain('Juan')
    expect(c).not.toContain('juan@ejemplo.cl')
    expect(c).not.toMatch(/@vicente/)
    expect(c).not.toMatch(/#12/)
    expect(c).toContain('> Hola')
    expect(c).toContain('Las Sugerencias')
    expect(c.trimEnd().endsWith(FIRMA_DEL_EQUIPO)).toBe(true)
    expect(FIRMA_DEL_EQUIPO).toBe('---\n💻 Equipo de desarrollo de parrilla')
  })

  it('una respuesta cambiada lo dice, y no promete otro correo', () => {
    const c = comentarioDeRespuesta('Otra cosa', { cambiada: true, nombre: null })
    expect(c).toContain('**Cambiamos la respuesta')
    expect(c).not.toContain('avisamos por correo')
  })
})
