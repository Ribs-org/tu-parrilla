import { describe, expect, it } from 'vitest'
import { bordeDe, calorDelDia, carneDe, coccionDe, comoSalio, medianaDe, selloPorEstado } from './parrilla'

describe('calorDelDia', () => {
  it('sin cortes la parrilla está apagada', () => {
    expect(calorDelDia(0)).toBe('apagada')
  })

  it('uno o dos cortes la dejan prendida', () => {
    expect(calorDelDia(1)).toBe('prendida')
    expect(calorDelDia(2)).toBe('prendida')
  })

  // Los dos bordes explícitos: mover el umbral es una decisión de producto.
  it('tres cortes o más la dejan llena', () => {
    expect(calorDelDia(3)).toBe('llena')
    expect(calorDelDia(12)).toBe('llena')
  })
})

describe('medianaDe', () => {
  it('sin valores no hay mediana', () => {
    expect(medianaDe([])).toBeNull()
  })

  it('con impares toma el del medio y con pares promedia', () => {
    expect(medianaDe([5, 1, 3])).toBe(3)
    expect(medianaDe([1, 3, 5, 7])).toBe(4)
  })

  // La razón de que sea mediana: con un viral, el promedio dejaría a todo lo demás
  // por debajo y ningún post se marcaría.
  it('un solo viral no la arrastra', () => {
    expect(medianaDe([100, 110, 120, 130, 50_000])).toBe(120)
  })
})

describe('comoSalio', () => {
  it('sin vistas ganadas o sin mediana no se compara', () => {
    expect(comoSalio(null, 100)).toBe('sin-datos')
    expect(comoSalio(500, null)).toBe('sin-datos')
  })

  // En un período sin movimiento, un post con una vista sería «se pasó»: eso es ruido.
  it('con la mediana en cero no se compara nada', () => {
    expect(comoSalio(1, 0)).toBe('sin-datos')
  })

  // Los dos bordes explícitos: el doble es una decisión, no un ajuste.
  it('reparte por la mediana y por su doble', () => {
    expect(comoSalio(99, 100)).toBe('normal')
    expect(comoSalio(100, 100)).toBe('salio-bien')
    expect(comoSalio(199, 100)).toBe('salio-bien')
    expect(comoSalio(200, 100)).toBe('se-paso')
  })
})

describe('coccionDe', () => {
  it('sin destinos queda cruda', () => {
    expect(coccionDe([])).toBe('cruda')
  })

  it('programada sin publicar queda cruda', () => {
    expect(coccionDe(['scheduled', 'scheduled'])).toBe('cruda')
  })

  it('algo en curso la sella', () => {
    expect(coccionDe(['scheduled', 'publishing'])).toBe('sellada')
  })

  it('todos publicados la dejan a punto', () => {
    expect(coccionDe(['published', 'published'])).toBe('punto')
  })

  it('publicados a medias no llegan a punto', () => {
    expect(coccionDe(['published', 'scheduled'])).toBe('cruda')
  })

  it('un fallo entre otros destinos lo quema en parte; todos, entero', () => {
    expect(coccionDe(['published', 'failed'])).toBe('parcial')
    expect(coccionDe(['scheduled', 'failed'])).toBe('parcial')
    expect(coccionDe(['failed', 'failed'])).toBe('quemada')
  })

  /*
   * El móvil recibe el estado como `string` desde la API, no como el enum de la base.
   * Un estado que no conoce tiene que caer en «cruda» y no reventar: la app vieja sigue
   * instalada en el teléfono cuando el servidor ya desplegó algo nuevo.
   */
  it('un estado desconocido cae en cruda sin romperse', () => {
    expect(coccionDe(['inventado'])).toBe('cruda')
  })
})

describe('carneDe', () => {
  it('quemado en parte se pinta con lo que no se quemó', () => {
    expect(carneDe(['published', 'failed'])).toBe('punto')
    expect(carneDe(['scheduled', 'failed'])).toBe('cruda')
    expect(carneDe(['failed'])).toBe('quemada')
  })
})

describe('selloPorEstado', () => {
  it('sin el sello del servidor, el estado alcanza para lo básico', () => {
    expect(selloPorEstado('scheduled')).toBe('pendiente')
    expect(selloPorEstado('scheduled', 'Instagram no respondió.')).toBe('reintento')
    expect(selloPorEstado('publishing')).toBe('saliendo')
    expect(selloPorEstado('published')).toBe('servido')
    expect(selloPorEstado('failed', 'x')).toBe('quemado')
  })
})

describe('bordeDe', () => {
  it('rojo cuando se quemó, ámbar cuando pide atención, acero el resto', () => {
    expect(bordeDe('parcial', ['servido', 'quemado'])).toBe('mano')
    expect(bordeDe('punto', ['servido', 'bandeja'])).toBe('atencion')
    expect(bordeDe('cruda', ['frio'])).toBe('atencion')
    expect(bordeDe('cruda', ['pendiente'])).toBe('cuenta')
  })
})
