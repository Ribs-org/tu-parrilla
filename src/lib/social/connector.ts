import type { SocialAccount } from '@/db'

export type PostMetricValues = {
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  reach: number | null
}

export type AccountMetricValues = {
  followers: number | null
  totalViews: number | null
  videoCount: number | null
  profileViews: number | null
  reach: number | null
  views: number | null
  accountsEngaged: number | null
}

export const NO_ACCOUNT_METRICS: AccountMetricValues = {
  followers: null,
  totalViews: null,
  videoCount: null,
  profileViews: null,
  reach: null,
  views: null,
  accountsEngaged: null,
}

export type FetchedPost = {
  externalId: string
  permalink: string | null
  caption: string | null
  thumbnailUrl: string | null
  mediaType: string | null
  publishedAt: Date
  metrics: PostMetricValues
}

export type FetchedBatch = {
  posts: FetchedPost[]
  /**
   * The connector stopped at a ceiling of its own instead of reaching the end of the
   * catalogue, so what it returned is a window, not everything. `postsToArchive` needs
   * this to tell "deleted" from "beyond the edge of what we asked for".
   *
   * Only the connector can answer it. The orchestrator used to infer it from how many
   * posts came back, which YouTube quietly broke: it collects *ids* from `playlistItems`
   * and then builds posts from `videos.list`, which omits private and deleted videos. One
   * unavailable video in the newest 200 returned 199, read as an exhaustive fetch, and
   * archived every older post — permanently, since those posts sat beyond the cap and
   * never came back to clear `archivedAt`. Today every connector answers it the same way:
   * a cursor was left in hand.
   */
  windowWasCapped: boolean
}

/**
 * The only thing the orchestrator knows about a network. Everything network-specific —
 * field names, pagination, auth dance — stays inside the implementation.
 */
export type Connector = {
  network: string
  /** Returns the usable credential, refreshing it first when it is close to expiring. */
  ensureCredential(account: SocialAccount): Promise<string | null>
  /**
   * Lo más nuevo de la cuenta, de adelante hacia atrás, con sus números: al menos
   * `MIN_LISTADAS` y, si viene `desde`, todo lo publicado desde ahí (`sigueListando`).
   */
  fetchPosts(account: SocialAccount, token: string | null, opciones?: OpcionesDeListado): Promise<FetchedBatch>
  /**
   * Los números de hoy de publicaciones ya guardadas que el listado no trajo, por su id
   * (`lectura.ts`). Lo que la red no devuelve —borrado, o un id que ya no responde— falta
   * en el mapa y nada más: no se archiva por eso, porque un id que no contesta no
   * distingue «borrado» de «sin permiso», y archivar no tiene vuelta. Una publicación sin
   * estadísticas vuelve con todo en null, como en el listado. Opcional: sin él, lo que
   * cae fuera del listado deja de leerse.
   */
  fetchMetricsById?(account: SocialAccount, token: string | null, externalIds: string[]): Promise<Map<string, PostMetricValues>>
  /**
   * Cómo va la cuenta hoy. Opcional: una red que no lo implemente simplemente no
   * aporta fila, y ninguna implementación debe lanzar por una métrica ausente.
   */
  fetchAccountMetrics?(account: SocialAccount, token: string): Promise<AccountMetricValues>
}

/** Hasta dónde listar: además del mínimo, todo lo publicado desde `desde` (`lectura.ts`). */
export type OpcionesDeListado = { desde?: Date }

/** Every metric absent — the starting point a connector fills in with what it has. */
export const NO_METRICS: PostMetricValues = {
  views: null,
  likes: null,
  comments: null,
  shares: null,
  saves: null,
  reach: null,
}
