import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { getDb, scheduledPostTargets, scheduledPosts } from '@/db'
import { historiaDe } from './opciones'

// Las historias de una secuencia salen en orden. Todas llevan la misma hora, pero el
// publicador no garantiza el orden entre posts de la misma hora, y un video que procesa deja
// pasar a la foto de atrás: cada historia espera a la anterior de la misma cuenta.

/** El lugar de un destino en su secuencia, o null si no es una historia de una secuencia. */
export function lugarEnSecuencia(network: string, opciones: unknown): { secuencia: string; orden: number } | null {
  const historia = historiaDe(network, opciones)
  return historia === null || historia === true ? null : historia
}

/**
 * Lo vencido, en el orden en que tiene que salir: por hora, y dentro de una misma hora las
 * historias de una secuencia por su lugar. Así, en una misma corrida, la 1 sale antes que la 2
 * y la 2 la encuentra ya publicada si era una foto. Lo demás conserva el orden que traía.
 */
export function ordenarParaPublicar<T extends { target: { network: string; opciones: unknown }; post: { scheduledAt: Date } }>(
  filas: T[],
): T[] {
  return filas
    .map((fila, i) => ({ fila, i, orden: lugarEnSecuencia(fila.target.network, fila.target.opciones)?.orden ?? 0 }))
    .sort((a, b) => a.fila.post.scheduledAt.getTime() - b.fila.post.scheduledAt.getTime() || a.orden - b.orden || a.i - b.i)
    .map(({ fila }) => fila)
}

/**
 * Si la historia anterior de la secuencia, en la misma cuenta, todavía no salió. Si salió, o
 * se quemó, o ya no existe (la borraron), esta sigue: una que se quemó no deja atascadas a las
 * demás. La consulta va atada al dueño del post.
 */
export async function esperaALaAnterior(
  ownerId: string,
  accountId: string,
  lugar: { secuencia: string; orden: number },
): Promise<boolean> {
  if (lugar.orden <= 1) return false
  const historia = sql`${scheduledPostTargets.opciones} -> 'historia'`
  const [anterior] = await getDb()
    .select({ status: scheduledPostTargets.status })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .where(
      and(
        eq(scheduledPostTargets.accountId, accountId),
        sql`${historia} ->> 'secuencia' = ${lugar.secuencia}`,
        sql`${historia} ->> 'orden' = ${String(lugar.orden - 1)}`,
        eq(scheduledPosts.ownerId, ownerId),
      ),
    )
    .limit(1)
  return anterior !== undefined && anterior.status !== 'published' && anterior.status !== 'failed'
}
