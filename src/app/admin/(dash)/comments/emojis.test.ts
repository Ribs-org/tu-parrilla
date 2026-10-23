import { describe, expect, it } from 'vitest'
import { EMOJIS, insertar } from './emojis'

describe('insertar', () => {
  it('pone el emoji donde está el cursor y deja el cursor después', () => {
    expect(insertar('Gracias!', '🙌', 7, 7)).toEqual({ texto: 'Gracias🙌!', cursor: 9 })
  })

  it('reemplaza lo seleccionado', () => {
    expect(insertar('Muy bueno', '🔥', 4, 9)).toEqual({ texto: 'Muy 🔥', cursor: 6 })
  })

  it('con el cursor fuera del texto, lo pone al final', () => {
    expect(insertar('Hola', '😊', 99, 99)).toEqual({ texto: 'Hola😊', cursor: 6 })
  })
})

describe('EMOJIS', () => {
  it('no repite ninguno', () => {
    expect(new Set(EMOJIS).size).toBe(EMOJIS.length)
  })
})
