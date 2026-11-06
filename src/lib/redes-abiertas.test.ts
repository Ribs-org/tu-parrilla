import { afterEach, describe, expect, it, vi } from 'vitest'
import { REDES_PROXIMAMENTE } from './networks'
import { anunciosAbiertosPara, proximamentePara } from './redes-abiertas'

describe('proximamentePara', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin la variable, o para otro dueño, es la lista fija', () => {
    vi.stubEnv('THREADS_ABIERTO_PARA', '')
    expect(proximamentePara('revisor')).toBe(REDES_PROXIMAMENTE)
    vi.stubEnv('THREADS_ABIERTO_PARA', 'revisor')
    expect(proximamentePara('otro')).toBe(REDES_PROXIMAMENTE)
    expect(proximamentePara(null)).toBe(REDES_PROXIMAMENTE)
  })

  it('para el revisor, Threads se abre y X sigue en «Próximamente»', () => {
    vi.stubEnv('THREADS_ABIERTO_PARA', 'otro, revisor')
    const suyas = proximamentePara('revisor')
    expect(suyas.has('threads')).toBe(false)
    expect(suyas.has('x')).toBe(true)
  })
})

describe('anunciosAbiertosPara', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin la variable, para nadie', () => {
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', '')
    expect(anunciosAbiertosPara('revisor')).toBe(false)
  })

  it('con «1», para todos; con una lista, solo para los que nombra', () => {
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', '1')
    expect(anunciosAbiertosPara('cualquiera')).toBe(true)
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', 'otro, revisor')
    expect(anunciosAbiertosPara('revisor')).toBe(true)
    expect(anunciosAbiertosPara('nadie')).toBe(false)
    expect(anunciosAbiertosPara(null)).toBe(false)
  })
})
