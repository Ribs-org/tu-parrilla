import { describe, expect, it } from 'vitest'
import { bordeDe, dibujoDe, estadoCorto } from './dibujo'

const destino = (accountId: string, status: 'scheduled' | 'publishing' | 'published' | 'failed', extra = {}) => ({
  accountId,
  network: 'instagram',
  status,
  lastError: null,
  opciones: null,
  externalId: null,
  ...extra,
})

describe('dibujoDe', () => {
  it('una marca por destino, en su orden', () => {
    const dibujo = dibujoDe(
      [destino('a', 'published'), destino('b', 'publishing'), destino('c', 'scheduled')],
      [{ mediaType: 'video' }],
      new Set(),
    )
    expect(dibujo).toEqual({
      formato: 'entrana',
      huesos: 0,
      coccion: 'sellada',
      carne: 'sellada',
      sellos: ['servido', 'saliendo', 'pendiente'],
    })
  })

  it('un destino en una cuenta fría lleva la marca fría', () => {
    const dibujo = dibujoDe([destino('a', 'scheduled'), destino('b', 'scheduled')], [], new Set(['b']))
    expect(dibujo.sellos).toEqual(['pendiente', 'frio'])
  })

  it('salió en una y falló en otra: a punto con el halo', () => {
    const dibujo = dibujoDe([destino('a', 'published'), destino('b', 'failed')], [{ mediaType: 'image' }], new Set())
    expect(dibujo.coccion).toBe('parcial')
    expect(dibujo.carne).toBe('punto')
  })

  it('si todos sus destinos son historia, es un choripán; si uno no lo es, no', () => {
    const historia = { opciones: { historia: true } }
    const dos = [destino('a', 'scheduled', historia), destino('b', 'scheduled', { ...historia, network: 'facebook' })]
    expect(dibujoDe(dos, [{ mediaType: 'image' }], new Set()).formato).toBe('choripan')
    expect(dibujoDe([dos[0]!, destino('b', 'scheduled')], [{ mediaType: 'image' }], new Set()).formato).toBe('bife')
  })

  it('un video que salió en todas sus redes se dibuja a punto y como entraña, sin su archivo', () => {
    const dibujo = dibujoDe([destino('a', 'published'), destino('b', 'published')], [], new Set(), 1)
    expect(dibujo).toMatchObject({ formato: 'entrana', carne: 'punto' })
  })
})

describe('estadoCorto', () => {
  it('lo programado no dice nada: la marca punteada ya lo dice', () => {
    expect(estadoCorto('cruda', ['pendiente'])).toBeNull()
  })

  it('lo quemado en parte dice cuántos de cuántos', () => {
    expect(estadoCorto('parcial', ['servido', 'quemado', 'servido'])).toBe('falló en 1 de 3')
    expect(estadoCorto('quemada', ['quemado'])).toBe('falló')
    expect(estadoCorto('sellada', ['saliendo'])).toBe('saliendo')
    expect(estadoCorto('punto', ['servido'])).toBe('publicado')
  })
})

describe('bordeDe', () => {
  it('rojo cuando se quemó, ámbar cuando pide atención, acero el resto', () => {
    expect(bordeDe('parcial', ['servido', 'quemado'])).toBe('mano')
    expect(bordeDe('quemada', ['quemado'])).toBe('mano')
    expect(bordeDe('punto', ['servido', 'bandeja'])).toBe('atencion')
    expect(bordeDe('cruda', ['reintento'])).toBe('atencion')
    expect(bordeDe('cruda', ['frio'])).toBe('atencion')
    expect(bordeDe('cruda', ['pendiente'])).toBe('cuenta')
  })
})
