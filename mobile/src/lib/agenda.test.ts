import { describe, expect, it } from 'vitest'

import {
  DIAS_FIJOS,
  cuandoQuemado,
  diasDeLaAgenda,
  dondeVaAhora,
  horaDeAhora,
  mezclaDeRedes,
  pieDeAyer,
  resumenDelDia,
  rotuloDelDia,
  seQuemo,
  servidoEnTodas,
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
    expect(dias[0]).toEqual({ dia: HOY, posts: [posts[1]], borradores: [] })
    expect(dias[1]!.posts).toEqual([])
    expect(dias.at(-1)).toEqual({ dia: '2026-11-02', posts: [posts[2]], borradores: [] })
    expect(dias.some((d) => d.dia === '2026-10-14')).toBe(false)
  })

  it('un borrador con fecha va en su día, por hora, y basta para que un día lejano aparezca', () => {
    const borrador = (id: string, cuando: string | null) => ({ id, texto: id, cuando, guardado: '2026-10-15T08:00:00-03:00', archivos: 0 })
    const tarde = borrador('tarde', '2026-10-16T21:00:00-03:00')
    const temprano = borrador('temprano', '2026-10-16T08:00:00-03:00')
    const lejos = borrador('lejos', '2026-11-20T10:00:00-03:00')
    const dias = diasDeLaAgenda([], HOY, [tarde, borrador('sin-fecha', null), lejos, temprano, borrador('viejo', '2026-10-01T09:00:00-03:00')])
    expect(dias).toHaveLength(DIAS_FIJOS + 1)
    expect(dias[1]).toEqual({ dia: '2026-10-16', posts: [], borradores: [temprano, tarde] })
    expect(dias.at(-1)).toEqual({ dia: '2026-11-20', posts: [], borradores: [lejos] })
  })
})

describe('seQuemo', () => {
  it('una fila por destino que falló, del más reciente al más viejo', () => {
    const viejo = post('viejo', '2026-10-10T09:00:00-03:00', ['failed'])
    const nuevo = post('nuevo', '2026-10-14T19:00:00-03:00', ['failed', 'published', 'failed'])
    const filas = seQuemo([viejo, nuevo, post('bien', '2026-10-14T20:00:00-03:00', ['published'])])
    expect(filas.map((f) => f.destino.id)).toEqual(['nuevo-0', 'nuevo-2', 'viejo-0'])
  })

  it('lo archivado no sale: ya no pide una acción', () => {
    const quemado = post('q', '2026-10-14T19:00:00-03:00', ['failed', 'failed'])
    quemado.redes[1]!.archivado = true
    expect(seQuemo([quemado]).map((f) => f.destino.id)).toEqual(['q-0'])
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

  it('de día, piezas servidas', () => {
    expect(pieDeAyer(0, 'dia')).toBe('Ayer no salió nada.')
    expect(pieDeAyer(1, 'dia')).toBe('Ayer: 1 pieza servida')
    expect(pieDeAyer(4, 'dia')).toBe('Ayer: 4 piezas servidas')
  })
})

describe('cuandoQuemado', () => {
  it('solo la hora si es de hoy; si no, el día delante', () => {
    expect(cuandoQuemado('2026-10-15T19:00:00-03:00', HOY)).toBe('19:00')
    expect(cuandoQuemado('2026-10-14T09:15:00-03:00', HOY)).toBe('mié 14 de oct · 09:15')
  })
})

describe('servidoEnTodas', () => {
  it('salió en todas y no le falta nada: se hunde', () => {
    expect(servidoEnTodas(post('a', '2026-10-15T09:00:00-03:00', ['published', 'published']))).toBe(true)
  })

  it('lo que falta, lo quemado y lo que llegó a la bandeja de TikTok no se hunden', () => {
    expect(servidoEnTodas(post('a', '2026-10-15T09:00:00-03:00', ['published', 'scheduled']))).toBe(false)
    expect(servidoEnTodas(post('a', '2026-10-15T09:00:00-03:00', ['published', 'failed']))).toBe(false)
    const enLaBandeja = post('a', '2026-10-15T09:00:00-03:00', ['published'])
    enLaBandeja.redes[0]!.sello = 'bandeja'
    expect(servidoEnTodas(enLaBandeja)).toBe(false)
  })
})

describe('resumenDelDia y mezclaDeRedes', () => {
  it('cuenta lo salido en todas, lo quemado en alguna y lo que falta; y los destinos de cada red', () => {
    const posts = [
      post('a', '2026-10-15T09:00:00-03:00', ['published']),
      post('b', '2026-10-15T10:00:00-03:00', ['published', 'failed']),
      post('c', '2026-10-15T11:00:00-03:00', ['scheduled']),
    ]
    expect(resumenDelDia(posts)).toEqual({ servidos: 1, fallaron: 1, porSalir: 1 })
    expect(mezclaDeRedes(posts)).toEqual([{ red: 'instagram', destinos: 4 }])
  })
})

describe('dondeVaAhora y horaDeAhora', () => {
  const posts = [post('a', '2026-10-15T09:00:00-03:00', []), post('b', '2026-10-15T14:00:00-03:00', [])]

  it('la línea va después de lo que ya tuvo su hora, por el instante', () => {
    expect(dondeVaAhora(posts, Date.parse('2026-10-15T12:00:00-03:00'))).toBe(1)
    expect(dondeVaAhora(posts, Date.parse('2026-10-15T14:00:00-03:00'))).toBe(2)
    expect(dondeVaAhora(posts, Date.parse('2026-10-15T08:00:00-03:00'))).toBe(0)
  })

  it('la hora de ahora, en la zona que trae `cuando` y no en la del teléfono', () => {
    expect(horaDeAhora(Date.parse('2026-10-15T17:20:00Z'), '2026-10-15T09:00:00-03:00')).toBe('14:20')
    expect(horaDeAhora(Date.parse('2026-10-15T17:20:00Z'), '2026-10-15T09:00:00+05:30')).toBe('22:50')
  })
})
