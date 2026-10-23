import type { SocialAccount } from '@/db'
import type { CommentState } from '@/db/schema'

export type { CommentState }

/** Lo que una red cuenta de un comentario, ya normalizado. */
export type ComentarioLeido = {
  externalId: string
  postExternalId: string
  /** Nombre o usuario visible; null cuando la red no lo entrega. */
  author: string | null
  /** El id del autor en la red: con él se reconoce un comentario del propio dueño. */
  authorExternalId: string | null
  text: string
  publishedAt: Date
  /**
   * Las respuestas que ya tiene en la red, las que la red entrega en la misma lectura. Con
   * ellas el sondeo reconoce un comentario que el dueño respondió desde la app de la red, para
   * que no se le responda dos veces desde la cola. Puede no traerlas todas: YouTube entrega
   * unas pocas por hilo.
   */
  respuestas: RespuestaLeida[]
}

/** Una respuesta que un comentario ya tiene en la red. */
export type RespuestaLeida = {
  externalId: string
  /** Como `author` en `ComentarioLeido`: el usuario con @ en Instagram, el nombre en las demás. */
  author: string | null
  authorExternalId: string | null
  text: string
}

/**
 * Lo único que el orquestador sabe de una red. Agregar Threads o X el día que se quiera
 * es un archivo y una línea en el índice, igual que `Connector` y `Publisher`.
 */
export type Comentarista = {
  network: string
  /**
   * Credencial de escritura cuando difiere de la de lectura. YouTube lee con una API key
   * y comenta con OAuth, que es exactamente la razón por la que `Publisher` tiene este
   * mismo campo.
   */
  ensureCredential?(account: SocialAccount): Promise<string | null>
  listar(account: SocialAccount, token: string, postExternalId: string): Promise<ComentarioLeido[]>
  responder(account: SocialAccount, token: string, comentarioExternalId: string, texto: string): Promise<string>
  /** Cuántos caracteres acepta la red en una respuesta. */
  limiteTexto: number
}

// Frases fijas: lo único que el dueño puede llegar a leer de un fallo.
export const SIN_CREDENCIAL = 'Esa cuenta ya no está conectada.'
export const RED_RECHAZO = 'La red no aceptó la respuesta. Inténtalo de nuevo.'
export const COMENTARIO_AUSENTE = 'El comentario ya no está en la red.'
export const PRIVADO_RECHAZADO = 'No se pudo mandar el privado.'
