import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `route.ts` llega a `@/lib/auth` y de ahí a módulos con `server-only`, que no resuelve
// bajo Vitest. Mismo motivo y mismo arreglo que `mobile/overview/route.test.ts`.
vi.mock('server-only', () => ({}))
// La vuelta de una conexión (`GET`) pide un dueño con sesión; `fetchCredential` no la usa.
vi.mock('@/lib/auth', () => ({ usuarioActual: async () => ({ id: 'owner-1' }) }))

const { GET, fetchCredential } = await import('./route')
const { signOAuthState } = await import('@/lib/social/oauth-state')

/**
 * Las respuestas del Graph que un login de Instagram recorre, en orden: token corto,
 * token largo, páginas con su cuenta de Instagram, y `/me` — que es el que esta prueba
 * hace fallar o responder.
 */
function respuestasDeInstagram(me: { ok: boolean; body?: unknown }): Response[] {
  return [
    Response.json({ access_token: 'CORTO' }),
    Response.json({ access_token: 'LARGO', expires_in: 5184000 }),
    Response.json({
      data: [{ name: 'Ribs', instagram_business_account: { id: '17841400000000001', username: 'ribs' } }],
    }),
    me.ok ? Response.json(me.body) : new Response('nope', { status: 400 }),
  ]
}

/** Responde la cola en orden y deja a la vista las URL pedidas, en ese mismo orden. */
function doblarFetch(respuestas: Response[]): string[] {
  const cola = [...respuestas]
  const pedidas: string[] = []
  vi.stubGlobal('fetch', async (entrada: URL | string) => {
    pedidas.push(String(entrada))
    return cola.shift() ?? new Response('sin respuesta', { status: 500 })
  })
  return pedidas
}

beforeEach(() => {
  process.env.INSTAGRAM_APP_ID = 'app-id'
  process.env.INSTAGRAM_APP_SECRET = 'app-secret'
  // El fallo de `/me` se registra con console.error como el resto del archivo: acá solo
  // estorba la salida de la suite.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchCredential (YouTube)', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('guarda los permisos que Google dijo conceder, no los pedidos', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'cliente')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'secreto')
    const concedidos =
      'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl'
    doblarFetch([
      Response.json({ access_token: 'ACCESO', refresh_token: 'REFRESCO', expires_in: 3599, scope: concedidos }),
      Response.json({ items: [{ id: 'UC123', snippet: { title: 'Mi canal' } }] }),
    ])

    const credential = await fetchCredential('youtube', 'CODE', 'https://ejemplo.cl/cb')

    // Se pidió también el de analítica y la persona lo destildó: no está.
    expect(credential.scopes).toBe(concedidos)
    expect(credential.candidatas).toEqual([{ externalId: 'UC123', handle: 'Mi canal' }])
  })
})

describe('fetchCredential (Meta)', () => {
  it('trae el id de usuario de Meta que devolvió /me', async () => {
    const pedidas = doblarFetch(respuestasDeInstagram({ ok: true, body: { id: '10201234567890' } }))

    const credential = await fetchCredential('instagram', 'CODE', 'https://ejemplo.cl/cb')

    expect(credential.metaUserId).toBe('10201234567890')
    expect(credential.candidatas).toEqual([{ externalId: '17841400000000001', handle: '@ribs' }])
    // El id se pide con el token largo, que es el que se guarda.
    expect(pedidas[3]).toContain('/me?fields=id&access_token=LARGO')
  })

  it('si /me falla la conexión sigue, con el id vacío', async () => {
    doblarFetch(respuestasDeInstagram({ ok: false }))

    const credential = await fetchCredential('instagram', 'CODE', 'https://ejemplo.cl/cb')

    expect(credential.metaUserId).toBeUndefined()
    expect(credential.accessToken).toBe('LARGO')
    expect(credential.candidatas).toHaveLength(1)
  })
})

describe('fetchCredential (login de Instagram)', () => {
  beforeEach(() => {
    process.env.INSTAGRAM_LOGIN_APP_ID = 'ig-app'
    process.env.INSTAGRAM_LOGIN_APP_SECRET = 'ig-secreto'
  })
  afterEach(() => {
    delete process.env.INSTAGRAM_LOGIN_APP_ID
    delete process.env.INSTAGRAM_LOGIN_APP_SECRET
  })

  it('canjea en api.instagram.com, alarga en graph.instagram.com y se queda con la cuenta de /me', async () => {
    const llamadas: Array<{ url: string; init?: RequestInit }> = []
    const cola = [
      Response.json({ data: [{ access_token: 'CORTO', user_id: '1020', permissions: 'instagram_business_basic' }] }),
      Response.json({ access_token: 'LARGO', token_type: 'bearer', expires_in: 5184000 }),
      Response.json({ id: '2002', user_id: '17841400000000001', username: 'ribs' }),
    ]
    vi.stubGlobal('fetch', async (url: URL | string, init?: RequestInit) => {
      llamadas.push({ url: String(url), init })
      return cola.shift() ?? new Response('sin respuesta', { status: 500 })
    })

    const credential = await fetchCredential('instagram', 'CODE', 'https://ejemplo.cl/cb', undefined, 'instagram')

    expect(llamadas[0]!.url).toBe('https://api.instagram.com/oauth/access_token')
    const canje = new URLSearchParams(String(llamadas[0]!.init?.body))
    expect(Object.fromEntries(canje)).toEqual({
      client_id: 'ig-app',
      client_secret: 'ig-secreto',
      grant_type: 'authorization_code',
      redirect_uri: 'https://ejemplo.cl/cb',
      code: 'CODE',
    })
    expect(llamadas[1]!.url).toContain('https://graph.instagram.com/access_token?grant_type=ig_exchange_token')
    expect(llamadas[1]!.url).toContain('access_token=CORTO')
    expect(llamadas[2]!.url).toBe('https://graph.instagram.com/v23.0/me?fields=id,user_id,username&access_token=LARGO')
    expect(credential).toMatchObject({
      accessToken: 'LARGO',
      refreshToken: null,
      candidatas: [{ externalId: '17841400000000001', handle: '@ribs' }],
      metaUserId: '2002',
      login: 'instagram',
    })
    expect(credential.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 59 * 864e5)
  })

  it('sin las credenciales del caso de uso de Instagram no llama a nadie y lo dice', async () => {
    delete process.env.INSTAGRAM_LOGIN_APP_SECRET
    const pedidas = doblarFetch([])
    await expect(fetchCredential('instagram', 'CODE', 'https://ejemplo.cl/cb', undefined, 'instagram')).rejects.toThrow(
      'Faltan las credenciales del login de Instagram (INSTAGRAM_LOGIN_APP_ID / INSTAGRAM_LOGIN_APP_SECRET).',
    )
    expect(pedidas).toEqual([])
  })

  it('el login de Facebook marca su credencial como tal', async () => {
    doblarFetch(respuestasDeInstagram({ ok: true, body: { id: '10201234567890' } }))
    expect((await fetchCredential('instagram', 'CODE', 'https://ejemplo.cl/cb')).login).toBe('facebook')
  })
})

describe('GET del login de Instagram cerrado', () => {
  it('no canjea el código: vuelve a Los Fierros con la frase', async () => {
    process.env.AUTH_SECRET = 'secreto-de-prueba-secreto-de-prueba'
    vi.stubEnv('INSTAGRAM_LOGIN_ABIERTO_PARA', 'otro')
    const state = await signOAuthState('instagram', 'owner-1', 'instagram')
    const pedidas = doblarFetch([])
    const res = await GET(
      new Request(`https://tu-parrilla.cl/api/social/instagram/callback?code=CODE&state=${encodeURIComponent(state)}`),
      { params: Promise.resolve({ network: 'instagram' }) },
    )
    const destino = new URL(res.headers.get('location') ?? '')
    expect(destino.searchParams.get('mensaje')).toBe(
      'Conectar con Instagram, sin página de Facebook, todavía no está disponible en Tu Parrilla: próximamente.',
    )
    expect(pedidas).toEqual([])
    vi.unstubAllEnvs()
    delete process.env.AUTH_SECRET
  })
})

describe('GET de una red en «Próximamente»', () => {
  it('no canjea el código ni guarda nada: vuelve a Los Fierros con la frase', async () => {
    const pedidas = doblarFetch([])
    const res = await GET(new Request('https://tu-parrilla.cl/api/social/x/callback?code=CODE&state=STATE'), {
      params: Promise.resolve({ network: 'x' }),
    })
    const destino = new URL(res.headers.get('location') ?? '')
    expect(destino.pathname).toBe('/admin/accounts')
    expect(destino.searchParams.get('mensaje')).toBe('X / Twitter todavía no está disponible en Tu Parrilla: próximamente.')
    expect(pedidas).toEqual([])
  })
})

describe('GET sin código', () => {
  it('deja en el registro lo que dijo la red, sin el estado, y borra la marca de «Agregar cuenta →»', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await GET(
      new Request(
        'https://tu-parrilla.cl/api/social/instagram/callback?error=access_denied&error_reason=user_denied&state=SECRETO',
        { headers: { cookie: 'agregar_cuenta=instagram' } },
      ),
      { params: Promise.resolve({ network: 'instagram' }) },
    )
    const destino = new URL(res.headers.get('location') ?? '')
    expect(destino.searchParams.get('mensaje')).toBe('La red no devolvió el código de autorización.')
    const registrado = String(aviso.mock.calls[0]?.[0])
    expect(registrado).toContain('access_denied · user_denied')
    expect(registrado).not.toContain('SECRETO')
    expect(res.headers.get('set-cookie')).toMatch(/agregar_cuenta=;.*Path=\/api\/social\/instagram/i)
  })
})
