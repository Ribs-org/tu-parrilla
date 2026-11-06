import { describe, expect, it } from 'vitest'

import { conLeidas, respuestasNuevas, type LibroLeido, type SugerenciaDelLibro } from './sugerencias'

function sugerencia(id: string, respuesta: string | null, nueva: boolean): SugerenciaDelLibro {
  return { id, tipo: 'idea', texto: id, creadaEn: '2026-11-06T12:00:00.000Z', respuesta, respondidaEn: null, nueva }
}

const LIBRO: LibroLeido = {
  sinLeer: 2,
  sugerencias: [sugerencia('a', 'Sí, la hacemos.', true), sugerencia('b', 'Ya está.', true), sugerencia('c', null, false)],
}

describe('el libro con lo que ya se abrió', () => {
  it('apaga la nueva que se abrió y vuelve a contar', () => {
    const r = conLeidas(LIBRO, new Set(['a']))
    expect(r.sinLeer).toBe(1)
    expect(r.sugerencias.map((s) => s.nueva)).toEqual([false, true, false])
  })

  it('sin nada abierto, el mismo libro; y abrir una sin respuesta no cambia nada', () => {
    expect(conLeidas(LIBRO, new Set())).toEqual(LIBRO)
    expect(conLeidas(LIBRO, new Set(['c'])).sinLeer).toBe(2)
  })

  it('dice cuántas en palabras', () => {
    expect(respuestasNuevas(1)).toBe('1 respuesta nueva')
    expect(respuestasNuevas(3)).toBe('3 respuestas nuevas')
  })
})
