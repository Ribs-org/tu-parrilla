import { afterEach, describe, expect, it, vi } from 'vitest'
import { REDES_PROXIMAMENTE } from './networks'
import {
  analiticaDeYoutubeAbiertaPara,
  anunciosAbiertosPara,
  loginDeInstagramAbiertoPara,
  promocionarAbiertoPara,
  proximamentePara,
} from './redes-abiertas'

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

describe('promocionarAbiertoPara', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('pide quien ve «Lo pagado» y las dos banderas del conectar', () => {
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', 'revisor')
    vi.stubEnv('META_PERMISOS_ANUNCIOS', '1')
    vi.stubEnv('META_PERMISOS_PROMOCIONAR', '1')
    expect(promocionarAbiertoPara('revisor')).toBe(true)
    expect(promocionarAbiertoPara('otro')).toBe(false)
    // Sin la de leer, la de promocionar sola no pide nada al conectar.
    vi.stubEnv('META_PERMISOS_ANUNCIOS', '')
    expect(promocionarAbiertoPara('revisor')).toBe(false)
    vi.stubEnv('META_PERMISOS_ANUNCIOS', '1')
    vi.stubEnv('META_PERMISOS_PROMOCIONAR', '')
    expect(promocionarAbiertoPara('revisor')).toBe(false)
  })
})

describe('analiticaDeYoutubeAbiertaPara', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin el permiso en el conectar está cerrada, aunque la lista nombre al dueño', () => {
    vi.stubEnv('YOUTUBE_PERMISOS_ANALITICA', '')
    vi.stubEnv('YOUTUBE_ANALITICA_ABIERTO_PARA', '1')
    expect(analiticaDeYoutubeAbiertaPara('revisor')).toBe(false)
  })

  it('con el permiso y sin lista, para nadie', () => {
    vi.stubEnv('YOUTUBE_PERMISOS_ANALITICA', '1')
    vi.stubEnv('YOUTUBE_ANALITICA_ABIERTO_PARA', '')
    expect(analiticaDeYoutubeAbiertaPara('revisor')).toBe(false)
  })

  it('con una lista, solo para esos ids; con 1, para todos', () => {
    vi.stubEnv('YOUTUBE_PERMISOS_ANALITICA', '1')
    vi.stubEnv('YOUTUBE_ANALITICA_ABIERTO_PARA', 'otro, revisor')
    expect(analiticaDeYoutubeAbiertaPara('revisor')).toBe(true)
    expect(analiticaDeYoutubeAbiertaPara('tercero')).toBe(false)
    expect(analiticaDeYoutubeAbiertaPara(null)).toBe(false)
    vi.stubEnv('YOUTUBE_ANALITICA_ABIERTO_PARA', '1')
    expect(analiticaDeYoutubeAbiertaPara('cualquiera')).toBe(true)
  })
})
