import 'server-only'
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { getDb, scheduledPostMedia, scheduledPosts, scheduledPostTargets } from '@/db'
import type { Publicado } from '@/lib/que-funciona'
import type { Atributos } from '@/lib/social/publish/atributos'

/**
 * Los atributos con que se programó cada publicación, por `${red}:${externalId}`.
 * Un post orgánico —subido a mano, fuera del calendario— simplemente no aparece.
 */
export async function attributesFor(
  ownerId: string,
  rows: Array<{ network: string; externalId: string }>,
): Promise<Map<string, Atributos | null>> {
  const mapa = new Map<string, Atributos | null>()
  const externalIds = rows.map((row) => row.externalId)
  if (externalIds.length === 0) return mapa

  const programados = await getDb()
    .select({
      network: scheduledPostTargets.network,
      externalId: scheduledPostTargets.externalId,
      atributos: scheduledPosts.atributos,
    })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .where(
      and(
        isNotNull(scheduledPostTargets.externalId),
        inArray(scheduledPostTargets.externalId, externalIds),
        eq(scheduledPosts.ownerId, ownerId),
      ),
    )

  for (const fila of programados) {
    mapa.set(`${fila.network}:${fila.externalId}`, (fila.atributos as Atributos | null) ?? null)
  }
  return mapa
}

/**
 * Lo mismo que `attributesFor`, y además cómo salió cada publicación desde Tu Parrilla: las
 * opciones de su destino y si el post iba solo en fotos, que es lo que «Qué te funciona» mira
 * para la música (`musicaDe`, en `que-funciona.ts`). Lo subido a mano tampoco aparece acá: de
 * eso no se sabe si llevó música. Aparte de `attributesFor` para no sumarle a cada lectura de
 * atributos la consulta por los videos del post.
 */
export async function publicadosDesdeTuParrilla(
  ownerId: string,
  rows: Array<{ network: string; externalId: string }>,
): Promise<Map<string, { atributos: Atributos | null; publicado: Publicado }>> {
  const mapa = new Map<string, { atributos: Atributos | null; publicado: Publicado }>()
  const externalIds = rows.map((row) => row.externalId)
  if (externalIds.length === 0) return mapa

  const programados = await getDb()
    .select({
      network: scheduledPostTargets.network,
      externalId: scheduledPostTargets.externalId,
      atributos: scheduledPosts.atributos,
      opciones: scheduledPostTargets.opciones,
      // Un video que ya salió se borra del almacén con su fila (`limpiarMedia`) y queda contado
      // en `videos_liberados`: sin esa cuenta, un video publicado parecería un post sin archivos.
      soloFotos: sql<boolean>`${scheduledPosts.videosLiberados} = 0 and not exists (
        select 1 from ${scheduledPostMedia}
        where ${scheduledPostMedia.postId} = ${scheduledPosts.id} and ${scheduledPostMedia.mediaType} = 'video'
      )`,
    })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .where(
      and(
        isNotNull(scheduledPostTargets.externalId),
        inArray(scheduledPostTargets.externalId, externalIds),
        eq(scheduledPosts.ownerId, ownerId),
      ),
    )

  for (const fila of programados) {
    mapa.set(`${fila.network}:${fila.externalId}`, {
      atributos: (fila.atributos as Atributos | null) ?? null,
      publicado: { opciones: fila.opciones ?? null, soloFotos: Boolean(fila.soloFotos) },
    })
  }
  return mapa
}
