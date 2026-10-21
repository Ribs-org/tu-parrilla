import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Las tarjetas de «tus cuentas» del teléfono. Sin base: las lecturas y las cuentas del dueño se
// doblan, y lo que importa es que dos cuentas de la misma red salgan en dos tarjetas, cada una
// con su nombre y con lo que ganó ella sola.

vi.mock('server-only', () => ({}))
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => ({ id: 'u-1', zona: 'America/Santiago' }) }))
vi.mock('@/lib/lecturas-cuentas', () => ({
  // La del 20 de agosto cae antes de la ventana de 7 días: es contra la que se mide lo ganado.
  lecturasDeCuentas: async () => [
    { network: 'instagram', accountId: 'a', day: '2026-08-20', followers: 1500, profileViews: 9, reach: 90 },
    { network: 'instagram', accountId: 'b', day: '2026-08-20', followers: 880, profileViews: 3, reach: 30 },
    { network: 'instagram', accountId: 'a', day: '2026-09-01', followers: 1520, profileViews: 10, reach: 100 },
    { network: 'instagram', accountId: 'b', day: '2026-09-01', followers: 890, profileViews: 5, reach: 50 },
    { network: 'instagram', accountId: 'a', day: '2026-09-03', followers: 1540, profileViews: 12, reach: 120 },
    { network: 'instagram', accountId: 'b', day: '2026-09-03', followers: 900, profileViews: 6, reach: 60 },
  ],
}))
vi.mock('@/lib/posts', () => ({
  getCuentas: async () => [
    { id: 'a', network: 'instagram', handle: '@ana' },
    { id: 'b', network: 'instagram', handle: '@beto' },
  ],
}))

const { GET } = await import('./route')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-03T15:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GET /api/mobile/accounts', () => {
  it('dos cuentas de Instagram son dos tarjetas, cada una con su nombre y lo que ganó ella', async () => {
    const respuesta = await GET(new Request('https://ejemplo.cl/api/mobile/accounts?rango=7d'))
    const { cuentas } = await respuesta.json()
    expect(cuentas.map((c: { id: string; nombre: string; seguidores: number; seguidoresGanados: number }) => [c.id, c.nombre, c.seguidores, c.seguidoresGanados])).toEqual([
      ['a', '@ana', 1540, 40],
      ['b', '@beto', 900, 20],
    ])
    expect(cuentas[0]).toMatchObject({ red: 'instagram', visitasAlPerfil: 12, alcance: 120 })
  })

  it('la serie diaria suma las dos cuentas, dentro de la ventana', async () => {
    const respuesta = await GET(new Request('https://ejemplo.cl/api/mobile/accounts?rango=7d'))
    const { serie } = await respuesta.json()
    expect(serie).toEqual([
      { fecha: '2026-09-01', visitasAlPerfil: 15, alcance: 150 },
      { fecha: '2026-09-03', visitasAlPerfil: 18, alcance: 180 },
    ])
  })
})
