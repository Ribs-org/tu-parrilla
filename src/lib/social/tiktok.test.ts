import { afterEach, describe, expect, it, vi } from 'vitest'
import fixture from './fixtures/tiktok-videos.json'
import { normalizeTikTokVideo, tiktokConnector, type TikTokVideo } from './tiktok'

const [video, fresh] = fixture.data.videos as TikTokVideo[]

describe('normalizeTikTokVideo', () => {
  it('mapea identidad y contenido', () => {
    const post = normalizeTikTokVideo(video!)
    expect(post.externalId).toBe('7234567890123456789')
    expect(post.permalink).toBe('https://www.tiktok.com/@ribs/video/7234567890123456789')
    expect(post.caption).toBe('Respuesta a @alguien sobre entrenar en casa')
    expect(post.thumbnailUrl).toBe('https://p16.tiktokcdn.com/cover1.jpeg')
    expect(post.mediaType).toBe('video')
  })

  it('lee create_time como segundos epoch, no milisegundos', () => {
    expect(normalizeTikTokVideo(video!).publishedAt.toISOString()).toBe('2026-08-04T00:00:00.000Z')
  })

  it('mapea los cuatro contadores que TikTok sí reporta', () => {
    const post = normalizeTikTokVideo(video!)
    expect(post.metrics.views).toBe(91204)
    expect(post.metrics.likes).toBe(7712)
    expect(post.metrics.comments).toBe(620)
    expect(post.metrics.shares).toBe(388)
  })

  it('deja en null lo que la Display API no expone', () => {
    const post = normalizeTikTokVideo(video!)
    expect(post.metrics.saves).toBeNull()
    expect(post.metrics.reach).toBeNull()
  })

  it('guarda un cero real como cero, no como ausencia', () => {
    const post = normalizeTikTokVideo(fresh!)
    expect(post.metrics.views).toBe(0)
    expect(post.metrics.likes).toBe(0)
    expect(post.metrics.comments).toBe(0)
    expect(post.metrics.shares).toBe(0)
  })

  it('trata el título vacío como sin caption', () => {
    expect(normalizeTikTokVideo(fresh!).caption).toBeNull()
  })
})

describe('tiktokConnector.fetchMetricsById', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pide de a 20 ids a video/query, y lo que no vuelve (borrado) no está en el mapa', async () => {
    const pedidos: string[][] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        expect(url).toContain('/video/query/')
        const ids = (JSON.parse(String(init.body)) as { filters: { video_ids: string[] } }).filters.video_ids
        pedidos.push(ids)
        const videos = ids.filter((id) => id !== 'v3').map((id) => ({ id, view_count: 10 }))
        return Response.json({ data: { videos } })
      }),
    )
    const ids = Array.from({ length: 25 }, (_, i) => `v${i}`)
    const metricas = await tiktokConnector.fetchMetricsById!({} as never, 'token', ids)
    expect(pedidos.map((p) => p.length)).toEqual([20, 5])
    expect(metricas.size).toBe(24)
    expect(metricas.has('v3')).toBe(false)
    expect(metricas.get('v0')!.views).toBe(10)
  })

  it('una respuesta que no es 2xx sube', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('limit', { status: 429 })))
    await expect(tiktokConnector.fetchMetricsById!({} as never, 'token', ['v0'])).rejects.toThrow('TikTok 429')
  })
})
