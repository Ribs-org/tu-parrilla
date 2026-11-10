import { afterEach, describe, expect, it, vi } from 'vitest'
import { NO_METRICS, type FetchedPost } from './connector'

vi.mock('@/lib/ajustes', () => ({ leerAjuste: vi.fn(), guardarAjuste: vi.fn(), borrarAjuste: vi.fn() }))

const {
  camposDeCuenta,
  fusionarConBusiness,
  idDeEnlace,
  leerBusquedas,
  leerComparacion,
  leerCuenta,
  leerVideos,
  normalizarCuenta,
  normalizarVideoBusiness,
  palabrasDe,
  partesDe,
} = await import('./tiktok-numeros')

const TODO = 'comment.list,comment.list.manage,user.info.stats,user.insights,video.list,video.insights,discovery.search.words'
const credencial = (scope = TODO) => ({ openId: 'open-business', accessToken: 'act.1', refreshToken: 'r', expiraEn: '', scope })

/** Lo que conteste TikTok según la llamada; anota las urls y cabeceras pedidas. */
function stubTikTok(responder: (n: number, url: URL) => unknown) {
  const pedidos: Array<{ url: URL; headers: Record<string, string> }> = []
  vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
    const u = new URL(String(url))
    const body = responder(pedidos.length, u)
    pedidos.push({ url: u, headers: (init?.headers ?? {}) as Record<string, string> })
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
  return pedidos
}

afterEach(() => vi.unstubAllGlobals())

describe('partesDe', () => {
  it('de mayor a menor, y en por ciento se pasa a partes de 1', () => {
    expect(partesDe([{ country: 'AR', percentage: 0.2 }, { country: 'CL', percentage: 0.7 }], 'country')).toEqual([
      { clave: 'CL', parte: 0.7 },
      { clave: 'AR', parte: 0.2 },
    ])
    expect(partesDe([{ city_name: 'Santiago', percentage: 17.5 }, { city_name: 'Lima', percentage: 2.5 }], 'city_name')).toEqual([
      { clave: 'Santiago', parte: 0.175 },
      { clave: 'Lima', parte: 0.025 },
    ])
  })

  it('lo que no es una lista, o una fila sin clave o sin número, no entra', () => {
    expect(partesDe(undefined, 'country')).toEqual([])
    expect(partesDe([{ country: '', percentage: 1 }, { country: 'CL' }], 'country')).toEqual([])
  })
})

describe('normalizarCuenta', () => {
  const data = {
    followers_count: 1300,
    videos_count: 40,
    total_likes: 9000,
    audience_genders: [{ gender: 'Female', percentage: 0.6 }, { gender: 'Male', percentage: 0.4 }],
    audience_countries: [{ country: 'CL', percentage: 0.8 }],
    audience_ages: [{ age: '25-34', percentage: 0.5 }, { age: '18-24', percentage: 0.3 }],
    metrics: [
      { date: '2026-11-06', followers_count: 1290, profile_views: 30, video_views: 900, likes: 50 },
      { date: '2026-11-05', followers_count: 1250, profile_views: 20, video_views: 800, unique_video_views: 600 },
      { date: 'mal', followers_count: 1 },
    ],
  }

  it('cada día con su fecha, en orden; lo que no vino es null, no cero', () => {
    const { dias } = normalizarCuenta(data)
    expect(dias.map((d) => d.dia)).toEqual(['2026-11-05', '2026-11-06'])
    expect(dias[0]).toMatchObject({ followers: 1250, profileViews: 20, views: 800, reach: 600, accountsEngaged: null })
    expect(dias[1]).toMatchObject({ reach: null, likes: 50 })
  })

  it('la audiencia y lo de por vida; lo ganado sale del primer y el último total si no hay neto diario', () => {
    const { audiencia } = normalizarCuenta(data, new Date('2026-11-08T12:00:00Z'))
    expect(audiencia).toMatchObject({ followers: 1300, videos: 40, totalLikes: 9000, ganados30: 40, leido: '2026-11-08T12:00:00.000Z' })
    expect(audiencia.edades.map((e) => e.clave)).toEqual(['18-24', '25-34'])
    expect(audiencia.generos[0]).toEqual({ clave: 'Female', parte: 0.6 })
  })

  it('con el neto diario (cuentas con acceso avanzado), lo ganado es su suma', () => {
    const conNeto = { metrics: [{ date: '2026-11-05', daily_total_followers: 3 }, { date: '2026-11-06', daily_total_followers: -1 }] }
    expect(normalizarCuenta(conNeto).audiencia.ganados30).toBe(2)
  })

  it('una cuenta personal sin nada de esto: todo null y listas vacías', () => {
    const { dias, audiencia } = normalizarCuenta({})
    expect(dias).toEqual([])
    expect(audiencia).toMatchObject({ followers: null, ganados30: null, paises: [], generos: [], edades: [] })
  })
})

describe('camposDeCuenta', () => {
  it('pide solo lo que el token permite', () => {
    expect(camposDeCuenta('comment.list', true)).toEqual([])
    expect(camposDeCuenta('user.info.stats', true)).toEqual(['followers_count', 'videos_count', 'total_likes'])
    expect(camposDeCuenta('user.insights', false)).not.toContain('unique_video_views')
    expect(camposDeCuenta('user.insights', true)).toContain('unique_video_views')
  })
})

describe('leerCuenta', () => {
  it('sin permisos de números no pide nada', async () => {
    const pedidos = stubTikTok(() => ({ code: 0, data: {} }))
    expect(await leerCuenta(credencial('comment.list,comment.list.manage'))).toBeNull()
    expect(pedidos).toHaveLength(0)
  })

  it('pide 30 días con el id de Business y el token en la cabecera', async () => {
    const pedidos = stubTikTok(() => ({ code: 0, data: { followers_count: 5 } }))
    const cuenta = await leerCuenta(credencial(), new Date('2026-11-08T12:00:00Z'))
    expect(cuenta?.audiencia.followers).toBe(5)
    const { url, headers } = pedidos[0]!
    expect(url.pathname).toBe('/open_api/v1.3/business/get/')
    expect(url.searchParams.get('business_id')).toBe('open-business')
    expect(url.searchParams.get('start_date')).toBe('2026-10-09')
    expect(url.searchParams.get('end_date')).toBe('2026-11-07')
    expect(JSON.parse(url.searchParams.get('fields')!)).toContain('audience_countries')
    expect(headers['Access-Token']).toBe('act.1')
  })

  it('si TikTok rechaza los campos avanzados, repite sin ellos', async () => {
    const pedidos = stubTikTok((n) => (n === 0 ? { code: 40001, message: 'no permission' } : { code: 0, data: { followers_count: 7 } }))
    const cuenta = await leerCuenta(credencial())
    expect(cuenta?.audiencia.followers).toBe(7)
    expect(pedidos).toHaveLength(2)
    expect(JSON.parse(pedidos[1]!.url.searchParams.get('fields')!)).not.toContain('unique_video_views')
  })
})

describe('videos', () => {
  const crudo = {
    item_id: '7430000000000000001',
    create_time: '1793900000',
    share_url: 'https://www.tiktok.com/@vicente/video/7430000000000000001?utm_source=x',
    video_views: 1500,
    likes: 90,
    comments: 4,
    shares: 3,
    favorites: 12,
    reach: 1100,
    average_time_watched: 6.4,
    full_video_watched_rate: 0.21,
    new_followers: 5,
    impression_sources: [{ impression_source: 'Follow', percentage: 0.1 }, { impression_source: 'For You', percentage: 0.85 }],
    audience_types: [{ type: 'NON_FOLLOWER_PERCENT', percentage: 0.9 }, { type: 'NEW_VIEWER', percentage: 0.7 }],
  }

  it('normaliza un video, con su a fondo', () => {
    const v = normalizarVideoBusiness(crudo)!
    expect(v.itemId).toBe('7430000000000000001')
    expect(v.idDelEnlace).toBe('7430000000000000001')
    expect(v.metrics).toEqual({ views: 1500, likes: 90, comments: 4, shares: 3, saves: 12, reach: 1100 })
    expect(v.aFondo).toMatchObject({ vistoPromedio: 6.4, vieronCompleto: 0.21, seguidoresNuevos: 5, noSeguidores: 0.9, nuevos: 0.7 })
    expect(v.aFondo.fuentes[0]).toEqual({ clave: 'For You', parte: 0.85 })
    expect(normalizarVideoBusiness({})).toBeNull()
  })

  it('el id del enlace, de un video o de fotos', () => {
    expect(idDeEnlace('https://www.tiktok.com/@a/photo/123')).toBe('123')
    expect(idDeEnlace('https://vm.tiktok.com/ABC/')).toBeNull()
    expect(idDeEnlace(null)).toBeNull()
  })

  it('sin `video.list` no pide nada; sin `video.insights`, solo los campos de siempre', async () => {
    let pedidos = stubTikTok(() => ({ code: 0, data: { videos: [] } }))
    expect(await leerVideos(credencial('comment.list'), new Date())).toEqual([])
    expect(pedidos).toHaveLength(0)
    pedidos = stubTikTok(() => ({ code: 0, data: { videos: [crudo], has_more: false } }))
    await leerVideos(credencial('video.list'), new Date())
    expect(JSON.parse(pedidos[0]!.url.searchParams.get('fields')!)).not.toContain('average_time_watched')
  })

  it('pagina con el cursor hasta pasar `desde`, y si los campos a fondo fallan repite sin ellos', async () => {
    const pagina = (desde: number, n: number) =>
      Array.from({ length: n }, (_, i) => ({ item_id: String(desde + i), create_time: String(1793900000 - (desde + i) * 86400) }))
    const pedidos = stubTikTok((n) =>
      n === 0
        ? { code: 40001, message: 'scope' }
        : n === 1
          ? { code: 0, data: { videos: pagina(0, 20), has_more: true, cursor: 111 } }
          : { code: 0, data: { videos: pagina(20, 20), has_more: true, cursor: 222 } },
    )
    const videos = await leerVideos(credencial(), new Date((1793900000 - 30 * 86400) * 1000))
    expect(videos).toHaveLength(40)
    expect(pedidos).toHaveLength(3)
    expect(pedidos[2]!.url.searchParams.get('cursor')).toBe('111')
    expect(pedidos[2]!.url.searchParams.get('max_count')).toBe('20')
  })
})

describe('fusionarConBusiness', () => {
  const post = (externalId: string, permalink: string | null = null): FetchedPost => ({
    externalId,
    permalink,
    caption: null,
    thumbnailUrl: null,
    mediaType: 'video',
    publishedAt: new Date(),
    metrics: { ...NO_METRICS, views: 2000, likes: 100, comments: 5, shares: 3 },
  })
  const video = (itemId: string, enlace: string) =>
    normalizarVideoBusiness({ item_id: itemId, share_url: enlace, video_views: 1500, likes: 90, favorites: 12, reach: 1100, average_time_watched: 4 })!

  it('completa guardados y alcance, y deja las views de siempre, que son al instante', () => {
    const { posts, aFondo, calce } = fusionarConBusiness([post('1')], [video('1', 'https://www.tiktok.com/@a/video/1')])
    expect(posts[0]!.metrics).toEqual({ views: 2000, likes: 100, comments: 5, shares: 3, saves: 12, reach: 1100 })
    expect(aFondo.get('1')?.vistoPromedio).toBe(4)
    expect(calce).toEqual({ porId: 1, porEnlace: 0, sinCalzar: 0 })
  })

  it('los seguidores que trajo cada video se quedan en lo de Business y no pasan a la lectura del día', () => {
    // `/privacidad` promete borrar el detalle de los videos de Business al desconectar, y la
    // lectura del día se queda: por eso no viajan en `post_metrics`.
    const conSeguidores = normalizarVideoBusiness({ item_id: '1', share_url: 'https://www.tiktok.com/@a/video/1', video_views: 10, new_followers: 8 })!
    const { posts, aFondo } = fusionarConBusiness([post('1')], [conSeguidores])
    expect(aFondo.get('1')?.seguidoresNuevos).toBe(8)
    expect(posts[0]!.metrics.seguidores).toBeUndefined()
  })

  it('si el id no calza, cruza por el número del enlace; y lo que no está queda tal cual', () => {
    const { posts, aFondo, calce } = fusionarConBusiness(
      [post('7'), post('8'), post('id-raro', 'https://www.tiktok.com/@a/video/9')],
      [video('otro-id', 'https://www.tiktok.com/@a/video/7'), video('9', 'https://www.tiktok.com/@a/video/9')],
    )
    expect(calce).toEqual({ porId: 0, porEnlace: 2, sinCalzar: 1 })
    expect(posts[1]!.metrics.saves).toBeNull()
    expect([...aFondo.keys()]).toEqual(['7', 'id-raro'])
  })
})

describe('comparación y búsquedas', () => {
  it('la comparación pide el rubro y traduce los promedios', async () => {
    const pedidos = stubTikTok(() => ({
      code: 0,
      data: { average_follower_count: 1592.5, average_engagement_rate: 0.0449, average_follower_growth: 24.9, business_category: 'Art & Crafts' },
    }))
    const c = await leerComparacion(credencial(), 'ART_AND_CRAFTS', new Date('2026-11-08T00:00:00Z'))
    expect(pedidos[0]!.url.pathname).toBe('/open_api/v1.3/business/benchmark/')
    expect(pedidos[0]!.url.searchParams.get('business_category')).toBe('ART_AND_CRAFTS')
    expect(c).toMatchObject({ rubro: 'ART_AND_CRAFTS', seguidores: 1592.5, interaccion: 0.0449, seguidoresGanados30: 24.9, videos: null })
  })

  it('las búsquedas: sin consulta, las tendencias; con una, las recomendadas; siempre para la cuenta', async () => {
    const pedidos = stubTikTok(() => ({ code: 0, data: { search_keywords: ['asado', 'Asado', ' chimichurri ', 3] } }))
    expect(await leerBusquedas(credencial(), null)).toEqual(['asado', 'chimichurri'])
    await leerBusquedas(credencial(), 'parrilla')
    expect(pedidos[0]!.url.pathname).toBe('/open_api/v1.3/discovery/trending/search/')
    expect(pedidos[0]!.url.searchParams.get('is_personalized')).toBe('true')
    expect(pedidos[1]!.url.pathname).toBe('/open_api/v1.3/discovery/trending/search/keyword/')
    expect(pedidos[1]!.url.searchParams.get('query')).toBe('parrilla')
  })

  it('una cuenta sin acceso avanzado: TikTok dice que no y eso lanza', async () => {
    stubTikTok(() => ({ code: 40100, message: 'account has no advanced access' }))
    await expect(leerBusquedas(credencial(), null)).rejects.toThrow(/40100/)
  })

  it('palabrasDe no se cae con lo que no es una lista', () => {
    expect(palabrasDe({})).toEqual([])
  })
})
