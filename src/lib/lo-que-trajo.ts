import 'server-only'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { cortesVistos, enIds, getDb, postComments, postMetrics, profiles, socialAccounts, socialPosts, visits } from '@/db'
import { analiticaDeVideos } from './analitica-youtube-lectura'
import { contarPendientes } from './comentarios-cola'
import { selloDe } from './parrilla'
import { sinMetricasDerivadas } from './social/politica-youtube'
import { corteDe, cortesEntre, type CorteCargado } from './social/publish/cortes'
import { videosAFondo } from './social/tiktok-numeros-guardar'
import { esUuid } from './uuid'

// «Lo que trajo», en la app del teléfono y en La Parrilla del panel: lo nuevo de cada corte desde que su dueño lo miró
// (`docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`). Todas las lecturas van atadas al
// dueño en el `where`, directo o por los ids que ya filtró la anterior, como pide el arnés de
// aislamiento (`aislamiento.test.ts`).

/** Los días hacia atrás de la fila: los cortes que salieron en la última semana. */
export const DIAS_DE_LA_FILA = 7

export const CORTE_NO_ESTA = 'Ese corte no está, o todavía no salió en ninguna red.'

/** Lo que se resta: «me gusta» y comentarios sumados en las redes del corte, sin YouTube. */
export type Contadores = { meGusta: number; comentarios: number }

/** Lo que llegó desde la última vez que se miró. Los comentarios incluyen los de YouTube que entraron a La Mesa. */
export type LoNuevo = { meGusta: number; comentarios: number; visitas: number }

export function totalDe(nuevo: LoNuevo): number {
  return nuevo.meGusta + nuevo.comentarios + nuevo.visitas
}

/**
 * La suma de las últimas lecturas de las redes que dejan restar: YouTube no entra (§III.E.4.h,
 * `politica-youtube.ts`). Un número que la red no dio cuenta como cero.
 */
export function sumarSinYoutube(lecturas: ReadonlyArray<{ red: string; likes: number | null; comments: number | null }>): Contadores {
  let meGusta = 0
  let comentarios = 0
  for (const l of lecturas) {
    if (sinMetricasDerivadas(l.red)) continue
    meGusta += l.likes ?? 0
    comentarios += l.comments ?? 0
  }
  return { meGusta, comentarios }
}

/**
 * Lo nuevo: lo de ahora menos lo que había al mirarlo, sin bajar de cero —alguien que quita su
 * «me gusta» no resta—, más los comentarios de YouTube y las visitas que llegaron después. Un
 * corte que nunca se miró cuenta todo desde que salió.
 */
export function loNuevoDe(actual: Contadores, marca: Contadores | null, comentariosDeYoutube: number, visitas: number): LoNuevo {
  return {
    meGusta: Math.max(0, actual.meGusta - (marca?.meGusta ?? 0)),
    comentarios: Math.max(0, actual.comentarios - (marca?.comentarios ?? 0)) + comentariosDeYoutube,
    visitas,
  }
}

/** Una red donde el corte salió, con su publicación sincronizada si la red ya la entregó. */
export type DestinoServido = {
  id: string
  red: string
  accountId: string
  handle: string | null
  externalId: string
  /** La fila de `social_posts`: null hasta que la sincronización la encuentre. */
  socialPostId: string | null
  campaign: string | null
  /** La última lectura de la red, tal como la dio; null si todavía no hay ninguna. */
  lectura: { views: number | null; likes: number | null; comments: number | null; seguidores: number | null } | null
}

export type CorteConNumeros = {
  corte: CorteCargado
  servidos: DestinoServido[]
  marca: { vistoEn: Date; meGusta: number; comentarios: number } | null
  actual: Contadores
  nuevo: LoNuevo
  /** Todas las visitas a las páginas del dueño con la etiqueta de alguna de sus publicaciones. */
  visitas: number
}

/** Antes de cualquier corte: el «desde» de uno que nunca se miró. */
const NUNCA = '1970-01-01T00:00:00.000Z'

/**
 * Los números de unos cortes ya leídos del dueño. Se queda con los que salieron en al menos una
 * red —un borrador en la bandeja de TikTok todavía no salió—, y para cada uno junta su
 * publicación sincronizada, su última lectura, su marca, las visitas y los comentarios de YouTube.
 */
export async function numerosDeLosCortes(ownerId: string, cortes: CorteCargado[]): Promise<CorteConNumeros[]> {
  const conServidos = cortes
    .map((corte) => ({
      corte,
      destinos: corte.targets.filter(
        (t): t is typeof t & { externalId: string } => t.externalId !== null && selloDe(t) === 'servido',
      ),
    }))
    .filter((c) => c.destinos.length > 0)
  if (conServidos.length === 0) return []
  const db = getDb()

  const externos = [...new Set(conServidos.flatMap((c) => c.destinos.map((d) => d.externalId)))]
  const publicadas = await db
    .select({ id: socialPosts.id, accountId: socialPosts.accountId, externalId: socialPosts.externalId, campaign: socialPosts.campaign })
    .from(socialPosts)
    .where(and(inArray(socialPosts.externalId, externos), eq(socialPosts.ownerId, ownerId)))
  // Por cuenta e id de la red, como `getPieza`: un id externo solo es único dentro de su cuenta.
  const publicadaDe = new Map(publicadas.map((p) => [`${p.accountId}:${p.externalId}`, p]))

  const ids = publicadas.map((p) => p.id)
  const lecturas =
    ids.length === 0
      ? []
      : await db
          .selectDistinctOn([postMetrics.postId], {
            postId: postMetrics.postId,
            views: postMetrics.views,
            likes: postMetrics.likes,
            comments: postMetrics.comments,
            seguidores: postMetrics.seguidores,
          })
          .from(postMetrics)
          // Por los ids que ya filtró la consulta de arriba, como `post_metrics` en `getPostRows`.
          .where(enIds(postMetrics.postId, ids))
          .orderBy(postMetrics.postId, desc(postMetrics.day))
  const lecturaDe = new Map(lecturas.map(({ postId, ...resto }) => [postId, resto]))

  const corteIds = conServidos.map((c) => c.corte.post.id)
  const marcas = await db
    .select({ postId: cortesVistos.postId, vistoEn: cortesVistos.vistoEn, meGusta: cortesVistos.meGusta, comentarios: cortesVistos.comentarios })
    .from(cortesVistos)
    .where(and(enIds(cortesVistos.postId, corteIds), eq(cortesVistos.ownerId, ownerId)))
  const marcaDe = new Map(marcas.map(({ postId, ...resto }) => [postId, resto]))

  const armados = conServidos.map(({ corte, destinos }) => {
    const servidos: DestinoServido[] = destinos.map((d) => {
      const publicada = publicadaDe.get(`${d.accountId}:${d.externalId}`) ?? null
      return {
        id: d.id,
        red: d.network,
        accountId: d.accountId,
        handle: d.handle,
        externalId: d.externalId,
        socialPostId: publicada?.id ?? null,
        campaign: publicada?.campaign ?? null,
        lectura: publicada ? (lecturaDe.get(publicada.id) ?? null) : null,
      }
    })
    const marca = marcaDe.get(corte.post.id) ?? null
    const desde = marca ? marca.vistoEn.toISOString() : NUNCA
    return { corte, servidos, marca, desde }
  })

  // Las visitas de cada corte: las de la etiqueta de cualquiera de sus publicaciones, a páginas del
  // dueño y sin bots, como Los Números (`getPostSeries`). Una sola consulta con el «desde» de cada
  // corte al lado de cada etiqueta. Las fechas van como texto y se convierten adentro: el driver no
  // convierte fechas (ver el comentario de `getPostSeries`), y una lista de ellas revienta.
  const etiquetas = armados.flatMap((a) =>
    a.servidos.filter((s) => s.campaign !== null).map((s) => ({ corte: a.corte.post.id, campaign: s.campaign!, desde: a.desde })),
  )
  const visitasDe = new Map<string, { nuevas: number; total: number }>()
  if (etiquetas.length > 0) {
    const filas = (await db.execute(sql`
      select t.corte::text as corte,
             (count(*) filter (where ${visits.createdAt} > t.desde::timestamptz))::int as nuevas,
             count(*)::int as total
      from unnest(
        ${sql.param(etiquetas.map((e) => e.corte))}::uuid[],
        ${sql.param(etiquetas.map((e) => e.campaign))}::text[],
        ${sql.param(etiquetas.map((e) => e.desde))}::text[]
      ) as t(corte, campaign, desde)
      join ${visits} on ${visits.campaign} = t.campaign
      where ${visits.isBot} = false
        and ${visits.profileId} in (select ${profiles.id} from ${profiles} where ${profiles.ownerId} = ${ownerId})
      group by t.corte
    `)) as unknown as Array<{ corte: string; nuevas: number; total: number }>
    for (const f of filas) visitasDe.set(f.corte, { nuevas: Number(f.nuevas), total: Number(f.total) })
  }

  // Los comentarios de YouTube que entraron a La Mesa después de mirarlo: filas guardadas, no una
  // resta de sus números. Por la cuenta y el id del video, solo de cuentas del dueño.
  const deYoutube = armados.flatMap((a) =>
    a.servidos.filter((s) => s.red === 'youtube').map((s) => ({ corte: a.corte.post.id, cuenta: s.accountId, externo: s.externalId, desde: a.desde })),
  )
  const comentariosDe = new Map<string, number>()
  if (deYoutube.length > 0) {
    const filas = (await db.execute(sql`
      select t.corte::text as corte, count(*)::int as nuevos
      from unnest(
        ${sql.param(deYoutube.map((y) => y.corte))}::uuid[],
        ${sql.param(deYoutube.map((y) => y.cuenta))}::uuid[],
        ${sql.param(deYoutube.map((y) => y.externo))}::text[],
        ${sql.param(deYoutube.map((y) => y.desde))}::text[]
      ) as t(corte, cuenta, externo, desde)
      join ${postComments} on ${postComments.accountId} = t.cuenta
        and ${postComments.postExternalId} = t.externo
        and ${postComments.createdAt} > t.desde::timestamptz
      where ${postComments.accountId} in (select ${socialAccounts.id} from ${socialAccounts} where ${socialAccounts.ownerId} = ${ownerId})
      group by t.corte
    `)) as unknown as Array<{ corte: string; nuevos: number }>
    for (const f of filas) comentariosDe.set(f.corte, Number(f.nuevos))
  }

  return armados.map(({ corte, servidos, marca }) => {
    const actual = sumarSinYoutube(servidos.map((s) => ({ red: s.red, likes: s.lectura?.likes ?? null, comments: s.lectura?.comments ?? null })))
    const visitas = visitasDe.get(corte.post.id) ?? { nuevas: 0, total: 0 }
    return {
      corte,
      servidos,
      marca,
      actual,
      nuevo: loNuevoDe(actual, marca, comentariosDe.get(corte.post.id) ?? 0, visitas.nuevas),
      visitas: visitas.total,
    }
  })
}

/**
 * La fila de «Lo que trajo»: los cortes que salieron en los últimos siete días, del más nuevo al
 * más viejo, y el número del ícono: cuántos tienen algo nuevo más cuántos comentarios esperan
 * respuesta en La Mesa.
 */
export async function leerLoQueTrajo(ownerId: string, ahora: Date): Promise<{ cortes: CorteConNumeros[]; numero: number }> {
  const cortes = await filaDeLoQueTrajo(ownerId, ahora)
  const pendientes = await contarPendientes(ownerId, null)
  return { cortes, numero: cortes.filter((c) => totalDe(c.nuevo) > 0).length + pendientes }
}

/** La fila sola, sin el número del ícono: la de La Parrilla del panel, que no lo lleva. */
export async function filaDeLoQueTrajo(ownerId: string, ahora: Date): Promise<CorteConNumeros[]> {
  const desde = new Date(ahora.getTime() - DIAS_DE_LA_FILA * 864e5)
  return (await numerosDeLosCortes(ownerId, await cortesEntre(ownerId, desde, ahora))).sort(
    (a, b) => b.corte.post.scheduledAt.getTime() - a.corte.post.scheduledAt.getTime(),
  )
}

/**
 * El número del ícono, para un aviso al teléfono que lo lleva (`badge`): el mismo de la fila. Si no
 * se puede contar, undefined: el aviso sale igual, sin tocar el ícono.
 */
export async function numeroDelIcono(ownerId: string, ahora: Date): Promise<number | undefined> {
  try {
    return (await leerLoQueTrajo(ownerId, ahora)).numero
  } catch (error) {
    console.error('[push] No se pudo contar el número del ícono:', String(error).slice(0, 300))
    return undefined
  }
}

/** Un corte del dueño con sus números, o null si no es suyo, no existe o no salió en ninguna red. */
export async function leerCorte(ownerId: string, postId: string): Promise<CorteConNumeros | null> {
  if (!esUuid(postId)) return null
  const [corte] = await numerosDeLosCortes(ownerId, await corteDe(ownerId, postId))
  return corte ?? null
}

/**
 * Los seguidores que trajo cada red del corte, donde la red los da y tal como los da: los de las
 * fotos y carruseles de Instagram (`post_metrics.seguidores`), los de TikTok for Business (en
 * `ajustes`, si su reja está abierta) y los de YouTube Analytics (`suscriptoresGanados`, sin
 * restarle los perdidos). Por id de destino; null donde la red no los da.
 */
export async function seguidoresDe(ownerId: string, servidos: readonly DestinoServido[]): Promise<Map<string, number | null>> {
  const seguidores = new Map<string, number | null>()
  const deYoutube = servidos.filter((s) => s.red === 'youtube' && s.socialPostId !== null).map((s) => s.socialPostId!)
  const analitica = await analiticaDeVideos(ownerId, deYoutube)
  const deTiktok = new Map<string, Awaited<ReturnType<typeof videosAFondo>>>()
  for (const s of servidos) {
    if (s.red === 'youtube') {
      seguidores.set(s.id, s.socialPostId ? (analitica.get(s.socialPostId)?.suscriptoresGanados ?? null) : null)
    } else if (s.red === 'tiktok') {
      const videos = deTiktok.get(s.accountId) ?? (await videosAFondo(ownerId, s.accountId))
      deTiktok.set(s.accountId, videos)
      seguidores.set(s.id, videos[s.externalId]?.seguidoresNuevos ?? null)
    } else {
      seguidores.set(s.id, s.lectura?.seguidores ?? null)
    }
  }
  return seguidores
}

/**
 * Mirar un corte: deja la marca con la hora y lo que lleva ahora. False si el corte no es del
 * dueño, no existe o no salió. La marca es una por corte (`cortes_vistos`), así que mirarlo otra
 * vez la pisa. La deja el detalle del teléfono (`marcarVisto`) y el del panel, que no lleva el
 * número del ícono.
 */
export async function dejarLaMarca(ownerId: string, postId: string, ahora: Date): Promise<boolean> {
  const corte = await leerCorte(ownerId, postId)
  if (!corte) return false
  const valores = { ownerId, vistoEn: ahora, meGusta: corte.actual.meGusta, comentarios: corte.actual.comentarios }
  await getDb()
    .insert(cortesVistos)
    .values({ postId: corte.corte.post.id, ...valores })
    .onConflictDoUpdate({ target: cortesVistos.postId, set: valores })
  return true
}

/** Mirar un corte desde el teléfono: la marca, y el número del ícono que queda. Null si el corte no es del dueño. */
export async function marcarVisto(ownerId: string, postId: string, ahora: Date): Promise<number | null> {
  if (!(await dejarLaMarca(ownerId, postId, ahora))) return null
  return (await leerLoQueTrajo(ownerId, ahora)).numero
}
