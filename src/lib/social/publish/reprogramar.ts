import { and, eq, inArray } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets } from '@/db'

export const REPROGRAMAR_PASADO = 'La hora debe estar en el futuro.'
export const DESTINO_NO_EXISTE = 'Ese destino ya no existe.'

export type ResultadoReprogramar = 'reprogramado' | 'no-existe'

/**
 * «Reprogramar» un destino quemado, con la regla que comparten el panel («Se quemó» y la
 * lista de La Parrilla) y la app del teléfono, para que no puedan divergir: el post entero
 * pasa a la hora nueva y el destino quemado vuelve a `scheduled` sin intentos ni error. La
 * hora ya viene validada (en el futuro) por quien llama.
 *
 * El destino se busca atado al dueño; «no existe» y «no es tuyo» son la misma respuesta a
 * propósito.
 */
export async function reprogramarDestino(
  ownerId: string,
  targetId: string,
  scheduledAt: Date,
): Promise<ResultadoReprogramar> {
  const db = getDb()
  const [target] = await db
    .select()
    .from(scheduledPostTargets)
    .where(
      and(
        eq(scheduledPostTargets.id, targetId),
        inArray(
          scheduledPostTargets.postId,
          db.select({ id: scheduledPosts.id }).from(scheduledPosts).where(eq(scheduledPosts.ownerId, ownerId)),
        ),
      ),
    )
  if (!target) return 'no-existe'

  await db.update(scheduledPosts).set({ scheduledAt, updatedAt: new Date() }).where(eq(scheduledPosts.id, target.postId))
  // Back to square one: attempts spent against the old hour say nothing about the new one.
  //
  // `status = 'failed'` en el `where` —como el rearm del editor— es la reja contra la
  // carrera con «Subir ahora»: entre la lectura de arriba y esta escritura el destino
  // puede haber salido publicado, y devolverlo a `scheduled` con `containerId` en null lo
  // haría publicar de nuevo en la vuelta siguiente del cron. Si ya no está quemado no casa
  // ninguna fila.
  await db
    .update(scheduledPostTargets)
    .set({ status: 'scheduled', attemptCount: 0, lastError: null, containerId: null, updatedAt: new Date() })
    .where(and(eq(scheduledPostTargets.id, targetId), eq(scheduledPostTargets.status, 'failed')))
  return 'reprogramado'
}
