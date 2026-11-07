import type { CommentState, DmState } from '@/db/schema'
import type { ComentarioFila, EstadoCola } from './comentarios-cola'
import { agruparPorPublicacion } from './social/comentarios/agrupar'
import { COMENTARIO_AUSENTE, SIN_CREDENCIAL } from './social/comentarios/comentarista'
import { SIN_BORRADOR } from './social/comentarios/modelo'
import { ESCRIBE_RESPUESTA } from './social/comentarios/validar'

/*
 * La Mesa en el teléfono: lo que `GET /api/mobile/comentarios` manda, ya agrupado por publicación
 * como lo dibuja el panel (`agruparPorPublicacion`), con los nombres en castellano del resto de la
 * API del teléfono. Puro, para probarlo sin base. Las reglas —qué entra en cada filtro, quién
 * puede responder qué, el largo de cada red— son las del panel, en el servidor: el teléfono solo
 * dibuja y manda.
 */

/** Los filtros por estado que ofrece el teléfono: «Descartados» y «Todos» se quedan en el panel. */
export const ESTADOS_DEL_TELEFONO = ['pendientes', 'enviados', 'automaticas'] as const satisfies readonly EstadoCola[]

export type ComentarioMovil = {
  id: string
  /** Quien comentó, o null si la red no lo dio: la app dice «Alguien». */
  autor: string | null
  /** Puede llegar vacío (ver la investigación de los comentarios de Instagram en `docs/pendientes.md`). */
  texto: string
  /** ISO en UTC: «hace 3 horas» lo cuenta el teléfono contra su reloj. */
  publicadoEl: string
  estado: CommentState
  /** El borrador de la IA, o lo que salió si ya se respondió. */
  borrador: string | null
  borradorError: string | null
  /** Por qué falló el último envío, o por qué se descartó solo. */
  error: string | null
  /** Lo tomó la respuesta automática por palabra clave. */
  automatico: boolean
  /** Solo con los privados encendidos para la cuenta y algo que contar; si no, null. */
  privado: { estado: Exclude<DmState, 'no'>; error: string | null } | null
}

export type PublicacionMovil = {
  id: string
  red: string
  cuenta: string | null
  texto: string | null
  miniatura: string | null
  enlace: string | null
  /** La palabra clave de la respuesta automática, si la publicación tiene una. */
  palabraClave: string | null
  comentarios: ComentarioMovil[]
}

export type MesaMovil = {
  estado: EstadoCola
  red: string | null
  /** Los botones de red de este dueño, como en el panel (`redesDeLaMesa`). */
  redes: readonly string[]
  /** Cuántos esperan respuesta en la red elegida, sin importar el estado elegido, como en el panel. */
  pendientes: number
  publicaciones: PublicacionMovil[]
}

function comentario(fila: ComentarioFila, mostrarPrivado: boolean): ComentarioMovil {
  return {
    id: fila.id,
    autor: fila.author,
    texto: fila.text ?? '',
    publicadoEl: fila.publishedAt.toISOString(),
    estado: fila.state,
    borrador: fila.draft,
    borradorError: fila.draftError,
    error: fila.error,
    automatico: fila.automatico,
    privado:
      mostrarPrivado && fila.dmState !== 'no' ? { estado: fila.dmState, error: fila.dmError } : null,
  }
}

export function mesaParaElTelefono(
  filas: ComentarioFila[],
  filtro: { estado: EstadoCola; red: string | null },
  redes: readonly string[],
  pendientes: number,
  mostrarPrivado: boolean,
): MesaMovil {
  return {
    estado: filtro.estado,
    red: filtro.red,
    redes,
    pendientes,
    publicaciones: agruparPorPublicacion(filas).map((g) => {
      const primero = g.comentarios[0]!
      return {
        id: g.postExternalId,
        red: primero.network,
        cuenta: primero.accountHandle,
        texto: primero.postCaption,
        miniatura: primero.postThumbnailUrl,
        enlace: primero.postPermalink,
        palabraClave: primero.reglaPalabra ? primero.reglaPalabra.toUpperCase() : null,
        comentarios: g.comentarios.map((c) => comentario(c, mostrarPrivado)),
      }
    }),
  }
}

/**
 * El código HTTP de cada frase de La Mesa: la app muestra la frase igual, pero un `404` sin frase
 * es otra cosa —un servidor de antes, sin estas rutas— y así se distingue. Las validaciones del
 * texto son un `400`; que la red o la IA no respondan, un `502`; la cuenta desconectada, un `409`.
 */
export function codigoDeLaMesa(frase: string): number {
  if (frase === COMENTARIO_AUSENTE) return 404
  if (frase === ESCRIBE_RESPUESTA || frase.startsWith('La respuesta no puede pasar de')) return 400
  if (frase === SIN_BORRADOR) return 502
  if (frase === SIN_CREDENCIAL) return 409
  return 502
}
