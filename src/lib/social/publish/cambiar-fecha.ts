import { esUuid } from '@/lib/uuid'
import { FECHA_ILEGIBLE, parseFecha } from './batch'
import { CONSERVAR, EN_CURSO, POST_NO_EXISTE, YA_SALIO_EN_ALGUNA, editarPostProgramado } from './editar'
import { REPROGRAMAR_PASADO } from './reprogramar'

// Mover un post programado a otra fecha sin borrarlo (`PATCH /api/schedule/posts/{id}` y su lote,
// `PATCH /api/schedule/posts`; issue #375). Antes, por API, la única forma era borrarlo y mandarlo
// de nuevo: se perdía el `id`, la media se volvía a bajar entera, y si el reenvío fallaba a medias
// lo borrado quedaba sin programar. Acá solo cambia la hora; el texto, los archivos ya guardados,
// la portada, los atributos, las opciones de cada destino, la palabra clave y la `ref` quedan como
// están.

/** Lo que dicen `GET`, `PATCH` y `DELETE` de un post que no existe, o que no es del dueño de la llave. */
export const POST_NO_EXISTE_API = 'Ese post no existe.'

/** Un post que ya salió en alguna cuenta: su fecha ya no se mueve, como el `DELETE` no lo borra. */
export const FECHA_YA_PUBLICADO = 'Ya salió en alguna cuenta: su fecha ya no se cambia.'

/** El cuerpo trae algo más que la fecha: por API, lo demás no se edita (se borra y se programa de nuevo). */
export const SOLO_FECHA = 'Solo se cambia «fecha»: el texto, la media y las cuentas no se editan por API.'

/** Cuántos posts mueve el lote de una vez: los mismos que programa `POST /api/schedule/batch`. */
export const MAX_FECHAS_POR_LOTE = 50
export const FECHAS_DEMASIADAS = `Máximo ${MAX_FECHAS_POR_LOTE} posts por lote.`
export const FECHAS_CUERPO = 'El cuerpo debe ser JSON con { posts: [{ id, fecha }] }.'
export const ID_REPETIDO = 'Ese post ya viene más arriba en el lote.'

export type ResultadoDeFecha = { ok: true } | { error: string; status: 400 | 404 | 409 }

/**
 * Lleva el post `postId` del dueño a `fecha` («YYYY-MM-DD HH:MM», en la zona del dueño, como en
 * el lote). Pasa por la regla del editor del panel y del teléfono (`editarPostProgramado`), con
 * todo lo demás conservado y la reja del teléfono —nada si ya salió en alguna cuenta—, así que
 * valen las mismas validaciones que al programar: la hora en el futuro, las cuentas todavía
 * conectadas y lo que cada red acepta. Un destino que se quemó vuelve a la cola con la hora nueva,
 * como al guardar en el editor. Si algo no pasa, el post queda en su fecha de antes.
 */
export async function cambiarFecha(
  ownerId: string,
  postId: string,
  fecha: unknown,
  zona: string,
  ahora: Date = new Date(),
): Promise<ResultadoDeFecha> {
  // Un id sin forma de uuid no existe: a la base le llegaría como un error, no como cero filas.
  if (!esUuid(postId)) return { error: POST_NO_EXISTE_API, status: 404 }
  const cuando = typeof fecha === 'string' ? parseFecha(fecha, zona) : null
  if (!cuando) return { error: FECHA_ILEGIBLE, status: 400 }
  // Aunque sea la misma fecha que tiene: el editor deja guardar una hora ya pasada si no cambió
  // (corregir el texto de lo que falló), y acá eso volvería a la cola un destino quemado para el
  // minuto siguiente. Mover es siempre a una hora que todavía no llega.
  if (cuando.getTime() <= ahora.getTime()) return { error: REPROGRAMAR_PASADO, status: 400 }

  const resultado = await editarPostProgramado(
    ownerId,
    postId,
    {
      caption: CONSERVAR,
      scheduledAt: cuando,
      cuentas: { quitar: [] },
      media: CONSERVAR,
      portada: CONSERVAR,
      atributos: CONSERVAR,
      regla: CONSERVAR,
    },
    { soloSinPublicar: true },
  )
  if ('ok' in resultado) return { ok: true }
  if (resultado.error === POST_NO_EXISTE) return { error: POST_NO_EXISTE_API, status: 404 }
  if (resultado.error === YA_SALIO_EN_ALGUNA) return { error: FECHA_YA_PUBLICADO, status: 409 }
  if (resultado.error === EN_CURSO) return { error: EN_CURSO, status: 409 }
  return { error: resultado.error, status: 400 }
}

/** Si el cuerpo de un cambio de fecha trae algo más que `fecha` (y, en el lote, `id`). */
export function traeMasQueLaFecha(cuerpo: Record<string, unknown>, permitidas: readonly string[]): boolean {
  return Object.keys(cuerpo).some((clave) => !permitidas.includes(clave))
}
