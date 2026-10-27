import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `route.ts` llega a `@/lib/auth` y de ahí a módulos con `server-only`, que no resuelve bajo
// Vitest. Acá basta un dueño con sesión.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ usuarioActual: async () => ({ id: 'owner-1' }) }))

const { GET, scopesDe } = await import('./route')

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

describe('los permisos del privado', () => {
  it('solo con la bandera, y solo en Instagram y Facebook', () => {
    expect(scopesDe('instagram', false)).not.toContain('instagram_manage_messages')
    expect(scopesDe('instagram', true)).toMatch(/,instagram_manage_messages,pages_messaging$/)
    expect(scopesDe('facebook', true)).toMatch(/,pages_messaging$/)
    expect(scopesDe('tiktok', true)).toBe(scopesDe('tiktok', false))
    expect(scopesDe('linkedin', true)).toBeUndefined()
  })
})
