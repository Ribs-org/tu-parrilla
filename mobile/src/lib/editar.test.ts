import { describe, expect, it } from 'vitest'
import { cuerpoDeLaEdicion, destinosQueSiguen, limiteDelTexto, sePuedeQuitar } from './editar'
import type { PostEditable } from './tipos'

const POST: PostEditable = {
  id: 'post-1',
  texto: 'Hola',
  cuando: '2026-11-06T19:00:00-03:00',
  destinos: [
    { id: 'd-ig', red: 'instagram', handle: 'vicente', estado: 'scheduled', limite: 2200 },
    { id: 'd-x', red: 'x', handle: 'vicente', estado: 'scheduled', limite: 280 },
  ],
  seConserva: null,
  bloqueo: null,
}

describe('editar un post programado', () => {
  it('el límite del texto es el de la red más estricta que sigue', () => {
    expect(limiteDelTexto(POST, [])).toBe(280)
    expect(limiteDelTexto(POST, ['d-x'])).toBe(2200)
  })

  it('el último destino no se quita: para eso está borrar', () => {
    expect(sePuedeQuitar(POST, [], 'd-x')).toBe(true)
    expect(sePuedeQuitar(POST, ['d-x'], 'd-ig')).toBe(false)
    expect(sePuedeQuitar(POST, ['d-x'], 'd-x')).toBe(false)
    expect(destinosQueSiguen(POST, ['d-x']).map((d) => d.id)).toEqual(['d-ig'])
  })

  it('la hora viaja solo si se eligió otra', () => {
    expect(cuerpoDeLaEdicion('Hola', null, ['d-x'])).toEqual({ texto: 'Hola', quitar: ['d-x'] })
    const fecha = new Date('2026-11-07T22:00:00Z')
    expect(cuerpoDeLaEdicion('Hola', fecha, [])).toEqual({ texto: 'Hola', cuando: '2026-11-07T22:00:00.000Z', quitar: [] })
  })
})
