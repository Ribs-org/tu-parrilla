import 'server-only'
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm'
import {
  getDb,
  socialAccounts,
  socialPosts,
  youtubeAnaliticaDesgloses,
  youtubeAnaliticaDias,
  youtubeAnaliticaVideos,
} from '@/db'
import type { SocialAccount } from '@/db'
import { localDay } from '../analytics'
import { analiticaDeYoutubeAbiertaPara } from '../redes-abiertas'
import { buscarPorId } from '../usuarios'
import { ZONA_POR_DEFECTO } from '../zona'
import {
  DIAS_DE_DESGLOSE,
  ErrorDeAnalitica,
  audienciaDe,
  consultaDeAudiencia,
  consultaDeDias,
  consultaDePaises,
  consultaDeTrafico,
  consultaDeVideos,
  consultar,
  diasDe,
  gruposDeVideos,
  paisesDe,
  pasosParaBorrarAnalitica,
  restarDias,
  sinAnalitica,
  tieneAnalitica,
  traficoDe,
  videosDe,
} from './analitica-youtube'
import { ensureYoutubeCredential } from './publish/youtube'

// La lectura diaria de YouTube Analytics (`analitica-youtube.ts`), al final de `syncAll` y por su
// cuenta, como los anuncios: un tropiezo acá no pinta de rojo un canal cuya lectura de siempre
// —la de la API key— ya quedó guardada.
//
// Por canal: los días (la primera vez, `DIAS_DE_HISTORIA`; después, los últimos
// `DIAS_DE_REFRESCO`, que es lo que YouTube todavía corrige), los desgloses de los últimos 28
// días, y cada video conocido desde que se publicó. Lo que contesta deja la marca
// `analitica_verificada_en`: la comprobación de autorización que piden las políticas cada 30 días
// (`politica-youtube.ts`). Si YouTube dice que el token ya no vale o no trae el permiso, se borra
// lo de analítica de ese canal en el acto.
//
// La API de Analytics tiene su propio cupo y no gasta las unidades de la Data API que pidió la
// auditoría de cuota.

/** Lo que se lee la primera vez: tres años de días, que es la historia que el dueño quería ver. */
export const DIAS_DE_HISTORIA = 3 * 365

/** Lo que se vuelve a leer cada día: YouTube asienta sus cifras con unos días de atraso. */
export const DIAS_DE_REFRESCO = 30

/** Cuántos videos de un canal se leen por día, los más nuevos primero. */
export const MAX_VIDEOS_POR_CANAL = 1000

const FILAS_POR_INSERT = 500

/** Lo leído de un canal. */
export type ReporteDeAnalitica = { canal: string; ok: boolean; dias: number; videos: number; error?: string }

async function escribirDias(accountId: string, dias: ReturnType<typeof diasDe>): Promise<void> {
  for (let i = 0; i < dias.length; i += FILAS_POR_INSERT) {
    await getDb()
      .insert(youtubeAnaliticaDias)
      .values(dias.slice(i, i + FILAS_POR_INSERT).map((d) => ({ accountId, ...d })))
      .onConflictDoUpdate({
        target: [youtubeAnaliticaDias.accountId, youtubeAnaliticaDias.day],
        set: {
          views: sql`excluded.views`,
          engagedViews: sql`excluded.engaged_views`,
          minutosVistos: sql`excluded.minutos_vistos`,
          duracionMedia: sql`excluded.duracion_media`,
          likes: sql`excluded.likes`,
          comments: sql`excluded.comments`,
          shares: sql`excluded.shares`,
          suscriptoresGanados: sql`excluded.suscriptores_ganados`,
          suscriptoresPerdidos: sql`excluded.suscriptores_perdidos`,
          capturedAt: new Date(),
        },
      })
  }
}

/** Los desgloses se reescriben enteros: lo que ya no vino en estos 28 días no se queda. */
async function escribirDesgloses(
  accountId: string,
  desgloses: ReturnType<typeof traficoDe>,
  desde: string,
  hasta: string,
): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx.delete(youtubeAnaliticaDesgloses).where(eq(youtubeAnaliticaDesgloses.accountId, accountId))
    if (desgloses.length > 0) {
      await tx.insert(youtubeAnaliticaDesgloses).values(desgloses.map((d) => ({ accountId, desde, hasta, ...d })))
    }
  })
}

/** Cada video conocido del canal, desde que salió hasta hoy. Devuelve cuántos contestaron. */
async function leerVideos(cuenta: SocialAccount, token: string, zona: string, hoy: string): Promise<number> {
  const posts = await getDb()
    .select({ id: socialPosts.id, externalId: socialPosts.externalId, publishedAt: socialPosts.publishedAt })
    .from(socialPosts)
    .where(and(eq(socialPosts.accountId, cuenta.id), isNull(socialPosts.archivedAt)))
    .orderBy(desc(socialPosts.publishedAt))
    .limit(MAX_VIDEOS_POR_CANAL)
  const postDe = new Map(posts.map((p) => [p.externalId, p.id]))
  let leidos = 0
  for (const grupo of gruposDeVideos(
    posts.map((p) => ({ externalId: p.externalId, dia: localDay(p.publishedAt, zona) })),
  )) {
    const videos = videosDe(await consultar(token, consultaDeVideos(grupo.ids, grupo.desde, hoy)))
    const filas = videos.flatMap(({ videoId, ...valores }) => {
      const postId = postDe.get(videoId)
      return postId ? [{ postId, desde: grupo.desde, hasta: hoy, ...valores }] : []
    })
    if (filas.length === 0) continue
    await getDb()
      .insert(youtubeAnaliticaVideos)
      .values(filas)
      .onConflictDoUpdate({
        target: youtubeAnaliticaVideos.postId,
        set: {
          views: sql`excluded.views`,
          engagedViews: sql`excluded.engaged_views`,
          minutosVistos: sql`excluded.minutos_vistos`,
          duracionMedia: sql`excluded.duracion_media`,
          porcentajeVisto: sql`excluded.porcentaje_visto`,
          likes: sql`excluded.likes`,
          comments: sql`excluded.comments`,
          shares: sql`excluded.shares`,
          suscriptoresGanados: sql`excluded.suscriptores_ganados`,
          suscriptoresPerdidos: sql`excluded.suscriptores_perdidos`,
          desde: sql`excluded.desde`,
          hasta: sql`excluded.hasta`,
          capturedAt: new Date(),
        },
      })
    leidos += filas.length
  }
  return leidos
}

/** YouTube dijo que ya no hay permiso: se borra lo de analítica y el canal deja de decir que lo tiene. */
async function olvidarAnalitica(cuenta: SocialAccount): Promise<void> {
  await getDb().transaction(async (tx) => {
    for (const paso of pasosParaBorrarAnalitica(cuenta.id)) await tx.execute(paso)
    await tx
      .update(socialAccounts)
      .set({ scopes: sinAnalitica(cuenta.scopes), analiticaVerificadaEn: null })
      .where(eq(socialAccounts.id, cuenta.id))
  })
}

export async function leerAnaliticaDelCanal(cuenta: SocialAccount): Promise<ReporteDeAnalitica> {
  const canal = cuenta.handle ?? cuenta.externalId ?? cuenta.id
  // `ensureYoutubeCredential` renueva el token de la hora si hace falta, y vuelve null si Google
  // ya no lo renueva. Eso no se toma como revocación: puede ser un tropiezo de la red. Sin
  // lectura no hay marca, y a los 30 días sin marca la retención borra igual.
  const token = await ensureYoutubeCredential(cuenta)
  if (!token) return { canal, ok: false, dias: 0, videos: 0, error: 'sin token' }

  const dueno = cuenta.ownerId ? await buscarPorId(cuenta.ownerId) : null
  const zona = dueno?.zona ?? ZONA_POR_DEFECTO
  const hoy = localDay(new Date(), zona)

  try {
    const [ya] = await getDb()
      .select({ id: youtubeAnaliticaDias.id })
      .from(youtubeAnaliticaDias)
      .where(eq(youtubeAnaliticaDias.accountId, cuenta.id))
      .limit(1)
    const desde = restarDias(hoy, ya ? DIAS_DE_REFRESCO : DIAS_DE_HISTORIA)
    const dias = diasDe(await consultar(token, consultaDeDias(desde, hoy)))
    await escribirDias(cuenta.id, dias)

    const desdeDesglose = restarDias(hoy, DIAS_DE_DESGLOSE - 1)
    const desgloses = [
      ...traficoDe(await consultar(token, consultaDeTrafico(desdeDesglose, hoy))),
      ...paisesDe(await consultar(token, consultaDePaises(desdeDesglose, hoy))),
      ...audienciaDe(await consultar(token, consultaDeAudiencia(desdeDesglose, hoy))),
    ]
    await escribirDesgloses(cuenta.id, desgloses, desdeDesglose, hoy)

    const videos = await leerVideos(cuenta, token, zona, hoy)

    await getDb().update(socialAccounts).set({ analiticaVerificadaEn: new Date() }).where(eq(socialAccounts.id, cuenta.id))
    return { canal, ok: true, dias: dias.length, videos }
  } catch (error) {
    if (error instanceof ErrorDeAnalitica && error.sinPermiso) {
      await olvidarAnalitica(cuenta)
      return { canal, ok: false, dias: 0, videos: 0, error: 'sin permiso: se borró lo de analítica' }
    }
    // Lo que alcanzó a escribirse se queda; sin marca de hoy, la de ayer sigue valiendo su plazo.
    return { canal, ok: false, dias: 0, videos: 0, error: String(error).slice(0, 300) }
  }
}

/**
 * Los canales de YouTube conectados con el permiso, de dueños con la analítica abierta, uno tras
 * otro. Sin dueño recorre el despliegue (el cron); con dueño, solo los suyos (el botón del panel).
 */
export async function sincronizarAnaliticaDeYoutube(ownerId?: string): Promise<ReporteDeAnalitica[]> {
  const cuentas = await getDb()
    .select()
    .from(socialAccounts)
    .where(ownerId ? and(eq(socialAccounts.network, 'youtube'), eq(socialAccounts.ownerId, ownerId)) : eq(socialAccounts.network, 'youtube'))
    .orderBy(asc(socialAccounts.createdAt))
  const reporte: ReporteDeAnalitica[] = []
  for (const cuenta of cuentas) {
    if (!cuenta.refreshToken || !tieneAnalitica(cuenta.scopes)) continue
    if (!analiticaDeYoutubeAbiertaPara(cuenta.ownerId)) continue
    reporte.push(await leerAnaliticaDelCanal(cuenta))
  }
  return reporte
}
