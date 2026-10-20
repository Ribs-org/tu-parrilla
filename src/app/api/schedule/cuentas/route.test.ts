import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// Se doblan la llave y las dos lecturas de la base: lo que se prueba acá es la puerta —que sin
// dueño no se lee nada— y que se leen las cuentas del dueño de la llave, en su zona. Cómo se
// arma cada cuenta lo prueba `cuentas-api.test.ts`.
const dueno = vi.fn()
vi.mock('@/lib/llaves', () => ({
  duenoDeLaLlave: (...args: unknown[]) => dueno(...args),
}))
const cuentas = vi.fn()
vi.mock('@/lib/posts', () => ({
  getCuentas: (...args: unknown[]) => cuentas(...args),
}))
const usuario = vi.fn()
vi.mock('@/lib/usuarios', () => ({
  buscarPorId: (...args: unknown[]) => usuario(...args),
}))

const { GET } = await import('./route')

function peticion(): Request {
  return new Request('https://ejemplo.cl/api/schedule/cuentas', { headers: { authorization: 'Bearer tp_llave' } })
}

beforeEach(() => {
  dueno.mockReset()
  dueno.mockResolvedValue('usuario-7')
  cuentas.mockReset()
  cuentas.mockResolvedValue([])
  usuario.mockReset()
  usuario.mockResolvedValue({ zona: 'America/Santiago' })
})

describe('GET /api/schedule/cuentas', () => {
  it('sin una llave válida es 401 y no lee nada', async () => {
    dueno.mockResolvedValueOnce(null)
    const r = await GET(peticion())
    expect(r.status).toBe(401)
    expect(await r.text()).toBe('No autorizado')
    expect(cuentas).not.toHaveBeenCalled()
  })

  it('lista las cuentas del dueño de la llave, con las horas en su zona', async () => {
    usuario.mockResolvedValueOnce({ zona: 'Europe/Madrid' })
    cuentas.mockResolvedValueOnce([
      {
        id: 'cuenta-1',
        network: 'facebook',
        handle: 'Mi página',
        externalId: '1029384756',
        connected: true,
        lastSyncedAt: null,
        lastSyncError: null,
        expiresAt: '2030-01-15T09:00:00.000Z',
      },
    ])
    const r = await GET(peticion())
    expect(r.status).toBe(200)
    expect(cuentas).toHaveBeenCalledWith('usuario-7')
    expect(await r.json()).toEqual({
      cuentas: [
        {
          id: 'cuenta-1',
          red: 'facebook',
          handle: 'Mi página',
          externalId: '1029384756',
          conectada: true,
          proximamente: false,
          fierro: 'al-rojo',
          vence: '2030-01-15T10:00:00+01:00',
          motivo: null,
        },
      ],
    })
  })

  it('un dueño sin cuentas recibe la lista vacía', async () => {
    const r = await GET(peticion())
    expect(await r.json()).toEqual({ cuentas: [] })
  })
})
