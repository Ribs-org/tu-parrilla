import { afterEach, describe, expect, it, vi } from 'vitest'
import fixture from './fixtures/instagram-media.json'
import {
  InstagramHttpError,
  conSeguidores,
  instagramConnector,
  instagramTokenExpiry,
  isMediaGone,
  isMediaWithoutInsights,
  listInstagramAccounts,
  normalizeInstagramMedia,
  type FacebookPages,
  type InstagramInsights,
  type InstagramMedia,
} from './instagram'

const media = fixture.media as InstagramMedia
const insights = fixture.insights as InstagramInsights
const imageMedia = fixture.imageMedia as InstagramMedia
const imageInsights = fixture.imageInsights as InstagramInsights

describe('normalizeInstagramMedia', () => {
  it('mapea identidad y contenido', () => {
    const post = normalizeInstagramMedia(media, insights)
    expect(post.externalId).toBe('17912345678901234')
    expect(post.permalink).toBe('https://www.instagram.com/reel/C8xK2Lp/')
    expect(post.caption).toBe('Rutina de gimnasio completa 💪 link en bio')
    expect(post.thumbnailUrl).toBe('https://scontent.cdninstagram.com/v/thumb.jpg')
    expect(post.mediaType).toBe('reel')
    expect(post.publishedAt.toISOString()).toBe('2026-08-12T18:22:04.000Z')
  })

  it('aplana la forma anidada de insights', () => {
    const post = normalizeInstagramMedia(media, insights)
    expect(post.metrics).toEqual({
      views: 42130,
      reach: 38104,
      likes: 3211,
      comments: 180,
      saves: 640,
      shares: 212,
    })
  })

  it('deja en null la métrica que no vino', () => {
    const post = normalizeInstagramMedia(imageMedia, imageInsights)
    expect(post.metrics.reach).toBe(900)
    expect(post.metrics.views).toBeNull()
    expect(post.metrics.likes).toBeNull()
  })

  it('usa media_url cuando no hay thumbnail, que es el caso de las fotos', () => {
    const post = normalizeInstagramMedia(imageMedia, imageInsights)
    expect(post.thumbnailUrl).toBe('https://scontent.cdninstagram.com/v/foto.jpg')
    expect(post.mediaType).toBe('image')
  })

  it('un reel con música de la biblioteca llega sin media_url (Meta, 2026-07-30): la miniatura sale de thumbnail_url', () => {
    const conMusica: InstagramMedia = { ...media }
    delete conMusica.media_url
    const post = normalizeInstagramMedia(conMusica, insights)
    expect(post.thumbnailUrl).toBe('https://scontent.cdninstagram.com/v/thumb.jpg')
    expect(post.permalink).toBe('https://www.instagram.com/reel/C8xK2Lp/')
    // Sin ninguna de las dos, sin miniatura: no rompe la lectura.
    const sinNada: InstagramMedia = { ...conMusica }
    delete sinNada.thumbnail_url
    expect(normalizeInstagramMedia(sinNada, insights).thumbnailUrl).toBeNull()
  })

  it('tolera un post sin caption', () => {
    expect(normalizeInstagramMedia(imageMedia, imageInsights).caption).toBeNull()
  })
})

describe('listInstagramAccounts', () => {
  it('devuelve todas las cuentas ligadas a alguna página, en el orden de Meta', () => {
    const pages: FacebookPages = {
      data: [
        { id: '1', name: 'Personal', instagram_business_account: { id: '17841400000000101', username: 'vicente' } },
        { id: '2', name: 'Sin IG' },
        { id: '3', name: 'Gimnasio', instagram_business_account: { id: '17841400000000102' } },
      ],
    }
    expect(listInstagramAccounts(pages)).toEqual([
      { id: '17841400000000101', username: 'vicente' },
      { id: '17841400000000102', username: null },
    ])
  })

  it('sin páginas con Instagram devuelve la lista vacía: el llamador decide la frase', () => {
    expect(listInstagramAccounts({ data: [{ id: '1' }] })).toEqual([])
    expect(listInstagramAccounts({})).toEqual([])
  })
})

describe('instagramTokenExpiry', () => {
  it('usa los ~60 días documentados cuando Meta no dice nada', () => {
    const expiry = instagramTokenExpiry(undefined)
    expect(expiry).not.toBeNull()
    const days = (expiry!.getTime() - Date.now()) / 864e5
    expect(days).toBeGreaterThan(59)
    expect(days).toBeLessThan(61)
  })

  it('respeta el plazo que venga', () => {
    const expiry = instagramTokenExpiry(3600)
    const minutes = (expiry!.getTime() - Date.now()) / 60000
    expect(minutes).toBeGreaterThan(59)
    expect(minutes).toBeLessThan(61)
  })

  it('lee un cero como «no vence», no como «venció recién»', () => {
    // Con `?? 5184000` el cero pasaba de largo y se guardaba Date.now(): una credencial
    // buena marcada como muerta en el mismo instante de escribirla.
    expect(instagramTokenExpiry(0)).toBeNull()
  })
})

describe('isMediaWithoutInsights', () => {
  it('tolera un 404: la publicación no tiene estadísticas', () => {
    expect(isMediaWithoutInsights(new InstagramHttpError(404, 'Instagram 404: ...'))).toBe(true)
  })

  it('tolera el 400 de contenido anterior a la conversión a cuenta profesional', () => {
    // Instagram nunca registró estadísticas de esos posts y nunca lo va a hacer: es un
    // hecho permanente sobre esa publicación, no sobre la corrida.
    expect(
      isMediaWithoutInsights(new InstagramHttpError(400, 'Instagram 400: ...', 2108006)),
    ).toBe(true)
  })

  it('no tolera otro 400: un parámetro inválido sí es problema nuestro', () => {
    expect(isMediaWithoutInsights(new InstagramHttpError(400, 'Instagram 400: ...', 1234))).toBe(
      false,
    )
  })

  it('no tolera un 400 sin subcódigo', () => {
    expect(isMediaWithoutInsights(new InstagramHttpError(400, 'Instagram 400: ...'))).toBe(false)
  })

  it('no tolera un 429 ni un 5xx, que son sistémicos', () => {
    expect(isMediaWithoutInsights(new InstagramHttpError(429, 'rate limit'))).toBe(false)
    expect(isMediaWithoutInsights(new InstagramHttpError(500, 'boom'))).toBe(false)
  })

  it('no tolera un error que no venga de una respuesta HTTP', () => {
    // Un fallo de red o un JSON.parse roto no dicen nada sobre esta publicación.
    expect(isMediaWithoutInsights(new Error('fetch failed'))).toBe(false)
  })
})

describe('isMediaGone', () => {
  it('reconoce el id que ya no existe: code 100 con subcode 33', () => {
    expect(isMediaGone(new InstagramHttpError(400, 'Instagram 400', 33, 100))).toBe(true)
  })

  it('no confunde otro 100, un token vencido ni un límite con un borrado', () => {
    expect(isMediaGone(new InstagramHttpError(400, 'Instagram 400', undefined, 100))).toBe(false)
    expect(isMediaGone(new InstagramHttpError(400, 'Instagram 400', 463, 190))).toBe(false)
    expect(isMediaGone(new InstagramHttpError(400, 'Instagram 400', undefined, 4))).toBe(false)
    expect(isMediaGone(new Error('fetch failed'))).toBe(false)
  })
})

describe('instagramConnector, por ventana y por id', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const cuenta = { id: 'acc-1', externalId: 'ig-1' } as never
  const insights = { data: [{ name: 'views', values: [{ value: 70 }] }] }

  it('lista más allá de las 200 mientras lo listado siga siendo de la ventana', async () => {
    // Páginas de 50, un día más atrás cada una, del 20 de octubre hacia atrás.
    let paginas = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/insights')) return Response.json(insights)
        const dia = paginas++
        const data = Array.from({ length: 50 }, (_, i) => ({
          id: `${dia}-${i}`,
          timestamp: new Date(Date.UTC(2026, 9, 20 - dia, 12)).toISOString(),
        }))
        return Response.json({ data, paging: { next: `https://graph.test/media?p=${paginas}` } })
      }),
    )
    const desde = new Date(Date.UTC(2026, 9, 14))
    const { posts, windowWasCapped } = await instagramConnector.fetchPosts(cuenta, 'token', { desde })
    // Del 20 al 14 son siete páginas; la octava (del 13) es la que dice que se pasó.
    expect(paginas).toBe(8)
    expect(posts).toHaveLength(400)
    expect(posts[0]!.metrics.views).toBe(70)
    expect(windowWasCapped).toBe(true)
  })

  it('sin cursor al final, no es ventana', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/insights')) return Response.json(insights)
        return Response.json({ data: [{ id: 'a', timestamp: '2026-10-20T12:00:00Z' }] })
      }),
    )
    const { posts, windowWasCapped } = await instagramConnector.fetchPosts(cuenta, 'token')
    expect(posts).toHaveLength(1)
    expect(windowWasCapped).toBe(false)
  })

  it('por id: lo borrado se salta, lo que no tiene estadísticas vuelve en null, y un error de la corrida sube', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/borrado/')) {
          return new Response(JSON.stringify({ error: { code: 100, error_subcode: 33 } }), { status: 400 })
        }
        if (url.includes('/antigua/')) {
          return new Response(JSON.stringify({ error: { code: 100, error_subcode: 2108006 } }), { status: 400 })
        }
        return Response.json(insights)
      }),
    )
    const metricas = await instagramConnector.fetchMetricsById!(cuenta, 'token', ['viva', 'borrado', 'antigua'])
    expect([...metricas.keys()].sort()).toEqual(['antigua', 'viva'])
    expect(metricas.get('viva')!.views).toBe(70)
    expect(metricas.get('antigua')!.views).toBeNull()

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { code: 190, error_subcode: 463 } }), { status: 400 })),
    )
    await expect(instagramConnector.fetchMetricsById!(cuenta, 'token', ['viva'])).rejects.toThrow('Instagram 400')
  })
})

describe('la lectura de cada hora y los seguidores de cada publicación', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const cuenta = { id: 'acc-1', externalId: 'ig-1' } as never
  const desde = new Date('2026-11-08T12:00:00Z')
  const conFollows = { data: [{ name: 'views', values: [{ value: 70 }] }, { name: 'follows', values: [{ value: 4 }] }] }
  const sinFollows = { data: [{ name: 'views', values: [{ value: 70 }] }] }

  /** Una página de media: las nuevas de la ventana y una de antes, todas con cursor. */
  function pagina() {
    return {
      data: [
        { id: 'foto', media_product_type: 'FEED', media_type: 'IMAGE', timestamp: '2026-11-10T09:00:00Z' },
        { id: 'reel', media_product_type: 'REELS', media_type: 'VIDEO', timestamp: '2026-11-09T09:00:00Z' },
        { id: 'vieja', media_product_type: 'FEED', media_type: 'IMAGE', timestamp: '2026-11-07T09:00:00Z' },
      ],
      paging: { next: 'https://graph.test/media?p=2' },
    }
  }

  it('Meta da follows solo en el feed: no se pide en un reel ni en lo que no dice qué es', () => {
    expect(conSeguidores({ id: 'a', media_product_type: 'FEED' })).toBe(true)
    expect(conSeguidores({ id: 'a', media_product_type: 'REELS' })).toBe(false)
    expect(conSeguidores({ id: 'a' })).toBe(false)
  })

  it('normaliza follows como los seguidores de la publicación', () => {
    expect(normalizeInstagramMedia({ id: 'a' }, conFollows).metrics.seguidores).toBe(4)
    expect(normalizeInstagramMedia({ id: 'a' }, sinFollows).metrics.seguidores).toBeUndefined()
  })

  it('con soloDesde, una página basta, lo de antes no se lee y follows va solo en la foto', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        if (url.includes('/insights')) return Response.json(url.includes('follows') ? conFollows : sinFollows)
        return Response.json(pagina())
      }),
    )
    const { posts } = await instagramConnector.fetchPosts(cuenta, 'token', { desde, soloDesde: true })
    expect(posts.map((p) => p.externalId)).toEqual(['foto', 'reel'])
    expect(posts[0]!.metrics.seguidores).toBe(4)
    expect(posts[1]!.metrics.seguidores).toBeUndefined()
    const insights = urls.filter((u) => u.includes('/insights'))
    expect(insights).toHaveLength(2)
    expect(insights.find((u) => u.includes('/foto/'))).toContain('follows')
    expect(insights.find((u) => u.includes('/reel/'))).not.toContain('follows')
    // La de antes de la ventana se listó, pero no se le pidieron sus números.
    expect(urls.some((u) => u.includes('/vieja/'))).toBe(false)
    expect(urls.filter((u) => !u.includes('/insights'))).toHaveLength(1)
  })

  it('sin soloDesde, la lectura del día lista como siempre, con follows en las fotos', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/insights')) return Response.json(url.includes('follows') ? conFollows : sinFollows)
        return Response.json({ data: pagina().data })
      }),
    )
    const { posts } = await instagramConnector.fetchPosts(cuenta, 'token', { desde })
    expect(posts.map((p) => [p.externalId, p.metrics.seguidores])).toEqual([
      ['foto', 4],
      ['reel', undefined],
      ['vieja', 4],
    ])
  })

  it('si Meta rechaza follows, repite sin él y los números de siempre llegan igual', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        if (url.includes('follows')) {
          return new Response(JSON.stringify({ error: { code: 100, message: 'metric' } }), { status: 400 })
        }
        if (url.includes('/insights')) return Response.json(sinFollows)
        return Response.json({ data: [pagina().data[0]] })
      }),
    )
    const { posts } = await instagramConnector.fetchPosts(cuenta, 'token')
    expect(posts[0]!.metrics.views).toBe(70)
    expect(posts[0]!.metrics.seguidores).toBeUndefined()
    expect(urls.filter((u) => u.includes('/insights'))).toHaveLength(2)
  })

  it('si el problema era el token, la segunda también falla y el error sube', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/insights')) {
          return new Response(JSON.stringify({ error: { code: 190, error_subcode: 463 } }), { status: 400 })
        }
        return Response.json({ data: [pagina().data[0]] })
      }),
    )
    await expect(instagramConnector.fetchPosts(cuenta, 'token')).rejects.toThrow('Instagram 400')
  })

  it('una foto sin estadísticas para siempre no se pide dos veces', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        if (url.includes('/insights')) return new Response('{}', { status: 404 })
        return Response.json({ data: [pagina().data[0]] })
      }),
    )
    const { posts } = await instagramConnector.fetchPosts(cuenta, 'token')
    expect(posts[0]!.metrics.views).toBeNull()
    expect(urls.filter((u) => u.includes('/insights'))).toHaveLength(1)
  })
})
