import { describe, expect, it, vi } from 'vitest'
import type { CancionInstagram } from './instagram-audio'
import {
  RAZON_SONANDO,
  elegirSinModelo,
  juntarCandidatas,
  leerBusquedas,
  leerEleccion,
  limpiarBusquedas,
  pedidoDeEleccion,
  sugerirCancion,
  type DepsSugerencia,
} from './musica-sugerencia'

function cancion(id: string, titulo = `Canción ${id}`, artista: string | null = 'Alguien'): CancionInstagram {
  return { id, titulo, artista, duracionMs: 30000, portada: null, muestra: `https://cdn/${id}.mp3` }
}

const SONANDO = [cancion('1', 'Tusa', 'Karol G'), cancion('2', 'Provenza', 'Karol G'), cancion('3', 'Flowers', 'Miley Cyrus')]
const LOFI = [cancion('10', 'Lofi uno'), cancion('2', 'Provenza', 'Karol G')]

function deps(over: Partial<DepsSugerencia> = {}): DepsSugerencia {
  return {
    buscar: async (b) => ({ canciones: b === null ? SONANDO : b === 'lofi chill' ? LOFI : [] }),
    pedirAlModelo: null,
    azar: () => 0,
    ...over,
  }
}

describe('lo que contesta el modelo', () => {
  const candidatas = juntarCandidatas(SONANDO, [], new Set())

  it('una elección vale solo si el id es de una candidata; la razón queda en una línea', () => {
    expect(leerEleccion('```json\n{"id": "2", "razon": "Tiene el\\nánimo del post."}\n```', candidatas)).toEqual({
      cancion: { ...SONANDO[1], origen: null },
      razon: 'Tiene el ánimo del post.',
    })
    expect(leerEleccion('{"id": "99", "razon": "Inventada"}', candidatas)).toBeNull()
    expect(leerEleccion('Te recomiendo Despacito', candidatas)).toBeNull()
    expect(leerEleccion('{"id": 3}', candidatas)?.razon).toBe(RAZON_SONANDO)
  })

  it('las búsquedas: hasta dos, cortas, sin repetir', () => {
    expect(leerBusquedas('{"busquedas": ["lofi chill", "LOFI CHILL", "reggaetón", "tercera"]}')).toEqual(['lofi chill', 'reggaetón'])
    expect(leerBusquedas('nada')).toEqual([])
    expect(limpiarBusquedas(['x'.repeat(100)])[0]).toHaveLength(60)
    expect(limpiarBusquedas('lofi')).toEqual([])
  })

  it('el pedido lista las candidatas por id, con su origen', () => {
    const pedido = pedidoDeEleccion('Mi rutina de mañana', juntarCandidatas(SONANDO, [{ busqueda: 'lofi chill', canciones: LOFI }], new Set()))
    expect(pedido).toContain('- id 1: Tusa — Karol G (sonando ahora)')
    expect(pedido).toContain('- id 10: Lofi uno — Alguien (buscando «lofi chill»)')
    expect(pedido).toContain('Mi rutina de mañana')
  })
})

describe('juntarCandidatas y elegirSinModelo', () => {
  it('sin repetir y sin las ya mostradas; las de búsqueda llevan su origen', () => {
    const juntas = juntarCandidatas(SONANDO, [{ busqueda: 'lofi chill', canciones: LOFI }], new Set(['1']))
    expect(juntas.map((c) => [c.id, c.origen])).toEqual([
      ['2', null],
      ['3', null],
      ['10', 'lofi chill'],
    ])
  })

  it('sin modelo elige entre lo que suena; si ya no queda, entre lo buscado', () => {
    const juntas = juntarCandidatas(SONANDO, [{ busqueda: 'lofi chill', canciones: LOFI }], new Set(['1', '2', '3']))
    expect(elegirSinModelo(juntas, () => 0.99)).toEqual({ cancion: LOFI[0], razon: 'Salió buscando «lofi chill».', conModelo: false })
    expect(elegirSinModelo(juntarCandidatas(SONANDO, [], new Set()), () => 0.99)?.cancion.id).toBe('3')
    expect(elegirSinModelo([])).toBeNull()
  })
})

describe('sugerirCancion', () => {
  it('sin pasarela, el botón funciona igual: una que suena, con su razón, sin preguntarle a nadie más', async () => {
    const buscar = vi.fn(deps().buscar)
    const r = await sugerirCancion({ texto: 'Hola', vistas: [] }, deps({ buscar }))
    expect(r).toEqual({ sugerencia: { cancion: SONANDO[0], razon: RAZON_SONANDO, conModelo: false }, busquedas: [] })
    expect(buscar).toHaveBeenCalledTimes(1)
  })

  it('«Otra» no repite ninguna de las mostradas, y al final dice que no quedan', async () => {
    const vistas: string[] = []
    for (const esperada of ['1', '2', '3']) {
      const r = await sugerirCancion({ texto: '', vistas }, deps())
      if (!('sugerencia' in r)) throw new Error('debía sugerir')
      expect(r.sugerencia.cancion.id).toBe(esperada)
      vistas.push(r.sugerencia.cancion.id)
    }
    expect(await sugerirCancion({ texto: '', vistas }, deps())).toEqual({ agotadas: true, busquedas: [] })
  })

  it('con modelo: propone búsquedas, elige una candidata por id y la razón es la suya', async () => {
    const pedirAlModelo = vi.fn(async (instrucciones: string, pedido: string) => {
      if (instrucciones.includes('búsquedas')) return '{"busquedas": ["lofi chill"]}'
      expect(pedido).toContain('id 10')
      // El modelo no ve las ya mostradas: nunca puede devolverlas.
      expect(pedido).not.toContain('id 1:')
      return '{"id": "10", "razon": "Tranquila, como tu mañana."}'
    })
    const r = await sugerirCancion({ texto: 'Mi rutina de mañana', vistas: ['1'] }, deps({ pedirAlModelo }))
    expect(r).toEqual({
      sugerencia: { cancion: LOFI[0], razon: 'Tranquila, como tu mañana.', conModelo: true },
      busquedas: ['lofi chill'],
    })
  })

  it('con las búsquedas de vuelta («Otra»), el modelo solo elige', async () => {
    const pedirAlModelo = vi.fn(async () => '{"id": "3", "razon": "Alegre."}')
    const r = await sugerirCancion({ texto: 'Hola', vistas: ['1'], busquedas: ['lofi chill'] }, deps({ pedirAlModelo }))
    expect(pedirAlModelo).toHaveBeenCalledTimes(1)
    expect('sugerencia' in r && r.sugerencia.cancion.id).toBe('3')
  })

  it('un modelo que inventa, contesta otra cosa o se cae no rompe nada: elige el azar', async () => {
    for (const pedirAlModelo of [
      async () => '{"id": "999", "razon": "Despacito"}',
      async () => 'no sé',
      async () => {
        throw new Error('GatewayModelNotFoundError')
      },
    ]) {
      const r = await sugerirCancion({ texto: '', vistas: [] }, deps({ pedirAlModelo }))
      expect(r).toEqual({ sugerencia: { cancion: SONANDO[0], razon: RAZON_SONANDO, conModelo: false }, busquedas: [] })
    }
  })

  it('una sugerencia ya mostrada que el modelo repite no vale', async () => {
    const r = await sugerirCancion({ texto: '', vistas: ['1'] }, deps({ pedirAlModelo: async () => '{"id": "1", "razon": "otra vez"}' }))
    expect('sugerencia' in r && r.sugerencia.cancion.id).toBe('2')
    expect('sugerencia' in r && r.sugerencia.conModelo).toBe(false)
  })

  it('si Instagram no responde y no hay nada buscado, la frase de Instagram', async () => {
    const r = await sugerirCancion({ texto: '', vistas: [] }, deps({ buscar: async () => ({ error: 'Instagram no respondió.' }) }))
    expect(r).toEqual({ error: 'Instagram no respondió.' })
  })
})
