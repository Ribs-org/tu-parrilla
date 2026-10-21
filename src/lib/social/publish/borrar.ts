import { and, eq, inArray } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets } from '@/db'
import { impideBorrar } from '@/lib/schedule-api'

export type ResultadoBorrado = 'borrado' | 'no-existe' | 'publicado'

/**
 * Borra un post programado con la regla que comparten el panel y la API, para que las
 * dos no puedan divergir: borrar la fila no despublica nada en la red, así que si algún
 * destino ya está publicado, publicando o en manos de una corrida se rechaza
 * (`impideBorrar`). Se lleva el post, sus destinos, su media y su regla —todo cuelga de él
 * en cascada—; los archivos quedan en R2 hasta el barrido de huérfanos, como con cualquier
 * borrado.
 *
 * Revisar y borrar van en una transacción, con los destinos bloqueados (`FOR UPDATE`) entre
 * una cosa y la otra: una corrida que reclama un destino justo entonces espera a que esto
 * termine —y ya no lo encuentra—, y una que lo reclamó antes se ve en la lectura. En dos
 * pasos sueltos, el destino podía salir a la red con el post ya borrado.
 *
 * Las dos consultas van atadas al dueño en el `where` —la de los destinos, en la subconsulta
 * que elige el post—, que es lo que el arnés de aislamiento vigila. «No existe» es que el
 * `DELETE` no encontró nada: «no existe» y «no es tuyo» son la misma respuesta a propósito.
 */
export async function borrarPostProgramado(ownerId: string, postId: string): Promise<ResultadoBorrado> {
  return getDb().transaction(async (tx) => {
    const delDueno = tx
      .select({ id: scheduledPosts.id })
      .from(scheduledPosts)
      .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.ownerId, ownerId)))
    const destinos = await tx
      .select({ status: scheduledPostTargets.status, reclamadoHasta: scheduledPostTargets.reclamadoHasta })
      .from(scheduledPostTargets)
      .where(inArray(scheduledPostTargets.postId, delDueno))
      .for('update')
    if (impideBorrar(destinos)) return 'publicado'

    const borrados = await tx
      .delete(scheduledPosts)
      .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.ownerId, ownerId)))
      .returning({ id: scheduledPosts.id })
    return borrados.length > 0 ? 'borrado' : 'no-existe'
  })
}
