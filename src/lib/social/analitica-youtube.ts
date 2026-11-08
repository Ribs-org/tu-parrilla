// La API de YouTube Analytics (v2, `reports.query` con `ids=channel==MINE`): lo que el dueño de un
// canal ve en YouTube Studio —tiempo visto, retención, de dónde llegó la gente, quién mira—, leído
// con su token y el permiso `yt-analytics.readonly`. Lo puro vive acá —el permiso, las consultas,
// cómo se lee una respuesta, los nombres en castellano, los pasos de borrado—, sin `server-only`,
// porque lo leen el conectar, los tests y los componentes de Los Números; lo que escribe en la
// base está en `analitica-youtube-sync.ts`.
//
// Cerrado salvo para quien diga `analiticaDeYoutubeAbiertaPara` (`redes-abiertas.ts`): el permiso
// espera la segunda verificación de Google (`docs/google-verificacion-guion.md`, «La analítica:
// segunda verificación»).
//
// Qué se puede guardar y cuánto, en `politica-youtube.ts`: estos datos son autorizados (§III.E.4.b)
// y se guardan mientras el dueño siga autorizando, pero se muestran tal como llegan, sin calcular
// nada con ellos (§III.E.4.h).

import { sql, type SQL } from 'drizzle-orm'

/** El permiso de solo lectura de YouTube Analytics. */
export const PERMISO_ANALITICA = 'https://www.googleapis.com/auth/yt-analytics.readonly'

const REPORTES = 'https://youtubeanalytics.googleapis.com/v2/reports'

/** La frase para quien tiene la analítica abierta y un canal conectado sin el permiso. */
export const RECONECTA_YOUTUBE = 'Reconecta YouTube para ver sus números completos.'

/**
 * Si los permisos que Google dijo conceder incluyen el de analítica. Google los separa con
 * espacios; la ventana deja destildar cada permiso, así que pedirlo no basta.
 */
export function tieneAnalitica(scopes: string | null | undefined): boolean {
  return (scopes ?? '').split(/[\s,]+/).includes(PERMISO_ANALITICA)
}

/** Los permisos de antes, sin el de analítica: lo que queda cuando YouTube dice que ya no está. */
export function sinAnalitica(scopes: string | null | undefined): string | null {
  const quedan = (scopes ?? '').split(/\s+/).filter((s) => s && s !== PERMISO_ANALITICA)
  return quedan.length > 0 ? quedan.join(' ') : null
}

export type Consulta = {
  startDate: string
  endDate: string
  metrics: readonly string[]
  dimensions?: string
  filters?: string
  sort?: string
  maxResults?: number
}

/**
 * Las métricas que una consulta puede perder si YouTube la rechaza: `engagedViews` llegó en 2025
 * y no está en todos los reportes. Con un 400, la consulta se repite sin ellas, y su columna queda
 * en null —no se sabe, que no es cero—.
 */
export const METRICAS_OPCIONALES: readonly string[] = ['engagedViews']

const METRICAS_BASE = [
  'views',
  'engagedViews',
  'estimatedMinutesWatched',
  'averageViewDuration',
  'likes',
  'comments',
  'shares',
  'subscribersGained',
  'subscribersLost',
] as const

/** Los totales del canal, un día por fila. */
export function consultaDeDias(desde: string, hasta: string): Consulta {
  return { startDate: desde, endDate: hasta, metrics: METRICAS_BASE, dimensions: 'day', sort: 'day' }
}

/** Hasta 200 videos por consulta: el tope de `maxResults` en el reporte por video. */
export const VIDEOS_POR_CONSULTA = 200

/**
 * Cada video desde `desde` —el día en que salió el más viejo del grupo— hasta hoy: para todos
 * ellos el rango cubre su vida entera, así que la fila es el total de YouTube desde que se publicó.
 */
export function consultaDeVideos(ids: readonly string[], desde: string, hasta: string): Consulta {
  return {
    startDate: desde,
    endDate: hasta,
    metrics: [...METRICAS_BASE, 'averageViewPercentage'],
    dimensions: 'video',
    filters: `video==${ids.join(',')}`,
    sort: '-views',
    maxResults: Math.min(ids.length, VIDEOS_POR_CONSULTA),
  }
}

/** `dia` («YYYY-MM-DD») menos `n` días del calendario. */
export function restarDias(dia: string, n: number): string {
  return new Date(Date.parse(`${dia}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10)
}

/**
 * Los videos de un canal en grupos de `VIDEOS_POR_CONSULTA`, del más nuevo al más viejo, cada uno
 * con el día en que salió su video más viejo: desde ahí pide la consulta, así que cubre la vida
 * entera de todos. Agrupar por edad es lo que evita que un video de hace años obligue a pedir años
 * para los de esta semana.
 */
export function gruposDeVideos(videos: ReadonlyArray<{ externalId: string; dia: string }>): Array<{ ids: string[]; desde: string }> {
  const ordenados = [...videos].sort((a, b) => b.dia.localeCompare(a.dia) || a.externalId.localeCompare(b.externalId))
  const grupos: Array<{ ids: string[]; desde: string }> = []
  for (let i = 0; i < ordenados.length; i += VIDEOS_POR_CONSULTA) {
    const grupo = ordenados.slice(i, i + VIDEOS_POR_CONSULTA)
    grupos.push({ ids: grupo.map((v) => v.externalId), desde: grupo[grupo.length - 1]!.dia })
  }
  return grupos
}

/** Los días que cubren los desgloses: los mismos 28 que YouTube Studio muestra de entrada. */
export const DIAS_DE_DESGLOSE = 28

export function consultaDeTrafico(desde: string, hasta: string): Consulta {
  return {
    startDate: desde,
    endDate: hasta,
    metrics: ['views', 'estimatedMinutesWatched'],
    dimensions: 'insightTrafficSourceType',
    sort: '-views',
  }
}

export function consultaDePaises(desde: string, hasta: string): Consulta {
  return { startDate: desde, endDate: hasta, metrics: ['views', 'estimatedMinutesWatched'], dimensions: 'country', sort: '-views' }
}

/** El reporte de edad y género solo da `viewerPercentage`. */
export function consultaDeAudiencia(desde: string, hasta: string): Consulta {
  return { startDate: desde, endDate: hasta, metrics: ['viewerPercentage'], dimensions: 'ageGroup,gender', sort: 'gender,ageGroup' }
}

/** Cuántos países se guardan: los que más vieron. */
export const PAISES_GUARDADOS = 10

export function urlDeConsulta(c: Consulta): string {
  const url = new URL(REPORTES)
  url.searchParams.set('ids', 'channel==MINE')
  url.searchParams.set('startDate', c.startDate)
  url.searchParams.set('endDate', c.endDate)
  url.searchParams.set('metrics', c.metrics.join(','))
  if (c.dimensions) url.searchParams.set('dimensions', c.dimensions)
  if (c.filters) url.searchParams.set('filters', c.filters)
  if (c.sort) url.searchParams.set('sort', c.sort)
  if (c.maxResults) url.searchParams.set('maxResults', String(c.maxResults))
  return url.toString()
}

export type Fila = Record<string, string | number | null>

/** Una respuesta de `reports.query` —`columnHeaders` y `rows`— como filas con nombre. */
export function filasDeReporte(json: unknown): Fila[] {
  const r = json as { columnHeaders?: Array<{ name?: string }>; rows?: unknown[][] }
  const nombres = (r.columnHeaders ?? []).map((h) => h.name ?? '')
  return (r.rows ?? []).map((fila) => Object.fromEntries(nombres.map((n, i) => [n, (fila[i] as string | number | null) ?? null])))
}

/**
 * Un error de la API con su estado. `sinPermiso` es el que dice que el dueño ya no autoriza: el
 * token no vale (401) o no trae el permiso (403 por permisos). Un 403 de cuota o de ritmo no lo es:
 * mañana vuelve a andar.
 */
export class ErrorDeAnalitica extends Error {
  constructor(
    readonly status: number,
    readonly sinPermiso: boolean,
    cuerpo: string,
  ) {
    super(`YouTube Analytics ${status}: ${cuerpo.slice(0, 200)}`)
  }
}

export function esSinPermiso(status: number, cuerpo: string): boolean {
  if (status === 401) return true
  return status === 403 && /insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient authentication scopes/i.test(cuerpo)
}

type Fetch = typeof fetch

async function pedir(token: string, c: Consulta, fetchImpl: Fetch): Promise<Response> {
  return fetchImpl(urlDeConsulta(c), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  })
}

/**
 * Corre una consulta. Si YouTube la rechaza por una combinación que no acepta (400) y llevaba una
 * métrica opcional, se repite una vez sin ella: lo demás llega igual.
 */
export async function consultar(token: string, c: Consulta, fetchImpl: Fetch = fetch): Promise<Fila[]> {
  let respuesta = await pedir(token, c, fetchImpl)
  if (respuesta.status === 400 && c.metrics.some((m) => METRICAS_OPCIONALES.includes(m))) {
    const sin = { ...c, metrics: c.metrics.filter((m) => !METRICAS_OPCIONALES.includes(m)) }
    respuesta = await pedir(token, sin, fetchImpl)
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.text()
    throw new ErrorDeAnalitica(respuesta.status, esSinPermiso(respuesta.status, cuerpo), cuerpo)
  }
  return filasDeReporte(await respuesta.json())
}

/** Un número de la respuesta, o null si no vino. Entero donde la columna es entera. */
function entero(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

function decimal(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export type ValoresDeAnalitica = {
  views: number | null
  engagedViews: number | null
  minutosVistos: number | null
  duracionMedia: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  suscriptoresGanados: number | null
  suscriptoresPerdidos: number | null
}

function valoresDe(f: Fila): ValoresDeAnalitica {
  return {
    views: entero(f.views),
    engagedViews: entero(f.engagedViews),
    minutosVistos: entero(f.estimatedMinutesWatched),
    duracionMedia: entero(f.averageViewDuration),
    likes: entero(f.likes),
    comments: entero(f.comments),
    shares: entero(f.shares),
    suscriptoresGanados: entero(f.subscribersGained),
    suscriptoresPerdidos: entero(f.subscribersLost),
  }
}

export type DiaDeAnalitica = ValoresDeAnalitica & { day: string }

export function diasDe(filas: Fila[]): DiaDeAnalitica[] {
  return filas.filter((f) => typeof f.day === 'string').map((f) => ({ day: f.day as string, ...valoresDe(f) }))
}

export type VideoDeAnalitica = ValoresDeAnalitica & { videoId: string; porcentajeVisto: number | null }

export function videosDe(filas: Fila[]): VideoDeAnalitica[] {
  return filas
    .filter((f) => typeof f.video === 'string')
    .map((f) => ({ videoId: f.video as string, ...valoresDe(f), porcentajeVisto: decimal(f.averageViewPercentage) }))
}

export type TipoDeDesglose = 'trafico' | 'pais' | 'audiencia'

export type Desglose = {
  tipo: TipoDeDesglose
  clave: string
  views: number | null
  minutosVistos: number | null
  porcentaje: number | null
}

export function traficoDe(filas: Fila[]): Desglose[] {
  return filas
    .filter((f) => typeof f.insightTrafficSourceType === 'string')
    .map((f) => ({
      tipo: 'trafico' as const,
      clave: f.insightTrafficSourceType as string,
      views: entero(f.views),
      minutosVistos: entero(f.estimatedMinutesWatched),
      porcentaje: null,
    }))
}

export function paisesDe(filas: Fila[]): Desglose[] {
  return filas
    .filter((f) => typeof f.country === 'string')
    .slice(0, PAISES_GUARDADOS)
    .map((f) => ({
      tipo: 'pais' as const,
      clave: f.country as string,
      views: entero(f.views),
      minutosVistos: entero(f.estimatedMinutesWatched),
      porcentaje: null,
    }))
}

export function audienciaDe(filas: Fila[]): Desglose[] {
  return filas
    .filter((f) => typeof f.ageGroup === 'string' && typeof f.gender === 'string')
    .map((f) => ({
      tipo: 'audiencia' as const,
      clave: `${f.ageGroup}|${f.gender}`,
      views: null,
      minutosVistos: null,
      porcentaje: decimal(f.viewerPercentage),
    }))
}

/** Los nombres de las fuentes de tráfico, como los dice YouTube Studio en castellano. */
const FUENTES: Record<string, string> = {
  SHORTS: 'Feed de Shorts',
  YT_SEARCH: 'Búsqueda de YouTube',
  SUBSCRIBER: 'Funciones de exploración (inicio y suscripciones)',
  RELATED_VIDEO: 'Videos sugeridos',
  EXT_URL: 'Fuentes externas (sitios y apps)',
  NO_LINK_OTHER: 'Directo o desconocido',
  YT_CHANNEL: 'Páginas de canal',
  YT_OTHER_PAGE: 'Otras funciones de YouTube',
  PLAYLIST: 'Listas de reproducción',
  NOTIFICATION: 'Notificaciones',
  HASHTAGS: 'Páginas de hashtags',
  END_SCREEN: 'Pantallas finales',
  ANNOTATION: 'Tarjetas y anotaciones',
  CAMPAIGN_CARD: 'Tarjetas de campaña',
  ADVERTISING: 'Publicidad de YouTube',
  PROMOTED: 'Promoción de YouTube',
  NO_LINK_EMBEDDED: 'Reproductor insertado',
  SOUND_PAGE: 'Páginas de sonidos',
  VIDEO_REMIXES: 'Remezclas',
  LIVE_REDIRECT: 'Redirección de un en vivo',
  PRODUCT_PAGE: 'Páginas de productos',
  WATCH_WITH: 'Ver con otros',
}

export function nombreDeFuente(clave: string): string {
  return FUENTES[clave] ?? clave
}

const EDADES: Record<string, string> = {
  'age13-17': '13–17',
  'age18-24': '18–24',
  'age25-34': '25–34',
  'age35-44': '35–44',
  'age45-54': '45–54',
  'age55-64': '55–64',
  'age65-': '65 o más',
}

const GENEROS: Record<string, string> = { female: 'Mujeres', male: 'Hombres', user_specified: 'Otro' }

/** «Mujeres · 25–34», de la clave «age25-34|female». */
export function nombreDeAudiencia(clave: string): string {
  const [edad = '', genero = ''] = clave.split('|')
  return `${GENEROS[genero] ?? genero} · ${EDADES[edad] ?? edad}`
}

/** Segundos como «1:05», o «1:02:05» si pasa de una hora. Es el formato de YouTube Studio. */
export function duracion(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return '—'
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/**
 * Los pasos que borran lo de analítica de un canal, puros para el test —mismo criterio que
 * `pasosParaBorrarYoutube`—. Los usa «Desconectar» y, cuando YouTube dice que el permiso ya no
 * está, la sincronización.
 */
export function pasosParaBorrarAnalitica(accountId: string): SQL[] {
  return [
    sql`delete from youtube_analitica_dias where account_id = ${accountId}`,
    sql`delete from youtube_analitica_desgloses where account_id = ${accountId}`,
    sql`delete from youtube_analitica_videos where post_id in (select id from social_posts where account_id = ${accountId})`,
  ]
}
