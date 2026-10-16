import { describe, expect, it } from 'vitest'

import {
  DIAS_FIJOS,
  cuandoQuemado,
  diasDeLaAgenda,
  pieDeAyer,
  rotuloDelDia,
  seQuemo,
  servidosAyer,
  sumarDias,
} from './agenda'
import type { PostProgramado } from './tipos'

const HOY = '2026-10-15' // jueves

function post(id: string, cuando: string, estados: string[]): PostProgramado {
  return {
    id,
    texto: id,
    cuando,
    redes: estados.map((estado, i) => ({ id: `${id}-${i}`, red: 'instagram', handle: '@x', estado })),
  }
}

describe('sumarDias', () => {
  it('cruza meses y años', () => {
    expect(sumarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31')
  })
})

describe('rotuloDelDia', () => {
  it('hoy, mañana y los demás', () => {
    expect(rotuloDelDia('2026-10-15', HOY)).toBe('Hoy · jue 15')
    expect(rotuloDelDia('2026-10-16', HOY)).toBe('Mañana · vie 16')
    expect(rotuloDelDia('2026-10-17', HOY)).toBe('sáb 17')
  })
})

describe('diasDeLaAgenda', () => {
  it('los siete primeros siempre, después solo los que tienen algo, y nada del pasado', () => {
    const posts = [
      post('ayer', '2026-10-14T19:00:00-03:00', ['published']),
      post('hoy', '2026-10-15T19:00:00-03:00', ['scheduled']),
      post('lejos', '2026-11-02T10:00:00-03:00', ['scheduled']),
    ]
    const dias = diasDeLaAgenda(posts, HOY)
    expect(dias).toHaveLength(DIAS_FIJOS + 1)
    expect(dias[0]).toEqual({ dia: HOY, posts: [posts[1]] })
    expect(dias[1]!.posts).toEqual([])
    expect(dias.at(-1)).toEqual({ dia: '2026-11-02', posts: [posts[2]] })
    expect(dias.some((d) => d.dia === '2026-10-14')).toBe(false)
  })
})

describe('seQuemo', () => {
  it('una fila por destino que falló, del más reciente al más viejo', () => {
    const viejo = post('viejo', '2026-10-10T09:00:00-03:00', ['failed'])
    const nuevo = post('nuevo', '2026-10-14T19:00:00-03:00', ['failed', 'published', 'failed'])
    const filas = seQuemo([viejo, nuevo, post('bien', '2026-10-14T20:00:00-03:00', ['published'])])
    expect(filas.map((f) => f.destino.id)).toEqual(['nuevo-0', 'nuevo-2', 'viejo-0'])
  })
})

describe('servidosAyer y pieDeAyer', () => {
  it('cuenta cortes de ayer con al menos una red publicada', () => {
    const posts = [
      post('a', '2026-10-14T09:00:00-03:00', ['published', 'failed']),
      post('b', '2026-10-14T19:00:00-03:00', ['failed']),
      post('c', '2026-10-15T09:00:00-03:00', ['published']),
    ]
    expect(servidosAyer(posts, HOY)).toBe(1)
  })

  it('las tres frases del pie', () => {
    expect(pieDeAyer(0)).toBe('Ayer no salió nada.')
    expect(pieDeAyer(1)).toBe('Ayer: 1 corte servido')
    expect(pieDeAyer(4)).toBe('Ayer: 4 cortes servidos')
  })
})

describe('cuandoQuemado', () => {
  it('solo la hora si es de hoy; si no, el día delante', () => {
    expect(cuandoQuemado('2026-10-15T19:00:00-03:00', HOY)).toBe('19:00')
    expect(cuandoQuemado('2026-10-14T09:15:00-03:00', HOY)).toBe('14 oct · 09:15')
  })
})
