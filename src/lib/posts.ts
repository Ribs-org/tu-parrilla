import 'server-only'
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import {
  clicks,
  getDb,
  postMetrics,
  profiles,
  socialAccounts,
  socialPosts,
  visits,
} from '@/db'
import type { Filters, Granularity } from './analytics'
import { describe, granularityFor, localDay } from './analytics'
import {
  postKpisFrom,
  type CuentaRow,
  type PostKpis,
  type PostRow,
} from './posts-kpis'
import { periodChange, type Snapshot } from './social/delta'
import { REDES_SIN_DERIVADAS, sinMetricasDerivadas } from './social/politica-youtube'

// Re-exported so server call sites only need one import line; the types and the pure
// summing function actually live in `posts-kpis.ts`, which stays free of
// `server-only` so a test file can import it without pulling in the DB layer.
// Client components must import them from there directly, not from here.
export type { CuentaRow, PostKpis, PostRow }
export { postKpisFrom }

export type CampaignPost = {
  /** El id de la publicación, para abrir su pieza. */
  id: string
  accountId: string
  network: string
  caption: string | null
  thumbnailUrl: string | null
  permalink: string | null
}

const int = (fragment: SQL) => sql<number>`${fragment}`.mapWith(Number)

/**
 * The publication date as the table shows it. Formatted here rather than in the client
 * component: that component renders on the server first (in the runtime's zone, UTC on
 * Vercel) and then in the browser (in the viewer's), so a post published at 02:00 UTC
 * read "25 ago" on one side and "24 ago" on the other — a hydration mismatch, and a day
 * boundary drawn outside the owner's zone either way.
 *
 * Un formateador por zona, memorizado: construir un `Intl.DateTimeFormat` por fila son
 * doscientos por página, y la zona cambia como mucho una vez por petición.
 */
const PUBLISHED = new Map<string, Intl.DateTimeFormat>()

function publishedLabel(date: Date, zone: string): string {
  let formatter = PUBLISHED.get(zone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: zone })
    PUBLISHED.set(zone, formatter)
  }
  return formatter.format(date)
}

/**
 * Lo más que lee de una vez una pantalla que suma o compara publicaciones (el tablero,
 * «Comparar por atributo», «Tu mejor 10 %»). Con 1.000 publicaciones por semana, un mes
 * son unas 4.300; el tope de 2000 que hubo hasta octubre de 2026 cortaba un mes por la
 * mitad. Cabe porque de cada publicación se traen solo dos lecturas (ver abajo).
 */
export const MAX_PUBLICACIONES_LEIDAS = 10_000

/**
 * `opts` exists for the metrics API: the panel wants the latest 200 posts whatever
 * their date, but an API caller asking for a month needs the window pushed into the
 * query — otherwise the newest 200 rows are all it can ever see, and a request for
 * an older month comes back empty with no way to tell that from "nothing happened".
 *
 * `conActividad` is what the dashboard sums over: the posts with a reading or a visit
 * inside the period, whatever their date. Those are the only ones that can add views
 * gained or visits to the period, and asking for them by name replaced «the 500 most
 * recent», which at 1,000 posts a week covered three days of a thirty-day window.
 */
export async function getPostRows(
  f: Filters,
  includeArchived = false,
  opts: {
    publishedFrom?: Date
    publishedTo?: Date
    limit?: number
    accountId?: string
    ids?: string[]
    conActividad?: boolean
  } = {},
): Promise<PostRow[]> {
  if (opts.ids?.length === 0) return []
  const db = getDb()
  const from = localDay(f.from, f.zone)
  const to = localDay(f.to, f.zone)

  const postConds: SQL[] = [eq(socialPosts.ownerId, f.ownerId)]
  if (!includeArchived) postConds.push(isNull(socialPosts.archivedAt))
  if (opts.publishedFrom) postConds.push(gte(socialPosts.publishedAt, opts.publishedFrom))
  if (opts.publishedTo) postConds.push(lte(socialPosts.publishedAt, opts.publishedTo))
  // En la consulta y no después: filtrar tras el tope le quitaba sus publicaciones a una
  // cuenta poco activa al lado de otra que publica mucho.
  if (opts.accountId) postConds.push(eq(socialPosts.accountId, opts.accountId))
  // Las versiones de una pieza: unas pocas publicaciones con nombre y apellido.
  if (opts.ids) postConds.push(inArray(socialPosts.id, opts.ids))
  if (opts.conActividad) {
    // Dos subconsultas y no un EXISTS por fila: cada una recorre una sola vez lo del
    // período (por el índice de día o de fecha) y Postgres las cruza con un hash.
    const leidasEnElPeriodo = db
      .selectDistinct({ id: postMetrics.postId })
      .from(postMetrics)
      .where(and(gte(postMetrics.day, from), lte(postMetrics.day, to)))
    const visitadasEnElPeriodo = db
      .selectDistinct({ campaign: visits.campaign })
      .from(visits)
      .where(
        and(
          gte(visits.createdAt, f.from),
          lte(visits.createdAt, f.to),
          inArray(visits.profileId, db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, f.ownerId))),
        ),
      )
    postConds.push(
      or(inArray(socialPosts.id, leidasEnElPeriodo), inArray(socialPosts.campaign, visitadasEnElPeriodo))!,
    )
  }

  const posts = await db
    .select()
    .from(socialPosts)
    .where(and(...postConds))
    .orderBy(desc(socialPosts.publishedAt))
    .limit(opts.limit ?? 200)

  if (posts.length === 0) return []

  const ids = posts.map((p) => p.id)
  const campaigns = posts.map((p) => p.campaign)

  // Dos lecturas por publicación, no todas: la última del período (el contador) y la
  // última de antes (la vara contra la que se mide lo ganado), que son las únicas que mira
  // `periodChange`. Traer todas eran decenas por publicación, y con miles de publicaciones
  // eso era lo que pesaba. La diferencia con antes, a propósito: si la última lectura trae
  // una métrica en null, ya no se mira una anterior que sí la tenía. No pasa en la práctica
  // —una red que no entrega una métrica no la entrega nunca—, y no vale una consulta por
  // métrica.
  const columnas = {
    postId: postMetrics.postId,
    day: postMetrics.day,
    views: postMetrics.views,
    likes: postMetrics.likes,
    comments: postMetrics.comments,
    shares: postMetrics.shares,
    saves: postMetrics.saves,
    reach: postMetrics.reach,
  }
  const adentro = await db
    .selectDistinctOn([postMetrics.postId], columnas)
    .from(postMetrics)
    .where(and(inArray(postMetrics.postId, ids), gte(postMetrics.day, from), lte(postMetrics.day, to)))
    .orderBy(postMetrics.postId, desc(postMetrics.day))
  const antes = await db
    .selectDistinctOn([postMetrics.postId], columnas)
    .from(postMetrics)
    .where(and(inArray(postMetrics.postId, ids), lt(postMetrics.day, from)))
    .orderBy(postMetrics.postId, desc(postMetrics.day))
  const snapshots = [...antes, ...adentro]

  const byPost = new Map<string, typeof snapshots>()
  for (const snapshot of snapshots) {
    const list = byPost.get(snapshot.postId) ?? []
    list.push(snapshot)
    byPost.set(snapshot.postId, list)
  }

  const visitConds: SQL[] = [
    gte(visits.createdAt, f.from),
    lte(visits.createdAt, f.to),
    inArray(visits.campaign, campaigns),
    inArray(visits.profileId, db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, f.ownerId))),
  ]
  if (f.profileId) visitConds.push(eq(visits.profileId, f.profileId))
  if (!f.includeBots) visitConds.push(eq(visits.isBot, false))

  const visitRows = await db
    .select({
      campaign: sql<string>`${visits.campaign}`,
      total: int(sql`count(*)`),
      uniques: int(sql`count(distinct ${visits.visitorHash})`),
    })
    .from(visits)
    .where(and(...visitConds))
    .groupBy(visits.campaign)

  const clickConds: SQL[] = [
    gte(clicks.createdAt, f.from),
    lte(clicks.createdAt, f.to),
    inArray(visits.campaign, campaigns),
    inArray(clicks.profileId, db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, f.ownerId))),
  ]
  if (f.profileId) clickConds.push(eq(clicks.profileId, f.profileId))
  if (!f.includeBots) clickConds.push(eq(clicks.isBot, false))

  const clickRows = await db
    .select({ campaign: sql<string>`${visits.campaign}`, total: int(sql`count(*)`) })
    .from(clicks)
    .innerJoin(visits, eq(clicks.visitId, visits.id))
    .where(and(...clickConds))
    .groupBy(visits.campaign)

  // A tag with no traffic *ever* means the link was never pasted, which reads as "—".
  // A tag with traffic before but none this period is a real zero.
  const everSeen = await db
    .selectDistinct({ campaign: sql<string>`${visits.campaign}` })
    .from(visits)
    .where(
      and(
        inArray(visits.campaign, campaigns),
        inArray(visits.profileId, db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ownerId, f.ownerId))),
      ),
    )

  const seen = new Set(everSeen.map((r) => r.campaign))
  const visitMap = new Map(visitRows.map((r) => [r.campaign, r]))
  const clickMap = new Map(clickRows.map((r) => [r.campaign, r.total]))

  return posts.map((post) => {
    const list = byPost.get(post.id) ?? []
    const snapshotsOf = (key: 'views' | 'likes' | 'comments' | 'shares' | 'saves' | 'reach'): Snapshot[] =>
      list.map((s) => ({ day: s.day, value: s[key] }))

    // Sin esto, la primera sincronización de un catálogo viejo cargaría toda su
    // historia como crecimiento de la ventana que la contiene.
    const publishedDay = localDay(post.publishedAt, f.zone)

    const views = periodChange(snapshotsOf('views'), from, to, publishedDay)
    const likes = periodChange(snapshotsOf('likes'), from, to, publishedDay)
    const comments = periodChange(snapshotsOf('comments'), from, to, publishedDay)
    const shares = periodChange(snapshotsOf('shares'), from, to, publishedDay)
    // De YouTube solo salen los contadores tal como los da la API: lo ganado y el
    // arrastre son métricas derivadas, que sus políticas no permiten (`politica-youtube`).
    // Anularlos aquí los saca de todo lo que se construye encima —la tabla, los totales,
    // el ranking, la API de métricas y la app— sin que cada uno tenga que acordarse.
    const derivadas = !sinMetricasDerivadas(post.network)
    const pasted = seen.has(post.campaign)
    const traffic = visitMap.get(post.campaign)
    const visitCount = pasted ? (traffic?.total ?? 0) : null
    const clickCount = pasted ? (clickMap.get(post.campaign) ?? 0) : null

    return {
      id: post.id,
      network: post.network,
      accountId: post.accountId,
      externalId: post.externalId,
      permalink: post.permalink,
      caption: post.caption,
      thumbnailUrl: post.thumbnailUrl,
      mediaType: post.mediaType,
      publishedLabel: publishedLabel(post.publishedAt, f.zone),
      publishedAt: post.publishedAt,
      campaign: post.campaign,
      archived: post.archivedAt !== null,
      views: views.current,
      viewsChange: derivadas ? views.change : null,
      likesChange: derivadas ? likes.change : null,
      commentsChange: derivadas ? comments.change : null,
      sharesChange: derivadas ? shares.change : null,
      isNew: views.isNew,
      likes: likes.current,
      comments: comments.current,
      shares: shares.current,
      saves: periodChange(snapshotsOf('saves'), from, to).current,
      reach: periodChange(snapshotsOf('reach'), from, to).current,
      visits: visitCount,
      uniques: pasted ? (traffic?.uniques ?? 0) : null,
      clicks: clickCount,
      ctr:
        visitCount !== null && visitCount > 0 && clickCount !== null
          ? (clickCount / visitCount) * 100
          : null,
      // Against the views *gained* this period, never the lifetime counter: the
      // visits above are counted inside the window, so the divisor has to be too.
      // A post that gained nothing yields null, which is the honest answer.
      pull:
        derivadas && views.change !== null && views.change > 0 && visitCount !== null
          ? (visitCount / views.change) * 100
          : null,
    }
  })
}

export type PostSeriesPoint = {
  bucket: string
  label: string
  fullLabel: string
  views: number
  visits: number
}

/**
 * Snapshots are captured once a day, so an hourly bucket has nothing to put in 23 of
 * every 24 slots — the day's whole gain would pile up at midnight and the rest of the
 * chart would read as a flat zero. A day is the finest this series can honestly draw,
 * whatever the range asks for.
 */
function seriesGranularity(f: Filters): Granularity {
  const unit = granularityFor(f)
  return unit === 'hour' ? 'day' : unit
}

/**
 * Views gained per bucket against the visits they drove.
 *
 * Sin YouTube en las views: lo ganado es una métrica derivada y sus políticas no la
 * permiten (`politica-youtube`). Las visitas sí van todas, porque las mide Tu Parrilla.
 *
 * The `lag` window is what turns cumulative counters into daily gains, and the
 * `greatest(0, …)` absorbs the downward revisions Instagram occasionally publishes.
 *
 * Those daily gains are computed first and only then rolled up into the chosen bucket.
 * Subtracting a week's edge snapshots instead would look equivalent and isn't: a post
 * that grew and was then revised down inside the same week would come out understated,
 * or negative, because the `greatest(0, …)` would never see the individual days.
 */
export async function getPostSeries(f: Filters): Promise<PostSeriesPoint[]> {
  const tz = f.zone
  const unit = seriesGranularity(f)
  const interval = unit === 'day' ? '1 day' : '1 week'
  const from = localDay(f.from, f.zone)
  const to = localDay(f.to, f.zone)

  // Toda fecha va con `.toISOString()`: el driver de `postgres-js` instala serializadores
  // transparentes para los tipos de fecha, o sea que NO convierte, y un `Date` interpolado
  // en SQL crudo revienta con ERR_INVALID_ARG_TYPE. Acá aplica también a las comparaciones
  // de `v`, que van contra el alias `vi.created_at` escrito a mano y no contra el objeto
  // columna: sin tipo declarado, Drizzle no tiene con qué mapearlas.
  const query = sql`
    with span as (
      select generate_series(
        date_trunc(${unit}, ${f.from.toISOString()}::timestamptz at time zone ${tz}),
        date_trunc(${unit}, ${f.to.toISOString()}::timestamptz at time zone ${tz}),
        ${interval}::interval
      ) as bucket
    ),
    gains as (
      select m.day,
             greatest(0, m.views - lag(m.views) over (partition by m.post_id order by m.day)) as gained
      from ${postMetrics} m
      join ${socialPosts} p on p.id = m.post_id
      where p.archived_at is null and m.views is not null and m.day <= ${to} and p.owner_id = ${f.ownerId}
        ${sql.join(REDES_SIN_DERIVADAS.map((red) => sql`and p.network <> ${red}`), sql` `)}
    ),
    g as (
      select date_trunc(${unit}, day::timestamp) as bucket, sum(gained)::int as total
      from gains where day >= ${from} group by 1
    ),
    v as (
      select date_trunc(${unit}, vi.created_at at time zone ${tz}) as bucket, count(*) as total
      from ${visits} vi
      join ${socialPosts} p on p.campaign = vi.campaign
      where vi.created_at >= ${f.from.toISOString()} and vi.created_at <= ${f.to.toISOString()} and p.owner_id = ${f.ownerId}
        ${f.profileId ? sql`and vi.profile_id = ${f.profileId}` : sql``}
        ${f.includeBots ? sql`` : sql`and vi.is_bot = false`}
      group by 1
    )
    select to_char(span.bucket, 'YYYY-MM-DD') as bucket,
           coalesce(g.total, 0)::int as views,
           coalesce(v.total, 0)::int as visits
    from span
    left join g on g.bucket = span.bucket
    left join v on v.bucket = span.bucket
    order by span.bucket
  `

  const result = await getDb().execute(query)
  // Filas directas, sin el envoltorio `{ rows }` del driver HTTP de Neon.
  const rows = result as unknown as Array<{
    bucket: string
    views: number
    visits: number
  }>

  return rows.map((row) => ({
    bucket: row.bucket,
    ...describe(row.bucket, unit),
    views: Number(row.views),
    visits: Number(row.visits),
  }))
}

/** Todas las cuentas, en el orden en que se conectaron; Los Fierros (en Ajustes) las agrupa por red. */
export async function getCuentas(ownerId: string): Promise<CuentaRow[]> {
  const cuentas = await getDb()
    .select()
    .from(socialAccounts)
    .where(eq(socialAccounts.ownerId, ownerId))
    .orderBy(asc(socialAccounts.network), asc(socialAccounts.createdAt))
  return cuentas.map((a) => ({
    id: a.id,
    network: a.network,
    handle: a.handle,
    externalId: a.externalId,
    connected: Boolean(a.accessToken),
    lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
    lastSyncError: a.lastSyncError,
    expiresAt: a.expiresAt?.toISOString() ?? null,
  }))
}

/** Lets the analytics campaign table show a post's caption instead of a bare tag. */
export async function getCampaignPosts(
  ownerId: string,
  campaigns: string[],
): Promise<Map<string, CampaignPost>> {
  if (campaigns.length === 0) return new Map()

  const rows = await getDb()
    .select({
      id: socialPosts.id,
      accountId: socialPosts.accountId,
      campaign: socialPosts.campaign,
      network: socialPosts.network,
      caption: socialPosts.caption,
      thumbnailUrl: socialPosts.thumbnailUrl,
      permalink: socialPosts.permalink,
    })
    .from(socialPosts)
    .where(and(eq(socialPosts.ownerId, ownerId), inArray(socialPosts.campaign, campaigns)))

  return new Map(rows.map((r) => [r.campaign, r]))
}
