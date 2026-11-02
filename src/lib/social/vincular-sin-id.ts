import 'server-only'
import { and, eq, gte, inArray, isNull } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets, socialPosts } from '@/db'
import type { SocialAccount } from '@/db'
import { DESPUES_BORRADOR_MS, emparejarVideos } from './tiktok-vinculo'

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Qué se lee: los videos del último mes y los destinos de los dos últimos. Un destino en modo
 * borrador puede tener su video hasta treinta días después (`DESPUES_BORRADOR_MS`), así que un
 * video de este mes puede ser de un destino del mes pasado, y la lista de ids ya tomados tiene
 * que verlo para no dárselo a otro. Lo más viejo ya pasó por las sincronizaciones de cada día.
 * Antes se leía el historial entero de la cuenta en cada sincronización.
 */
export const VIDEOS_DESDE_MS = DESPUES_BORRADOR_MS + 2 * DIA_MS
export const DESTINOS_DESDE_MS = 2 * VIDEOS_DESDE_MS

/**
 * Le pone su id a lo que salió por Tu Parrilla sin él, cruzándolo con lo que la sincronización
 * acaba de traer de esa misma cuenta (`emparejarVideos`, en `tiktok-vinculo.ts`, dice cómo se
 * cruza). Corre al final de cada sincronización de una cuenta de TikTok o de Instagram, así que
 * también arregla los que ya estaban.
 *
 * - TikTok no siempre manda el id del video (`tiktok-vinculo.ts` dice cuándo).
 * - Instagram, cuando un intento publicó pero no contestó, o contestó con un error igual: el
 *   contenedor dice PUBLISHED y no trae el id (`publish/instagram.ts`). Sin el id, además de
 *   sus números, el post pierde su regla de palabra clave, que se busca por él (`reglasPara`).
 *
 * Solo toca destinos publicados y sin id, y solo les escribe el id si siguen sin él: nunca
 * pisa uno que llegó por `status/fetch`. Devuelve cuántos vinculó.
 *
 * El dueño va en el WHERE de las tres consultas —el destino no tiene `owner_id`, así que se
 * ata por su post—, que es lo que vigila `src/lib/aislamiento.test.ts`.
 */
export async function vincularSinId(
  account: Pick<SocialAccount, 'id' | 'ownerId'>,
  red: 'tiktok' | 'instagram' = 'tiktok',
  now: Date = new Date(),
): Promise<number> {
  if (!account.ownerId) return 0
  const db = getDb()

  const destinos = await db
    .select({
      id: scheduledPostTargets.id,
      externalId: scheduledPostTargets.externalId,
      status: scheduledPostTargets.status,
      captionOverride: scheduledPostTargets.captionOverride,
      opciones: scheduledPostTargets.opciones,
      caption: scheduledPosts.caption,
      scheduledAt: scheduledPosts.scheduledAt,
    })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .where(
      and(
        eq(scheduledPostTargets.accountId, account.id),
        eq(scheduledPostTargets.network, red),
        gte(scheduledPosts.scheduledAt, new Date(now.getTime() - DESTINOS_DESDE_MS)),
        eq(scheduledPosts.ownerId, account.ownerId),
      ),
    )

  const sinId = destinos.filter((d) => d.status === 'published' && !d.externalId)
  if (sinId.length === 0) return 0
  const tomados = new Set(destinos.flatMap((d) => (d.externalId ? [d.externalId] : [])))

  const videos = (
    await db
      .select({ externalId: socialPosts.externalId, caption: socialPosts.caption, publishedAt: socialPosts.publishedAt })
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.accountId, account.id),
          gte(socialPosts.publishedAt, new Date(now.getTime() - VIDEOS_DESDE_MS)),
          eq(socialPosts.ownerId, account.ownerId),
        ),
      )
  ).filter((v) => !tomados.has(v.externalId))

  const pares = emparejarVideos(
    sinId.map((d) => ({
      id: d.id,
      caption: d.captionOverride ?? d.caption,
      scheduledAt: d.scheduledAt,
      borrador:
        red === 'tiktok' &&
        typeof d.opciones === 'object' && d.opciones !== null && (d.opciones as { modo?: unknown }).modo === 'borrador',
    })),
    videos,
  )

  let vinculados = 0
  for (const [destino, externalId] of pares) {
    const escritos = await db
      .update(scheduledPostTargets)
      .set({ externalId, updatedAt: new Date() })
      .where(
        and(
          eq(scheduledPostTargets.id, destino),
          isNull(scheduledPostTargets.externalId),
          inArray(
            scheduledPostTargets.postId,
            db.select({ id: scheduledPosts.id }).from(scheduledPosts).where(eq(scheduledPosts.ownerId, account.ownerId)),
          ),
        ),
      )
      .returning({ id: scheduledPostTargets.id })
    vinculados += escritos.length
  }
  return vinculados
}
