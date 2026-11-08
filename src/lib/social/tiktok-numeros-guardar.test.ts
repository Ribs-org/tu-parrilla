import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'
import { NO_METRICS, type FetchedPost } from './connector'

vi.mock('server-only', () => ({}))

// `ajustes` en memoria, por dueño y clave: lo que este archivo mira es qué se guarda y dónde.
const memoria = vi.hoisted(() => new Map<string, string>())
vi.mock('@/lib/ajustes', () => ({
  leerAjuste: vi.fn(async (dueno: string, clave: string) => memoria.get(`${dueno}|${clave}`) ?? null),
  guardarAjuste: vi.fn(async (dueno: string, clave: string, valor: string) => void memoria.set(`${dueno}|${clave}`, valor)),
  borrarAjuste: vi.fn(async (dueno: string, clave: string) => void memoria.delete(`${dueno}|${clave}`)),
}))

// La base doblada al nivel de drizzle, como en `sync.test.ts`: anota los días escritos en
// `account_metrics`, y `select` devuelve la cuenta del dueño que el caso diga.
const { escritos, cuentaLeida } = vi.hoisted(() => ({
  escritos: [] as Array<Record<string, unknown>>,
  cuentaLeida: { fila: null as unknown },
}))
vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  const eslabon = (filas: unknown[]) => {
    const paso = {
      values: (v: Record<string, unknown>) => {
        escritos.push(v)
        return paso
      },
      onConflictDoUpdate: () => paso,
      from: () => paso,
      where: () => paso,
      limit: () => paso,
      then: (ok?: never, err?: never) => Promise.resolve(filas).then(ok, err),
    }
    return paso
  }
  return {
    ...real,
    getDb: () => ({
      insert: () => eslabon([]),
      select: () => eslabon(cuentaLeida.fila ? [cuentaLeida.fila] : []),
    }),
  }
})

const { cifrar } = await import('./tiktok-business')
const {
  busquedasDeLaCuenta,
  cambiarRubro,
  claveDeNumeros,
  cuentasConBusquedas,
  interaccionDe,
  llaveDeConsulta,
  numerosDeTiktok,
  prefijoDeNumeros,
  sincronizarTiktokBusiness,
  videosAFondo,
} = await import('./tiktok-numeros-guardar')

const DUENO = 'owner-1'
const CUENTA_ID = '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'
const CUENTA = { id: CUENTA_ID, ownerId: DUENO, network: 'tiktok', handle: 'Vicente', accessToken: 'cifrado' } as unknown as SocialAccount
const TODO = 'comment.list,comment.list.manage,user.info.stats,user.insights,video.list,video.insights,discovery.search.words'

function abrir(para = '1') {
  vi.stubEnv('TIKTOK_BUSINESS_APP_ID', 'app-id')
  vi.stubEnv('TIKTOK_BUSINESS_SECRET', 'app-secret')
  vi.stubEnv('TIKTOK_BUSINESS_AUTORIZACION', 'https://www.tiktok.com/v2/auth/authorize?client_key=abc')
  vi.stubEnv('TIKTOK_COMENTARIOS_ABIERTO_PARA', para)
}

function activar(scope = TODO) {
  memoria.set(
    `${DUENO}|tiktok_comentarios:${CUENTA_ID}`,
    cifrar({ openId: 'open-business', accessToken: 'act.1', refreshToken: 'r', expiraEn: new Date(Date.now() + 20 * 3600e3).toISOString(), scope }),
  )
}

/** TikTok según el camino pedido; anota cada camino. */
function stubTikTok(porCamino: Record<string, unknown>) {
  const pedidos: string[] = []
  vi.stubGlobal('fetch', (url: string) => {
    const u = new URL(String(url))
    pedidos.push(u.pathname.replace('/open_api/v1.3', ''))
    const body = porCamino[u.pathname.replace('/open_api/v1.3', '')] ?? { code: 40000, message: 'no' }
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
  return pedidos
}

const POST: FetchedPost = {
  externalId: '7430000000000000001',
  permalink: 'https://www.tiktok.com/@vicente/video/7430000000000000001',
  caption: 'asado',
  thumbnailUrl: null,
  mediaType: 'video',
  publishedAt: new Date(),
  metrics: { ...NO_METRICS, views: 2000, likes: 100, comments: 5, shares: 3 },
}

const RESPUESTAS = {
  '/business/video/list/': {
    code: 0,
    data: { videos: [{ item_id: POST.externalId, favorites: 12, reach: 1100, average_time_watched: 6 }], has_more: false },
  },
  '/business/get/': {
    code: 0,
    data: {
      followers_count: 1300,
      videos_count: 40,
      audience_countries: [{ country: 'CL', percentage: 0.8 }],
      metrics: [{ date: '2026-11-06', followers_count: 1290, profile_views: 30, video_views: 900 }],
    },
  },
  '/business/benchmark/': { code: 0, data: { average_follower_count: 1592, average_engagement_rate: 0.04 } },
}

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', 'secreto-de-prueba-de-al-menos-32-caracteres')
  memoria.clear()
  escritos.length = 0
  cuentaLeida.fila = null
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('las claves', () => {
  it('todas bajo el prefijo que desconectar, quitar y traspasar borran o pasan', () => {
    for (const cosa of ['audiencia', 'videos', 'rubro', 'comparacion', 'busquedas'] as const) {
      expect(claveDeNumeros('c1', cosa).startsWith(prefijoDeNumeros('c1'))).toBe(true)
    }
    expect(prefijoDeNumeros('c1')).toBe('tiktok_business:c1:')
  })
})

describe('sincronizarTiktokBusiness', () => {
  it('con la reja cerrada devuelve los posts tal cual y no pide nada a TikTok ni a la base', async () => {
    activar()
    const pedidos = stubTikTok(RESPUESTAS)
    const posts = [POST]
    expect(await sincronizarTiktokBusiness(CUENTA, posts, new Date(), '2026-11-08')).toBe(posts)
    expect(pedidos).toEqual([])
    expect(escritos).toEqual([])
  })

  it('abierta pero sin activar en esa cuenta, tampoco', async () => {
    abrir()
    const pedidos = stubTikTok(RESPUESTAS)
    expect(await sincronizarTiktokBusiness(CUENTA, [POST], new Date(), '2026-11-08')).toEqual([POST])
    expect(pedidos).toEqual([])
  })

  it('activada: completa los posts, guarda los días de la cuenta en su día, la audiencia, lo a fondo y la comparación', async () => {
    abrir()
    activar()
    stubTikTok(RESPUESTAS)
    const [post] = await sincronizarTiktokBusiness(CUENTA, [POST], new Date(), '2026-11-08')
    expect(post!.metrics).toMatchObject({ views: 2000, saves: 12, reach: 1100 })
    expect(escritos).toEqual([
      expect.objectContaining({ network: 'tiktok', accountId: CUENTA_ID, day: '2026-11-06', followers: 1290, profileViews: 30, views: 900 }),
      expect.objectContaining({ day: '2026-11-08', followers: 1300, videoCount: 40 }),
    ])
    expect(JSON.parse(memoria.get(`${DUENO}|${claveDeNumeros(CUENTA_ID, 'audiencia')}`)!).paises).toEqual([{ clave: 'CL', parte: 0.8 }])
    expect((await videosAFondo(DUENO, CUENTA_ID))[POST.externalId]?.vistoPromedio).toBe(6)
    expect(JSON.parse(memoria.get(`${DUENO}|${claveDeNumeros(CUENTA_ID, 'comparacion')}`)!)).toMatchObject({ rubro: 'PERSONAL_BLOG', seguidores: 1592 })
  })

  it('si TikTok falla en todo, devuelve los posts tal cual y no lanza', async () => {
    abrir()
    activar()
    stubTikTok({})
    expect(await sincronizarTiktokBusiness(CUENTA, [POST], new Date(), '2026-11-08')).toEqual([POST])
  })

  it('una cuenta que no es de TikTok ni se mira', async () => {
    abrir()
    activar()
    const pedidos = stubTikTok(RESPUESTAS)
    const ig = { ...CUENTA, network: 'instagram' } as SocialAccount
    expect(await sincronizarTiktokBusiness(ig, [POST], new Date(), '2026-11-08')).toEqual([POST])
    expect(pedidos).toEqual([])
  })
})

describe('lo que el panel lee', () => {
  it('con la reja cerrada, Los Números y la pieza no reciben nada aunque haya datos guardados', async () => {
    activar()
    memoria.set(`${DUENO}|${claveDeNumeros(CUENTA_ID, 'videos')}`, JSON.stringify({ leido: '', videos: { x: {} } }))
    expect(await numerosDeTiktok(DUENO, [{ id: CUENTA_ID, videos: [] }])).toEqual([])
    expect(await videosAFondo(DUENO, CUENTA_ID)).toEqual({})
    expect(await cuentasConBusquedas(DUENO, [CUENTA_ID])).toEqual([])
  })

  it('abierta: solo las cuentas activadas, con el rubro por defecto y la interacción de sus videos', async () => {
    abrir()
    activar()
    const numeros = await numerosDeTiktok(DUENO, [
      { id: CUENTA_ID, videos: [{ views: 1000, likes: 80, comments: 10, shares: 10 }] },
      { id: 'otra', videos: [] },
    ])
    expect(numeros).toEqual([{ accountId: CUENTA_ID, audiencia: null, comparacion: null, rubro: 'PERSONAL_BLOG', interaccion: 0.1 }])
  })

  it('el compositor ofrece las búsquedas solo a las cuentas con su permiso', async () => {
    abrir()
    activar('comment.list,comment.list.manage')
    expect(await cuentasConBusquedas(DUENO, [CUENTA_ID])).toEqual([])
    activar()
    expect(await cuentasConBusquedas(DUENO, [CUENTA_ID])).toEqual([CUENTA_ID])
  })

  it('interacción: null sin views', () => {
    expect(interaccionDe([{ views: 0, likes: 3, comments: null, shares: null }])).toBeNull()
  })
})

describe('busquedasDeLaCuenta', () => {
  it('con la reja cerrada no lee la cuenta ni pide nada', async () => {
    const pedidos = stubTikTok({})
    expect(await busquedasDeLaCuenta(DUENO, CUENTA_ID, null)).toHaveProperty('error')
    expect(pedidos).toEqual([])
  })

  it('una cuenta que no es del dueño (la base no la devuelve) da error, sin pedir nada', async () => {
    abrir()
    activar()
    const pedidos = stubTikTok({})
    expect(await busquedasDeLaCuenta(DUENO, CUENTA_ID, null)).toHaveProperty('error')
    expect(pedidos).toEqual([])
  })

  it('pide una vez y recuerda seis horas por consulta', async () => {
    abrir()
    activar()
    cuentaLeida.fila = { id: CUENTA_ID, network: 'tiktok', ownerId: DUENO, accessToken: 'cifrado', handle: 'Vicente' }
    const pedidos = stubTikTok({
      '/discovery/trending/search/': { code: 0, data: { search_keywords: ['asado'] } },
      '/discovery/trending/search/keyword/': { code: 0, data: { search_keywords: ['asado al palo'] } },
    })
    const ahora = new Date('2026-11-08T12:00:00Z')
    expect(await busquedasDeLaCuenta(DUENO, CUENTA_ID, null, ahora)).toEqual({ palabras: ['asado'] })
    expect(await busquedasDeLaCuenta(DUENO, CUENTA_ID, null, new Date(ahora.getTime() + 3600e3))).toEqual({ palabras: ['asado'] })
    expect(await busquedasDeLaCuenta(DUENO, CUENTA_ID, '  Asado ', ahora)).toEqual({ palabras: ['asado al palo'] })
    expect(pedidos).toEqual(['/discovery/trending/search/', '/discovery/trending/search/keyword/'])
    await busquedasDeLaCuenta(DUENO, CUENTA_ID, null, new Date(ahora.getTime() + 7 * 3600e3))
    expect(pedidos).toHaveLength(3)
  })

  it('una cuenta sin acceso avanzado: la frase, no un error rojo', async () => {
    abrir()
    activar()
    cuentaLeida.fila = { id: CUENTA_ID, network: 'tiktok', ownerId: DUENO, accessToken: 'cifrado', handle: 'Vicente' }
    stubTikTok({})
    expect(await busquedasDeLaCuenta(DUENO, CUENTA_ID, null)).toEqual({
      error: 'TikTok no dio lo que se busca para esta cuenta: es solo para cuentas con acceso avanzado o de empresa.',
    })
  })

  it('la llave de la consulta ignora mayúsculas y espacios', () => {
    expect(llaveDeConsulta('  Asado   al Palo ')).toBe('asado al palo')
    expect(llaveDeConsulta(null)).toBe('')
  })
})

describe('cambiarRubro', () => {
  it('rechaza un rubro que no existe y no guarda nada', async () => {
    abrir()
    activar()
    cuentaLeida.fila = { id: CUENTA_ID, network: 'tiktok', ownerId: DUENO, accessToken: 'cifrado', handle: 'Vicente' }
    expect((await cambiarRubro(DUENO, CUENTA_ID, 'INVENTADO')).ok).toBe(false)
    expect(memoria.has(`${DUENO}|${claveDeNumeros(CUENTA_ID, 'rubro')}`)).toBe(false)
  })

  it('guarda el rubro y pide la comparación nueva en el acto', async () => {
    abrir()
    activar()
    cuentaLeida.fila = { id: CUENTA_ID, network: 'tiktok', ownerId: DUENO, accessToken: 'cifrado', handle: 'Vicente' }
    const pedidos = stubTikTok(RESPUESTAS)
    expect(await cambiarRubro(DUENO, CUENTA_ID, 'FOOD_AND_BEVERAGE')).toEqual({ ok: true, texto: 'Listo: la comparación es ahora con ese rubro.' })
    expect(memoria.get(`${DUENO}|${claveDeNumeros(CUENTA_ID, 'rubro')}`)).toBe('FOOD_AND_BEVERAGE')
    expect(pedidos).toEqual(['/business/benchmark/'])
  })

  it('con la reja cerrada no hace nada', async () => {
    expect((await cambiarRubro(DUENO, CUENTA_ID, 'FOOD_AND_BEVERAGE')).ok).toBe(false)
  })
})
