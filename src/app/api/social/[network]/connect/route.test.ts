import { afterEach, describe, expect, it, vi } from 'vitest'

// `route.ts` llega a `@/lib/auth` y de ahí a módulos con `server-only`, que no resuelve bajo
// Vitest. Acá basta un dueño con sesión.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth', () => ({ usuarioActual: async () => ({ id: 'owner-1' }) }))

const { GET } = await import('./route')

function conectar(red: string) {
  return GET(new Request(`https://tu-parrilla.cl/api/social/${red}/connect`), {
    params: Promise.resolve({ network: red }),
  })
}

afterEach(() => {
  delete process.env.TIKTOK_CLIENT_KEY
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
    process.env.TIKTOK_CLIENT_KEY = 'clave'
    process.env.AUTH_SECRET = 'secreto-de-prueba-secreto-de-prueba'
    const res = await conectar('tiktok')
    expect(res.headers.get('location')).toMatch(/^https:\/\/www\.tiktok\.com\/v2\/auth\/authorize\//)
  })
})
