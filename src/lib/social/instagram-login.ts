// Instagram se conecta de dos maneras, y la cuenta guarda con cuál (`social_accounts.login`):
//
// - **Login de Facebook** (`facebook`, la de siempre): la persona entra con Facebook, la cuenta
//   de Instagram se encuentra a través de la página que administra, y todo va a
//   graph.facebook.com con el token de la persona.
// - **Login de Instagram** (`instagram`, *Business Login for Instagram*): la persona entra con su
//   cuenta de Instagram, sin página de Facebook, y todo va a graph.instagram.com con un token de
//   esa cuenta. La cuenta tiene que ser profesional (empresa o creador) igual.
//
// Lo demás es lo mismo: las rutas (`/<id>/media`, `/media_publish`, `/comments`, `/replies`,
// `/insights`) y sus campos se llaman igual en los dos hosts, así que el conector, el publicador
// y los comentarios de Instagram son uno solo y solo cambian el host (`graphDeInstagram`) y cómo
// se renueva el token. El privado sí cambia de forma: con login de Facebook sale de la página,
// con el de Instagram de la cuenta misma (`comentarios/privado.ts`).
//
// Este módulo no importa nada de la base ni del entorno: lo usan el publicador, el conector y el
// callback, y sus tests lo prueban sin red.

/** El host de Graph de Instagram con login de Facebook, y de todo lo de Facebook. */
export const GRAPH_FACEBOOK = 'https://graph.facebook.com/v23.0'
/** El host de Graph de Instagram con login de Instagram. */
export const GRAPH_INSTAGRAM = 'https://graph.instagram.com/v23.0'

export type LoginDeInstagram = 'facebook' | 'instagram'

/** Si la cuenta se conectó con el login de Instagram. Nulo o ausente es el de Facebook. */
export function conLoginDeInstagram(cuenta: { login?: string | null }): boolean {
  return cuenta.login === 'instagram'
}

/** El host de Graph con que se habla de esta cuenta de Instagram. */
export function graphDeInstagram(cuenta: { login?: string | null }): string {
  return conLoginDeInstagram(cuenta) ? GRAPH_INSTAGRAM : GRAPH_FACEBOOK
}

/**
 * Los permisos del login de Instagram, separados por comas, que la ventana acepta. Van los cinco
 * siempre: un permiso se concede al autorizar, y sumarlo después es mandar a la persona otra vez
 * por la ventana. El de mensajes es el del privado de la regla de palabra clave; el privado
 * igual se enciende aparte, con `COMENTARIOS_DM` (`comentarios/privado.ts`). Si la app no tiene
 * activado alguno en el caso de uso de Instagram, Meta rechaza la ventana entera.
 */
export const SCOPES_LOGIN_DE_INSTAGRAM = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_comments',
  'instagram_business_manage_messages',
  'instagram_business_manage_insights',
].join(',')

/** La ventana del login de Instagram. */
export const AUTORIZAR_LOGIN_DE_INSTAGRAM = 'https://www.instagram.com/oauth/authorize'
/** Donde se canjea el código por el token corto, de una hora. */
export const TOKEN_CORTO_LOGIN_DE_INSTAGRAM = 'https://api.instagram.com/oauth/access_token'
/** Donde se canjea el token corto por el largo (`ig_exchange_token`), y donde se renueva el largo. */
export const TOKEN_LARGO_LOGIN_DE_INSTAGRAM = 'https://graph.instagram.com/access_token'
export const RENOVAR_LOGIN_DE_INSTAGRAM = 'https://graph.instagram.com/refresh_access_token'

/** La frase con que se rechaza el login de Instagram a quien todavía no lo tiene abierto. */
export const LOGIN_DE_INSTAGRAM_CERRADO =
  'Conectar con Instagram, sin página de Facebook, todavía no está disponible en Tu Parrilla: próximamente.'

/**
 * El token corto que devuelve `api.instagram.com/oauth/access_token`. La documentación del
 * login de Instagram lo muestra envuelto (`{ data: [{ access_token, user_id, permissions }] }`)
 * y la de su referencia, y lo que se ve en la práctica, plano (`{ access_token, user_id }`): se
 * aceptan los dos, porque elegir mal deja la conexión sin token. Null si no trae token.
 *
 * Recibe el cuerpo en texto y no ya parseado: `user_id` puede llegar como número, y uno de
 * diecisiete cifras no cabe en un número de JavaScript (`17841400000000001` se lee
 * `17841400000000000`). El id se saca del texto, tal cual vino.
 */
export function leerTokenCorto(cuerpo: string): { accessToken: string; userId: string | null } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(cuerpo)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const raiz = parsed as { data?: unknown; access_token?: unknown }
  const fila = Array.isArray(raiz.data) && raiz.data.length > 0 ? (raiz.data[0] as typeof raiz) : raiz
  if (typeof fila?.access_token !== 'string' || fila.access_token === '') return null
  const userId = /"user_id"\s*:\s*"?(\d+)/.exec(cuerpo)?.[1] ?? null
  return { accessToken: fila.access_token, userId }
}

/**
 * La cuenta que autorizó el login de Instagram, de `GET /me?fields=id,user_id,username`.
 *
 * `user_id` es el id de la cuenta profesional, el que va en `/<id>/media` y en los webhooks, y el
 * mismo que el login de Facebook encuentra en la página (`instagram_business_account.id`): por eso
 * es el `external_id` de la fila, y la misma cuenta conectada por cualquiera de los dos logins es
 * una sola fila. `id` es el id de la persona en esta app, el que se guarda como `meta_user_id`
 * para reconocerla si un día llega por la baja o el borrado. Sin `user_id` se cae al id del canje
 * del código y después a `id`: alguno tiene que haber para que la fila tenga identidad.
 *
 * En texto, como `leerTokenCorto`: los ids se sacan del cuerpo tal cual, por si llegan como número.
 */
export function leerPerfil(
  cuerpo: string,
  userIdDelCanje: string | null,
): { externalId: string; handle: string | null; appUserId: string | null } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(cuerpo)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const id = (campo: string) => new RegExp(`"${campo}"\\s*:\\s*"?(\\d+)`).exec(cuerpo)?.[1] ?? null
  const appUserId = id('id')
  const externalId = id('user_id') ?? userIdDelCanje ?? appUserId
  if (!externalId) return null
  const usuario = (parsed as { username?: unknown }).username
  return { externalId, handle: typeof usuario === 'string' && usuario ? `@${usuario}` : null, appUserId }
}
