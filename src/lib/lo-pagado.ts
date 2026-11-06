import 'server-only'
import { and, asc, desc, eq, gte, isNull, lte, or, sql } from 'drizzle-orm'
import { anuncios, getDb, socialAccounts, socialPosts } from '@/db'
import type { FilaPagada } from './social/anuncios'

/**
 * Los anuncios del dueño que corrieron en algún momento entre `desde` y `hasta` («YYYY-MM-DD»),
 * cada uno con sus totales de principio a fin y la publicación que promocionó, si es suya.
 *
 * El dueño se ata por la cuenta conectada que leyó cada anuncio, y la publicación también tiene
 * que ser suya. La sincronización deja un anuncio en una sola cuenta del dueño
 * (`anuncios-sync.ts`); el `distinct on` es la red por si dos quedaran: no suma dos veces.
 */
export async function leerLoPagado(ownerId: string, desde: string, hasta: string): Promise<FilaPagada[]> {
  const filas = await getDb()
    .selectDistinctOn([anuncios.externalId], {
      externalId: anuncios.externalId,
      moneda: anuncios.moneda,
      gasto: anuncios.gasto,
      alcance: anuncios.alcance,
      impresiones: anuncios.impresiones,
      clics: anuncios.clics,
      desde: anuncios.desde,
      hasta: anuncios.hasta,
      postId: socialPosts.id,
      network: socialPosts.network,
      accountId: socialPosts.accountId,
      caption: socialPosts.caption,
      campaign: socialPosts.campaign,
      thumbnailUrl: socialPosts.thumbnailUrl,
    })
    .from(anuncios)
    .innerJoin(socialAccounts, eq(socialAccounts.id, anuncios.accountId))
    .leftJoin(socialPosts, and(eq(socialPosts.id, anuncios.postId), eq(socialPosts.ownerId, ownerId)))
    .where(
      and(
        eq(socialAccounts.ownerId, ownerId),
        or(isNull(anuncios.desde), lte(anuncios.desde, hasta)),
        or(isNull(anuncios.hasta), gte(anuncios.hasta, desde)),
      ),
    )
    .orderBy(asc(anuncios.externalId), desc(anuncios.leidoEn))
  return filas.map((f) => ({ ...f, desde: f.desde ?? null, hasta: f.hasta ?? null }))
}

/** Si el dueño tiene algún anuncio guardado, del período que sea: decide qué dice «Lo pagado» vacío. */
export async function tieneAnuncios(ownerId: string): Promise<boolean> {
  const [fila] = await getDb()
    .select({ hay: sql<number>`1` })
    .from(anuncios)
    .innerJoin(socialAccounts, eq(socialAccounts.id, anuncios.accountId))
    .where(eq(socialAccounts.ownerId, ownerId))
    .limit(1)
  return Boolean(fila)
}
