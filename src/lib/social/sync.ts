import 'server-only'
import { createHash } from 'node:crypto'
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { accountMetrics, getDb, postMetrics, socialAccounts, socialPosts } from '@/db'
import type { SocialAccount } from '@/db'
import { localDay } from '../analytics'
import { env } from '../env'
import { adminId, buscarPorId } from '../usuarios'
import { ZONA_POR_DEFECTO } from '../zona'
import { postsToArchive } from './archive'
import { campaignTagFor, type CuentaTag } from './campaign'
import type { Connector, FetchedPost, PostMetricValues } from './connector'
import { agruparPorRed, primariaDe } from './cuenta'
import { connectorFor } from './index'
import { DIAS_DE_LECTURA_DIARIA, porLeerHoy } from './lectura'
import { vincularVideosTikTok } from './vincular-tiktok'

export type SyncReport = Array<{ network: string; handle: string | null; ok: boolean; posts: number; error?: string }>

/**
 * La fila de YouTube del despliegue nace la primera vez que corre un sync con las dos
 * variables puestas; las demás cuentas llegan por el callback. Nace sin tokens, y un
 * canal sin conectar no se sincroniza (`youtubeConnector.ensureCredential`): sirve para
 * que la tarjeta ya esté ahí, esperando el Conectar de su dueño.
 */
async function ensureYouTubeAccount(): Promise<void> {
  const channelId = env('YOUTUBE_CHANNEL_ID')
  if (!channelId || !env('YOUTUBE_API_KEY')) return

  // La cuenta que nace de YOUTUBE_CHANNEL_ID es del despliegue: la entrega 3 la ata mejor.
  const ownerId = await adminId()

  await getDb()
    .insert(socialAccounts)
    .values({ ownerId, network: 'youtube', externalId: channelId, handle: channelId })
    .onConflictDoUpdate({
      target: [socialAccounts.network, socialAccounts.externalId],
      set: { externalId: channelId },
    })
}

// The Postgres name drizzle-kit generates for `campaign: text().unique()` with no
// explicit name — confirmed against the live schema (see `pg_constraint`). Matching on
// it, not just the unique-violation code, is what keeps this fallback from swallowing an
// unrelated unique violation (e.g. a future constraint on the table) that should propagate.
const CAMPAIGN_UNIQUE_CONSTRAINT = 'social_posts_campaign_unique'

export function isCampaignUniqueViolation(error: unknown): boolean {
  const matches = (candidate: unknown): boolean => {
    // This project's driver is `postgres` (postgres-js), not `node-postgres`: it maps the
    // field to `constraint_name`, not `constraint` (see
    // `node_modules/postgres/src/connection.js:46`). Both names are checked in case some
    // layer normalizes it, but `constraint_name` is what actually arrives.
    const { code, constraint_name, constraint } =
      (candidate as { code?: string; constraint_name?: string; constraint?: string }) ?? {}
    return code === '23505' && (constraint_name ?? constraint) === CAMPAIGN_UNIQUE_CONSTRAINT
  }
  // drizzle-orm 0.45.2 wraps every failing query in `DrizzleQueryError` and puts the
  // driver's original error in `cause` (see `drizzle-orm/errors.cjs:35-45`, and every
  // `throw new DrizzleQueryError(queryString, params, e)` in
  // `drizzle-orm/pg-core/session.js`), so the pg fields above live one level down, not on
  // the error this function catches. No `instanceof Error` guard up front, on purpose: it
  // would also throw away a `cause` that happened not to be an `Error`. Same shape as
  // `esChoqueDeUnicidad` in `src/lib/usuarios.ts`.
  return matches(error) || matches((error as { cause?: unknown })?.cause)
}

/**
 * `campaignTagFor` collapses separators and truncates at 48 chars, so two different
 * native ids can — astronomically unlikely, but not structurally impossible — mint the
 * same tag; an owner can also hand-edit one post's tag onto a value another post already
 * generated. Either way, the fallback carves a short, deterministic suffix out of the
 * same 48-char budget so the retry lands on a tag nothing else already holds.
 */
function disambiguatedCampaignTag(network: string, externalId: string, cuenta?: CuentaTag): string {
  const base = campaignTagFor(network, externalId, cuenta)
  const suffix = createHash('sha256').update(`${network}:${externalId}`).digest('hex').slice(0, 6)
  return `${base.slice(0, base.length - suffix.length - 1)}-${suffix}`
}

async function insertOrUpdatePost(
  post: FetchedPost,
  account: SocialAccount,
  campaign: string,
): Promise<string> {
  const [row] = await getDb()
    .insert(socialPosts)
    .values({
      ownerId: account.ownerId,
      network: account.network,
      accountId: account.id,
      externalId: post.externalId,
      permalink: post.permalink,
      caption: post.caption,
      thumbnailUrl: post.thumbnailUrl,
      mediaType: post.mediaType,
      publishedAt: post.publishedAt,
      campaign,
    })
    .onConflictDoUpdate({
      target: [socialPosts.accountId, socialPosts.externalId],
      // `campaign` is deliberately absent: once the owner edits the tag, it is theirs.
      set: {
        permalink: post.permalink,
        caption: post.caption,
        thumbnailUrl: post.thumbnailUrl,
        mediaType: post.mediaType,
        publishedAt: post.publishedAt,
        archivedAt: null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: socialPosts.id })

  return row!.id
}

async function upsertPost(post: FetchedPost, account: SocialAccount, cuenta: CuentaTag): Promise<string> {
  try {
    return await insertOrUpdatePost(post, account, campaignTagFor(account.network, post.externalId, cuenta))
  } catch (error) {
    // A unique violation on `campaign` specifically is the one failure mode worth a
    // retry — see `disambiguatedCampaignTag`. Anything else (a dropped connection, a
    // constraint this doesn't anticipate) must still propagate and fail the sync.
    if (!isCampaignUniqueViolation(error)) throw error
    return await insertOrUpdatePost(
      post,
      account,
      disambiguatedCampaignTag(account.network, post.externalId, cuenta),
    )
  }
}

export type Lectura = { postId: string; metrics: PostMetricValues }

/** Cuántas lecturas van en un mismo insert. */
const LECTURAS_POR_INSERT = 500

/**
 * Las lecturas del día, de a muchas por consulta: con cientos de publicaciones por cuenta,
 * una consulta por lectura son cientos de idas y vueltas a la base. Una misma
 * publicación dos veces en el lote —una red que repite un post entre dos páginas— hace
 * fallar el insert entero («ON CONFLICT DO UPDATE command cannot affect row a second
 * time»), así que se queda la última.
 */
export function lecturasSinRepetir(lecturas: readonly Lectura[]): Lectura[] {
  return [...new Map(lecturas.map((l) => [l.postId, l])).values()]
}

async function writeSnapshots(lecturas: readonly Lectura[], day: string): Promise<void> {
  const unicas = lecturasSinRepetir(lecturas)
  for (let i = 0; i < unicas.length; i += LECTURAS_POR_INSERT) {
    await getDb()
      .insert(postMetrics)
      .values(unicas.slice(i, i + LECTURAS_POR_INSERT).map((l) => ({ postId: l.postId, day, ...l.metrics })))
      .onConflictDoUpdate({
        target: [postMetrics.postId, postMetrics.day],
        set: {
          views: sql`excluded.views`,
          likes: sql`excluded.likes`,
          comments: sql`excluded.comments`,
          shares: sql`excluded.shares`,
          saves: sql`excluded.saves`,
          reach: sql`excluded.reach`,
          capturedAt: new Date(),
        },
      })
  }
}

/** Cuántos ids se le piden por vez a `fetchMetricsById`; entre una vez y la otra se mira el plazo. */
const IDS_POR_VUELTA = 50

/**
 * Lo viejo que el listado no trajo y que hoy toca (`lectura.ts`), leído por su id hasta
 * que se acaba el plazo de la corrida. Lo que no alcanzó sigue en la fila mañana. Devuelve
 * cuántas se leyeron.
 */
async function leerLasViejas(
  account: SocialAccount,
  connector: Connector,
  token: string,
  listadas: ReadonlySet<string>,
  day: string,
  zona: string,
  plazo: number,
): Promise<number> {
  if (!connector.fetchMetricsById) return 0
  const filas = await getDb()
    .select({
      id: socialPosts.id,
      externalId: socialPosts.externalId,
      publishedAt: socialPosts.publishedAt,
      // Como texto: el día es una llave «YYYY-MM-DD», igual que `day`.
      ultimaLectura: sql<string | null>`max(${postMetrics.day})::text`,
    })
    .from(socialPosts)
    .leftJoin(postMetrics, eq(postMetrics.postId, socialPosts.id))
    .where(and(eq(socialPosts.accountId, account.id), isNull(socialPosts.archivedAt)))
    .groupBy(socialPosts.id)

  const conocidas = filas.map((f) => ({
    externalId: f.externalId,
    publicadaDia: localDay(f.publishedAt, zona),
    ultimaLectura: f.ultimaLectura,
  }))
  const ids = porLeerHoy(conocidas, listadas, day)
  const postIdDe = new Map(filas.map((f) => [f.externalId, f.id]))

  let leidas = 0
  for (let i = 0; i < ids.length; i += IDS_POR_VUELTA) {
    if (Date.now() >= plazo) {
      console.log(`[sync] ${account.network} ${account.handle ?? ''}: ${ids.length - i} publicaciones viejas quedan para mañana`)
      break
    }
    const metricas = await connector.fetchMetricsById(account, token, ids.slice(i, i + IDS_POR_VUELTA))
    const lecturas: Lectura[] = []
    for (const [externalId, metrics] of metricas) {
      const postId = postIdDe.get(externalId)
      if (postId) lecturas.push({ postId, metrics })
    }
    await writeSnapshots(lecturas, day)
    leidas += lecturas.length
  }
  return leidas
}

/**
 * Hasta cuándo se leen publicaciones viejas, contado desde que empieza `syncAll`. Lo nuevo
 * se lee siempre entero; lo viejo es lo que cede si no hay tiempo. Deja margen dentro de
 * los 300 s del cron para la retención de YouTube y lo que corre después.
 */
export const PLAZO_DE_LO_VIEJO_MS = 180_000

export async function syncAccount(account: SocialAccount, primaria: boolean, plazo = Infinity): Promise<number> {
  const db = getDb()
  const connector = connectorFor(account.network)
  if (!connector) throw new Error(`Unknown network ${account.network}`)
  const cuenta: CuentaTag = { primaria, handle: account.handle, externalId: account.externalId }

  try {
    const token = await connector.ensureCredential(account)

    // No credential is not a failure, it is an account the owner disconnected: the row
    // outlives the token on purpose, so a disconnected account still has one to find.
    // Leaving before the writes below is what keeps its card from reading
    // "Sincronizado recién" under a Conectar button.
    if (token === null) return 0

    // Lo de los últimos días se lista entero, aunque sean cientos (`lectura.ts`).
    const desde = new Date(Date.now() - DIAS_DE_LECTURA_DIARIA * 864e5)
    const { posts: fetched, windowWasCapped } = await connector.fetchPosts(account, token, { desde })

    // El día del dueño, no el del servidor: `getPostRows` compara estas llaves contra
    // `localDay(…, f.zone)`, así que una captura escrita en otra zona se leería un día
    // corrida —o fuera de la ventana— para quien la mira.
    // `owner_id` es nullable en el esquema (filas anteriores a los usuarios), y por eso
    // el default del sitio sigue siendo la última palabra acá.
    const dueno = account.ownerId ? await buscarPorId(account.ownerId) : null
    const zona = dueno?.zona ?? ZONA_POR_DEFECTO
    const day = localDay(new Date(), zona)
    const lecturas: Lectura[] = []
    for (const post of fetched) {
      lecturas.push({ postId: await upsertPost(post, account, cuenta), metrics: post.metrics })
    }
    await writeSnapshots(lecturas, day)

    // Extra deliberado: las métricas de cuenta nunca deben tumbar la sincronización
    // de publicaciones que sí funcionó, así que su fallo muere acá mismo.
    if (connector.fetchAccountMetrics) {
      try {
        const values = await connector.fetchAccountMetrics(account, token)
        await db
          .insert(accountMetrics)
          .values({ network: account.network, accountId: account.id, day, ...values })
          .onConflictDoUpdate({
            target: [accountMetrics.accountId, accountMetrics.day],
            set: { ...values, capturedAt: new Date() },
          })
      } catch (error) {
        console.error(`[sync] métricas de cuenta de ${account.network}:`, String(error).slice(0, 300))
      }
    }

    // Solo los posts de ESTA cuenta: con dos cuentas en la misma red, comparar contra
    // toda la red archivaría el catálogo de la otra, que nunca aparece en este fetch.
    const known = await db
      .select({ externalId: socialPosts.externalId, publishedAt: socialPosts.publishedAt })
      .from(socialPosts)
      .where(and(eq(socialPosts.accountId, account.id), isNull(socialPosts.archivedAt)))

    // A truncated window is the connector's own answer, not something counted from here:
    // a known post that didn't come back can only be judged deleted once it falls inside
    // the window, and only the connector knows where that edge really is.
    const gone = postsToArchive(known, fetched, windowWasCapped)
    if (gone.length > 0) {
      await db
        .update(socialPosts)
        .set({ archivedAt: new Date() })
        .where(and(eq(socialPosts.accountId, account.id), inArray(socialPosts.externalId, gone)))
    }

    // TikTok no siempre devuelve el id del video al publicar: con los videos recién traídos
    // se le pone a lo que salió por Tu Parrilla sin él, y así cruza con sus atributos. Un
    // fallo acá no tumba la sincronización, que ya guardó lo suyo.
    if (account.network === 'tiktok') {
      try {
        const vinculados = await vincularVideosTikTok(account)
        if (vinculados > 0) console.log(`[sync] TikTok: ${vinculados} publicaciones recuperaron su id de video`)
      } catch (error) {
        console.error('[sync] vincular videos de TikTok:', String(error).slice(0, 300))
      }
    }

    // Lo viejo, al final y por su cuenta: lo nuevo ya quedó guardado, y un tropiezo acá
    // —un límite de la red a mitad de camino— no debe pintar de rojo una cuenta que sí se
    // leyó. Lo que no se alcanzó a leer le sigue tocando mañana.
    let viejas = 0
    try {
      viejas = await leerLasViejas(account, connector, token, new Set(fetched.map((p) => p.externalId)), day, zona, plazo)
    } catch (error) {
      console.error(`[sync] lo viejo de ${account.network}:`, String(error).slice(0, 300))
    }

    await db
      .update(socialAccounts)
      .set({ lastSyncedAt: new Date(), lastSyncError: null })
      .where(eq(socialAccounts.id, account.id))

    return fetched.length + viejas
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // `lastSyncedAt` deliberately untouched: this run fetched nothing, and stamping it
    // would leave the card reading "Sincronizado recién" over an empty day.
    await db
      .update(socialAccounts)
      .set({ lastSyncError: message.slice(0, 500) })
      .where(eq(socialAccounts.id, account.id))
    throw error
  }
}

/**
 * The networks run in parallel and the accounts of one network in series, so the house
 * never hits the same API concurrently. Every account runs on its own: one that throws
 * leaves its error on its own row and the others still finish and store their snapshot —
 * which is the whole reason it was defensible to take on several integrations at once.
 *
 * Sin dueño recorre todo el despliegue, que es lo que hace el cron; con dueño, solo sus
 * cuentas, que es lo que pide el botón del panel: nadie gasta la cuota de API de otro.
 */
export async function syncAll(ownerId?: string): Promise<SyncReport> {
  const plazo = Date.now() + PLAZO_DE_LO_VIEJO_MS
  // Antes del resto y por su cuenta: una base inalcanzable acá no debe costarle el
  // snapshot del día a las demás, así que su fallo se registra y se sigue.
  try {
    await ensureYouTubeAccount()
  } catch (error) {
    console.error('[sync] no se pudo asegurar la cuenta de YouTube:', String(error).slice(0, 300))
  }

  const cuentas = await getDb()
    .select()
    .from(socialAccounts)
    .where(ownerId ? eq(socialAccounts.ownerId, ownerId) : undefined)
    .orderBy(asc(socialAccounts.createdAt))
  // Solo las redes con conector: una fila de threads o x se sincroniza el día que
  // exista su conector, no antes.
  const conConector = cuentas.filter((c) => connectorFor(c.network))
  const porRed = agruparPorRed(conConector)
  // Redes en paralelo, cuentas de la misma red en serie: la casa nunca pega concurrente
  // contra Meta (ver run.ts), y cinco páginas de Facebook a la vez sería justo eso.
  const porRedResuelto = await Promise.all(
    [...porRed.entries()].map(async ([, cuentas]) => {
      // `cuentas` ya viene filtrado por dueño cuando lo llama el botón del panel (arriba),
      // así que `primaria` es la más antigua *de ese dueño*, no necesariamente la más
      // antigua de la red entera. El cron llama a `syncAll()` sin ownerId y sí ve todas
      // las cuentas, así que puede elegir otra primaria distinta para la misma red. No es
      // un bug: solo significa que qué post nuevo hereda qué etiqueta de campaña depende
      // de si lo sincronizó primero el panel de un dueño o el cron.
      const primaria = primariaDe(cuentas)
      const filas: SyncReport = []
      for (const cuenta of cuentas) {
        try {
          filas.push({ network: cuenta.network, handle: cuenta.handle, ok: true, posts: await syncAccount(cuenta, primaria === cuenta.id, plazo) })
        } catch (error) {
          filas.push({ network: cuenta.network, handle: cuenta.handle, ok: false, posts: 0, error: error instanceof Error ? error.message : String(error) })
        }
      }
      return filas
    }),
  )
  return porRedResuelto.flat()
}
