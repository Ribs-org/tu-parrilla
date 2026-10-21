import { and, eq, inArray } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets } from '@/db'
import { esUuid } from '@/lib/uuid'
import { REARME } from './publisher'

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
  // Un id sin forma de uuid no existe: a la base le llegaría como un error, no como cero filas.
  if (!esUuid(targetId)) return 'no-existe'
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

  // De vuelta a la fila (`REARME`): los intentos gastados contra la hora vieja no dicen nada
  // de la nueva. El contenedor se queda, para que el intento siguiente pregunte primero cómo
  // terminó el anterior.
  //
  // Las dos escrituras van juntas, en una transacción, y en este orden: el destino vuelve a
  // la fila solo si sigue quemado, y la hora del post se mueve solo si volvió. `status =
  // 'failed'` en el `where` —como el rearm del editor— es la reja contra la carrera con
  // «Subir ahora»: entre la lectura de arriba y esta escritura el destino puede haber salido
  // publicado, y devolverlo a `scheduled` lo haría publicar de nuevo en la vuelta siguiente
  // del cron. Antes la hora del post iba primero y sin condición, así que en esa carrera se
  // movía igual, y un destino hermano todavía programado se corría con ella. Si ya no estaba
  // quemado no se toca nada; la pantalla, al repintarse, muestra cómo quedó.
  await db.transaction(async (tx) => {
    const rearmados = await tx
      .update(scheduledPostTargets)
      .set({ ...REARME, updatedAt: new Date() })
      .where(and(eq(scheduledPostTargets.id, targetId), eq(scheduledPostTargets.status, 'failed')))
      .returning({ id: scheduledPostTargets.id })
    if (rearmados.length === 0) return
    await tx
      .update(scheduledPosts)
      .set({ scheduledAt, updatedAt: new Date() })
      .where(and(eq(scheduledPosts.id, target.postId), eq(scheduledPosts.ownerId, ownerId)))
  })
  return 'reprogramado'
}
