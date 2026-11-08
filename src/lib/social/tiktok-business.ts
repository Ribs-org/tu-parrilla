import type { SocialAccount } from '@/db'
import { borrarAjuste, guardarAjuste, leerAjuste } from '@/lib/ajustes'
import { env } from '@/lib/env'
import { tiktokBusinessAbiertoPara } from '@/lib/redes-abiertas'
import { decryptToken, encryptToken } from './crypto'

/**
 * La app de TikTok for Business (business-api.tiktok.com), la «Accounts API». Nació para los
 * comentarios, que es lo único de TikTok que los lee y los responde: la app de siempre (Login
 * Kit, Display y Content Posting, en developers.tiktok.com) solo da cuántos tiene cada video. Con
 * la misma autorización lee también lo que la app de siempre no da (`tiktok-numeros.ts`): los
 * números de la cuenta y su audiencia, cada video más a fondo, la comparación con cuentas
 * parecidas y lo que se busca en TikTok.
 *
 * Es otra app, en otro portal y con otra revisión, y su autorización es aparte: el dueño ya conectó
 * la cuenta para publicar, y la autoriza una segunda vez aquí. Esa segunda credencial se guarda
 * junto a la cuenta (en `ajustes`, ver `claveDeComentarios`) y no reemplaza a la primera.
 *
 * Cerrado salvo para quien diga `TIKTOK_COMENTARIOS_ABIERTO_PARA` (`redes-abiertas.ts`). Lo que se
 * leyó de la documentación, con las direcciones, está en `docs/levantamiento-terceros.md`, §3.5.
 */

export const API_BUSINESS = 'https://business-api.tiktok.com/open_api/v1.3'

/**
 * Los dos permisos de comentarios de la Accounts API: leer, y responder (y ocultar, que no se usa).
 * Son los únicos que la vuelta exige: sin ellos no se guarda nada. Los de los números
 * (`PERMISOS_DE_NUMEROS`) se aprovechan si vinieron, y su falta solo apaga lo suyo.
 */
export const PERMISOS_DE_COMENTARIOS = ['comment.list', 'comment.list.manage'] as const

/**
 * Los permisos de los números, con el nombre que les da el token (y la casilla del portal que los
 * marca). La comparación con cuentas parecidas («Business benchmark») no está: su documentación
 * no dice con qué nombre llega al token, así que se pide igual y, si TikTok la niega, no se muestra.
 */
export const PERMISOS_DE_NUMEROS = {
  /** Seguidores, «me gusta» y videos de por vida («Get account user info»). */
  estadisticas: 'user.info.stats',
  /** Lo del día y la audiencia («Get account insights»). */
  cuenta: 'user.insights',
  /** Cada video con sus números de siempre («Get account media»). */
  videos: 'video.list',
  /** Cada video más a fondo: tiempo visto, de dónde llegaron («Get account media»). */
  videosAFondo: 'video.insights',
  /** Lo que se busca en TikTok («Discover trending search keywords»). */
  busquedas: 'discovery.search.words',
} as const

/** Si el token trae ese permiso, en la lista separada por comas que da TikTok. */
export function tienePermiso(scope: string, permiso: string): boolean {
  return scope.split(',').some((s) => s.trim() === permiso)
}

/**
 * Los permisos de los números que el dueño no concedió: la cuenta sigue con sus comentarios, y Los
 * Fierros le ofrece autorizar de nuevo para traer lo que falta.
 */
export function numerosQueFaltan(scope: string): string[] {
  return Object.values(PERMISOS_DE_NUMEROS).filter((p) => !tienePermiso(scope, p))
}

/** La red con que se firma el state de esta vuelta: no es la de conectar TikTok (`[network]/connect`). */
export const RED_DEL_STATE = 'tiktok-comentarios'

/** Renovar con una hora de margen, como el token de publicar (`tiktok.ts`): el de acceso dura un día. */
const MARGEN_RENOVAR_MS = 60 * 60 * 1000

export const COMENTARIOS_ACTIVADOS =
  'TikTok for Business activado: los comentarios llegan a La Mesa en la próxima pasada, y los números con la sincronización de mañana.'
export const COMENTARIOS_CERRADOS = 'TikTok for Business todavía no está disponible en Tu Parrilla.'
export const COMENTARIOS_SIN_PERMISO =
  'TikTok no dio permiso para leer y responder comentarios. Vuelve a intentarlo y acepta todo lo que pide.'
export const COMENTARIOS_OTRA_CUENTA =
  'Autorizaste otra cuenta de TikTok. Entra en TikTok con la misma cuenta de esta fila y vuelve a intentarlo.'
export const COMENTARIOS_FALLO = 'No se pudo activar TikTok for Business. Inténtalo de nuevo.'

/** La credencial de la app de TikTok for Business para una cuenta: su propio id y sus propios tokens. */
export type CredencialDeComentarios = {
  /**
   * El id que la app de TikTok for Business le da a la cuenta (`business_id` en cada llamada). No es
   * el `externalId` de la fila: TikTok da un id distinto por app.
   */
  openId: string
  accessToken: string
  refreshToken: string
  /** ISO: cuándo vence el token de acceso. */
  expiraEn: string
  scope: string
}

/** Lo que el comentarista recibe como «token»: el id de la cuenta en esta app y el token de acceso. */
export type TokenDeComentarios = { openId: string; token: string }

/** La fila de `ajustes` donde vive la credencial de comentarios de una cuenta, del mismo dueño. */
export function claveDeComentarios(accountId: string): string {
  return `tiktok_comentarios:${accountId}`
}

/** La respuesta de toda la API for Business: `code` 0 es éxito, aunque el HTTP sea 200 siempre. */
type RespuestaBusiness<T> = { code?: number; message?: string; data?: T }

/** Un pedido a la API for Business; lanza con el código y el mensaje si TikTok dijo que no. */
export async function pedirBusiness<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), ...init })
  const texto = await response.text()
  let cuerpo: RespuestaBusiness<T>
  try {
    cuerpo = JSON.parse(texto) as RespuestaBusiness<T>
  } catch {
    throw new Error(`TikTok Business ${response.status}: ${texto.slice(0, 200)}`)
  }
  if (!response.ok || cuerpo.code !== 0 || cuerpo.data === undefined) {
    throw new Error(`TikTok Business ${response.status} ${cuerpo.code ?? '?'}: ${(cuerpo.message ?? '').slice(0, 200)}`)
  }
  return cuerpo.data
}

/**
 * Adónde mandar al dueño: el «TikTok account holder authorization URL» que el portal da para la app
 * (`TIKTOK_BUSINESS_AUTORIZACION`), con el state firmado y `disable_auto_auth=1`, que hace que TikTok
 * muestre siempre su pantalla con la cuenta que va a autorizar, como al conectar.
 */
export function urlDeAutorizacion(base: string, state: string): URL {
  const url = new URL(base)
  url.searchParams.set('state', state)
  url.searchParams.set('disable_auto_auth', '1')
  return url
}

/**
 * La dirección de vuelta, que el canje tiene que repetir tal cual: la que trae el enlace del portal,
 * que es la activa de la app. TikTok for Business la exige terminada en `/` y sin parámetros; Next
 * redirige `…/vuelta/` a `…/vuelta` conservando el código, así que la ruta no necesita la barra.
 */
export function vueltaDe(base: string, origen: string): string {
  return new URL(base).searchParams.get('redirect_uri') ?? `${origen}/api/social/tiktok/comentarios/vuelta/`
}

/** Los permisos de comentarios que el dueño no concedió, de la lista separada por comas que da TikTok. */
export function permisosQueFaltan(scope: string): string[] {
  const concedidos = new Set(scope.split(',').map((s) => s.trim()))
  return PERMISOS_DE_COMENTARIOS.filter((p) => !concedidos.has(p))
}

type TokenBusiness = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  open_id?: string
  scope?: string
}

function credencialDe(data: TokenBusiness, anterior?: CredencialDeComentarios): CredencialDeComentarios {
  const openId = data.open_id ?? anterior?.openId
  if (!data.access_token || !openId) throw new Error('TikTok Business no devolvió el token o el id de la cuenta')
  return {
    openId,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? anterior?.refreshToken ?? '',
    expiraEn: new Date(Date.now() + (data.expires_in ?? 86400) * 1000).toISOString(),
    scope: data.scope ?? anterior?.scope ?? '',
  }
}

function credencialesDeLaApp(): { clientId: string; clientSecret: string } {
  const clientId = env('TIKTOK_BUSINESS_APP_ID')
  const clientSecret = env('TIKTOK_BUSINESS_SECRET')
  if (!clientId || !clientSecret) throw new Error('Faltan TIKTOK_BUSINESS_APP_ID o TIKTOK_BUSINESS_SECRET')
  return { clientId, clientSecret }
}

/** Canjea el código de la vuelta (dura diez minutos y sirve una vez) por la credencial. */
export async function canjearCodigo(codigo: string, redirectUri: string): Promise<CredencialDeComentarios> {
  const { clientId, clientSecret } = credencialesDeLaApp()
  const data = await pedirBusiness<TokenBusiness>(`${API_BUSINESS}/tt_user/oauth2/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      auth_code: codigo,
      redirect_uri: redirectUri,
    }),
  })
  return credencialDe(data)
}

/** Un token nuevo con el de renovación, que dura un año. */
export async function renovar(anterior: CredencialDeComentarios): Promise<CredencialDeComentarios> {
  const { clientId, clientSecret } = credencialesDeLaApp()
  const data = await pedirBusiness<TokenBusiness>(`${API_BUSINESS}/tt_user/oauth2/refresh_token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: anterior.refreshToken,
    }),
  })
  return credencialDe(data, anterior)
}

/**
 * El nombre visible de la cuenta que autorizó, para comparar con el de la fila: si no calzan, el
 * dueño entró a TikTok con otra cuenta. Null si TikTok no lo dio: la comparación se salta, y una
 * cuenta equivocada igual no lee nada, porque la API solo lista comentarios de videos propios.
 */
export async function nombreVisible(credencial: CredencialDeComentarios): Promise<string | null> {
  const url = new URL(`${API_BUSINESS}/business/get/`)
  url.searchParams.set('business_id', credencial.openId)
  url.searchParams.set('fields', JSON.stringify(['display_name']))
  try {
    const data = await pedirBusiness<{ display_name?: string }>(url.toString(), {
      headers: { 'Access-Token': credencial.accessToken },
    })
    return data.display_name?.trim() || null
  } catch (error) {
    console.error('[tiktok-business] perfil:', String(error).slice(0, 300))
    return null
  }
}

export function cifrar(credencial: CredencialDeComentarios): string {
  return encryptToken(JSON.stringify(credencial))
}

export function descifrar(valor: string): CredencialDeComentarios | null {
  try {
    const leido = JSON.parse(decryptToken(valor)) as Partial<CredencialDeComentarios>
    if (!leido.openId || !leido.accessToken || !leido.expiraEn) return null
    return {
      openId: leido.openId,
      accessToken: leido.accessToken,
      refreshToken: leido.refreshToken ?? '',
      expiraEn: leido.expiraEn,
      scope: leido.scope ?? '',
    }
  } catch {
    return null
  }
}

export function necesitaRenovar(credencial: CredencialDeComentarios, ahora: number): boolean {
  const vence = new Date(credencial.expiraEn).getTime()
  return Number.isNaN(vence) || vence - ahora <= MARGEN_RENOVAR_MS
}

/** El «token» que viaja al comentarista, con el id de la cuenta adentro; y de vuelta. */
export function empaquetar(credencial: CredencialDeComentarios): string {
  return JSON.stringify({ openId: credencial.openId, token: credencial.accessToken } satisfies TokenDeComentarios)
}

export function desempaquetar(token: string): TokenDeComentarios {
  const leido = JSON.parse(token) as Partial<TokenDeComentarios>
  if (!leido.openId || !leido.token) throw new Error('Credencial de comentarios de TikTok incompleta')
  return { openId: leido.openId, token: leido.token }
}

export async function guardarCredencialDeComentarios(
  ownerId: string,
  accountId: string,
  credencial: CredencialDeComentarios,
): Promise<void> {
  await guardarAjuste(ownerId, claveDeComentarios(accountId), cifrar(credencial))
}

/** Se borra al desconectar la cuenta: los comentarios dejan de llegar junto con todo lo demás. */
export async function borrarCredencialDeComentarios(ownerId: string, accountId: string): Promise<void> {
  await borrarAjuste(ownerId, claveDeComentarios(accountId))
}

/**
 * La credencial de TikTok for Business de una cuenta de TikTok, renovada si está por vencer. Null
 * —y no se pide nada a TikTok— si TikTok for Business está cerrado para el dueño, si la cuenta está
 * desconectada o si nunca lo activó. La usan los comentarios y los números (`tiktok-numeros.ts`).
 */
export async function credencialBusiness(
  account: Pick<SocialAccount, 'id' | 'network' | 'ownerId' | 'accessToken'>,
  ahora: number = Date.now(),
): Promise<CredencialDeComentarios | null> {
  if (account.network !== 'tiktok' || !account.ownerId || !account.accessToken) return null
  if (!tiktokBusinessAbiertoPara(account.ownerId)) return null
  const guardada = await leerAjuste(account.ownerId, claveDeComentarios(account.id))
  if (!guardada) return null
  let credencial = descifrar(guardada)
  if (!credencial) return null
  if (necesitaRenovar(credencial, ahora)) {
    credencial = await renovar(credencial)
    await guardarCredencialDeComentarios(account.ownerId, account.id, credencial)
  }
  return credencial
}

/**
 * La credencial de comentarios de una cuenta de TikTok, ya empaquetada para el comentarista. Null
 * —y la cuenta no se sondea, como una desconectada— en los mismos casos que `credencialBusiness`.
 */
export async function credencialDeComentarios(account: SocialAccount, ahora: number = Date.now()): Promise<string | null> {
  const credencial = await credencialBusiness(account, ahora)
  return credencial ? empaquetar(credencial) : null
}

/**
 * Las cuentas de este dueño que activaron TikTok for Business, lo que Los Fierros pinta: `activadas`,
 * todas las que lo tienen; `incompletas`, las que lo activaron sin algún permiso de los números
 * —por ejemplo, antes de que la app los tuviera—, a las que se les ofrece autorizar de nuevo.
 */
export async function cuentasConComentarios(
  ownerId: string,
  accountIds: string[],
): Promise<{ activadas: string[]; incompletas: string[] }> {
  const activadas: string[] = []
  const incompletas: string[] = []
  for (const id of accountIds) {
    const guardada = await leerAjuste(ownerId, claveDeComentarios(id))
    if (!guardada) continue
    activadas.push(id)
    const credencial = descifrar(guardada)
    if (credencial && numerosQueFaltan(credencial.scope).length > 0) incompletas.push(id)
  }
  return { activadas, incompletas }
}
