import type { SocialAccount } from '@/db'
import { paginaSiguiente, threadsConnector } from '../threads'
import { COMENTARIO_AUSENTE, type Comentarista, type ComentarioLeido, type RespuestaLeida } from './comentarista'
import { GRAPH_OBJETO_AUSENTE, codigoGraph, pedirGraph } from './graph'
import { recortar } from './ventana'

const GRAPH = 'https://graph.threads.net/v1.0'
/** El mismo tope que un post de Threads: una respuesta es un post más. */
const LIMITE = 500
// Salvaguarda de cuota y de tiempo, no promesa de completitud: lo de la página seis se ve en la pasada siguiente.
const MAX_PAGINAS = 5

export type ThreadsReplyPayload = {
  id?: string
  text?: string
  username?: string
  timestamp?: string
  replied_to?: { id?: string }
  is_reply_owned_by_me?: boolean
  hide_status?: string
}

/** Lo que Threads ya sacó de la vista pública: no tiene sentido contestarlo. */
const OCULTAS = new Set(['HIDDEN', 'COVERED', 'BLOCKED', 'RESTRICTED'])

/**
 * Threads no entrega el id de quien respondió, solo su usuario y si la respuesta es de la
 * cuenta (`is_reply_owned_by_me`). Con eso basta para lo que el id hace acá —reconocer lo del
 * propio dueño—: la suya lleva el id de la cuenta, y la de los demás va sin id.
 */
function autorDe(raw: ThreadsReplyPayload, account: SocialAccount): { author: string | null; authorExternalId: string | null } {
  return {
    author: raw.username ? `@${raw.username}` : null,
    authorExternalId: raw.is_reply_owned_by_me ? account.externalId : null,
  }
}

/**
 * La conversación de un post llega aplanada, con todas las respuestas a cualquier
 * profundidad. Los comentarios de la cola son las respuestas directas al post; las respuestas
 * a cada una van en sus `respuestas`, que es lo que deja ver si el dueño ya contestó desde la
 * app. Lo que cuelga más abajo no entra, como en Instagram.
 */
export function normalizeThreadsConversation(
  data: ThreadsReplyPayload[],
  postExternalId: string,
  account: SocialAccount,
): ComentarioLeido[] {
  const respuestasDe = new Map<string, RespuestaLeida[]>()
  for (const raw of data) {
    const padre = raw.replied_to?.id
    if (!raw.id || !padre || padre === postExternalId) continue
    const lista = respuestasDe.get(padre) ?? []
    lista.push({ externalId: raw.id, ...autorDe(raw, account), text: raw.text ?? '' })
    respuestasDe.set(padre, lista)
  }

  const leidos: ComentarioLeido[] = []
  for (const raw of data) {
    if (!raw.id || raw.replied_to?.id !== postExternalId) continue
    if (raw.hide_status && OCULTAS.has(raw.hide_status)) continue
    const fecha = new Date(raw.timestamp ?? '')
    leidos.push({
      externalId: raw.id,
      postExternalId,
      ...autorDe(raw, account),
      // Una respuesta puede ser solo una imagen: la columna es NOT NULL.
      text: raw.text ?? '',
      // Sin fecha de la red, la del descubrimiento: 1970 hundiría la fila al fondo de la cola.
      publishedAt: Number.isNaN(fecha.getTime()) ? new Date() : fecha,
      respuestas: respuestasDe.get(raw.id) ?? [],
    })
  }
  return leidos
}

/**
 * Un POST de formulario a Threads; lanza con el cuerpo si la red dijo que no. `aRespuesta` es
 * el paso que nombra la respuesta a contestar: solo ahí un 404 o un código 100 quieren decir
 * que ya no está.
 */
async function postThreads(url: string, params: Record<string, string>, aRespuesta: boolean): Promise<{ id?: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })
  if (!response.ok) {
    const body = await response.text()
    // Como en Graph: a una respuesta que ya no está, Threads le contesta con el código 100.
    if (aRespuesta && (response.status === 404 || codigoGraph(body) === GRAPH_OBJETO_AUSENTE)) {
      throw new Error(COMENTARIO_AUSENTE)
    }
    throw new Error(`Threads ${response.status}: ${body.slice(0, 200)}`)
  }
  return (await response.json()) as { id?: string }
}

export const threadsComentarista: Comentarista = {
  network: 'threads',
  // La credencial del conector: sin los permisos extra de Threads es null, y la cuenta no se
  // sondea ni se le responde, como una desconectada.
  ensureCredential: (account) => threadsConnector.ensureCredential(account),
  limiteTexto: LIMITE,

  async listar(account, token, postExternalId) {
    const fields = 'id,text,username,timestamp,replied_to,is_reply_owned_by_me,hide_status'
    // Del más viejo al más nuevo, como el borde de Instagram: así el cursor avanza hacia lo nuevo.
    let url = `${GRAPH}/${postExternalId}/conversation?fields=${fields}&reverse=false&limit=50&access_token=${token}`
    const crudas: ThreadsReplyPayload[] = []
    for (let pagina = 0; pagina < MAX_PAGINAS && url; pagina++) {
      const data = (await pedirGraph('Threads', url)) as {
        data?: ThreadsReplyPayload[]
        paging?: { next?: string; cursors?: { after?: string } }
      }
      const filas = data.data ?? []
      crudas.push(...filas)
      url = paginaSiguiente(url, data.paging, filas.length === 0)
    }
    return normalizeThreadsConversation(crudas, postExternalId, account)
  },

  /**
   * Responder en Threads es publicar: un contenedor de texto con `reply_to_id` y después su
   * `threads_publish`. El texto queda listo al tiro, así que no hay que esperar al contenedor.
   */
  async responder(account, token, comentarioExternalId, texto) {
    const userId = account.externalId
    if (!userId) throw new Error('La cuenta de Threads no tiene id')
    const contenedor = await postThreads(`${GRAPH}/${userId}/threads`, {
      media_type: 'TEXT',
      text: recortar(texto, LIMITE),
      reply_to_id: comentarioExternalId,
      access_token: token,
    }, true)
    if (!contenedor.id) throw new Error('Threads no devolvió el contenedor de la respuesta')
    const publicado = await postThreads(`${GRAPH}/${userId}/threads_publish`, {
      creation_id: contenedor.id,
      access_token: token,
    }, false)
    if (!publicado.id) throw new Error('Threads no devolvió el id de la respuesta')
    return publicado.id
  },
}
