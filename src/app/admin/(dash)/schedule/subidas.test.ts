import { describe, expect, it } from 'vitest'
import { formatoConLoQueSube, fraseDeLlegada, llenadoDe, siguienteEnCola, tipoDe, type Subida } from './subidas'

const subida = (clave: string, estado: Subida['estado'], progreso = 0, tipo: Subida['tipo'] = 'image'): Subida => ({
  clave,
  nombre: `${clave}.jpg`,
  tipo,
  estado,
  progreso,
  error: estado === 'fallo' ? 'No se pudo subir el archivo.' : null,
})

describe('tipoDe', () => {
  it('lee el tipo del navegador y, si no lo trae, la extensión', () => {
    expect(tipoDe({ name: 'a.jpg', type: 'image/jpeg' })).toBe('image')
    expect(tipoDe({ name: 'a.mp4', type: 'video/mp4' })).toBe('video')
    // Un .mov puede llegar sin tipo desde el navegador.
    expect(tipoDe({ name: 'clip.MOV', type: '' })).toBe('video')
    expect(tipoDe({ name: 'foto.heic', type: '' })).toBe('image')
  })
})

describe('siguienteEnCola', () => {
  it('de a una y en orden', () => {
    expect(siguienteEnCola([subida('a', 'cola'), subida('b', 'cola')])?.clave).toBe('a')
    expect(siguienteEnCola([subida('a', 'subiendo'), subida('b', 'cola')])).toBeNull()
  })

  it('un fallo detiene la cola: seguir con las de atrás cambiaría el orden del carrusel', () => {
    expect(siguienteEnCola([subida('a', 'fallo'), subida('b', 'cola')])).toBeNull()
  })

  it('sin nada en la cola, nada', () => {
    expect(siguienteEnCola([])).toBeNull()
  })
})

describe('llenadoDe', () => {
  it('lo que llegó cuenta entero, lo que sube cuenta lo que lleva', () => {
    expect(llenadoDe(2, [subida('c', 'subiendo', 0.5), subida('d', 'cola')])).toBeCloseTo(2.5 / 4)
  })

  it('sin nada que subir, el corte está entero', () => {
    expect(llenadoDe(0, [])).toBe(1)
    expect(llenadoDe(3, [])).toBe(1)
  })
})

describe('formatoConLoQueSube', () => {
  it('la silueta cuenta también lo que todavía sube', () => {
    expect(formatoConLoQueSube([{ mediaType: 'image' }], [subida('b', 'cola')])).toEqual({ formato: 'tira', huesos: 2 })
    expect(formatoConLoQueSube([], [subida('v', 'subiendo', 0.2, 'video')])).toEqual({ formato: 'entrana', huesos: 0 })
    expect(formatoConLoQueSube([], [])).toEqual({ formato: 'chori', huesos: 0 })
  })
})

describe('fraseDeLlegada', () => {
  it('cuántos llegaron mientras suben', () => {
    expect(fraseDeLlegada(1, [subida('b', 'subiendo', 0.3), subida('c', 'cola')])).toBe('Llegando: 1 de 3.')
  })

  it('lo que no llegó, primero', () => {
    expect(fraseDeLlegada(1, [subida('b', 'fallo'), subida('c', 'cola')])).toBe(
      'Un archivo no llegó: reintenta o quítalo. Los que siguen esperan.',
    )
  })

  it('con todo arriba, nada que decir', () => {
    expect(fraseDeLlegada(3, [])).toBeNull()
  })
})
