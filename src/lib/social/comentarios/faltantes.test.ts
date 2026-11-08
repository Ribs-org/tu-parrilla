import { describe, expect, it } from 'vitest'
import { comentariosQueFaltan, fraseDeFaltantes, MIN_FALTANTES } from './faltantes'
import { TOPE_COMENTARIOS_POR_PASADA } from './instagram'

describe('comentariosQueFaltan', () => {
  it('cuenta lo que Instagram suma y no entregó: el caso de los dos «GUIA» escondidos', () => {
    expect(comentariosQueFaltan({ contados: 4, llegaron: 2, respuestasPropias: 0 })).toBe(2)
  })

  it('las respuestas de la dueña suman en la cuenta de Instagram: no son comentarios perdidos', () => {
    // Dos comentarios, los dos respondidos desde La Mesa: Instagram cuenta cuatro.
    expect(comentariosQueFaltan({ contados: 4, llegaron: 2, respuestasPropias: 2 })).toBeNull()
    expect(comentariosQueFaltan({ contados: 6, llegaron: 2, respuestasPropias: 2 })).toBe(2)
  })

  it('avisa aunque no haya llegado ninguno: la publicación entera puede estar escondida', () => {
    expect(comentariosQueFaltan({ contados: 3, llegaron: 0, respuestasPropias: 0 })).toBe(3)
  })

  it('uno solo que falta no avisa: casi siempre es una respuesta entre otras personas', () => {
    expect(MIN_FALTANTES).toBe(2)
    expect(comentariosQueFaltan({ contados: 3, llegaron: 2, respuestasPropias: 0 })).toBeNull()
  })

  it('no avisa cuando llegó todo, ni cuando llegó más de lo que la última lectura contaba', () => {
    expect(comentariosQueFaltan({ contados: 5, llegaron: 5, respuestasPropias: 0 })).toBeNull()
    // El sync cuenta una vez al día y el sondeo lee cada cinco minutos: lo nuevo llega antes.
    expect(comentariosQueFaltan({ contados: 5, llegaron: 9, respuestasPropias: 1 })).toBeNull()
  })

  it('sin cuenta de Instagram no hay con qué comparar', () => {
    expect(comentariosQueFaltan({ contados: null, llegaron: 0, respuestasPropias: 0 })).toBeNull()
  })

  it('por encima de lo que una pasada lee, la diferencia es del sondeo y no se atribuye a Instagram', () => {
    expect(comentariosQueFaltan({ contados: TOPE_COMENTARIOS_POR_PASADA, llegaron: 0, respuestasPropias: 0 })).toBe(
      TOPE_COMENTARIOS_POR_PASADA,
    )
    expect(comentariosQueFaltan({ contados: TOPE_COMENTARIOS_POR_PASADA + 1, llegaron: 0, respuestasPropias: 0 })).toBeNull()
  })
})

describe('fraseDeFaltantes', () => {
  it('dice lo que Instagram cuenta y lo que entregó, en palabras cuando no entregó ninguno', () => {
    expect(fraseDeFaltantes(6, 4)).toBe('Instagram cuenta 6 comentarios en esta publicación y solo nos entregó 4.')
    expect(fraseDeFaltantes(3, 1)).toBe('Instagram cuenta 3 comentarios en esta publicación y solo nos entregó 1.')
    expect(fraseDeFaltantes(2, 0)).toBe('Instagram cuenta 2 comentarios en esta publicación y no nos entregó ninguno.')
  })
})
