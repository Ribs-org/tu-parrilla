import { describe, expect, it } from 'vitest'
import {
  MAX_PAGINAS,
  emparejar,
  formatearGasto,
  idsPorCruzar,
  leerAnunciosDeMeta,
  normalizarAnuncios,
  resumirLoPagado,
  urlAnuncios,
  type AnuncioLeido,
  type FilaPagada,
} from './anuncios'

const CUENTA = { id: 'act_1', nombre: 'Cuenta de Juan', moneda: 'CLP' }

/** Un anuncio como lo devuelve `/<act>/ads` con los campos que se piden. */
function deMeta(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    name: `Anuncio ${id}`,
    effective_status: 'ACTIVE',
    creative: { effective_object_story_id: 'PAGE_1', effective_instagram_media_id: 'IG_1' },
    insights: {
      data: [{ spend: '15000', reach: '1200', impressions: '3400', clicks: '56', date_start: '2026-10-01', date_stop: '2026-11-05' }],
    },
    ...extra,
  }
}

describe('normalizarAnuncios', () => {
  it('lee los números que Meta manda como texto, con la cuenta y su moneda', () => {
    const [a] = normalizarAnuncios({ data: [deMeta('AD_1')] }, CUENTA)
    expect(a).toEqual({
      externalId: 'AD_1',
      nombre: 'Anuncio AD_1',
      estado: 'ACTIVE',
      cuentaPublicitariaId: 'act_1',
      cuentaPublicitariaNombre: 'Cuenta de Juan',
      moneda: 'CLP',
      storyId: 'PAGE_1',
      instagramMediaId: 'IG_1',
      gasto: 15000,
      alcance: 1200,
      impresiones: 3400,
      clics: 56,
      desde: '2026-10-01',
      hasta: '2026-11-05',
    })
  })

  it('un anuncio sin insights nunca corrió y no se guarda', () => {
    expect(normalizarAnuncios({ data: [deMeta('AD_1', { insights: undefined })] }, CUENTA)).toEqual([])
    expect(normalizarAnuncios({ data: [deMeta('AD_1', { insights: { data: [] } })] }, CUENTA)).toEqual([])
  })

  it('termina cuando terminó su conjunto, no el día de la consulta', () => {
    // Con `maximum`, Meta cierra el rango hoy aunque el anuncio haya parado hace un mes.
    const [a] = normalizarAnuncios(
      { data: [deMeta('AD_1', { adset: { start_time: '2026-10-01T09:00:00-0300', end_time: '2026-10-08T23:59:00-0300' } })] },
      CUENTA,
    )
    expect(a!.hasta).toBe('2026-10-08')
    // Uno que sigue corriendo (el fin todavía no llega) se queda con el día de Meta.
    const [b] = normalizarAnuncios({ data: [deMeta('AD_2', { adset: { end_time: '2026-12-31T00:00:00-0300' } })] }, CUENTA)
    expect(b!.hasta).toBe('2026-11-05')
  })

  it('lo que falta queda en null, y el gasto en cero', () => {
    const [a] = normalizarAnuncios(
      { data: [deMeta('AD_1', { creative: null, insights: { data: [{ impressions: '10' }] } })] },
      CUENTA,
    )
    expect(a).toMatchObject({ storyId: null, instagramMediaId: null, gasto: 0, alcance: null, impresiones: 10, clics: null, desde: null })
  })
})

describe('urlAnuncios', () => {
  it('pide el creativo, el conjunto y los totales de principio a fin en la misma llamada', () => {
    const url = new URL(urlAnuncios('act_1', 'tok'))
    expect(url.pathname).toBe('/v23.0/act_1/ads')
    const campos = url.searchParams.get('fields')!
    expect(campos).toContain('creative{effective_object_story_id,effective_instagram_media_id}')
    expect(campos).toContain('insights.date_preset(maximum){spend,reach,impressions,clicks,date_start,date_stop}')
    // Lo archivado entra: sin el filtro Meta lo deja fuera, y ahí suelen estar las promociones viejas.
    expect(JSON.parse(url.searchParams.get('effective_status')!)).toContain('ARCHIVED')
    expect(new URL(urlAnuncios('act_1', 'tok', false)).searchParams.has('effective_status')).toBe(false)
  })
})

describe('leerAnunciosDeMeta', () => {
  /** Un Graph de mentira: responde por el comienzo de la ruta. */
  function graph(respuestas: Record<string, unknown | ((url: URL) => unknown)>) {
    const pedidas: URL[] = []
    const pedir = async (texto: string) => {
      const url = new URL(texto)
      pedidas.push(url)
      const clave = Object.keys(respuestas).find((k) => url.pathname.endsWith(k))
      const r = clave ? respuestas[clave] : undefined
      const valor = typeof r === 'function' ? (r as (u: URL) => unknown)(url) : r
      if (valor instanceof Error) throw valor
      if (valor === undefined) throw new Error(`sin respuesta para ${url.pathname}`)
      return valor
    }
    return { pedir, pedidas }
  }

  it('recorre las cuentas publicitarias y junta sus anuncios', async () => {
    const { pedir } = graph({
      '/me/adaccounts': { data: [CUENTA_GRAPH('act_1'), CUENTA_GRAPH('act_2')] },
      '/act_1/ads': { data: [deMeta('AD_1')] },
      '/act_2/ads': { data: [deMeta('AD_2')] },
    })
    const { cuentas, anuncios } = await leerAnunciosDeMeta('tok', pedir)
    expect(cuentas.map((c) => c.id)).toEqual(['act_1', 'act_2'])
    expect(anuncios.map((a) => [a.externalId, a.cuentaPublicitariaId])).toEqual([
      ['AD_1', 'act_1'],
      ['AD_2', 'act_2'],
    ])
  })

  it('sigue las páginas, hasta un tope', async () => {
    const { pedir, pedidas } = graph({
      '/me/adaccounts': { data: [CUENTA_GRAPH('act_1')] },
      '/act_1/ads': () => ({ data: [deMeta(`AD_${Math.random()}`)], paging: { next: 'https://graph.facebook.com/v23.0/act_1/ads?after=x' } }),
    })
    const { anuncios } = await leerAnunciosDeMeta('tok', pedir)
    expect(anuncios).toHaveLength(MAX_PAGINAS)
    expect(pedidas.filter((u) => u.pathname.endsWith('/ads'))).toHaveLength(MAX_PAGINAS)
  })

  it('si el filtro de estados falla, repite sin él', async () => {
    const { pedir, pedidas } = graph({
      '/me/adaccounts': { data: [CUENTA_GRAPH('act_1')] },
      '/act_1/ads': (url: URL) => (url.searchParams.has('effective_status') ? new Error('Graph 400') : { data: [deMeta('AD_1')] }),
    })
    const { anuncios } = await leerAnunciosDeMeta('tok', pedir)
    expect(anuncios).toHaveLength(1)
    expect(pedidas.filter((u) => u.pathname.endsWith('/ads'))).toHaveLength(2)
  })

  it('una cuenta que no se deja leer se salta; si no se deja ninguna, lanza', async () => {
    const parcial = graph({
      '/me/adaccounts': { data: [CUENTA_GRAPH('act_1'), CUENTA_GRAPH('act_2')] },
      '/act_1/ads': new Error('Graph 400 (#270)'),
      '/act_2/ads': { data: [deMeta('AD_2')] },
    })
    expect((await leerAnunciosDeMeta('tok', parcial.pedir)).anuncios).toHaveLength(1)

    const ninguna = graph({ '/me/adaccounts': { data: [CUENTA_GRAPH('act_1')] }, '/act_1/ads': new Error('Graph 400 (#270)') })
    await expect(leerAnunciosDeMeta('tok', ninguna.pedir)).rejects.toThrow('#270')
  })

  it('sin cuentas publicitarias no hay nada que leer, y no es un error', async () => {
    const { pedir } = graph({ '/me/adaccounts': { data: [] } })
    expect(await leerAnunciosDeMeta('tok', pedir)).toEqual({ cuentas: [], anuncios: [] })
  })

  it('sin el permiso, el primer listado lanza: el llamador prueba otro token', async () => {
    const { pedir } = graph({ '/me/adaccounts': new Error('Graph 403 (#200): Requires ads_read permission') })
    await expect(leerAnunciosDeMeta('tok', pedir)).rejects.toThrow('ads_read')
  })
})

function CUENTA_GRAPH(id: string) {
  return { id, name: `Cuenta ${id}`, currency: 'CLP' }
}

function leido(externalId: string, extra: Partial<AnuncioLeido> = {}): AnuncioLeido {
  return {
    ...normalizarAnuncios({ data: [deMeta(externalId)] }, CUENTA)[0]!,
    storyId: null,
    instagramMediaId: null,
    ...extra,
  }
}

describe('emparejar', () => {
  const publicaciones = [
    { id: 'post-ig', network: 'instagram', externalId: 'IG_1' },
    { id: 'post-fb', network: 'facebook', externalId: 'PAGE_POST' },
  ]

  it('prefiere la publicación de Instagram, y si no, el post de la página', () => {
    const pares = emparejar(
      [
        leido('A', { instagramMediaId: 'IG_1', storyId: 'PAGE_POST' }),
        leido('B', { storyId: 'PAGE_POST' }),
        leido('C', { instagramMediaId: 'IG_OTRA', storyId: 'OTRO' }),
      ],
      publicaciones,
    )
    expect(Object.fromEntries(pares)).toEqual({ A: 'post-ig', B: 'post-fb' })
  })

  it('un id de Instagram no cruza con una publicación de Facebook que se llame igual', () => {
    const pares = emparejar([leido('A', { instagramMediaId: 'PAGE_POST' })], publicaciones)
    expect(pares.size).toBe(0)
  })

  it('idsPorCruzar junta los dos ids, sin repetir', () => {
    expect(idsPorCruzar([leido('A', { instagramMediaId: 'IG_1', storyId: 'S' }), leido('B', { storyId: 'S' })]).sort()).toEqual([
      'IG_1',
      'S',
    ])
  })
})

function fila(extra: Partial<FilaPagada>): FilaPagada {
  return {
    externalId: 'AD',
    moneda: 'CLP',
    gasto: 0,
    alcance: null,
    impresiones: null,
    clics: null,
    desde: null,
    hasta: null,
    postId: null,
    network: null,
    accountId: null,
    caption: null,
    campaign: null,
    thumbnailUrl: null,
    ...extra,
  }
}

describe('resumirLoPagado', () => {
  it('suma por publicación, deja aparte lo que no es de una publicación y ordena por impresiones', () => {
    const { totales, publicaciones, sueltos } = resumirLoPagado([
      fila({ externalId: 'A1', postId: 'p1', gasto: 1000, alcance: 100, impresiones: 300, clics: 5, desde: '2026-10-05', hasta: '2026-10-10' }),
      fila({ externalId: 'A2', postId: 'p1', gasto: 500, alcance: 50, impresiones: 200, clics: null, desde: '2026-10-01', hasta: '2026-10-07' }),
      fila({ externalId: 'B1', postId: 'p2', gasto: 9000, impresiones: 1000 }),
      fila({ externalId: 'C1', gasto: 10, moneda: 'USD', impresiones: 7 }),
    ])
    expect(totales).toEqual({ anuncios: 4, gasto: { CLP: 10500, USD: 10 }, alcance: 150, impresiones: 1507, clics: 5 })
    expect(sueltos).toBe(1)
    expect(publicaciones.map((p) => p.postId)).toEqual(['p2', 'p1'])
    expect(publicaciones[1]).toMatchObject({ anuncios: 2, gasto: { CLP: 1500 }, alcance: 150, desde: '2026-10-01', hasta: '2026-10-10' })
    // Sin ningún dato, «—» y no cero: no se sabe no es cero.
    expect(publicaciones[0]!.alcance).toBeNull()
  })
})

describe('formatearGasto', () => {
  it('con la moneda de la cuenta, una por una', () => {
    expect(formatearGasto({ CLP: 15000 })).toMatch(/^15\.000\sCLP$/)
    expect(formatearGasto({ USD: 10.5, CLP: 100 })).toMatch(/^100\sCLP · 10,50\sUSD$/)
    expect(formatearGasto({})).toBe('—')
  })
})
