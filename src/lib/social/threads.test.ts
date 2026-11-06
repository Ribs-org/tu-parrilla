import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'
import { normalizeThreadsAccount } from './account-metrics'
import {
  ThreadsHttpError,
  isThreadsMediaSinNumeros,
  normalizeThreadsMedia,
  paginaSiguiente,
  permisosExtraDeThreads,
  threadsConnector,
  threadsMetrics,
} from './threads'

const CUENTA = { id: 'a1', externalId: '2600000000000001', accessToken: 'cifrado', expiresAt: null } as unknown as SocialAccount

/** Lo que conteste `responder` según la url, y las urls pedidas en orden. */
function stubThreads(responder: (url: string) => { status?: number; body: unknown }) {
  const urls: string[] = []
  vi.stubGlobal('fetch', (url: string) => {
    urls.push(String(url))
    const { status = 200, body } = responder(String(url))
    return Promise.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }))
  })
  return urls
}

const insights = (valores: Record<string, number>) => ({
  data: Object.entries(valores).map(([name, value]) => ({ name, period: 'lifetime', values: [{ value }] })),
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.THREADS_PERMISOS_EXTRA
})

describe('threadsMetrics', () => {
  it('las respuestas son los comentarios, y reposts más citas son los compartidos', () => {
    expect(threadsMetrics(insights({ views: 1200, likes: 80, replies: 12, reposts: 5, quotes: 2 }))).toEqual({
      views: 1200,
      likes: 80,
      comments: 12,
      shares: 7,
      saves: null,
      reach: null,
    })
  })

  it('lo que no vino queda en null, nunca en cero', () => {
    expect(threadsMetrics({})).toEqual({ views: null, likes: null, comments: null, shares: null, saves: null, reach: null })
    // Con uno solo de los dos, compartidos es ese.
    expect(threadsMetrics(insights({ quotes: 3 })).shares).toBe(3)
  })

  it('acepta también la forma `total_value`', () => {
    expect(threadsMetrics({ data: [{ name: 'likes', total_value: { value: 9 } }] }).likes).toBe(9)
  })
})

describe('normalizeThreadsMedia', () => {
  it('mapea identidad, texto y formato', () => {
    const post = normalizeThreadsMedia(
      {
        id: '1801',
        media_type: 'TEXT_POST',
        permalink: 'https://www.threads.com/@vicente/post/abc',
        text: 'Hola Threads',
        timestamp: '2026-11-01T12:00:00+0000',
      },
      {},
    )
    expect(post).toMatchObject({
      externalId: '1801',
      permalink: 'https://www.threads.com/@vicente/post/abc',
      caption: 'Hola Threads',
      thumbnailUrl: null,
      mediaType: 'text',
    })
    expect(post.publishedAt.toISOString()).toBe('2026-11-01T12:00:00.000Z')
  })

  it('la foto es su propia miniatura; el video trae la suya', () => {
    expect(normalizeThreadsMedia({ id: '1', media_type: 'IMAGE', media_url: 'https://cdn/f.jpg' }, {})).toMatchObject({
      thumbnailUrl: 'https://cdn/f.jpg',
      mediaType: 'image',
    })
    expect(
      normalizeThreadsMedia({ id: '2', media_type: 'VIDEO', media_url: 'https://cdn/v.mp4', thumbnail_url: 'https://cdn/t.jpg' }, {}),
    ).toMatchObject({ thumbnailUrl: 'https://cdn/t.jpg', mediaType: 'video' })
  })
})

describe('normalizeThreadsAccount', () => {
  it('seguidores del total y views de la última jornada de la serie', () => {
    expect(
      normalizeThreadsAccount({
        data: [
          {
            name: 'views',
            values: [
              { value: 300, end_time: '2026-11-05T08:00:00+0000' },
              { value: 120, end_time: '2026-11-04T08:00:00+0000' },
            ],
          },
          { name: 'followers_count', total_value: { value: 431 } },
        ],
      }),
    ).toMatchObject({ followers: 431, views: 300, reach: null, profileViews: null })
  })
})

describe('paginaSiguiente', () => {
  const actual = 'https://graph.threads.net/v1.0/1/threads?fields=id&limit=50&access_token=T'

  it('usa `paging.next` tal cual cuando viene', () => {
    expect(paginaSiguiente(actual, { next: 'https://graph.threads.net/siguiente' }, false)).toBe(
      'https://graph.threads.net/siguiente',
    )
  })

  it('sin `next`, la misma consulta con el cursor `after`', () => {
    const url = new URL(paginaSiguiente(actual, { cursors: { after: 'CUR' } }, false))
    expect(url.searchParams.get('after')).toBe('CUR')
    expect(url.searchParams.get('access_token')).toBe('T')
  })

  it('una página vacía o sin cursor corta', () => {
    expect(paginaSiguiente(actual, { cursors: { after: 'CUR' } }, true)).toBe('')
    expect(paginaSiguiente(actual, undefined, false)).toBe('')
  })
})

describe('isThreadsMediaSinNumeros', () => {
  it('un 404 o el código 100 son de la publicación; lo demás es de la corrida', () => {
    expect(isThreadsMediaSinNumeros(new ThreadsHttpError(404, 'x'))).toBe(true)
    expect(isThreadsMediaSinNumeros(new ThreadsHttpError(400, 'x', 100))).toBe(true)
    expect(isThreadsMediaSinNumeros(new ThreadsHttpError(400, 'x', 10))).toBe(false)
    expect(isThreadsMediaSinNumeros(new ThreadsHttpError(401, 'x', 190))).toBe(false)
    expect(isThreadsMediaSinNumeros(new Error('x'))).toBe(false)
  })
})

describe('threadsConnector', () => {
  it('sin THREADS_PERMISOS_EXTRA no hay credencial de lectura: la cuenta se queda quieta', async () => {
    const urls = stubThreads(() => ({ body: {} }))
    expect(permisosExtraDeThreads()).toBe(false)
    expect(await threadsConnector.ensureCredential(CUENTA)).toBeNull()
    expect(urls).toHaveLength(0)
  })

  it('con la bandera, `permisosExtraDeThreads` la reconoce', () => {
    process.env.THREADS_PERMISOS_EXTRA = '1'
    expect(permisosExtraDeThreads()).toBe(true)
  })

  it('lista lo propio con sus números y deja fuera los reposts de otros', async () => {
    const urls = stubThreads((url) => {
      if (url.includes('/threads?')) {
        return {
          body: {
            data: [
              { id: 'p1', media_type: 'TEXT_POST', text: 'uno', timestamp: '2026-11-04T10:00:00+0000' },
              { id: 'r1', media_type: 'REPOST_FACADE', timestamp: '2026-11-03T10:00:00+0000' },
              { id: 'p2', media_type: 'IMAGE', media_url: 'https://cdn/f.jpg', timestamp: '2026-11-02T10:00:00+0000' },
            ],
          },
        }
      }
      return { body: insights({ views: 10, likes: 1, replies: 0, reposts: 0, quotes: 0 }) }
    })

    const { posts, windowWasCapped } = await threadsConnector.fetchPosts(CUENTA, 'TOKEN')

    expect(posts.map((p) => p.externalId)).toEqual(['p1', 'p2'])
    expect(posts[0]!.metrics).toMatchObject({ views: 10, likes: 1, comments: 0, shares: 0 })
    expect(windowWasCapped).toBe(false)
    expect(urls[0]).toContain('/2600000000000001/threads?')
    expect(urls.filter((u) => u.includes('/insights?metric=views,likes,replies,reposts,quotes'))).toHaveLength(2)
    expect(urls.some((u) => u.includes('/r1/'))).toBe(false)
  })

  it('una publicación sin números queda en null; un token vencido tumba la corrida', async () => {
    stubThreads((url) => {
      if (url.includes('/threads?')) return { body: { data: [{ id: 'p1', timestamp: '2026-11-04T10:00:00+0000' }] } }
      return { status: 400, body: { error: { code: 100, message: 'Unsupported get request' } } }
    })
    const { posts } = await threadsConnector.fetchPosts(CUENTA, 'TOKEN')
    expect(posts[0]!.metrics.views).toBeNull()

    stubThreads((url) => {
      if (url.includes('/threads?')) return { body: { data: [{ id: 'p1', timestamp: '2026-11-04T10:00:00+0000' }] } }
      return { status: 401, body: { error: { code: 190, message: 'Session expired' } } }
    })
    await expect(threadsConnector.fetchPosts(CUENTA, 'TOKEN')).rejects.toThrow(/^Threads 401:/)
  })

  it('por id: lo que ya no contesta falta en el mapa', async () => {
    stubThreads((url) =>
      url.includes('/borrado/')
        ? { status: 400, body: { error: { code: 100 } } }
        : { body: insights({ likes: 4 }) },
    )
    const metricas = await threadsConnector.fetchMetricsById!(CUENTA, 'TOKEN', ['vivo', 'borrado'])
    expect([...metricas.keys()]).toEqual(['vivo'])
    expect(metricas.get('vivo')!.likes).toBe(4)
  })

  it('la cuenta: dos llamadas, y que falle una no borra la otra', async () => {
    const urls = stubThreads((url) =>
      url.includes('metric=views')
        ? { status: 500, body: 'caído' }
        : { body: { data: [{ name: 'followers_count', total_value: { value: 77 } }] } },
    )
    const cuenta = await threadsConnector.fetchAccountMetrics!(CUENTA, 'TOKEN')
    expect(cuenta).toMatchObject({ followers: 77, views: null })
    expect(urls.every((u) => u.includes('/2600000000000001/threads_insights?'))).toBe(true)
  })
})
