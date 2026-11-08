import 'server-only'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { accountMetrics, getDb, socialAccounts } from '@/db'
import type { SocialAccount } from '@/db'
import { guardarAjuste, leerAjuste } from '@/lib/ajustes'
import { tiktokBusinessAbiertoPara } from '@/lib/redes-abiertas'
import { esUuid } from '@/lib/uuid'
import type { FetchedPost } from './connector'
import {
  PERMISOS_DE_NUMEROS,
  claveDeComentarios,
  credencialBusiness,
  descifrar,
  tienePermiso,
  type CredencialDeComentarios,
} from './tiktok-business'
import {
  MAX_CONSULTA,
  RUBRO_POR_DEFECTO,
  esRubro,
  fusionarConBusiness,
  leerBusquedas,
  leerComparacion,
  leerCuenta,
  leerVideos,
  type AudienciaDeTiktok,
  type Comparacion,
  type DiaDeTiktok,
  type VideoAFondo,
} from './tiktok-numeros'

/**
 * Dónde quedan los números de TikTok for Business (`tiktok-numeros.ts`) y quién los lee.
 *
 * - Lo de cada día de la cuenta va a `account_metrics`, como el de las demás redes, cada fila con
 *   su propio día (el de TikTok, en UTC): llega con 24 a 48 horas de atraso, así que la fila de
 *   hoy trae solo los seguidores de por vida y las de los días anteriores, lo del día.
 * - Lo de los videos que cabe en `post_metrics` —guardados y alcance— entra en la lectura del día
 *   (`fusionarConBusiness`); lo demás, que son totales de toda la vida del video, se guarda una
 *   sola vez por cuenta, lo último leído, en `ajustes`.
 * - La audiencia, la comparación, el rubro elegido y lo que se busca en TikTok, también en
 *   `ajustes`, una fila por cuenta y cosa (`claveDeNumeros`).
 *
 * Todo en `ajustes` y sin migración, como la credencial: nace cerrado detrás de la misma reja, y
 * es lo último leído, no una historia. Desconectar o quitar la cuenta lo borra; traspasarla lo pasa
 * con ella (`desconectar.ts`, `quitar.ts`, `traspasar.ts`).
 */

/** Las cosas de TikTok for Business que se guardan por cuenta, además de la credencial. */
export type CosaDeNumeros = 'audiencia' | 'videos' | 'rubro' | 'comparacion' | 'busquedas'

/** El prefijo de todas: `desconectar.ts`, `quitar.ts` y `traspasar.ts` lo borran o lo pasan entero. */
export function prefijoDeNumeros(accountId: string): string {
  return `tiktok_business:${accountId}:`
}

export function claveDeNumeros(accountId: string, cosa: CosaDeNumeros): string {
  return `${prefijoDeNumeros(accountId)}${cosa}`
}

/** Cada cuánto se vuelve a pedir la comparación: TikTok la calcula sobre 30 días. */
const COMPARACION_VIGENTE_MS = 7 * 864e5
/** Cuánto dura lo que se busca en TikTok antes de volver a pedirlo: cuida el cupo de 40 por minuto. */
export const BUSQUEDAS_VIGENTES_MS = 6 * 3600e3
/** Cuántas consultas se recuerdan por cuenta. */
const MAX_CONSULTAS_GUARDADAS = 20
/** Cuántos videos «a fondo» se recuerdan por cuenta. */
const MAX_VIDEOS_GUARDADOS = 500

function leerJson<T>(valor: string | null): T | null {
  if (!valor) return null
  try {
    return JSON.parse(valor) as T
  } catch {
    return null
  }
}

/* ----------------------------------------------------------- la sincronización -- */

/** Los días de la cuenta a `account_metrics`, cada uno en su día; un dato que no vino no pisa al guardado. */
async function guardarDias(account: SocialAccount, dias: DiaDeTiktok[]): Promise<void> {
  for (const d of dias) {
    const valores = {
      followers: d.followers,
      profileViews: d.profileViews,
      views: d.views,
      reach: d.reach,
      accountsEngaged: d.accountsEngaged,
    }
    await getDb()
      .insert(accountMetrics)
      .values({ network: 'tiktok', accountId: account.id, day: d.dia, ...valores })
      .onConflictDoUpdate({
        target: [accountMetrics.accountId, accountMetrics.day],
        set: {
          followers: sql`coalesce(excluded.followers, ${accountMetrics.followers})`,
          profileViews: sql`coalesce(excluded.profile_views, ${accountMetrics.profileViews})`,
          views: sql`coalesce(excluded.views, ${accountMetrics.views})`,
          reach: sql`coalesce(excluded.reach, ${accountMetrics.reach})`,
          accountsEngaged: sql`coalesce(excluded.accounts_engaged, ${accountMetrics.accountsEngaged})`,
          capturedAt: new Date(),
        },
      })
  }
}

/** Los seguidores y los videos de por vida, en la fila de hoy del dueño. */
async function guardarHoy(account: SocialAccount, dia: string, audiencia: AudienciaDeTiktok): Promise<void> {
  if (audiencia.followers === null && audiencia.videos === null) return
  await getDb()
    .insert(accountMetrics)
    .values({ network: 'tiktok', accountId: account.id, day: dia, followers: audiencia.followers, videoCount: audiencia.videos })
    .onConflictDoUpdate({
      target: [accountMetrics.accountId, accountMetrics.day],
      set: {
        followers: sql`coalesce(excluded.followers, ${accountMetrics.followers})`,
        videoCount: sql`coalesce(excluded.video_count, ${accountMetrics.videoCount})`,
        capturedAt: new Date(),
      },
    })
}

type VideosGuardados = { leido: string; videos: Record<string, VideoAFondo> }

async function guardarAFondo(ownerId: string, accountId: string, nuevos: Map<string, VideoAFondo>): Promise<void> {
  if (nuevos.size === 0) return
  const clave = claveDeNumeros(accountId, 'videos')
  const antes = leerJson<VideosGuardados>(await leerAjuste(ownerId, clave))?.videos ?? {}
  // Los recién leídos primero: al pasarse del tope se olvidan los que hace más que no vuelven.
  const juntos = Object.fromEntries(
    [...nuevos.entries(), ...Object.entries(antes).filter(([id]) => !nuevos.has(id))].slice(0, MAX_VIDEOS_GUARDADOS),
  )
  await guardarAjuste(ownerId, clave, JSON.stringify({ leido: new Date().toISOString(), videos: juntos } satisfies VideosGuardados))
}

async function refrescarComparacion(
  ownerId: string,
  accountId: string,
  credencial: CredencialDeComentarios,
  ahora: Date,
  forzar = false,
): Promise<Comparacion | null> {
  const rubroGuardado = await leerAjuste(ownerId, claveDeNumeros(accountId, 'rubro'))
  const rubro = esRubro(rubroGuardado) ? rubroGuardado : RUBRO_POR_DEFECTO
  const clave = claveDeNumeros(accountId, 'comparacion')
  const antes = leerJson<Comparacion>(await leerAjuste(ownerId, clave))
  const vigente = antes && antes.rubro === rubro && ahora.getTime() - new Date(antes.leido).getTime() < COMPARACION_VIGENTE_MS
  if (vigente && !forzar) return antes
  const comparacion = await leerComparacion(credencial, rubro, ahora)
  await guardarAjuste(ownerId, clave, JSON.stringify(comparacion))
  return comparacion
}

/**
 * Lo de TikTok for Business en la sincronización diaria de una cuenta de TikTok: los posts de la
 * app de siempre completados con lo de Business, y además la cuenta, su audiencia y la comparación
 * guardadas. Nunca lanza, y sin Business —reja cerrada, cuenta sin activar, sin permisos o un error
 * de TikTok— devuelve los posts tal cual: la app de siempre sigue sola, como antes.
 */
export async function sincronizarTiktokBusiness(
  account: SocialAccount,
  posts: FetchedPost[],
  desde: Date,
  dia: string,
  ahora: Date = new Date(),
): Promise<FetchedPost[]> {
  if (account.network !== 'tiktok' || !account.ownerId) return posts
  let credencial: CredencialDeComentarios | null
  try {
    credencial = await credencialBusiness(account, ahora.getTime())
  } catch (error) {
    console.error('[tiktok-business] credencial para los números:', String(error).slice(0, 300))
    return posts
  }
  if (!credencial) return posts
  const ownerId = account.ownerId

  let resultado = posts
  try {
    const videos = await leerVideos(credencial, desde)
    if (videos.length > 0) {
      const { posts: fusionados, aFondo, calce } = fusionarConBusiness(posts, videos)
      // La pregunta que quedó abierta en la primera entrega: si el id de la app de siempre es el
      // mismo `item_id` de Business. El registro lo contesta con la primera cuenta real.
      console.log(
        `[tiktok-business] videos de ${account.handle ?? account.id}: ${calce.porId} calzan por id, ${calce.porEnlace} por enlace, ${calce.sinCalzar} sin calzar (de ${videos.length} en Business)`,
      )
      await guardarAFondo(ownerId, account.id, aFondo)
      resultado = fusionados
    }
  } catch (error) {
    console.error('[tiktok-business] videos:', String(error).slice(0, 300))
  }

  try {
    const cuenta = await leerCuenta(credencial, ahora)
    if (cuenta) {
      await guardarDias(account, cuenta.dias)
      await guardarHoy(account, dia, cuenta.audiencia)
      await guardarAjuste(ownerId, claveDeNumeros(account.id, 'audiencia'), JSON.stringify(cuenta.audiencia))
    }
  } catch (error) {
    console.error('[tiktok-business] cuenta:', String(error).slice(0, 300))
  }

  try {
    await refrescarComparacion(ownerId, account.id, credencial, ahora)
  } catch (error) {
    console.error('[tiktok-business] comparación:', String(error).slice(0, 300))
  }

  return resultado
}

/* ------------------------------------------------------ lo que el panel lee -- */

/**
 * Una cuenta de TikTok de este dueño, conectada, con lo que `credencialBusiness` necesita. Una
 * ajena y una que no existe dan lo mismo: null. Las acciones del panel pasan siempre por aquí.
 */
export async function cuentaTiktokDelDueno(
  ownerId: string,
  cuentaId: unknown,
): Promise<Pick<SocialAccount, 'id' | 'network' | 'ownerId' | 'accessToken' | 'handle'> | null> {
  if (!esUuid(cuentaId)) return null
  const [fila] = await getDb()
    .select({
      id: socialAccounts.id,
      network: socialAccounts.network,
      ownerId: socialAccounts.ownerId,
      accessToken: socialAccounts.accessToken,
      handle: socialAccounts.handle,
    })
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.id, cuentaId),
        eq(socialAccounts.ownerId, ownerId),
        eq(socialAccounts.network, 'tiktok'),
        isNotNull(socialAccounts.accessToken),
      ),
    )
    .limit(1)
  return fila ?? null
}

/** Lo que Los Números muestra de una cuenta de TikTok con Business. */
export type NumerosDeTiktok = {
  accountId: string
  audiencia: AudienciaDeTiktok | null
  comparacion: Comparacion | null
  rubro: string
  /** La interacción de sus videos recientes, de 0 a 1, para poner al lado de la comparación. */
  interaccion: number | null
}

/**
 * La interacción de los videos guardados: likes, comentarios y compartidos sobre views, sumando
 * todos. No es la fórmula de TikTok, que no la publica; es la que se puede contar.
 */
export function interaccionDe(videos: Array<{ views: number | null; likes: number | null; comments: number | null; shares: number | null }>): number | null {
  let vistas = 0
  let interacciones = 0
  for (const v of videos) {
    if (!v.views) continue
    vistas += v.views
    interacciones += (v.likes ?? 0) + (v.comments ?? 0) + (v.shares ?? 0)
  }
  return vistas > 0 ? interacciones / vistas : null
}

/**
 * Lo guardado de las cuentas de TikTok de este dueño que activaron Business, para Los Números.
 * Vacío con la reja cerrada. `interaccionDe` recibe los números de los videos de cada cuenta,
 * que la página ya leyó (`getPostRows`).
 */
export async function numerosDeTiktok(
  ownerId: string,
  cuentas: Array<{ id: string; videos: Parameters<typeof interaccionDe>[0] }>,
): Promise<NumerosDeTiktok[]> {
  if (!tiktokBusinessAbiertoPara(ownerId)) return []
  const numeros: NumerosDeTiktok[] = []
  for (const cuenta of cuentas) {
    if (!(await leerAjuste(ownerId, claveDeComentarios(cuenta.id)))) continue
    const audiencia = leerJson<AudienciaDeTiktok>(await leerAjuste(ownerId, claveDeNumeros(cuenta.id, 'audiencia')))
    const comparacion = leerJson<Comparacion>(await leerAjuste(ownerId, claveDeNumeros(cuenta.id, 'comparacion')))
    const rubro = await leerAjuste(ownerId, claveDeNumeros(cuenta.id, 'rubro'))
    numeros.push({
      accountId: cuenta.id,
      audiencia,
      comparacion,
      rubro: esRubro(rubro) ? rubro : (comparacion?.rubro ?? RUBRO_POR_DEFECTO),
      interaccion: interaccionDe(cuenta.videos),
    })
  }
  return numeros
}

/** Los videos «a fondo» de una cuenta, por el id de su fila (`externalId`). Vacío con la reja cerrada. */
export async function videosAFondo(ownerId: string, accountId: string): Promise<Record<string, VideoAFondo>> {
  if (!tiktokBusinessAbiertoPara(ownerId)) return {}
  return leerJson<VideosGuardados>(await leerAjuste(ownerId, claveDeNumeros(accountId, 'videos')))?.videos ?? {}
}

export const RUBRO_GUARDADO = 'Listo: la comparación es ahora con ese rubro.'
export const RUBRO_SIN_COMPARACION = 'Se guardó el rubro, pero TikTok no dio la comparación. Se vuelve a intentar mañana.'
export const RUBRO_NO_SE_PUEDE = 'No se pudo cambiar el rubro de esa cuenta.'

/** Cambia el rubro con que se compara una cuenta, y pide la comparación nueva en el acto. */
export async function cambiarRubro(ownerId: string, cuentaId: unknown, rubro: unknown): Promise<{ ok: boolean; texto: string }> {
  if (!tiktokBusinessAbiertoPara(ownerId) || !esRubro(rubro)) return { ok: false, texto: RUBRO_NO_SE_PUEDE }
  const cuenta = await cuentaTiktokDelDueno(ownerId, cuentaId)
  if (!cuenta) return { ok: false, texto: RUBRO_NO_SE_PUEDE }
  const credencial = await credencialBusiness(cuenta)
  if (!credencial) return { ok: false, texto: RUBRO_NO_SE_PUEDE }
  await guardarAjuste(ownerId, claveDeNumeros(cuenta.id, 'rubro'), rubro)
  try {
    await refrescarComparacion(ownerId, cuenta.id, credencial, new Date(), true)
    return { ok: true, texto: RUBRO_GUARDADO }
  } catch (error) {
    console.error('[tiktok-business] comparación al cambiar el rubro:', String(error).slice(0, 300))
    return { ok: true, texto: RUBRO_SIN_COMPARACION }
  }
}

/* -------------------------------------------------------------- búsquedas -- */

export const BUSQUEDAS_NO_DISPONIBLES =
  'TikTok no dio lo que se busca para esta cuenta: es solo para cuentas con acceso avanzado o de empresa.'

type BusquedasGuardadas = Record<string, { leido: string; palabras: string[] }>

/** La consulta como se recuerda: sin mayúsculas ni espacios de más. Vacía, las tendencias. */
export function llaveDeConsulta(consulta: string | null | undefined): string {
  return (consulta ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_CONSULTA)
}

/** Las cuentas de este dueño con Business y el permiso de búsquedas: las que el compositor ofrece. */
export async function cuentasConBusquedas(ownerId: string, accountIds: string[]): Promise<string[]> {
  if (!tiktokBusinessAbiertoPara(ownerId)) return []
  const con: string[] = []
  for (const id of accountIds) {
    const credencial = descifrar((await leerAjuste(ownerId, claveDeComentarios(id))) ?? '')
    if (credencial && tienePermiso(credencial.scope, PERMISOS_DE_NUMEROS.busquedas)) con.push(id)
  }
  return con
}

/**
 * «Lo que se busca en TikTok» en el compositor, para una cuenta del dueño: las tendencias (sin
 * consulta) o lo recomendado para una consulta, recordado seis horas por cuenta y consulta.
 */
export async function busquedasDeLaCuenta(
  ownerId: string,
  cuentaId: unknown,
  consulta: string | null,
  ahora: Date = new Date(),
): Promise<{ palabras: string[] } | { error: string }> {
  if (!tiktokBusinessAbiertoPara(ownerId)) return { error: BUSQUEDAS_NO_DISPONIBLES }
  const cuenta = await cuentaTiktokDelDueno(ownerId, cuentaId)
  if (!cuenta) return { error: BUSQUEDAS_NO_DISPONIBLES }
  const llave = llaveDeConsulta(consulta)
  const clave = claveDeNumeros(cuenta.id, 'busquedas')
  const guardadas = leerJson<BusquedasGuardadas>(await leerAjuste(ownerId, clave)) ?? {}
  const recordada = guardadas[llave]
  if (recordada && ahora.getTime() - new Date(recordada.leido).getTime() < BUSQUEDAS_VIGENTES_MS) {
    return { palabras: recordada.palabras }
  }
  try {
    const credencial = await credencialBusiness(cuenta, ahora.getTime())
    if (!credencial || !tienePermiso(credencial.scope, PERMISOS_DE_NUMEROS.busquedas)) return { error: BUSQUEDAS_NO_DISPONIBLES }
    const palabras = await leerBusquedas(credencial, llave || null)
    const vigentes = Object.entries(guardadas).filter(
      ([k, v]) => k !== llave && ahora.getTime() - new Date(v.leido).getTime() < BUSQUEDAS_VIGENTES_MS,
    )
    const nuevas = Object.fromEntries(
      [[llave, { leido: ahora.toISOString(), palabras }] as const, ...vigentes].slice(0, MAX_CONSULTAS_GUARDADAS),
    )
    await guardarAjuste(ownerId, clave, JSON.stringify(nuevas))
    return { palabras }
  } catch (error) {
    console.error('[tiktok-business] búsquedas:', String(error).slice(0, 300))
    return { error: BUSQUEDAS_NO_DISPONIBLES }
  }
}
