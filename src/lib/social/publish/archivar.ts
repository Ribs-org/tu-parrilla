import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets } from '@/db'
import { esUuid } from '@/lib/uuid'

// Archivar lo quemado: que un destino que ya no pide nada —se volvió a programar aparte, era
// una prueba— deje de aparecer en «Se quemó», en el resumen y en el correo del día, sin
// borrar el post. Borrarlo se llevaba el error y los intentos, que es la evidencia para
// reportar un fallo. La regla es una sola para el panel y la API (`api/schedule/posts/{id}/
// archivar`), como `borrarPostProgramado` para el borrado.

/** Por qué no se pudo: la API lo traduce a 404 o 409, el panel a su frase. */
export type FallaDeArchivo = 'no-existe' | 'sin-destino' | 'nada-quemado' | 'no-quemado'

export type ResultadoArchivo = { cambiados: number; postId: string } | { falla: FallaDeArchivo }

export const FRASE_DE_FALLA: Record<FallaDeArchivo, string> = {
  'no-existe': 'Ese post no existe.',
  'sin-destino': 'Ese post no tiene un destino en esa cuenta.',
  'nada-quemado': 'Ese post no tiene nada quemado.',
  'no-quemado': 'Ese destino no está quemado: solo lo quemado se archiva o se desarchiva.',
}

/** Los posts del dueño, para atar cada consulta a él (el arnés de `aislamiento.test.ts`). */
function postsDelDueno(ownerId: string) {
  return getDb().select({ id: scheduledPosts.id }).from(scheduledPosts).where(eq(scheduledPosts.ownerId, ownerId))
}

/**
 * Archiva lo quemado de un post, o lo desarchiva: el destino de la cuenta `cuentaId`, o todos
 * los quemados del post si no se nombra ninguna. Solo un destino `failed` se archiva: lo que
 * está programado, publicando o publicado no pide nada que esconder.
 *
 * Repetirlo no hace nada (`cambiados: 0`): un lote que reintenta no tiene que saber qué
 * alcanzó a pasar. La escritura vuelve a exigir `failed` en su `where`, por la carrera con un
 * rearme («Reprogramar», «Subir ahora», el editor) que llegue entre la lectura y ella: un
 * destino que acaba de volver a la parrilla no se archiva.
 *
 * «No existe» y «no es tuyo» son la misma respuesta a propósito, como en el borrado.
 */
export async function archivarQuemados(
  ownerId: string,
  postId: string,
  opciones: { cuentaId?: string | null; archivar: boolean; ahora?: Date },
): Promise<ResultadoArchivo> {
  // Un id sin forma de uuid no existe: a la base le llegaría como un error, no como cero filas.
  if (!esUuid(postId)) return { falla: 'no-existe' }
  const cuentaId = opciones.cuentaId ?? null
  if (cuentaId !== null && !esUuid(cuentaId)) return { falla: 'sin-destino' }

  const db = getDb()
  const destinos = await db
    .select({
      id: scheduledPostTargets.id,
      accountId: scheduledPostTargets.accountId,
      status: scheduledPostTargets.status,
      archivadoEn: scheduledPostTargets.archivadoEn,
    })
    .from(scheduledPostTargets)
    .where(and(eq(scheduledPostTargets.postId, postId), inArray(scheduledPostTargets.postId, postsDelDueno(ownerId))))
  if (destinos.length === 0) return { falla: 'no-existe' }

  const elegidos =
    cuentaId === null ? destinos.filter((d) => d.status === 'failed') : destinos.filter((d) => d.accountId === cuentaId)
  if (elegidos.length === 0) return { falla: cuentaId === null ? 'nada-quemado' : 'sin-destino' }
  if (elegidos.some((d) => d.status !== 'failed')) return { falla: 'no-quemado' }

  const porCambiar = elegidos.filter((d) => (d.archivadoEn === null) === opciones.archivar)
  if (porCambiar.length === 0) return { cambiados: 0, postId }

  const cambiados = await db
    .update(scheduledPostTargets)
    // Sin `updatedAt`: archivar no cambia el estado de la publicación, y esa columna es la que
    // comparan el reclamo del cron y las guardas del editor.
    .set({ archivadoEn: opciones.archivar ? (opciones.ahora ?? new Date()) : null })
    .where(
      and(
        inArray(
          scheduledPostTargets.id,
          porCambiar.map((d) => d.id),
        ),
        eq(scheduledPostTargets.status, 'failed'),
        opciones.archivar ? isNull(scheduledPostTargets.archivadoEn) : isNotNull(scheduledPostTargets.archivadoEn),
        inArray(scheduledPostTargets.postId, postsDelDueno(ownerId)),
      ),
    )
    .returning({ id: scheduledPostTargets.id })
  return { cambiados: cambiados.length, postId }
}

/**
 * Lo mismo, por el id del destino: es lo que tiene el panel en cada fila de «Se quemó» y del
 * editor. Busca el destino atado al dueño y delega en `archivarQuemados`.
 */
export async function archivarDestino(ownerId: string, targetId: string, archivar: boolean): Promise<ResultadoArchivo> {
  if (!esUuid(targetId)) return { falla: 'no-existe' }
  const [destino] = await getDb()
    .select({ postId: scheduledPostTargets.postId, accountId: scheduledPostTargets.accountId })
    .from(scheduledPostTargets)
    .where(and(eq(scheduledPostTargets.id, targetId), inArray(scheduledPostTargets.postId, postsDelDueno(ownerId))))
  if (!destino) return { falla: 'no-existe' }
  return archivarQuemados(ownerId, destino.postId, { cuentaId: destino.accountId, archivar })
}
