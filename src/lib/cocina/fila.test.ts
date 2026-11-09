import { describe, expect, it } from 'vitest'
import { ordenarFila, type EnFila } from './fila'

const a = (id: string, ownerId: string, minuto: number, tipo: EnFila['tipo'] = 'tanda'): EnFila => ({
  id,
  ownerId,
  tipo,
  creadaEn: new Date(Date.UTC(2026, 9, 22, 12, minuto)),
})

describe('ordenarFila', () => {
  it('las pruebas se saltan la fila: van primero, aunque hayan llegado después', () => {
    const fila = ordenarFila([a('largo', 'u1', 0), a('prueba', 'u2', 30, 'prueba')])
    expect(fila.map((c) => c.id)).toEqual(['prueba', 'largo'])
  })

  it('es pareja: una de cada dueño por vuelta, en el orden en que llegó la primera de cada uno', () => {
    const fila = ordenarFila([
      a('u1-a', 'u1', 0),
      a('u1-b', 'u1', 1),
      a('u1-c', 'u1', 2),
      a('u2-a', 'u2', 3),
      a('u3-a', 'u3', 4),
      a('u2-b', 'u2', 5),
    ])
    expect(fila.map((c) => c.id)).toEqual(['u1-a', 'u2-a', 'u3-a', 'u1-b', 'u2-b', 'u1-c'])
  })

  it('dentro de un dueño, de la más vieja a la más nueva, sin importar cómo llegan', () => {
    const fila = ordenarFila([a('nueva', 'u1', 9), a('vieja', 'u1', 1)])
    expect(fila.map((c) => c.id)).toEqual(['vieja', 'nueva'])
  })

  it('vacía no es un error', () => {
    expect(ordenarFila([])).toEqual([])
  })
})

describe('ordenarFila con los planes', () => {
  const p = (id: string, ownerId: string, minuto: number, prioridad: number, tipo: EnFila['tipo'] = 'tanda'): EnFila => ({
    ...a(id, ownerId, minuto, tipo),
    prioridad,
  })

  it('el pagado pasa primero, aunque haya llegado después; la prueba de un gratis igual va antes', () => {
    const fila = ordenarFila([
      p('gratis-a', 'gratis', 0, 0),
      p('gratis-prueba', 'gratis', 1, 0, 'prueba'),
      p('pagado-a', 'pagado', 5, 1),
    ])
    expect(fila.map((c) => c.id)).toEqual(['gratis-prueba', 'pagado-a', 'gratis-a'])
  })

  it('dentro de cada prioridad la fila sigue pareja', () => {
    const fila = ordenarFila([
      p('g1-a', 'g1', 0, 0),
      p('p1-a', 'p1', 1, 1),
      p('p1-b', 'p1', 2, 1),
      p('p2-a', 'p2', 3, 1),
      p('g2-a', 'g2', 4, 0),
      p('g1-b', 'g1', 5, 0),
    ])
    expect(fila.map((c) => c.id)).toEqual(['p1-a', 'p2-a', 'p1-b', 'g1-a', 'g2-a', 'g1-b'])
  })

  it('sin prioridad cuenta como 0, como el gratis', () => {
    const fila = ordenarFila([a('sin', 'u1', 0), p('gratis', 'u2', 1, 0), p('pagado', 'u3', 2, 1)])
    expect(fila.map((c) => c.id)).toEqual(['pagado', 'sin', 'gratis'])
  })
})
