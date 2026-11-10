import type { SocialAccount } from '@/db'
import { env } from '../env'
import { normalizeThreadsAccount } from './account-metrics'
import {
  NO_ACCOUNT_METRICS,
  NO_METRICS,
  type AccountMetricValues,
  type Connector,
  type FetchedBatch,
  type FetchedPost,
  type OpcionesDeListado,
  type PostMetricValues,
} from './connector'
import { dentroDeLoPedido, laMasVieja, minimoDelListado, sigueListando } from './lectura'
import { ensureThreadsCredential } from './publish/threads'

const GRAPH = 'https://graph.threads.net/v1.0'
const PAGE_SIZE = 50
// Mismo resguardo que Instagram: un cursor que no se acaba no puede dejar el listado girando.
const MAX_PAGES = 50
const INSIGHTS_CHUNK_SIZE = 5

/**
 * Los permisos que Threads pide además de publicar: `threads_manage_insights` (los números de
 * Los Números) y `threads_read_replies` y `threads_manage_replies` (las respuestas en La Mesa).
 * Solo con `THREADS_PERMISOS_EXTRA=1`, por dos razones. La ventana de Threads rechaza el pedido
 * entero si nombra un permiso que el caso de uso de la app no tiene activado, así que se pide
 * después de activarlos en el panel de Meta. Y sin ellos cada lectura falla: el conector y el
 * comentarista se quedan quietos, como con una cuenta desconectada, en vez de pintar de rojo la
 * tarjeta todas las mañanas. Publicar no depende de esto.
 */
export const SCOPES_THREADS_EXTRA = 'threads_manage_insights,threads_read_replies,threads_manage_replies'

export function permisosExtraDeThreads(): boolean {
  return env('THREADS_PERMISOS_EXTRA') === '1'
}

export type ThreadsMedia = {
  id: string
  media_type?: string
  media_url?: string
  permalink?: string
  text?: string | null
  timestamp?: string
  thumbnail_url?: string
  is_quote_post?: boolean
}

export type ThreadsInsights = {
  data?: Array<{ name?: string; values?: Array<{ value?: unknown }>; total_value?: { value?: unknown } }>
}

type Paging = { next?: string; cursors?: { after?: string } }

/** El repost de una publicación ajena: aparece en el listado, pero no es de la cuenta. */
const REPOST = 'REPOST_FACADE'

function mediaType(media: ThreadsMedia): string {
  if (media.media_type === 'CAROUSEL_ALBUM') return 'carousel'
  if (media.media_type === 'VIDEO') return 'video'
  if (media.media_type === 'IMAGE') return 'image'
  if (media.media_type === 'AUDIO') return 'audio'
  return 'text'
}

function numero(entry: NonNullable<ThreadsInsights['data']>[number] | undefined): number | null {
  const value = entry?.total_value?.value ?? entry?.values?.[0]?.value
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Los números de una publicación de Threads en las columnas de siempre. Las respuestas son los
 * comentarios. Los reposts y las citas van juntos en compartidos: son las dos maneras de
 * llevarse el post a otro perfil, y Threads no tiene otro «compartir» que entregue (el suyo
 * está «en desarrollo» en la documentación). Guardados y alcance, Threads no los da.
 */
export function threadsMetrics(insights: ThreadsInsights): PostMetricValues {
  const de = (name: string) => numero((insights.data ?? []).find((e) => e.name === name))
  const reposts = de('reposts')
  const quotes = de('quotes')
  return {
    ...NO_METRICS,
    views: de('views'),
    likes: de('likes'),
    comments: de('replies'),
    shares: reposts === null && quotes === null ? null : (reposts ?? 0) + (quotes ?? 0),
  }
}

export function normalizeThreadsMedia(media: ThreadsMedia, insights: ThreadsInsights): FetchedPost {
  return {
    externalId: media.id,
    permalink: media.permalink ?? null,
    caption: media.text ?? null,
    // Threads da miniatura solo a los videos; la foto es su propia miniatura, y el texto no tiene.
    thumbnailUrl: media.thumbnail_url ?? (media.media_type === 'IMAGE' ? (media.media_url ?? null) : null),
    mediaType: mediaType(media),
    publishedAt: new Date(media.timestamp ?? 0),
    metrics: threadsMetrics(insights),
  }
}

export class ThreadsHttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: number,
  ) {
    super(message)
  }
}

async function getJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    let code: number | undefined
    try {
      const parsed = JSON.parse(body) as { error?: { code?: unknown } }
      code = typeof parsed.error?.code === 'number' ? parsed.error.code : undefined
    } catch {
      // Un cuerpo que no es JSON sigue siendo un fallo, solo que sin código.
    }
    throw new ThreadsHttpError(response.status, `Threads ${response.status}: ${body.slice(0, 200)}`, code)
  }
  return response.json()
}

/**
 * Si Threads dice que esta publicación no tiene números, o ya no está: un 404, o el código 100
 * («parámetro inválido», el mismo de un id que ya no existe). Es un hecho de la publicación y
 * no de la corrida. Lo demás —token vencido, permiso que falta, límite de llamadas— sube: si se
 * tragara, se escribirían nulls como si fueran datos en todas las que siguen.
 */
export function isThreadsMediaSinNumeros(error: unknown): boolean {
  return error instanceof ThreadsHttpError && (error.status === 404 || error.code === 100)
}

const INSIGHT_METRICS = 'views,likes,replies,reposts,quotes'

async function insightsOf(id: string, token: string): Promise<ThreadsInsights> {
  return (await getJson(`${GRAPH}/${id}/insights?metric=${INSIGHT_METRICS}&access_token=${token}`)) as ThreadsInsights
}

/**
 * La página siguiente: la url de `paging.next` si Threads la manda, y si no, la misma consulta
 * con el cursor `after`. Una página vacía corta: un cursor que viene en la última página no
 * puede seguir pidiendo para siempre.
 */
export function paginaSiguiente(actual: string, paging: Paging | undefined, vacia: boolean): string {
  if (vacia) return ''
  if (paging?.next) return paging.next
  const after = paging?.cursors?.after
  if (!after) return ''
  const url = new URL(actual)
  url.searchParams.set('after', after)
  return url.toString()
}

export const threadsConnector: Connector = {
  network: 'threads',

  // La misma renovación que usa el publicador. Sin los permisos extra no hay qué leer.
  async ensureCredential(account: SocialAccount): Promise<string | null> {
    if (!permisosExtraDeThreads()) return null
    return ensureThreadsCredential(account)
  },

  async fetchPosts(account: SocialAccount, token: string | null, opciones?: OpcionesDeListado): Promise<FetchedBatch> {
    const userId = account.externalId
    if (!token || !userId) return { posts: [], windowWasCapped: false }

    const fields = 'id,media_type,media_url,permalink,text,timestamp,thumbnail_url,is_quote_post'
    const media: ThreadsMedia[] = []
    let next = `${GRAPH}/${userId}/threads?fields=${fields}&limit=${PAGE_SIZE}&access_token=${token}`
    let paginas = 0
    let masVieja: Date | null = null

    while (next && paginas < MAX_PAGES && sigueListando(media.length, masVieja, opciones?.desde, minimoDelListado(opciones))) {
      const page = (await getJson(next)) as { data?: ThreadsMedia[]; paging?: Paging }
      paginas++
      const data = page.data ?? []
      for (const item of data) {
        masVieja = laMasVieja(masVieja, new Date(item.timestamp ?? 0))
        if (item.media_type !== REPOST) media.push(item)
      }
      next = paginaSiguiente(next, page.paging, data.length === 0)
    }

    const aLeer = dentroDeLoPedido(media, (item) => new Date(item.timestamp ?? 0), opciones)
    const posts: FetchedPost[] = []
    // De a pocas a la vez, como Instagram: cientos de llamadas juntas arriesgan el límite de la red.
    for (let i = 0; i < aLeer.length; i += INSIGHTS_CHUNK_SIZE) {
      const chunk = aLeer.slice(i, i + INSIGHTS_CHUNK_SIZE)
      posts.push(
        ...(await Promise.all(
          chunk.map(async (item) => {
            try {
              return normalizeThreadsMedia(item, await insightsOf(item.id, token))
            } catch (error) {
              if (!isThreadsMediaSinNumeros(error)) throw error
              console.error(`[sync] threads ${item.id} sin números:`, String(error).slice(0, 300))
              return normalizeThreadsMedia(item, {})
            }
          }),
        )),
      )
    }

    return { posts, windowWasCapped: next !== '' }
  },

  async fetchMetricsById(_account: SocialAccount, token: string | null, externalIds: string[]) {
    const metricas = new Map<string, PostMetricValues>()
    if (!token) return metricas
    for (let i = 0; i < externalIds.length; i += INSIGHTS_CHUNK_SIZE) {
      await Promise.all(
        externalIds.slice(i, i + INSIGHTS_CHUNK_SIZE).map(async (id) => {
          try {
            metricas.set(id, threadsMetrics(await insightsOf(id, token)))
          } catch (error) {
            // Lo que no contesta falta en el mapa y nada más: no se archiva (`Connector`).
            if (!isThreadsMediaSinNumeros(error)) throw error
          }
        }),
      )
    }
    return metricas
  },

  /**
   * Dos llamadas porque son dos formas: `views` es una serie por día y `followers_count` un
   * total que no acepta rango. Cada una va por su lado: que falle una no borra la otra.
   */
  async fetchAccountMetrics(account: SocialAccount, token: string): Promise<AccountMetricValues> {
    const id = account.externalId
    if (!id) return NO_ACCOUNT_METRICS
    const [views, followers] = await Promise.all([
      getJson(`${GRAPH}/${id}/threads_insights?metric=views&access_token=${token}`).catch(() => ({})),
      getJson(`${GRAPH}/${id}/threads_insights?metric=followers_count&access_token=${token}`).catch(() => ({})),
    ])
    const data = [...((views as ThreadsInsights).data ?? []), ...((followers as ThreadsInsights).data ?? [])]
    return normalizeThreadsAccount({ data } as never)
  },
}
