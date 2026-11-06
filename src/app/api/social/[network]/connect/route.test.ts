import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `route.ts` llega a `@/lib/auth` y de ahí a módulos con `server-only`, que no resuelve bajo
// Vitest. Acá basta un dueño con sesión.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ usuarioActual: async () => ({ id: 'owner-1' }) }))

const { GET, scopesDe } = await import('./route')
const { leerOAuthState } = await import('@/lib/social/oauth-state')

function conectar(red: string, consulta = '') {
  return GET(new Request(`https://tu-parrilla.cl/api/social/${red}/connect${consulta}`), {
    params: Promise.resolve({ network: red }),
  })
}

beforeEach(() => {
  process.env.TIKTOK_CLIENT_KEY = 'clave'
  process.env.GOOGLE_CLIENT_ID = 'cliente'
  process.env.AUTH_SECRET = 'secreto-de-prueba-secreto-de-prueba'
})

afterEach(() => {
  delete process.env.TIKTOK_CLIENT_KEY
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.AUTH_SECRET
})

describe('GET /api/social/<red>/connect', () => {
  it('una red en «Próximamente» vuelve a Los Fierros con su frase, sin abrir la ventana de la red', async () => {
    for (const [red, frase] of [
      ['threads', 'Threads todavía no está disponible en Tu Parrilla: próximamente.'],
      ['x', 'X / Twitter todavía no está disponible en Tu Parrilla: próximamente.'],
    ]) {
      const res = await conectar(red)
      const destino = new URL(res.headers.get('location') ?? '')
      expect(destino.origin + destino.pathname).toBe('https://tu-parrilla.cl/admin/accounts')
      expect(destino.searchParams.get('mensaje')).toBe(frase)
    }
  })

  it('las demás siguen yendo a la ventana de su red', async () => {
    const res = await conectar('tiktok')
    expect(res.headers.get('location')).toMatch(/^https:\/\/www\.tiktok\.com\/v2\/auth\/authorize\//)
  })

  it('TikTok muestra siempre su pantalla: con la sesión abierta, si no, autorizaba sola', async () => {
    const destino = new URL((await conectar('tiktok')).headers.get('location') ?? '')
    expect(destino.searchParams.get('disable_auto_auth')).toBe('1')
  })

  it('Google pregunta siempre con qué cuenta entrar, y sigue pidiendo el permiso para renovar', async () => {
    const destino = new URL((await conectar('youtube')).headers.get('location') ?? '')
    expect(destino.searchParams.get('prompt')).toBe('select_account consent')
    expect(destino.searchParams.get('access_type')).toBe('offline')
  })

  it('«Agregar cuenta →» deja la marca para la vuelta, en la ruta de su red; sin ella, la borra', async () => {
    const conMarca = await conectar('tiktok', '?agregar=1')
    expect(conMarca.headers.get('set-cookie')).toMatch(/agregar_cuenta=tiktok;.*Path=\/api\/social\/tiktok/i)

    const sinMarca = await conectar('tiktok')
    // Borrar una cookie es mandarla vacía y ya vencida.
    expect(sinMarca.headers.get('set-cookie')).toMatch(/agregar_cuenta=;.*Path=\/api\/social\/tiktok/i)
  })
})

describe('GET /api/social/instagram/connect?login=instagram', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('cerrado para este dueño, vuelve a Los Fierros con la frase, sin abrir la ventana', async () => {
    vi.stubEnv('INSTAGRAM_LOGIN_ABIERTO_PARA', 'otro')
    vi.stubEnv('INSTAGRAM_LOGIN_APP_ID', 'ig-app')
    const destino = new URL((await conectar('instagram', '?login=instagram')).headers.get('location') ?? '')
    expect(destino.pathname).toBe('/admin/accounts')
    expect(destino.searchParams.get('mensaje')).toBe(
      'Conectar con Instagram, sin página de Facebook, todavía no está disponible en Tu Parrilla: próximamente.',
    )
  })

  it('abierto, va a la ventana de Instagram con el Instagram app ID, los cinco permisos y el login firmado en el state', async () => {
    vi.stubEnv('INSTAGRAM_LOGIN_ABIERTO_PARA', 'owner-1')
    vi.stubEnv('INSTAGRAM_LOGIN_APP_ID', 'ig-app')
    vi.stubEnv('INSTAGRAM_APP_ID', 'meta-app')
    const destino = new URL((await conectar('instagram', '?login=instagram&agregar=1')).headers.get('location') ?? '')
    expect(destino.origin + destino.pathname).toBe('https://www.instagram.com/oauth/authorize')
    expect(destino.searchParams.get('client_id')).toBe('ig-app')
    expect(destino.searchParams.get('redirect_uri')).toBe('https://tu-parrilla.cl/api/social/instagram/callback')
    expect(destino.searchParams.get('scope')).toBe(
      'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages,instagram_business_manage_insights',
    )
    expect(destino.searchParams.get('force_reauth')).toBe('true')
    expect(await leerOAuthState(destino.searchParams.get('state') ?? '', 'instagram', 'owner-1')).toEqual({
      login: 'instagram',
    })
  })

  it('sin ?login=instagram sigue siendo el login de Facebook, aunque esté abierto', async () => {
    vi.stubEnv('INSTAGRAM_LOGIN_ABIERTO_PARA', 'owner-1')
    vi.stubEnv('INSTAGRAM_APP_ID', 'meta-app')
    const destino = new URL((await conectar('instagram')).headers.get('location') ?? '')
    expect(destino.origin + destino.pathname).toBe('https://www.facebook.com/v23.0/dialog/oauth')
    expect(destino.searchParams.get('client_id')).toBe('meta-app')
    expect(await leerOAuthState(destino.searchParams.get('state') ?? '', 'instagram', 'owner-1')).toEqual({ login: null })
  })
})

const SIN = { privado: false, threads: false, anuncios: false, promocionar: false }
const TODO = { privado: true, threads: true, anuncios: true, promocionar: true }

describe('los permisos del privado', () => {
  it('solo con la bandera, y solo en Instagram y Facebook', () => {
    expect(scopesDe('instagram', SIN)).not.toContain('instagram_manage_messages')
    expect(scopesDe('instagram', { ...SIN, privado: true })).toMatch(/,instagram_manage_messages,pages_messaging$/)
    expect(scopesDe('facebook', { ...SIN, privado: true })).toMatch(/,pages_messaging$/)
    expect(scopesDe('tiktok', TODO)).toBe(scopesDe('tiktok', SIN))
    expect(scopesDe('linkedin', TODO)).toBeUndefined()
  })
})

describe('los permisos extra de Threads', () => {
  it('sin la bandera, Threads pide solo lo de publicar', () => {
    expect(scopesDe('threads', SIN)).toBe('threads_basic,threads_content_publish')
    // La del privado no le suma nada: es de Instagram y Facebook.
    expect(scopesDe('threads', { ...SIN, privado: true })).toBe('threads_basic,threads_content_publish')
  })

  it('con la bandera suma los números y las respuestas, y solo en Threads', () => {
    expect(scopesDe('threads', { ...SIN, threads: true })).toBe(
      'threads_basic,threads_content_publish,threads_manage_insights,threads_read_replies,threads_manage_replies',
    )
    expect(scopesDe('instagram', { ...SIN, threads: true })).toBe(scopesDe('instagram', SIN))
  })
})

describe('el permiso de los anuncios', () => {
  it('solo con su bandera, y solo en Instagram y Facebook', () => {
    expect(scopesDe('instagram', SIN)).not.toContain('ads_read')
    expect(scopesDe('instagram', { ...SIN, anuncios: true })).toMatch(/,ads_read$/)
    expect(scopesDe('facebook', { ...SIN, anuncios: true })).toMatch(/,ads_read$/)
    // Leer no es promocionar: `ads_management` tiene su propia bandera.
    expect(scopesDe('instagram', { ...SIN, privado: true, anuncios: true })).not.toContain('ads_management')
    expect(scopesDe('tiktok', TODO)).toBe(scopesDe('tiktok', SIN))
  })

  it('se suma al privado sin pisarlo', () => {
    expect(scopesDe('instagram', { ...SIN, privado: true, anuncios: true })).toMatch(/,instagram_manage_messages,pages_messaging,ads_read$/)
  })

  it('promocionar pide ads_management solo junto con leer', () => {
    expect(scopesDe('instagram', { ...SIN, anuncios: true, promocionar: true })).toMatch(/,ads_read,ads_management$/)
    expect(scopesDe('facebook', { ...SIN, anuncios: true, promocionar: true })).toMatch(/,ads_read,ads_management$/)
    // La bandera de promocionar sola no pide nada.
    expect(scopesDe('instagram', { ...SIN, promocionar: true })).toBe(scopesDe('instagram', SIN))
    expect(scopesDe('youtube', { ...SIN, anuncios: true, promocionar: true })).toBe(scopesDe('youtube', SIN))
  })

  it('la ventana de Meta lo pide con la bandera puesta', async () => {
    process.env.INSTAGRAM_APP_ID = 'app'
    process.env.META_PERMISOS_ANUNCIOS = '1'
    try {
      const destino = new URL((await conectar('instagram')).headers.get('location') ?? '')
      expect(destino.searchParams.get('scope')?.split(',')).toContain('ads_read')
    } finally {
      delete process.env.INSTAGRAM_APP_ID
      delete process.env.META_PERMISOS_ANUNCIOS
    }
  })
})
