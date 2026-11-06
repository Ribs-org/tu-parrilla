import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// El conector guarda el token renovado en la base, que se importa tarde (`guardarTokenRenovado`):
// se dobla para mirar qué se escribió. El cifrado, para leer el token sin llave.
const guardado: Array<Record<string, unknown>> = []
vi.mock('@/db', () => ({
  getDb: () => ({
    update: () => ({
      set: (valores: Record<string, unknown>) => ({
        where: async () => {
          guardado.push(valores)
        },
      }),
    }),
  }),
  socialAccounts: { id: 'id' },
}))
vi.mock('./crypto', () => ({
  decryptToken: (cifrado: string) => cifrado.replace(/^cifrado:/, ''),
  encryptToken: (claro: string) => `cifrado:${claro}`,
}))

const { instagramConnector, VENTANA_RENOVAR_LOGIN_DE_INSTAGRAM_MS } = await import('./instagram')
const { GRAPH_FACEBOOK, GRAPH_INSTAGRAM, graphDeInstagram, leerPerfil, leerTokenCorto } = await import('./instagram-login')

describe('graphDeInstagram', () => {
  it('el login de Instagram habla con graph.instagram.com; el de Facebook, y una fila sin login, con graph.facebook.com', () => {
    expect(graphDeInstagram({ login: 'instagram' })).toBe('https://graph.instagram.com/v23.0')
    expect(graphDeInstagram({ login: 'facebook' })).toBe(GRAPH_FACEBOOK)
    expect(graphDeInstagram({ login: null })).toBe(GRAPH_FACEBOOK)
    expect(graphDeInstagram({})).toBe(GRAPH_FACEBOOK)
  })
})

describe('leerTokenCorto', () => {
  it('acepta el token envuelto en data, como lo muestra la documentación del login', () => {
    expect(
      leerTokenCorto(
        JSON.stringify({ data: [{ access_token: 'CORTO', user_id: '1020', permissions: 'instagram_business_basic' }] }),
      ),
    ).toEqual({ accessToken: 'CORTO', userId: '1020' })
  })

  it('y plano, con el id como número de diecisiete cifras, sin perder la última', () => {
    // Como número de JavaScript, 17841400000000001 se lee 17841400000000000: otra cuenta.
    expect(leerTokenCorto('{"access_token":"CORTO","user_id":17841400000000001,"permissions":["x"]}')).toEqual({
      accessToken: 'CORTO',
      userId: '17841400000000001',
    })
  })

  it('sin token, o con un cuerpo que no es JSON, es null', () => {
    expect(leerTokenCorto('{"data":[]}')).toBeNull()
    expect(leerTokenCorto('{"error_message":"Matching code was not found or was already used"}')).toBeNull()
    expect(leerTokenCorto('<html>')).toBeNull()
  })
})

describe('leerPerfil', () => {
  it('la fila se identifica por user_id, la cuenta profesional; id es el de la persona en la app', () => {
    expect(leerPerfil('{"id":"2002","user_id":"17841400000000001","username":"ribs"}', '1020')).toEqual({
      externalId: '17841400000000001',
      handle: '@ribs',
      appUserId: '2002',
    })
  })

  it('también si los ids llegan como números largos', () => {
    expect(leerPerfil('{"id":26000000000000003,"user_id":17841400000000001}', null)).toEqual({
      externalId: '17841400000000001',
      handle: null,
      appUserId: '26000000000000003',
    })
  })

  it('sin user_id cae al id del canje del código, y después al id', () => {
    expect(leerPerfil('{"id":"2002"}', '1020')?.externalId).toBe('1020')
    expect(leerPerfil('{"id":"2002"}', null)?.externalId).toBe('2002')
    expect(leerPerfil('{}', null)).toBeNull()
  })
})

describe('el conector con el login de Instagram', () => {
  const cuenta = (expiraEnMs: number | null) =>
    ({
      id: 'acc-1',
      externalId: '17841400000000001',
      network: 'instagram',
      login: 'instagram',
      accessToken: 'cifrado:VIEJO',
      expiresAt: expiraEnMs === null ? null : new Date(Date.now() + expiraEnMs),
    }) as never

  beforeEach(() => {
    guardado.length = 0
  })
  afterEach(() => vi.unstubAllGlobals())

  it('con más de un mes por delante usa el token tal cual, sin llamar a nadie', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramConnector.ensureCredential(cuenta(VENTANA_RENOVAR_LOGIN_DE_INSTAGRAM_MS + 864e5))).toBe('VIEJO')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('con menos, lo renueva con refresh_access_token, sin el secreto de la app, y guarda el nuevo', async () => {
    const fetchMock = vi.fn(async () => Response.json({ access_token: 'NUEVO', token_type: 'bearer', expires_in: 5184000 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramConnector.ensureCredential(cuenta(5 * 864e5))).toBe('NUEVO')
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]))
    expect(url.origin + url.pathname).toBe('https://graph.instagram.com/refresh_access_token')
    expect(url.searchParams.get('grant_type')).toBe('ig_refresh_token')
    expect(url.searchParams.get('access_token')).toBe('VIEJO')
    expect(url.searchParams.has('client_secret')).toBe(false)
    expect(guardado).toHaveLength(1)
    expect(guardado[0]!.accessToken).toBe('cifrado:NUEVO')
    // Sesenta días desde hoy.
    expect((guardado[0]!.expiresAt as Date).getTime()).toBeGreaterThan(Date.now() + 59 * 864e5)
  })

  it('si Meta no lo renueva (un token de menos de un día, una caída), sigue con el de siempre', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"code":190}}', { status: 400 })))
    expect(await instagramConnector.ensureCredential(cuenta(null))).toBe('VIEJO')
    expect(guardado).toHaveLength(0)
  })

  it('lista lo publicado y sus estadísticas en graph.instagram.com', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        if (url.includes('/insights')) return Response.json({ data: [{ name: 'views', values: [{ value: 9 }] }] })
        return Response.json({ data: [{ id: 'm-1', timestamp: '2026-11-05T12:00:00Z' }] })
      }),
    )
    const { posts } = await instagramConnector.fetchPosts(cuenta(null), 'TOKEN')
    expect(posts[0]!.metrics.views).toBe(9)
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) expect(url.startsWith(`${GRAPH_INSTAGRAM}/`)).toBe(true)
  })

  it('pide las vistas del perfil aparte, para que no tumben las demás métricas de la cuenta', async () => {
    const urls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url)
        if (url.includes('metric=profile_views')) return new Response('{"error":{"code":100}}', { status: 400 })
        if (url.includes('metric=views,accounts_engaged')) {
          return Response.json({ data: [{ name: 'views', total_value: { value: 120 } }] })
        }
        if (url.includes('fields=followers_count')) return Response.json({ followers_count: 42 })
        return Response.json({ data: [] })
      }),
    )
    const metricas = await instagramConnector.fetchAccountMetrics!(cuenta(null), 'TOKEN')
    expect(metricas.followers).toBe(42)
    expect(metricas.views).toBe(120)
    expect(metricas.profileViews).toBeNull()
    for (const url of urls) expect(url.startsWith(`${GRAPH_INSTAGRAM}/`)).toBe(true)
  })
})
