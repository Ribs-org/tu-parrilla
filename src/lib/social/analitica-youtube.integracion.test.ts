import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Lo de YouTube Analytics contra una Postgres de verdad: que se guarde mientras el dueño autoriza
// —sin el plazo de 30 días de lo leído con la API key—, que la retención lo borre cuando falta la
// prueba de autorización o el permiso, y que «Desconectar» lo borre en el acto.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { desconectarCuenta } = await import('./desconectar')
const { purgarYoutubeViejo } = await import('./retencion-youtube')
const { PERMISO_ANALITICA } = await import('./analitica-youtube')

const CON_ANALITICA = `https://www.googleapis.com/auth/youtube.upload ${PERMISO_ANALITICA}`
const HACE = (dias: number) => new Date(Date.now() - dias * 864e5)

async function persona(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  return u!.id
}

/** Un canal con un video y lo de analítica: un día viejo, un desglose y la fila del video. */
async function canal(ownerId: string, opciones: { scopes: string | null; verificadaEn: Date | null; videoCapturadoEn?: Date }) {
  const { socialAccounts, socialPosts, youtubeAnaliticaDias, youtubeAnaliticaDesgloses, youtubeAnaliticaVideos } = await esquema()
  const d = await db()
  const [cuenta] = await d
    .insert(socialAccounts)
    .values({
      ownerId,
      network: 'youtube',
      handle: 'Mi canal',
      externalId: crypto.randomUUID(),
      accessToken: 'acceso',
      refreshToken: 'refresco',
      scopes: opciones.scopes,
      analiticaVerificadaEn: opciones.verificadaEn,
    })
    .returning()
  const [post] = await d
    .insert(socialPosts)
    .values({
      ownerId,
      accountId: cuenta!.id,
      network: 'youtube',
      campaign: crypto.randomUUID(),
      externalId: crypto.randomUUID(),
      publishedAt: HACE(400),
    })
    .returning()
  // Un día de hace un año, capturado hace un año: con la API key ya se habría borrado.
  await d.insert(youtubeAnaliticaDias).values({ accountId: cuenta!.id, day: '2025-11-08', views: 900, capturedAt: HACE(365) })
  await d.insert(youtubeAnaliticaDesgloses).values({
    accountId: cuenta!.id,
    tipo: 'trafico',
    clave: 'SHORTS',
    views: 500,
    desde: '2026-10-12',
    hasta: '2026-11-08',
  })
  await d.insert(youtubeAnaliticaVideos).values({
    postId: post!.id,
    views: 1500,
    porcentajeVisto: 82.4,
    desde: '2025-10-04',
    hasta: '2026-11-08',
    capturedAt: opciones.videoCapturadoEn ?? new Date(),
  })
  return { cuenta: cuenta!, post: post! }
}

async function loQueQueda(accountId: string, postId: string) {
  const { socialAccounts, youtubeAnaliticaDias, youtubeAnaliticaDesgloses, youtubeAnaliticaVideos } = await esquema()
  const d = await db()
  const [cuenta] = await d.select().from(socialAccounts).where(eq(socialAccounts.id, accountId))
  return {
    cuenta,
    dias: (await d.select().from(youtubeAnaliticaDias).where(eq(youtubeAnaliticaDias.accountId, accountId))).length,
    desgloses: (await d.select().from(youtubeAnaliticaDesgloses).where(eq(youtubeAnaliticaDesgloses.accountId, accountId))).length,
    videos: (await d.select().from(youtubeAnaliticaVideos).where(eq(youtubeAnaliticaVideos.postId, postId))).length,
  }
}

describe.skipIf(!URL_PRUEBAS)('YouTube Analytics guardado, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_analitica_youtube')
  }, 60_000)

  it('con el permiso y una comprobación reciente, la historia se queda aunque tenga un año', async () => {
    const ana = await persona()
    const { cuenta, post } = await canal(ana, { scopes: CON_ANALITICA, verificadaEn: HACE(1) })

    await purgarYoutubeViejo()

    expect(await loQueQueda(cuenta.id, post.id)).toMatchObject({ dias: 1, desgloses: 1, videos: 1 })
  })

  it('sin una comprobación en 30 días, o sin el permiso, se borra todo lo de analítica', async () => {
    const ana = await persona()
    const vencida = await canal(ana, { scopes: CON_ANALITICA, verificadaEn: HACE(31) })
    const sinPermiso = await canal(ana, { scopes: 'https://www.googleapis.com/auth/youtube.upload', verificadaEn: HACE(1) })
    const nunca = await canal(ana, { scopes: CON_ANALITICA, verificadaEn: null })

    await purgarYoutubeViejo()

    for (const { cuenta, post } of [vencida, sinPermiso, nunca]) {
      expect(await loQueQueda(cuenta.id, post.id)).toMatchObject({ dias: 0, desgloses: 0, videos: 0 })
    }
  })

  it('la fila de un video que lleva 30 días sin refrescarse se borra, aunque el canal siga autorizando', async () => {
    const ana = await persona()
    const { cuenta, post } = await canal(ana, { scopes: CON_ANALITICA, verificadaEn: HACE(1), videoCapturadoEn: HACE(31) })

    await purgarYoutubeViejo()

    expect(await loQueQueda(cuenta.id, post.id)).toMatchObject({ dias: 1, desgloses: 1, videos: 0 })
  })

  it('la sincronización, con Google doblado, guarda lo que YouTube contesta y deja la marca', async () => {
    vi.stubEnv('AUTH_SECRET', 'secreto-de-prueba-secreto-de-prueba')
    vi.stubEnv('YOUTUBE_PERMISOS_ANALITICA', '1')
    const ana = await persona()
    vi.stubEnv('YOUTUBE_ANALITICA_ABIERTO_PARA', ana)
    const { socialAccounts, socialPosts, youtubeAnaliticaVideos } = await esquema()
    const { encryptToken } = await import('./crypto')
    const d = await db()
    const [cuenta] = await d
      .insert(socialAccounts)
      .values({
        ownerId: ana,
        network: 'youtube',
        handle: 'Mi canal',
        externalId: crypto.randomUUID(),
        accessToken: encryptToken('token-del-dueno'),
        refreshToken: encryptToken('refresco'),
        expiresAt: new Date(Date.now() + 3600_000),
        scopes: CON_ANALITICA,
      })
      .returning()
    const [post] = await d
      .insert(socialPosts)
      .values({ ownerId: ana, accountId: cuenta!.id, network: 'youtube', campaign: crypto.randomUUID(), externalId: 'vid1', publishedAt: HACE(3) })
      .returning()

    const pedidas: string[] = []
    vi.stubGlobal('fetch', async (entrada: string, init?: RequestInit) => {
      const url = new URL(entrada)
      pedidas.push(url.searchParams.get('dimensions') ?? '')
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-del-dueno')
      const tabla = (columnas: string[], filas: unknown[][]) =>
        Response.json({ columnHeaders: columnas.map((name) => ({ name })), rows: filas })
      switch (url.searchParams.get('dimensions')) {
        case 'day':
          return tabla(['day', 'views', 'estimatedMinutesWatched'], [['2026-11-06', 40, 12], ['2026-11-07', 55, 18]])
        case 'insightTrafficSourceType':
          return tabla(['insightTrafficSourceType', 'views', 'estimatedMinutesWatched'], [['SHORTS', 80, 25]])
        case 'country':
          return tabla(['country', 'views', 'estimatedMinutesWatched'], [['CL', 70, 20]])
        case 'ageGroup,gender':
          return tabla(['ageGroup', 'gender', 'viewerPercentage'], [['age25-34', 'male', 60.5]])
        case 'video':
          expect(url.searchParams.get('filters')).toBe('video==vid1')
          return tabla(['video', 'views', 'averageViewPercentage', 'averageViewDuration'], [['vid1', 95, 81.2, 24]])
        default:
          return new Response('no esperada', { status: 500 })
      }
    })
    try {
      const { sincronizarAnaliticaDeYoutube } = await import('./analitica-youtube-sync')
      const reporte = await sincronizarAnaliticaDeYoutube(ana)
      expect(reporte).toEqual([{ canal: 'Mi canal', ok: true, dias: 2, videos: 1 }])
      expect(pedidas).toEqual(['day', 'insightTrafficSourceType', 'country', 'ageGroup,gender', 'video'])

      const queda = await loQueQueda(cuenta!.id, post!.id)
      expect(queda).toMatchObject({ dias: 2, desgloses: 3, videos: 1 })
      expect(queda.cuenta?.analiticaVerificadaEn).toBeInstanceOf(Date)
      const [video] = await d.select().from(youtubeAnaliticaVideos).where(eq(youtubeAnaliticaVideos.postId, post!.id))
      expect(video).toMatchObject({ views: 95, porcentajeVisto: 81.2, duracionMedia: 24, engagedViews: null })

      // Una segunda vuelta reescribe, no duplica.
      await sincronizarAnaliticaDeYoutube(ana)
      expect(await loQueQueda(cuenta!.id, post!.id)).toMatchObject({ dias: 2, desgloses: 3, videos: 1 })

      // Google dice que el permiso ya no está: se borra en el acto y el canal deja de tenerlo.
      vi.stubGlobal('fetch', async () => new Response('{"error":{"errors":[{"reason":"insufficientPermissions"}]}}', { status: 403 }))
      const [sinPermiso] = await sincronizarAnaliticaDeYoutube(ana)
      expect(sinPermiso).toMatchObject({ ok: false })
      const despues = await loQueQueda(cuenta!.id, post!.id)
      expect(despues).toMatchObject({ dias: 0, desgloses: 0, videos: 0 })
      expect(despues.cuenta).toMatchObject({ scopes: 'https://www.googleapis.com/auth/youtube.upload', analiticaVerificadaEn: null })
    } finally {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
    }
  })

  it('con la analítica cerrada para el dueño, la sincronización no le pregunta nada a Google', async () => {
    const ana = await persona()
    await canal(ana, { scopes: CON_ANALITICA, verificadaEn: HACE(1) })
    const fetchFalso = vi.fn(async () => new Response('no', { status: 500 }))
    vi.stubGlobal('fetch', fetchFalso)
    try {
      const { sincronizarAnaliticaDeYoutube } = await import('./analitica-youtube-sync')
      expect(await sincronizarAnaliticaDeYoutube(ana)).toEqual([])
      expect(fetchFalso).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('«Desconectar» lo borra en el acto, con los permisos y la comprobación', async () => {
    const ana = await persona()
    const { cuenta, post } = await canal(ana, { scopes: CON_ANALITICA, verificadaEn: HACE(1) })

    expect(await desconectarCuenta(ana, cuenta.id)).toBe(true)

    const queda = await loQueQueda(cuenta.id, post.id)
    expect(queda).toMatchObject({ dias: 0, desgloses: 0, videos: 0 })
    expect(queda.cuenta).toMatchObject({ scopes: null, analiticaVerificadaEn: null, refreshToken: null })
  })
})
