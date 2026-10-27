import { env } from '@/lib/env'
import type { SocialAccount } from '@/db'
import { DIAS_PRIVADO } from './reglas'

const GRAPH = 'https://graph.facebook.com/v23.0'

// `DIAS_PRIVADO` vive en `reglas.ts` (puro, sin dependencias de red) para que este módulo,
// que solo importan las rutas que hablan con Meta, no entre en el bundle del cliente. Se
// reexporta para no romper a quien ya lo importaba de acá (`privado.test.ts` incluido).
export { DIAS_PRIVADO }

const REDES_CON_PRIVADO = new Set(['instagram', 'facebook'])

/**
 * Para quién está encendido el privado. `COMENTARIOS_DM=1` lo enciende para todos; una lista
 * de ids de usuario separados por comas, solo para esos —así se graba la revisión de Meta con
 * la cuenta del revisor sin encenderlo para nadie más—; vacía, para nadie. Exige
 * `instagram_manage_messages` y `pages_messaging`: con acceso estándar Meta solo deja escribirle
 * a quien tiene un rol en la app, y el acceso avanzado pasa por su revisión.
 */
export function privadoActivo(ownerId: string | null | undefined): boolean {
  const bandera = env('COMENTARIOS_DM')?.trim()
  if (!bandera) return false
  if (bandera === '1') return true
  if (!ownerId) return false
  return bandera.split(',').some((id) => id.trim() === ownerId)
}

export function tocaPrivado(
  network: string,
  publishedAt: Date,
  now: Date,
  activo: boolean,
): boolean {
  if (!activo) return false
  if (!REDES_CON_PRIVADO.has(network)) return false
  return now.getTime() - publishedAt.getTime() < DIAS_PRIVADO * 864e5
}

/**
 * La página desde la que se le escribe a quien comentó, con su token. En Facebook es la cuenta
 * misma: lo guardado ya es la página y su token. En Instagram, el privado sale de la página de
 * Facebook enlazada a la cuenta y con el token de esa página, que la cuenta no guarda (guarda
 * el del usuario): se busca entre las páginas que el usuario administra, la que tiene esta cuenta.
 */
export async function paginaParaPrivado(
  account: SocialAccount,
  token: string,
): Promise<{ id: string; token: string } | null> {
  if (!account.externalId) return null
  if (account.network !== 'instagram') return { id: account.externalId, token }
  const response = await fetch(
    `${GRAPH}/me/accounts?fields=id,access_token,instagram_business_account{id}&limit=100&access_token=${token}`,
  )
  if (!response.ok) throw new Error(`Meta ${response.status}: ${(await response.text()).slice(0, 200)}`)
  const body = (await response.json()) as {
    data?: Array<{ id?: string; access_token?: string; instagram_business_account?: { id?: string } | null }>
  }
  const pagina = body.data?.find((p) => p.instagram_business_account?.id === account.externalId)
  return pagina?.id && pagina.access_token ? { id: pagina.id, token: pagina.access_token } : null
}

/**
 * `POST /{page-id}/messages` con `recipient.comment_id`, con el token de la página
 * (`paginaParaPrivado`): el mismo endpoint para un comentario de la página de Facebook y para
 * uno de la cuenta de Instagram enlazada. Meta deja uno solo por comentario y dentro de siete días.
 */
export async function mandarPrivado(
  account: SocialAccount,
  token: string,
  comentarioExternalId: string,
  texto: string,
): Promise<string> {
  const pagina = await paginaParaPrivado(account, token)
  if (!pagina) throw new Error('No se encontró la página de Facebook de la cuenta')
  const response = await fetch(`${GRAPH}/${pagina.id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { comment_id: comentarioExternalId },
      message: { text: texto },
      access_token: pagina.token,
    }),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Meta ${response.status}: ${body.slice(0, 200)}`)
  }
  const body = (await response.json()) as { message_id?: string }
  if (!body.message_id) throw new Error('Meta no devolvió el id del mensaje')
  return body.message_id
}
