import { afterEach, describe, expect, it, vi } from 'vitest'
import { REDES_PROXIMAMENTE } from './networks'
import { loginDeInstagramAbiertoPara, proximamentePara } from './redes-abiertas'

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

describe('loginDeInstagramAbiertoPara', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin la variable está cerrado para todos', () => {
    vi.stubEnv('INSTAGRAM_LOGIN_ABIERTO_PARA', '')
    expect(loginDeInstagramAbiertoPara('revisor')).toBe(false)
  })

  it('con una lista, solo para esos ids', () => {
    vi.stubEnv('INSTAGRAM_LOGIN_ABIERTO_PARA', 'otro, revisor')
    expect(loginDeInstagramAbiertoPara('revisor')).toBe(true)
    expect(loginDeInstagramAbiertoPara('tercero')).toBe(false)
    expect(loginDeInstagramAbiertoPara(null)).toBe(false)
  })

  it('con 1, para todos', () => {
    vi.stubEnv('INSTAGRAM_LOGIN_ABIERTO_PARA', '1')
    expect(loginDeInstagramAbiertoPara('cualquiera')).toBe(true)
  })
})
