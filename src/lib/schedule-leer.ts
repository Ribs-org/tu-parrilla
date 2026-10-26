import 'server-only'
import { and, asc, eq, inArray, type SQL } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostMedia, scheduledPostTargets, socialAccounts } from '@/db'
import { armarProgramados, type PostProgramadoApi } from '@/lib/schedule-api'

/**
 * Los posts programados del dueño que cumplen `condiciones`, con sus destinos y su media,
 * en la forma de la API. La comparten `GET /api/schedule/posts` (por ventana o estado) y
 * `GET /api/schedule/posts/{id}` (uno solo), para que las dos respuestas no puedan diferir.
 *
 * El dueño va siempre en el `where`, sumado a lo que pida quien llama. `leftJoin` y no
 * `innerJoin` con `socialAccounts`: un destino cuya cuenta ya no exista no debe desaparecer
 * de la respuesta — mismo criterio que el calendario del panel (`(dash)/schedule/page.tsx`).
 * El id del destino sigue viniendo de `scheduledPostTargets.accountId`, no de este join;
 * solo el handle depende de él. La media va por los ids que la primera consulta ya filtró.
 */
export async function leerProgramados(ownerId: string, condiciones: SQL[], zone: string): Promise<PostProgramadoApi[]> {
  const db = getDb()
  const filas = await db
    .select({ post: scheduledPosts, target: scheduledPostTargets, handle: socialAccounts.handle })
    .from(scheduledPosts)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .leftJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(and(...condiciones, eq(scheduledPosts.ownerId, ownerId)))
    .orderBy(asc(scheduledPosts.scheduledAt), asc(scheduledPostTargets.network))

  const ids = [...new Set(filas.map((f) => f.post.id))]
  const medias = ids.length
    ? await db.select().from(scheduledPostMedia).where(inArray(scheduledPostMedia.postId, ids))
    : []

  return armarProgramados(filas, medias, zone)
}
