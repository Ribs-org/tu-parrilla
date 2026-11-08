import type { FetchedPost, PostMetricValues } from './connector'
import {
  API_BUSINESS,
  PERMISOS_DE_NUMEROS,
  pedirBusiness,
  tienePermiso,
  type CredencialDeComentarios,
} from './tiktok-business'

/**
 * Los números de TikTok por la app de TikTok for Business (`tiktok-business.ts`), con la misma
 * credencial que los comentarios. La app de siempre (Display) da de cada video solo views, likes,
 * comentarios y compartidos, y de la cuenta nada; esta da además:
 *
 * - **La cuenta** (`/business/get/`): seguidores, «me gusta» y videos de por vida, y por día las
 *   visitas al perfil, las views, el alcance y la gente que interactuó, más la audiencia (países,
 *   género y edad). Lo diario llega con 24 a 48 horas de atraso y cubre hasta 60 días.
 * - **Cada video** (`/business/video/list/`): sus números de siempre más el alcance, los
 *   guardados, el tiempo visto, cuántos lo vieron completo, los seguidores que trajo y de dónde
 *   llegó la gente. Son totales de toda la vida del video.
 * - **La comparación** (`/business/benchmark/`): el promedio de las cuentas de empresa verificadas
 *   de un rubro.
 * - **Lo que se busca en TikTok** (`/discovery/trending/search/` y `.../keyword/`): 20 búsquedas
 *   en tendencia, o recomendadas para una consulta.
 *
 * Varios de esos números son solo para cuentas «con acceso avanzado» o de empresa verificadas, y
 * la audiencia pide al menos 100 seguidores: a una cuenta personal le llegan vacíos o no le
 * llegan, y aquí un dato ausente es `null`, nunca cero. Lo que dice la documentación, con sus
 * direcciones, está en `docs/levantamiento-terceros.md`, §3.5.
 *
 * Este archivo pide y traduce; guardar es de `tiktok-numeros-guardar.ts`.
 */

/** Un número de TikTok, o null si no vino o no es un número: ausente y cero son respuestas distintas. */
function numero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Un entero para las columnas de la base, que son `integer`. */
function entero(valor: unknown): number | null {
  const n = numero(valor)
  return n === null ? null : Math.round(n)
}

/** Una parte de algo, de 0 a 1. TikTok da casi todo así, pero algún ejemplo viene en por ciento. */
export type Parte = { clave: string; parte: number }

/**
 * Una distribución de TikTok (`[{country, percentage}]`, `[{gender, percentage}]`…) como partes de 0
 * a 1, de mayor a menor. Si alguna pasa de 1 es que vino en por ciento, y se divide toda.
 */
export function partesDe(lista: unknown, campo: string): Parte[] {
  if (!Array.isArray(lista)) return []
  const partes = lista
    .map((item) => {
      const fila = (item ?? {}) as Record<string, unknown>
      const clave = typeof fila[campo] === 'string' ? (fila[campo] as string).trim() : ''
      const parte = numero(fila.percentage)
      return clave && parte !== null && parte >= 0 ? { clave, parte } : null
    })
    .filter((p): p is Parte => p !== null)
  const enPorCiento = partes.some((p) => p.parte > 1)
  return partes
    .map((p) => (enPorCiento ? { ...p, parte: p.parte / 100 } : p))
    .sort((a, b) => b.parte - a.parte)
}

/* ---------------------------------------------------------------- la cuenta -- */

/** Lo que pide `/business/get/` con `user.info.stats`: de por vida, al instante. */
const CAMPOS_DE_POR_VIDA = ['followers_count', 'videos_count', 'total_likes'] as const

/** Lo diario y la audiencia, con `user.insights`, que cualquier cuenta entrega. */
const CAMPOS_DEL_DIA = [
  'followers_count',
  'profile_views',
  'video_views',
  'likes',
  'comments',
  'shares',
  'audience_countries',
  'audience_genders',
  'audience_ages',
] as const

/** Lo diario que es solo para cuentas con acceso avanzado o de empresa. */
const CAMPOS_AVANZADOS = ['unique_video_views', 'engaged_audience', 'daily_total_followers'] as const

/** Un día de la cuenta, en UTC, como lo da TikTok. */
export type DiaDeTiktok = {
  dia: string
  followers: number | null
  profileViews: number | null
  views: number | null
  reach: number | null
  accountsEngaged: number | null
  likes: number | null
  comentarios: number | null
  compartidos: number | null
  seguidoresNetos: number | null
}

/** La audiencia y lo de por vida: lo que Los Números muestra de la cuenta, además de las tarjetas. */
export type AudienciaDeTiktok = {
  /** ISO: cuándo se leyó. */
  leido: string
  followers: number | null
  videos: number | null
  totalLikes: number | null
  /** Seguidores ganados en los últimos 30 días leídos; null si TikTok no dio con qué contarlos. */
  ganados30: number | null
  paises: Parte[]
  generos: Parte[]
  edades: Parte[]
}

export type CuentaDeTiktok = { dias: DiaDeTiktok[]; audiencia: AudienciaDeTiktok }

type DiaCrudo = Record<string, unknown> & { date?: string }
type CuentaCruda = Record<string, unknown> & { metrics?: DiaCrudo[] }

/**
 * Los seguidores ganados en el tramo: la suma del neto diario si TikTok lo dio (solo cuentas con
 * acceso avanzado), y si no, el último total diario menos el primero.
 */
function ganadosEn(dias: DiaDeTiktok[]): number | null {
  const netos = dias.map((d) => d.seguidoresNetos).filter((n): n is number => n !== null)
  if (netos.length > 0) return netos.reduce((a, b) => a + b, 0)
  const conTotal = dias.filter((d) => d.followers !== null)
  if (conTotal.length < 2) return null
  return conTotal.at(-1)!.followers! - conTotal[0]!.followers!
}

export function normalizarCuenta(data: CuentaCruda, ahora: Date = new Date()): CuentaDeTiktok {
  const dias = (Array.isArray(data.metrics) ? data.metrics : [])
    .filter((d): d is DiaCrudo => typeof d?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
    .map((d) => ({
      dia: d.date!,
      followers: entero(d.followers_count),
      profileViews: entero(d.profile_views),
      views: entero(d.video_views),
      reach: entero(d.unique_video_views),
      accountsEngaged: entero(d.engaged_audience),
      likes: entero(d.likes),
      comentarios: entero(d.comments),
      compartidos: entero(d.shares),
      seguidoresNetos: entero(d.daily_total_followers),
    }))
    .sort((a, b) => a.dia.localeCompare(b.dia))
  return {
    dias,
    audiencia: {
      leido: ahora.toISOString(),
      followers: entero(data.followers_count),
      videos: entero(data.videos_count),
      totalLikes: entero(data.total_likes),
      ganados30: ganadosEn(dias),
      paises: partesDe(data.audience_countries, 'country').slice(0, 5),
      generos: partesDe(data.audience_genders, 'gender'),
      edades: partesDe(data.audience_ages, 'age').sort((a, b) => a.clave.localeCompare(b.clave)),
    },
  }
}

function fechaUtc(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Qué pedirle a `/business/get/` según los permisos del token; vacío si no hay ninguno de números. */
export function camposDeCuenta(scope: string, avanzados: boolean): string[] {
  const campos = new Set<string>()
  if (tienePermiso(scope, PERMISOS_DE_NUMEROS.estadisticas)) for (const c of CAMPOS_DE_POR_VIDA) campos.add(c)
  if (tienePermiso(scope, PERMISOS_DE_NUMEROS.cuenta)) {
    for (const c of CAMPOS_DEL_DIA) campos.add(c)
    if (avanzados) for (const c of CAMPOS_AVANZADOS) campos.add(c)
  }
  return [...campos]
}

async function pedirCuenta(credencial: CredencialDeComentarios, campos: string[], ahora: Date): Promise<CuentaCruda> {
  const url = new URL(`${API_BUSINESS}/business/get/`)
  url.searchParams.set('business_id', credencial.openId)
  url.searchParams.set('fields', JSON.stringify(campos))
  // Lo más que deja mirar atrás son 60 días; 30 alcanzan para lo ganado en el mes.
  url.searchParams.set('start_date', fechaUtc(new Date(ahora.getTime() - 30 * 864e5)))
  url.searchParams.set('end_date', fechaUtc(new Date(ahora.getTime() - 864e5)))
  return pedirBusiness<CuentaCruda>(url.toString(), { headers: { 'Access-Token': credencial.accessToken } })
}

/**
 * La cuenta, sus últimos 30 días y su audiencia. Null si el token no trae ningún permiso de
 * números. Si TikTok rechaza el pedido con los campos de cuentas avanzadas, se repite sin ellos:
 * una cuenta personal no tiene por qué perder lo demás por esos.
 */
export async function leerCuenta(credencial: CredencialDeComentarios, ahora: Date = new Date()): Promise<CuentaDeTiktok | null> {
  const completos = camposDeCuenta(credencial.scope, true)
  if (completos.length === 0) return null
  let data: CuentaCruda
  try {
    data = await pedirCuenta(credencial, completos, ahora)
  } catch (error) {
    const basicos = camposDeCuenta(credencial.scope, false)
    if (basicos.length === completos.length) throw error
    data = await pedirCuenta(credencial, basicos, ahora)
  }
  return normalizarCuenta(data, ahora)
}

/* ----------------------------------------------------------------- videos -- */

/** Lo que `/business/video/list/` da con `video.list`. */
const CAMPOS_DE_VIDEO = [
  'item_id',
  'create_time',
  'share_url',
  'video_duration',
  'video_views',
  'likes',
  'comments',
  'shares',
  'favorites',
  'reach',
] as const

/** Lo que agrega `video.insights`. */
const CAMPOS_A_FONDO = [
  'average_time_watched',
  'total_time_watched',
  'full_video_watched_rate',
  'new_followers',
  'profile_views',
  'impression_sources',
  'audience_types',
] as const

/** Las fuentes de tráfico, como las nombra TikTok Studio en español. */
export const FUENTES: Record<string, string> = {
  'For You': 'Para ti',
  Follow: 'Siguiendo',
  Sound: 'Sonidos',
  'Personal Profile': 'Tu perfil',
  Search: 'Búsqueda',
  'Direct Message': 'Mensajes',
  Others: 'Otros',
}

/** Lo de un video que no cabe en las columnas de siempre: se muestra en la pieza. */
export type VideoAFondo = {
  alcance: number | null
  guardados: number | null
  /** Segundos. */
  duracion: number | null
  /** Segundos que cada persona lo miró, en promedio. */
  vistoPromedio: number | null
  /** De 0 a 1: cuántos lo vieron hasta el final. */
  vieronCompleto: number | null
  seguidoresNuevos: number | null
  visitasAlPerfil: number | null
  /** De dónde llegó la gente, con la clave de TikTok (`FUENTES` la traduce). */
  fuentes: Parte[]
  /** De 0 a 1: cuánta gente no lo seguía. */
  noSeguidores: number | null
  /** De 0 a 1: cuánta gente lo veía por primera vez. */
  nuevos: number | null
}

export type VideoDeBusiness = {
  /** El id del video según TikTok for Business (`item_id`). */
  itemId: string
  /** El número de la dirección del video (`share_url`), para cruzar si el id no calza. */
  idDelEnlace: string | null
  publicado: Date | null
  metrics: PostMetricValues
  aFondo: VideoAFondo
}

type VideoCrudo = Record<string, unknown>

/** El número que va después de `/video/` o `/photo/` en la dirección del video. */
export function idDeEnlace(enlace: unknown): string | null {
  if (typeof enlace !== 'string') return null
  return /\/(?:video|photo)\/(\d+)/.exec(enlace)?.[1] ?? null
}

function parteDeTipo(tipos: Parte[], tipo: string): number | null {
  return tipos.find((t) => t.clave === tipo)?.parte ?? null
}

export function normalizarVideoBusiness(v: VideoCrudo): VideoDeBusiness | null {
  const itemId = typeof v.item_id === 'string' ? v.item_id : typeof v.item_id === 'number' ? String(v.item_id) : ''
  if (!itemId) return null
  const segundos = numero(v.create_time)
  const vieronCompleto = numero(v.full_video_watched_rate)
  const tipos = partesDe(v.audience_types, 'type')
  return {
    itemId,
    idDelEnlace: idDeEnlace(v.share_url),
    publicado: segundos === null ? null : new Date(segundos * 1000),
    metrics: {
      views: entero(v.video_views),
      likes: entero(v.likes),
      comments: entero(v.comments),
      shares: entero(v.shares),
      saves: entero(v.favorites),
      reach: entero(v.reach),
    },
    aFondo: {
      alcance: entero(v.reach),
      guardados: entero(v.favorites),
      duracion: numero(v.video_duration),
      vistoPromedio: numero(v.average_time_watched),
      vieronCompleto: vieronCompleto === null ? null : vieronCompleto > 1 ? vieronCompleto / 100 : vieronCompleto,
      seguidoresNuevos: entero(v.new_followers),
      visitasAlPerfil: entero(v.profile_views),
      fuentes: partesDe(v.impression_sources, 'impression_source'),
      noSeguidores: parteDeTipo(tipos, 'NON_FOLLOWER_PERCENT'),
      nuevos: parteDeTipo(tipos, 'NEW_VIEWER'),
    },
  }
}

/** Lo más que da TikTok por página. */
const VIDEOS_POR_PAGINA = 20
/** Un tope, como en `tiktok.ts`: una página puede volver vacía con `has_more` en true. */
const MAX_PAGINAS = 25

async function pedirVideos(
  credencial: CredencialDeComentarios,
  campos: readonly string[],
  desde: Date,
): Promise<VideoDeBusiness[]> {
  const videos: VideoDeBusiness[] = []
  let cursor: number | undefined
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const url = new URL(`${API_BUSINESS}/business/video/list/`)
    url.searchParams.set('business_id', credencial.openId)
    url.searchParams.set('fields', JSON.stringify(campos))
    url.searchParams.set('max_count', String(VIDEOS_POR_PAGINA))
    if (cursor !== undefined) url.searchParams.set('cursor', String(cursor))
    const data = await pedirBusiness<{ videos?: VideoCrudo[]; cursor?: number; has_more?: boolean }>(url.toString(), {
      headers: { 'Access-Token': credencial.accessToken },
    })
    for (const crudo of data.videos ?? []) {
      const video = normalizarVideoBusiness(crudo)
      if (video) videos.push(video)
    }
    const masVieja = videos.reduce<Date | null>(
      (min, v) => (v.publicado && (!min || v.publicado < min) ? v.publicado : min),
      null,
    )
    // Como el listado de siempre (`lectura.ts`): al menos una página, y todo lo publicado desde `desde`.
    const yaLlego = videos.length >= VIDEOS_POR_PAGINA && masVieja !== null && masVieja < desde
    if (!data.has_more || data.cursor === undefined || yaLlego) break
    cursor = data.cursor
  }
  return videos
}

/**
 * Los videos de la cuenta publicados desde `desde` (y al menos los 20 más nuevos), con sus números.
 * Vacío si el token no trae `video.list`. Si TikTok rechaza los campos de `video.insights`, se
 * repite sin ellos.
 */
export async function leerVideos(credencial: CredencialDeComentarios, desde: Date): Promise<VideoDeBusiness[]> {
  if (!tienePermiso(credencial.scope, PERMISOS_DE_NUMEROS.videos)) return []
  if (!tienePermiso(credencial.scope, PERMISOS_DE_NUMEROS.videosAFondo)) return pedirVideos(credencial, CAMPOS_DE_VIDEO, desde)
  try {
    return await pedirVideos(credencial, [...CAMPOS_DE_VIDEO, ...CAMPOS_A_FONDO], desde)
  } catch (error) {
    console.error('[tiktok-business] videos a fondo:', String(error).slice(0, 300))
    return pedirVideos(credencial, CAMPOS_DE_VIDEO, desde)
  }
}

/** Cuántos videos calzaron con los de la app de siempre, y cómo: la pregunta abierta de los ids. */
export type Calce = { porId: number; porEnlace: number; sinCalzar: number }

/**
 * Los posts de la app de siempre completados con los números de TikTok for Business: lo que la app
 * de siempre no da —los guardados y el alcance— sale de Business, y lo que sí da se queda. Las
 * views, los likes, los comentarios y los compartidos de Business llegan con 24 a 48 horas de
 * atraso, y pisar con ellos los de la app de siempre, que son al instante, haría que un video
 * «perdiera» views de un día para otro en la serie. El video se busca primero por su id —los
 * dos deberían ser el número de la dirección del video— y, si no calza, por el número de su
 * enlace. `aFondo` sale con el id de la fila (`externalId`), que es como se guarda.
 */
export function fusionarConBusiness(
  posts: FetchedPost[],
  videos: VideoDeBusiness[],
): { posts: FetchedPost[]; aFondo: Map<string, VideoAFondo>; calce: Calce } {
  const porItem = new Map(videos.map((v) => [v.itemId, v]))
  const porEnlace = new Map(videos.filter((v) => v.idDelEnlace).map((v) => [v.idDelEnlace!, v]))
  const calce: Calce = { porId: 0, porEnlace: 0, sinCalzar: 0 }
  const aFondo = new Map<string, VideoAFondo>()
  const fusionados = posts.map((post) => {
    let video = porItem.get(post.externalId)
    if (video) calce.porId++
    else {
      video = porEnlace.get(post.externalId) ?? (idDeEnlace(post.permalink) ? porItem.get(idDeEnlace(post.permalink)!) : undefined)
      if (video) calce.porEnlace++
      else calce.sinCalzar++
    }
    if (!video) return post
    aFondo.set(post.externalId, video.aFondo)
    const m = video.metrics
    const d = post.metrics
    return {
      ...post,
      metrics: {
        views: d.views ?? m.views,
        likes: d.likes ?? m.likes,
        comments: d.comments ?? m.comments,
        shares: d.shares ?? m.shares,
        saves: d.saves ?? m.saves,
        reach: d.reach ?? m.reach,
      },
    }
  })
  return { posts: fusionados, aFondo, calce }
}

/* ------------------------------------------------------------ comparación -- */

export { RUBROS, RUBRO_POR_DEFECTO, esRubro } from './tiktok-rubros'

/** El promedio de las cuentas de empresa verificadas del rubro, como lo da TikTok. */
export type Comparacion = {
  rubro: string
  /** ISO: cuándo se leyó. */
  leido: string
  seguidores: number | null
  seguidoresGanados30: number | null
  videos: number | null
  likes: number | null
  comentarios: number | null
  compartidos: number | null
  views: number | null
  /** De 0 a 1. */
  interaccion: number | null
}

export function normalizarComparacion(rubro: string, data: Record<string, unknown>, ahora: Date = new Date()): Comparacion {
  return {
    rubro,
    leido: ahora.toISOString(),
    seguidores: numero(data.average_follower_count),
    seguidoresGanados30: numero(data.average_follower_growth),
    videos: numero(data.average_video_count),
    likes: numero(data.average_likes),
    comentarios: numero(data.average_comments),
    compartidos: numero(data.average_shares),
    views: numero(data.average_video_views),
    interaccion: numero(data.average_engagement_rate),
  }
}

export async function leerComparacion(credencial: CredencialDeComentarios, rubro: string, ahora: Date = new Date()): Promise<Comparacion> {
  const url = new URL(`${API_BUSINESS}/business/benchmark/`)
  url.searchParams.set('business_id', credencial.openId)
  url.searchParams.set('business_category', rubro)
  const data = await pedirBusiness<Record<string, unknown>>(url.toString(), {
    headers: { 'Access-Token': credencial.accessToken },
  })
  return normalizarComparacion(rubro, data, ahora)
}

/* -------------------------------------------------------------- búsquedas -- */

/** Lo más largo que acepta `/discovery/trending/search/keyword/`. */
export const MAX_CONSULTA = 255

export function palabrasDe(data: { search_keywords?: unknown }): string[] {
  if (!Array.isArray(data.search_keywords)) return []
  const vistas = new Set<string>()
  const palabras: string[] = []
  for (const p of data.search_keywords) {
    if (typeof p !== 'string') continue
    const limpia = p.trim().slice(0, 100)
    if (!limpia || vistas.has(limpia.toLowerCase())) continue
    vistas.add(limpia.toLowerCase())
    palabras.push(limpia)
  }
  return palabras.slice(0, 20)
}

/**
 * Lo que se busca en TikTok, para esta cuenta (`is_personalized`): sin consulta, las 20 búsquedas
 * en tendencia; con una, las 20 recomendadas para ella. Solo para cuentas con acceso avanzado o de
 * empresa: a las demás TikTok les dice que no, y eso lanza.
 */
export async function leerBusquedas(credencial: CredencialDeComentarios, consulta: string | null): Promise<string[]> {
  const ruta = consulta ? '/discovery/trending/search/keyword/' : '/discovery/trending/search/'
  const url = new URL(`${API_BUSINESS}${ruta}`)
  url.searchParams.set('business_id', credencial.openId)
  url.searchParams.set('is_personalized', 'true')
  if (consulta) url.searchParams.set('query', consulta.slice(0, MAX_CONSULTA))
  const data = await pedirBusiness<{ search_keywords?: unknown }>(url.toString(), {
    headers: { 'Access-Token': credencial.accessToken },
  })
  return palabrasDe(data)
}
