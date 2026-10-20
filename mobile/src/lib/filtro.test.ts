import { describe, expect, it } from 'vitest'

import { cabeEnElFiltro, hayQueFiltrar, opcionesDelFiltro, recortar } from './filtro'
import type { PostProgramado } from './tipos'

function post(id: string, ...destinos: [red: string, handle: string | null][]): PostProgramado {
  return {
    id,
    texto: id,
    cuando: '2026-10-20T10:00:00-03:00',
    redes: destinos.map(([red, handle], i) => ({ id: `${id}-${i}`, red, handle, estado: 'scheduled' })),
  }
}

const POSTS = [
  post('ig', ['instagram', '@ig']),
  post('ig-y-fb', ['instagram', '@ig'], ['facebook', 'Página']),
  post('uno', ['tiktok', 'uno']),
  post('dos', ['tiktok', 'dos']),
]

describe('cabeEnElFiltro', () => {
  it('por red, cualquier cuenta de la red; por cuenta, solo la de ese nombre', () => {
    const destino = POSTS[2]!.redes[0]!
    expect(cabeEnElFiltro(destino, { red: 'tiktok', cuenta: null })).toBe(true)
    expect(cabeEnElFiltro(destino, { red: 'tiktok', cuenta: 'uno' })).toBe(true)
    expect(cabeEnElFiltro(destino, { red: 'tiktok', cuenta: 'dos' })).toBe(false)
  })
})

describe('recortar', () => {
  it('sin filtro, todos enteros; con filtro, cada post con solo lo suyo y fuera el que no tiene nada', () => {
    expect(recortar(POSTS, null)).toEqual(POSTS)
    const conFacebook = recortar(POSTS, { red: 'facebook', cuenta: null })
    expect(conFacebook.map((p) => p.id)).toEqual(['ig-y-fb'])
    expect(conFacebook[0]!.redes.map((r) => r.red)).toEqual(['facebook'])
  })
})

describe('opcionesDelFiltro', () => {
  it('cada red en el orden de siempre, y uno que sale a dos redes cuenta en las dos', () => {
    const { todas, redes } = opcionesDelFiltro(POSTS)
    expect(todas).toBe(4)
    expect(redes.map((r) => [r.red, r.cuantos])).toEqual([
      ['instagram', 2],
      ['tiktok', 2],
      ['facebook', 1],
    ])
  })

  it('solo una red con varias cuentas trae sus cuentas', () => {
    const { redes } = opcionesDelFiltro(POSTS)
    expect(redes.find((r) => r.red === 'instagram')!.cuentas).toEqual([])
    expect(redes.find((r) => r.red === 'tiktok')!.cuentas).toEqual([
      { cuenta: 'uno', nombre: 'uno', cuantos: 1 },
      { cuenta: 'dos', nombre: 'dos', cuantos: 1 },
    ])
  })
})

describe('hayQueFiltrar', () => {
  it('con dos redes, o una con varias cuentas; con una cuenta sola, no', () => {
    expect(hayQueFiltrar(opcionesDelFiltro(POSTS).redes)).toBe(true)
    expect(hayQueFiltrar(opcionesDelFiltro([POSTS[2]!, POSTS[3]!]).redes)).toBe(true)
    expect(hayQueFiltrar(opcionesDelFiltro([POSTS[0]!]).redes)).toBe(false)
  })
})
