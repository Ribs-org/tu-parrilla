import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'
import fixture from './fixtures/youtube-videos.json'
import { normalizeYouTubeVideo, youtubeConnector, type YouTubeVideo } from './youtube'

const [video, short] = fixture.items as YouTubeVideo[]

describe('normalizeYouTubeVideo', () => {
  it('mapea los campos que sí vienen', () => {
    const post = normalizeYouTubeVideo(video!)
    expect(post.externalId).toBe('dQw4w9WgXcQ')
    expect(post.permalink).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(post.caption).toBe('Cómo edito mis reels')
    expect(post.thumbnailUrl).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg')
    expect(post.publishedAt.toISOString()).toBe('2026-08-12T14:03:11.000Z')
    expect(post.metrics.views).toBe(8412)
    expect(post.metrics.likes).toBe(402)
    expect(post.metrics.comments).toBe(51)
  })

  it('deja en null lo que la Data API no reporta', () => {
    const post = normalizeYouTubeVideo(video!)
    expect(post.metrics.shares).toBeNull()
    expect(post.metrics.saves).toBeNull()
    expect(post.metrics.reach).toBeNull()
  })

  it('distingue un contador oculto de un cero', () => {
    const post = normalizeYouTubeVideo(short!)
    expect(post.metrics.views).toBe(1203)
    expect(post.metrics.likes).toBeNull()
    expect(post.metrics.comments).toBeNull()
  })

  it('llama short a lo que dura menos de un minuto', () => {
    expect(normalizeYouTubeVideo(short!).mediaType).toBe('short')
    expect(normalizeYouTubeVideo(video!).mediaType).toBe('video')
  })
})

describe('youtubeConnector.ensureCredential', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const cuenta = (refreshToken: string | null) => ({ refreshToken }) as SocialAccount

  it('con el canal conectado, entrega la API key con la que se leen las estadísticas', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'AIza-prueba')
    expect(await youtubeConnector.ensureCredential(cuenta('cifrado'))).toBe('AIza-prueba')
  })

  it('con el canal desconectado no entrega nada, aunque la key exista: no se sigue leyendo', async () => {
    vi.stubEnv('YOUTUBE_API_KEY', 'AIza-prueba')
    expect(await youtubeConnector.ensureCredential(cuenta(null))).toBeNull()
  })
})

describe('youtubeConnector, por ventana y por id', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const canal = { externalId: 'UC-1' } as SocialAccount

  it('lista mientras la fecha de publicación de la playlist siga en la ventana', async () => {
    let paginas = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/channels')) {
          return Response.json({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU-1' } } }] })
        }
        if (url.includes('/videos')) {
          const ids = new URL(url).searchParams.get('id')!.split(',')
          return Response.json({ items: ids.map((id) => ({ id, statistics: { viewCount: '5' } })) })
        }
        const dia = paginas++
        const items = Array.from({ length: 50 }, (_, i) => ({
          contentDetails: { videoId: `${dia}-${i}`, videoPublishedAt: new Date(Date.UTC(2026, 9, 20 - dia)).toISOString() },
        }))
        return Response.json({ items, nextPageToken: `t${paginas}` })
      }),
    )
    const { posts, windowWasCapped } = await youtubeConnector.fetchPosts(canal, 'AIza', {
      desde: new Date(Date.UTC(2026, 9, 15)),
    })
    // Del 20 al 15 son seis páginas; la séptima (del 14) dice que se pasó.
    expect(paginas).toBe(7)
    expect(posts).toHaveLength(350)
    expect(windowWasCapped).toBe(true)
  })

  it('por id: de a 50 en videos.list, y lo privado o borrado simplemente no vuelve', async () => {
    const pedidos: number[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const ids = new URL(url).searchParams.get('id')!.split(',')
        pedidos.push(ids.length)
        return Response.json({
          items: ids.filter((id) => id !== 'v7').map((id) => ({ id, statistics: { viewCount: '12' } })),
        })
      }),
    )
    const ids = Array.from({ length: 60 }, (_, i) => `v${i}`)
    const metricas = await youtubeConnector.fetchMetricsById!(canal, 'AIza', ids)
    expect(pedidos).toEqual([50, 10])
    expect(metricas.size).toBe(59)
    expect(metricas.get('v0')!.views).toBe(12)
  })
})
