import 'server-only'
import { and, asc, eq, gte, inArray, isNotNull, lte } from 'drizzle-orm'
import {
  getDb,
  socialAccounts,
  socialPosts,
  youtubeAnaliticaDesgloses,
  youtubeAnaliticaDias,
  youtubeAnaliticaVideos,
} from '@/db'
import { tieneAnalitica, type Desglose, type DiaDeAnalitica, type ValoresDeAnalitica } from './social/analitica-youtube'

// Lo que Los Números leen de YouTube Analytics (`social/analitica-youtube.ts`). Todo atado al
// dueño: cada consulta cruza con `social_accounts.owner_id` o `social_posts.owner_id`, aunque los
// ids ya lleguen de una lista suya.

export type CanalDeYoutube = {
  id: string
  handle: string | null
  /** Si el canal se conectó dando el permiso de analítica. */
  conAnalitica: boolean
}

/** Los canales de YouTube conectados del dueño, del más antiguo al más nuevo. */
export async function canalesDeYoutube(ownerId: string): Promise<CanalDeYoutube[]> {
  const filas = await getDb()
    .select({ id: socialAccounts.id, handle: socialAccounts.handle, scopes: socialAccounts.scopes })
    .from(socialAccounts)
    .where(and(eq(socialAccounts.ownerId, ownerId), eq(socialAccounts.network, 'youtube'), isNotNull(socialAccounts.refreshToken)))
    .orderBy(asc(socialAccounts.createdAt))
  return filas.map((f) => ({ id: f.id, handle: f.handle, conAnalitica: tieneAnalitica(f.scopes) }))
}

export type DiaDelCanal = DiaDeAnalitica & { accountId: string }

/** Los días de esos canales dentro del período, tal como los guardó la sincronización. */
export async function diasDelCanal(ownerId: string, accountIds: string[], desde: string, hasta: string): Promise<DiaDelCanal[]> {
  if (accountIds.length === 0) return []
  const filas = await getDb()
    .select({
      accountId: youtubeAnaliticaDias.accountId,
      day: youtubeAnaliticaDias.day,
      views: youtubeAnaliticaDias.views,
      engagedViews: youtubeAnaliticaDias.engagedViews,
      minutosVistos: youtubeAnaliticaDias.minutosVistos,
      duracionMedia: youtubeAnaliticaDias.duracionMedia,
      likes: youtubeAnaliticaDias.likes,
      comments: youtubeAnaliticaDias.comments,
      shares: youtubeAnaliticaDias.shares,
      suscriptoresGanados: youtubeAnaliticaDias.suscriptoresGanados,
      suscriptoresPerdidos: youtubeAnaliticaDias.suscriptoresPerdidos,
    })
    .from(youtubeAnaliticaDias)
    .innerJoin(socialAccounts, eq(socialAccounts.id, youtubeAnaliticaDias.accountId))
    .where(
      and(
        eq(socialAccounts.ownerId, ownerId),
        inArray(youtubeAnaliticaDias.accountId, accountIds),
        gte(youtubeAnaliticaDias.day, desde),
        lte(youtubeAnaliticaDias.day, hasta),
      ),
    )
    .orderBy(asc(youtubeAnaliticaDias.day))
  return filas
}

export type DesgloseDelCanal = Desglose & { accountId: string; desde: string; hasta: string }

/** Los desgloses de los últimos 28 días de esos canales. */
export async function desglosesDelCanal(ownerId: string, accountIds: string[]): Promise<DesgloseDelCanal[]> {
  if (accountIds.length === 0) return []
  return getDb()
    .select({
      accountId: youtubeAnaliticaDesgloses.accountId,
      tipo: youtubeAnaliticaDesgloses.tipo,
      clave: youtubeAnaliticaDesgloses.clave,
      views: youtubeAnaliticaDesgloses.views,
      minutosVistos: youtubeAnaliticaDesgloses.minutosVistos,
      porcentaje: youtubeAnaliticaDesgloses.porcentaje,
      desde: youtubeAnaliticaDesgloses.desde,
      hasta: youtubeAnaliticaDesgloses.hasta,
    })
    .from(youtubeAnaliticaDesgloses)
    .innerJoin(socialAccounts, eq(socialAccounts.id, youtubeAnaliticaDesgloses.accountId))
    .where(and(eq(socialAccounts.ownerId, ownerId), inArray(youtubeAnaliticaDesgloses.accountId, accountIds)))
}

export type AnaliticaDeVideo = ValoresDeAnalitica & { porcentajeVisto: number | null; desde: string; hasta: string }

/** Lo de cada video desde que se publicó, por id de post. */
export async function analiticaDeVideos(ownerId: string, postIds: string[]): Promise<Map<string, AnaliticaDeVideo>> {
  if (postIds.length === 0) return new Map()
  const filas = await getDb()
    .select({
      postId: youtubeAnaliticaVideos.postId,
      views: youtubeAnaliticaVideos.views,
      engagedViews: youtubeAnaliticaVideos.engagedViews,
      minutosVistos: youtubeAnaliticaVideos.minutosVistos,
      duracionMedia: youtubeAnaliticaVideos.duracionMedia,
      porcentajeVisto: youtubeAnaliticaVideos.porcentajeVisto,
      likes: youtubeAnaliticaVideos.likes,
      comments: youtubeAnaliticaVideos.comments,
      shares: youtubeAnaliticaVideos.shares,
      suscriptoresGanados: youtubeAnaliticaVideos.suscriptoresGanados,
      suscriptoresPerdidos: youtubeAnaliticaVideos.suscriptoresPerdidos,
      desde: youtubeAnaliticaVideos.desde,
      hasta: youtubeAnaliticaVideos.hasta,
    })
    .from(youtubeAnaliticaVideos)
    .innerJoin(socialPosts, eq(socialPosts.id, youtubeAnaliticaVideos.postId))
    .where(and(eq(socialPosts.ownerId, ownerId), inArray(youtubeAnaliticaVideos.postId, postIds)))
  return new Map(filas.map(({ postId, ...resto }) => [postId, resto]))
}
