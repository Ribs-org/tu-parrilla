import type { SocialAccount } from '@/db'
import { env } from '../env'
import {
  NO_METRICS,
  type Connector,
  type FetchedBatch,
  type FetchedPost,
  type OpcionesDeListado,
  type PostMetricValues,
} from './connector'
import { decryptToken } from './crypto'
import { laMasVieja, sigueListando } from './lectura'

const API = 'https://open.tiktokapis.com/v2'
const PAGE_SIZE = 20
// Bounds page fetches independently of how many videos a page actually yields: a page can
// return `has_more: true` with an empty `videos` array, which would otherwise starve the
// videos.length check below and loop forever.
const MAX_VIDEO_PAGES = 50
const REFRESH_WINDOW_MS = 60 * 60 * 1000
/** Lo más que acepta `video/query` por llamada. */
const QUERY_SIZE = 20

const VIDEO_FIELDS = [
  'id',
  'title',
  'cover_image_url',
  'share_url',
  'create_time',
  'duration',
  'view_count',
  'like_count',
  'comment_count',
  'share_count',
].join(',')

export type TikTokVideo = {
  id: string
  title?: string
  cover_image_url?: string
  share_url?: string
  create_time?: number
  duration?: number
  view_count?: number
  like_count?: number
  comment_count?: number
  share_count?: number
}

/** Absent and zero are different answers; only `undefined` becomes null. */
function count(raw: number | undefined): number | null {
  return typeof raw === 'number' ? raw : null
}

export function normalizeTikTokVideo(video: TikTokVideo): FetchedPost {
  return {
    externalId: video.id,
    permalink: video.share_url ?? null,
    caption: video.title ? video.title : null,
    thumbnailUrl: video.cover_image_url ?? null,
    mediaType: 'video',
    // create_time is epoch seconds, not milliseconds.
    publishedAt: new Date((video.create_time ?? 0) * 1000),
    metrics: {
      ...NO_METRICS,
      views: count(video.view_count),
      likes: count(video.like_count),
      comments: count(video.comment_count),
      shares: count(video.share_count),
    },
  }
}

export const tiktokConnector: Connector = {
  network: 'tiktok',

  /** The access token lasts 24 hours, so a daily cron always finds it expired. */
  async ensureCredential(account: SocialAccount): Promise<string | null> {
    if (!account.accessToken) return null
    const token = decryptToken(account.accessToken)

    const stillValid =
      account.expiresAt && account.expiresAt.getTime() - Date.now() > REFRESH_WINDOW_MS
    if (stillValid) return token

    const clientKey = env('TIKTOK_CLIENT_KEY')
    const clientSecret = env('TIKTOK_CLIENT_SECRET')
    if (!clientKey || !clientSecret || !account.refreshToken) return token

    const response = await fetch(`${API}/oauth/token/`, {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: decryptToken(account.refreshToken),
      }),
    })
    if (!response.ok) throw new Error(`TikTok refresh ${response.status}`)

    const data = (await response.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    if (!data.access_token) return token

    const { getDb, socialAccounts } = await import('@/db')
    const { eq } = await import('drizzle-orm')
    const { encryptToken } = await import('./crypto')

    await getDb()
      .update(socialAccounts)
      .set({
        accessToken: encryptToken(data.access_token),
        refreshToken: data.refresh_token ? encryptToken(data.refresh_token) : account.refreshToken,
        expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
      })
      .where(eq(socialAccounts.id, account.id))

    return data.access_token
  },

  async fetchPosts(_account: SocialAccount, token: string | null, opciones?: OpcionesDeListado): Promise<FetchedBatch> {
    if (!token) return { posts: [], windowWasCapped: false }

    const videos: TikTokVideo[] = []
    let cursor: number | undefined
    let pagesFetched = 0
    let moreToPage = false
    let masVieja: Date | null = null

    while (pagesFetched < MAX_VIDEO_PAGES && sigueListando(videos.length, masVieja, opciones?.desde)) {
      const response = await fetch(`${API}/video/list/?fields=${VIDEO_FIELDS}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ max_count: PAGE_SIZE, ...(cursor !== undefined ? { cursor } : {}) }),
      })
      if (!response.ok) {
        throw new Error(`TikTok ${response.status}: ${(await response.text()).slice(0, 200)}`)
      }

      const payload = (await response.json()) as {
        data?: { videos?: TikTokVideo[]; cursor?: number; has_more?: boolean }
      }
      pagesFetched++

      for (const item of payload.data?.videos ?? []) {
        videos.push(item)
        masVieja = laMasVieja(masVieja, new Date((item.create_time ?? 0) * 1000))
      }

      moreToPage = Boolean(payload.data?.has_more) && payload.data?.cursor !== undefined
      if (!moreToPage) break
      cursor = payload.data!.cursor
    }

    // Videos still waiting behind the cursor mean the loop stopped at its window or its
    // page ceiling rather than at the end of the account. Nothing listed is dropped.
    return { posts: videos.map(normalizeTikTokVideo), windowWasCapped: moreToPage }
  },

  /**
   * `video/query` recibe hasta 20 ids por llamada y devuelve solo los que siguen
   * existiendo: un video borrado simplemente no vuelve.
   */
  async fetchMetricsById(_account: SocialAccount, token: string | null, externalIds: string[]) {
    const metricas = new Map<string, PostMetricValues>()
    if (!token) return metricas
    for (let i = 0; i < externalIds.length; i += QUERY_SIZE) {
      const response = await fetch(`${API}/video/query/?fields=${VIDEO_FIELDS}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { video_ids: externalIds.slice(i, i + QUERY_SIZE) } }),
      })
      if (!response.ok) {
        throw new Error(`TikTok ${response.status}: ${(await response.text()).slice(0, 200)}`)
      }
      const payload = (await response.json()) as { data?: { videos?: TikTokVideo[] } }
      for (const video of payload.data?.videos ?? []) metricas.set(video.id, normalizeTikTokVideo(video).metrics)
    }
    return metricas
  },
}
