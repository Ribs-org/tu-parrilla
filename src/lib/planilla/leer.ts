import 'server-only'
import { and, desc, eq, gte, inArray, lte, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'
import {
  accountMetrics,
  clicks,
  getDb,
  links,
  postComments,
  postMetrics,
  profiles,
  scheduledPosts,
  scheduledPostTargets,
  socialAccounts,
  socialPosts,
  visits,
} from '@/db'
import { clickWhere, visitWhere, type Filters } from '@/lib/analytics'
import type {
  ClickCrudo,
  ComentarioCrudo,
  DestinoProgramado,
  GrupoDeEtiqueta,
  LecturaDeCuenta,
  LecturaDePublicacion,
  VisitaCruda,
} from './hojas'

// Lo que la planilla lee de la base y Los Números no: las filas una por una (cada visita, cada
// click, cada lectura diaria, cada comentario, cada destino programado). Cada consulta lleva al
// dueño en su `where` —nunca solo en el `on` de un join—, que es lo que vigila
// `src/lib/aislamiento.test.ts`.
//
// Las listas largas se leen por tandas, de la más reciente hacia atrás, con un cursor (la fecha y
// el id de la última fila): así la planilla nunca tiene más de una tanda en memoria, y una que se
// corta lleva lo más reciente.
//
// YouTube: lo que tiene más de 30 días sin refrescarse ya lo borra la sincronización
// (`retencion-youtube.ts`), pero esa limpieza corre una vez al día. Estas consultas lo dejan
// fuera igual, con el mismo corte (`corte`), para que la planilla nunca lleve un dato vencido.

const int = (fragment: SQL) => sql<number>`${fragment}`.mapWith(Number)

/** La fecha de una fila con sus microsegundos, como texto: un `Date` los pierde y el cursor saltaría filas. */
const conMicros = (columna: AnyColumn) =>
  sql<string>`to_char(${columna} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`

export type Cursor = { en: string; id: string }

function misPaginas(ownerId: string) {
  return getDb().select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, ownerId))
}

/** Lo de YouTube leído antes de `corte` no va: `politica-youtube.ts`. */
function youtubeVigente(red: AnyColumn, fecha: AnyColumn, corte: Date): SQL {
  return or(sql`${red} <> 'youtube'`, gte(fecha, corte))!
}

/** Una tanda de visitas, de la más reciente hacia atrás. */
export async function leerVisitas(
  f: Filters,
  despuesDe: Cursor | null,
  cuantas: number,
): Promise<{ filas: VisitaCruda[]; cursor: Cursor | null }> {
  const condiciones: SQL[] = []
  if (despuesDe) {
    condiciones.push(sql`(${visits.createdAt}, ${visits.id}) < (${despuesDe.en}::timestamptz, ${despuesDe.id}::uuid)`)
  }
  const filas = await getDb()
    .select({
      id: visits.id,
      creadaEn: visits.createdAt,
      cursor: conMicros(visits.createdAt),
      slug: profiles.slug,
      referrerNetwork: visits.referrerNetwork,
      referrer: visits.referrer,
      campaign: visits.campaign,
      utmSource: visits.utmSource,
      utmMedium: visits.utmMedium,
      utmCampaign: visits.utmCampaign,
      utmContent: visits.utmContent,
      country: visits.country,
      region: visits.region,
      city: visits.city,
      timezone: visits.timezone,
      deviceType: visits.deviceType,
      os: visits.os,
      browser: visits.browser,
      language: visits.language,
      isBot: visits.isBot,
    })
    .from(visits)
    .leftJoin(profiles, eq(profiles.id, visits.profileId))
    // `visitWhere` lleva al dueño por sus páginas: va al final, después del cursor.
    .where(and(...condiciones, visitWhere(f)))
    .orderBy(desc(visits.createdAt), desc(visits.id))
    .limit(cuantas)
  const ultima = filas.at(-1)
  return { filas, cursor: ultima ? { en: ultima.cursor, id: ultima.id } : null }
}

/** Una tanda de clicks, del más reciente hacia atrás, con la etiqueta de su visita. */
export async function leerClicks(
  f: Filters,
  despuesDe: Cursor | null,
  cuantos: number,
): Promise<{ filas: ClickCrudo[]; cursor: Cursor | null }> {
  const condiciones: SQL[] = []
  if (despuesDe) {
    condiciones.push(sql`(${clicks.createdAt}, ${clicks.id}) < (${despuesDe.en}::timestamptz, ${despuesDe.id}::uuid)`)
  }
  // El link y la visita se buscan solo entre los del dueño: `visit_id` no tiene clave foránea, y
  // un click podría nombrar la visita de otro.
  const filas = await getDb()
    .select({
      id: clicks.id,
      creadoEn: clicks.createdAt,
      cursor: conMicros(clicks.createdAt),
      slug: profiles.slug,
      link: links.label,
      url: links.url,
      linkBorrado: sql<boolean>`${links.id} is null`,
      position: clicks.position,
      msOnPage: clicks.msOnPage,
      campaign: visits.campaign,
      isBot: clicks.isBot,
      visitId: clicks.visitId,
    })
    .from(clicks)
    .leftJoin(profiles, eq(profiles.id, clicks.profileId))
    .leftJoin(links, and(eq(links.id, clicks.linkId), inArray(links.profileId, misPaginas(f.ownerId))))
    .leftJoin(visits, and(eq(visits.id, clicks.visitId), inArray(visits.profileId, misPaginas(f.ownerId))))
    .where(and(...condiciones, clickWhere(f)))
    .orderBy(desc(clicks.createdAt), desc(clicks.id))
    .limit(cuantos)
  const ultima = filas.at(-1)
  return { filas, cursor: ultima ? { en: ultima.cursor, id: ultima.id } : null }
}

/** Una tanda de lecturas diarias de publicaciones, del día más reciente hacia atrás. */
export async function leerLecturas(
  ownerId: string,
  dias: { desde: string; hasta: string },
  cuentaId: string | null,
  corte: Date,
  despuesDe: Cursor | null,
  cuantas: number,
): Promise<{ filas: LecturaDePublicacion[]; cursor: Cursor | null }> {
  const condiciones: SQL[] = [
    gte(postMetrics.day, dias.desde),
    lte(postMetrics.day, dias.hasta),
    youtubeVigente(socialPosts.network, postMetrics.capturedAt, corte),
  ]
  if (cuentaId) condiciones.push(eq(socialPosts.accountId, cuentaId))
  if (despuesDe) condiciones.push(sql`(${postMetrics.day}, ${postMetrics.id}) < (${despuesDe.en}::date, ${despuesDe.id}::uuid)`)
  const filas = await getDb()
    .select({
      id: postMetrics.id,
      dia: postMetrics.day,
      leidaEn: postMetrics.capturedAt,
      red: socialPosts.network,
      handle: socialAccounts.handle,
      etiqueta: socialPosts.campaign,
      externalId: socialPosts.externalId,
      views: postMetrics.views,
      likes: postMetrics.likes,
      comments: postMetrics.comments,
      shares: postMetrics.shares,
      saves: postMetrics.saves,
      reach: postMetrics.reach,
    })
    .from(postMetrics)
    .innerJoin(socialPosts, eq(socialPosts.id, postMetrics.postId))
    .leftJoin(socialAccounts, eq(socialAccounts.id, socialPosts.accountId))
    .where(and(...condiciones, eq(socialPosts.ownerId, ownerId)))
    .orderBy(desc(postMetrics.day), desc(postMetrics.id))
    .limit(cuantas)
  const ultima = filas.at(-1)
  return { filas, cursor: ultima ? { en: ultima.dia, id: ultima.id } : null }
}

/**
 * Las lecturas diarias de las cuentas en el período, con los seguidores de la lectura anterior
 * de cada una (de cualquier día, también de antes del período) para lo ganado.
 */
export async function leerSeguidores(
  ownerId: string,
  dias: { desde: string; hasta: string },
  cuentaId: string | null,
  corte: Date,
  cuantas: number,
): Promise<LecturaDeCuenta[]> {
  const condiciones: SQL[] = [
    gte(accountMetrics.day, dias.desde),
    lte(accountMetrics.day, dias.hasta),
    youtubeVigente(accountMetrics.network, accountMetrics.capturedAt, corte),
  ]
  if (cuentaId) condiciones.push(eq(accountMetrics.accountId, cuentaId))
  return getDb()
    .select({
      dia: accountMetrics.day,
      red: accountMetrics.network,
      handle: socialAccounts.handle,
      followers: accountMetrics.followers,
      followersAntes: sql<number | null>`(
        select a2.followers from ${accountMetrics} a2
        where a2.account_id = ${accountMetrics.accountId} and a2.day < ${accountMetrics.day} and a2.followers is not null
        order by a2.day desc limit 1
      )`.mapWith((v) => (v === null ? null : Number(v))),
      totalViews: accountMetrics.totalViews,
      videoCount: accountMetrics.videoCount,
      profileViews: accountMetrics.profileViews,
      reach: accountMetrics.reach,
      views: accountMetrics.views,
      accountsEngaged: accountMetrics.accountsEngaged,
    })
    .from(accountMetrics)
    .innerJoin(socialAccounts, eq(socialAccounts.id, accountMetrics.accountId))
    .where(and(...condiciones, eq(socialAccounts.ownerId, ownerId)))
    .orderBy(desc(accountMetrics.day), accountMetrics.network, socialAccounts.handle)
    .limit(cuantas)
}

/** Las visitas, únicos y clicks del período por etiqueta y por sus cuatro UTM. */
export async function leerEtiquetas(f: Filters, cuantos: number): Promise<GrupoDeEtiqueta[]> {
  const db = getDb()
  const claves = {
    campaign: visits.campaign,
    utmSource: visits.utmSource,
    utmMedium: visits.utmMedium,
    utmCampaign: visits.utmCampaign,
    utmContent: visits.utmContent,
  }
  const grupos = await db
    .select({ ...claves, visitas: int(sql`count(*)`), unicos: int(sql`count(distinct ${visits.visitorHash})`) })
    .from(visits)
    .where(visitWhere(f))
    .groupBy(visits.campaign, visits.utmSource, visits.utmMedium, visits.utmCampaign, visits.utmContent)
    .orderBy(desc(sql`count(*)`))
    .limit(cuantos)
  // Los clicks heredan la etiqueta y las UTM de su visita, como en `getCampaigns`.
  const deClicks = await db
    .select({ ...claves, clicks: int(sql`count(*)`) })
    .from(clicks)
    .innerJoin(visits, eq(clicks.visitId, visits.id))
    .where(and(clickWhere(f), visitWhere(f)))
    .groupBy(visits.campaign, visits.utmSource, visits.utmMedium, visits.utmCampaign, visits.utmContent)
  const llave = (g: Record<keyof typeof claves, string | null>) =>
    JSON.stringify([g.campaign, g.utmSource, g.utmMedium, g.utmCampaign, g.utmContent])
  const porLlave = new Map(deClicks.map((c) => [llave(c), c.clicks]))
  return grupos.map((g) => ({ ...g, clicks: porLlave.get(llave(g)) ?? 0 }))
}

/**
 * La publicación de cada etiqueta, para nombrarla. Las etiquetas viajan en un solo parámetro
 * (como `enIds`): pueden ser miles. El texto de un video de YouTube que lleva 30 días sin
 * llegar no va.
 */
export async function publicacionesDeEtiquetas(
  ownerId: string,
  etiquetas: readonly string[],
  corte: Date,
): Promise<Map<string, { caption: string | null; network: string; accountId: string }>> {
  if (etiquetas.length === 0) return new Map()
  const filas = await getDb()
    .select({
      campaign: socialPosts.campaign,
      caption: sql<string | null>`case when ${socialPosts.network} = 'youtube' and ${socialPosts.updatedAt} < ${corte.toISOString()} then null else ${socialPosts.caption} end`,
      network: socialPosts.network,
      accountId: socialPosts.accountId,
    })
    .from(socialPosts)
    .where(and(sql`${socialPosts.campaign} = any(${sql.param(etiquetas)}::text[])`, eq(socialPosts.ownerId, ownerId)))
  return new Map(filas.map((f) => [f.campaign, f]))
}

/**
 * Qué publicaciones de YouTube de la lista ya no se pueden mostrar enteras: el título, si el video
 * lleva 30 días sin llegar; los contadores, si su última lectura es de antes del corte.
 */
export async function youtubeVencido(
  ownerId: string,
  ids: readonly string[],
  corte: Date,
): Promise<{ sinTexto: Set<string>; sinLectura: Set<string> }> {
  const sinTexto = new Set<string>()
  const sinLectura = new Set<string>()
  if (ids.length === 0) return { sinTexto, sinLectura }
  const filas = await getDb()
    .select({
      id: socialPosts.id,
      actualizada: socialPosts.updatedAt,
      ultimaLectura: sql<string | null>`max(${postMetrics.capturedAt})`,
    })
    .from(socialPosts)
    .leftJoin(postMetrics, eq(postMetrics.postId, socialPosts.id))
    .where(
      and(
        eq(socialPosts.network, 'youtube'),
        sql`${socialPosts.id} = any(${sql.param(ids)}::uuid[])`,
        eq(socialPosts.ownerId, ownerId),
      ),
    )
    .groupBy(socialPosts.id, socialPosts.updatedAt)
  for (const fila of filas) {
    if (fila.actualizada.getTime() < corte.getTime()) sinTexto.add(fila.id)
    if (fila.ultimaLectura === null || new Date(fila.ultimaLectura).getTime() < corte.getTime()) sinLectura.add(fila.id)
  }
  return { sinTexto, sinLectura }
}

/**
 * Lo programado: cada destino de cada post con hora en el período, más todo lo que todavía está
 * por salir (hora después de `ahora`), de la hora más reciente hacia atrás.
 */
export async function leerProgramado(
  f: Filters,
  cuentaId: string | null,
  ahora: Date,
  cuantos: number,
): Promise<DestinoProgramado[]> {
  const condiciones: SQL[] = [
    or(and(gte(scheduledPosts.scheduledAt, f.from), lte(scheduledPosts.scheduledAt, f.to)), sql`${scheduledPosts.scheduledAt} > ${ahora.toISOString()}`)!,
  ]
  if (cuentaId) condiciones.push(eq(scheduledPostTargets.accountId, cuentaId))
  const filas = await getDb()
    .select({
      hora: scheduledPosts.scheduledAt,
      status: scheduledPostTargets.status,
      archivadoEn: scheduledPostTargets.archivadoEn,
      red: scheduledPostTargets.network,
      handle: socialAccounts.handle,
      texto: sql<string>`coalesce(${scheduledPostTargets.captionOverride}, ${scheduledPosts.caption})`,
      lastError: scheduledPostTargets.lastError,
      intentos: scheduledPostTargets.attemptCount,
      externalId: scheduledPostTargets.externalId,
      opciones: scheduledPostTargets.opciones,
      videos: int(sql`(select count(*) from scheduled_post_media m where m.post_id = ${scheduledPosts.id} and m.media_type = 'video')`),
      imagenes: int(sql`(select count(*) from scheduled_post_media m where m.post_id = ${scheduledPosts.id} and m.media_type = 'image')`),
      videosLiberados: scheduledPosts.videosLiberados,
      atributos: scheduledPosts.atributos,
      referencia: scheduledPosts.ref,
      creado: scheduledPosts.createdAt,
    })
    .from(scheduledPosts)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .leftJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(and(...condiciones, eq(scheduledPosts.ownerId, f.ownerId)))
    .orderBy(desc(scheduledPosts.scheduledAt), desc(scheduledPostTargets.id))
    .limit(cuantos)
  return filas.map((d) => ({
    hora: d.hora,
    status: d.status,
    archivado: d.archivadoEn !== null,
    red: d.red,
    handle: d.handle,
    texto: d.texto,
    lastError: d.lastError,
    intentos: d.intentos,
    externalId: d.externalId,
    aLaBandeja: esBorradorDeTikTok(d.opciones),
    // Los videos que ya salieron en todas sus redes se borran del almacén con su fila: el post
    // los sigue contando (`videosLiberados`).
    videos: d.videos + d.videosLiberados,
    imagenes: d.imagenes,
    atributos: d.atributos,
    referencia: d.referencia,
    creado: d.creado,
  }))
}

/** TikTok: el destino sale como borrador a la bandeja del dueño (`opciones.modo`). */
function esBorradorDeTikTok(opciones: unknown): boolean {
  return typeof opciones === 'object' && opciones !== null && (opciones as { modo?: unknown }).modo === 'borrador'
}

/** Una tanda de comentarios de La Mesa del período, del más reciente hacia atrás. */
export async function leerComentarios(
  f: Filters,
  cuentaId: string | null,
  corte: Date,
  despuesDe: Cursor | null,
  cuantos: number,
): Promise<{ filas: ComentarioCrudo[]; cursor: Cursor | null }> {
  const condiciones: SQL[] = [
    gte(postComments.publishedAt, f.from),
    lte(postComments.publishedAt, f.to),
    youtubeVigente(postComments.network, postComments.createdAt, corte),
  ]
  if (cuentaId) condiciones.push(eq(postComments.accountId, cuentaId))
  if (despuesDe) {
    condiciones.push(sql`(${postComments.publishedAt}, ${postComments.id}) < (${despuesDe.en}::timestamptz, ${despuesDe.id}::uuid)`)
  }
  const filas = await getDb()
    .select({
      id: postComments.id,
      cursor: conMicros(postComments.publishedAt),
      publicadoEn: postComments.publishedAt,
      red: postComments.network,
      handle: socialAccounts.handle,
      publicacion: sql<string | null>`case when ${socialPosts.network} = 'youtube' and ${socialPosts.updatedAt} < ${corte.toISOString()} then null else ${socialPosts.caption} end`,
      enlace: socialPosts.permalink,
      autor: postComments.author,
      texto: postComments.text,
      estado: postComments.state,
      draft: postComments.draft,
      automatico: postComments.automatico,
      // En una subconsulta y no en un join: un post viejo puede tener dos destinos con el mismo
      // id de la red, y el join duplicaría el comentario.
      palabra: sql<string | null>`(
        select r.palabra from reglas_clave r join scheduled_post_targets t on t.post_id = r.post_id
        where t.account_id = ${postComments.accountId} and t.external_id = ${postComments.postExternalId} limit 1
      )`,
      privado: postComments.dmState,
      error: postComments.error,
      errorPrivado: postComments.dmError,
    })
    .from(postComments)
    .innerJoin(socialAccounts, eq(socialAccounts.id, postComments.accountId))
    .leftJoin(
      socialPosts,
      and(eq(socialPosts.accountId, postComments.accountId), eq(socialPosts.externalId, postComments.postExternalId)),
    )
    .where(and(...condiciones, eq(socialAccounts.ownerId, f.ownerId)))
    .orderBy(desc(postComments.publishedAt), desc(postComments.id))
    .limit(cuantos)
  const ultima = filas.at(-1)
  return {
    filas: filas.map((c) => ({ ...c, respuesta: c.draft })),
    cursor: ultima ? { en: ultima.cursor, id: ultima.id } : null,
  }
}

/** Cuántas filas hay de lo que tiene tope, para decir en pantalla y en «Léeme» qué queda fuera. */
export async function contarFilas(
  f: Filters,
  dias: { desde: string; hasta: string },
  cuentaId: string | null,
  corte: Date,
): Promise<{ visitas: number; clicks: number; lecturas: number; comentarios: number }> {
  const db = getDb()
  const [v] = await db.select({ n: int(sql`count(*)`) }).from(visits).where(visitWhere(f))
  const [c] = await db.select({ n: int(sql`count(*)`) }).from(clicks).where(clickWhere(f))
  const lecturas: SQL[] = [
    gte(postMetrics.day, dias.desde),
    lte(postMetrics.day, dias.hasta),
    youtubeVigente(socialPosts.network, postMetrics.capturedAt, corte),
  ]
  if (cuentaId) lecturas.push(eq(socialPosts.accountId, cuentaId))
  const [l] = await db
    .select({ n: int(sql`count(*)`) })
    .from(postMetrics)
    .innerJoin(socialPosts, eq(socialPosts.id, postMetrics.postId))
    .where(and(...lecturas, eq(socialPosts.ownerId, f.ownerId)))
  const comentarios: SQL[] = [
    gte(postComments.publishedAt, f.from),
    lte(postComments.publishedAt, f.to),
    youtubeVigente(postComments.network, postComments.createdAt, corte),
  ]
  if (cuentaId) comentarios.push(eq(postComments.accountId, cuentaId))
  const [k] = await db
    .select({ n: int(sql`count(*)`) })
    .from(postComments)
    .innerJoin(socialAccounts, eq(socialAccounts.id, postComments.accountId))
    .where(and(...comentarios, eq(socialAccounts.ownerId, f.ownerId)))
  return { visitas: v?.n ?? 0, clicks: c?.n ?? 0, lecturas: l?.n ?? 0, comentarios: k?.n ?? 0 }
}
