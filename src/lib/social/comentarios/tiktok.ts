import type { SocialAccount } from '@/db'
import { API_BUSINESS, credencialDeComentarios, desempaquetar, pedirBusiness } from '../tiktok-business'
import type { Comentarista, ComentarioLeido, RespuestaLeida } from './comentarista'
import { recortar } from './ventana'

/** El tope de una respuesta por la API (`/business/comment/reply/create/`). */
const LIMITE = 1200
/** Lo más que TikTok da por página. */
const POR_PAGINA = 30
// Salvaguarda de cuota y de tiempo, no promesa de completitud, como en Threads.
const MAX_PAGINAS = 5

type RespuestaPayload = {
  comment_id?: string | number
  text?: string
  owner?: boolean
  username?: string
  display_name?: string
  unique_identifier?: string
  user_id?: string
}

export type TikTokCommentPayload = RespuestaPayload & {
  video_id?: string
  create_time?: string | number
  status?: string
  parent_comment_id?: string
  /** Hasta tres respuestas por comentario, con `include_replies=true`. */
  reply_list?: RespuestaPayload[]
}

/**
 * TikTok da el usuario, el nombre visible y un id de quien comentó, y además si es la propia
 * cuenta (`owner`). El id de la fila es el de la app de publicar, que no es ninguno de esos: lo del
 * dueño se marca con él, como en Threads, para que `estadoInicial` y `respuestaDelDueno` lo
 * reconozcan.
 */
function autorDe(raw: RespuestaPayload, account: SocialAccount): { author: string | null; authorExternalId: string | null } {
  return {
    author: raw.username ? `@${raw.username}` : (raw.display_name ?? null),
    authorExternalId: raw.owner ? account.externalId : (raw.unique_identifier ?? raw.user_id ?? null),
  }
}

/**
 * Los comentarios de primer nivel de un video, con las respuestas que TikTok trae pegadas. Una
 * respuesta suelta (con `parent_comment_id`) no entra a la cola: es la conversación de otro.
 */
export function normalizeTikTokComments(
  data: TikTokCommentPayload[],
  postExternalId: string,
  account: SocialAccount,
): ComentarioLeido[] {
  const leidos: ComentarioLeido[] = []
  for (const raw of data) {
    if (raw.comment_id === undefined || raw.parent_comment_id) continue
    if (raw.status && raw.status !== 'PUBLIC') continue
    const segundos = Number(raw.create_time)
    const respuestas: RespuestaLeida[] = (raw.reply_list ?? []).flatMap((r) =>
      r.comment_id === undefined ? [] : [{ externalId: String(r.comment_id), ...autorDe(r, account), text: r.text ?? '' }],
    )
    leidos.push({
      externalId: String(raw.comment_id),
      postExternalId,
      ...autorDe(raw, account),
      // Un comentario puede ser solo una imagen: la columna es NOT NULL.
      text: raw.text ?? '',
      // Sin fecha de la red, la del descubrimiento: 1970 hundiría la fila al fondo de la cola.
      publishedAt: Number.isFinite(segundos) && segundos > 0 ? new Date(segundos * 1000) : new Date(),
      respuestas,
    })
  }
  return leidos
}

export const tiktokComentarista: Comentarista = {
  network: 'tiktok',
  // La credencial de la app de TikTok for Business, no la de publicar: esa no lee comentarios.
  // Null mientras los comentarios de TikTok estén cerrados para el dueño o la cuenta no los
  // haya activado, y entonces la cuenta no se sondea.
  ensureCredential: (account) => credencialDeComentarios(account),
  limiteTexto: LIMITE,

  async listar(account, token, postExternalId) {
    const { openId, token: acceso } = desempaquetar(token)
    const crudos: TikTokCommentPayload[] = []
    let cursor = 0
    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const url = new URL(`${API_BUSINESS}/business/comment/list/`)
      url.searchParams.set('business_id', openId)
      url.searchParams.set('video_id', postExternalId)
      url.searchParams.set('include_replies', 'true')
      // Solo lo público: lo oculto por el dueño o por la moderación de TikTok no se contesta.
      url.searchParams.set('status', 'PUBLIC')
      // Lo más nuevo primero: si un video tiene más de cinco páginas, lo que queda fuera es lo viejo.
      url.searchParams.set('sort_field', 'create_time')
      url.searchParams.set('sort_order', 'desc')
      url.searchParams.set('max_count', String(POR_PAGINA))
      url.searchParams.set('cursor', String(cursor))
      const data = await pedirBusiness<{ comments?: TikTokCommentPayload[]; cursor?: number; has_more?: boolean }>(
        url.toString(),
        { headers: { 'Access-Token': acceso } },
      )
      crudos.push(...(data.comments ?? []))
      // TikTok puede devolver menos de lo pedido con `has_more` en true: se sigue por el cursor, no por el largo.
      if (!data.has_more || typeof data.cursor !== 'number' || data.cursor === cursor) break
      cursor = data.cursor
    }
    return normalizeTikTokComments(crudos, postExternalId, account)
  },

  /** Responder pide el video además del comentario: es el único comentarista que usa `postExternalId`. */
  async responder(_account, token, comentarioExternalId, texto, postExternalId) {
    if (!postExternalId) throw new Error('TikTok necesita el video para responder un comentario')
    const { openId, token: acceso } = desempaquetar(token)
    const data = await pedirBusiness<{ comment_id?: string | number }>(`${API_BUSINESS}/business/comment/reply/create/`, {
      method: 'POST',
      headers: { 'Access-Token': acceso, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: openId,
        video_id: postExternalId,
        comment_id: comentarioExternalId,
        text: recortar(texto, LIMITE),
      }),
    })
    if (data.comment_id === undefined) throw new Error('TikTok no devolvió el id de la respuesta')
    return String(data.comment_id)
  },
}
