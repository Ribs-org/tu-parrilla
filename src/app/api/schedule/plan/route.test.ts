import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// La puerta de `GET /api/schedule/plan`: sin llave no lee nada, y con llave lee el plan de su dueño.
// Lo que dice cada tope lo prueba `plan-api.test.ts`; lo que lee la base, `usoDelPlan`.
const dueno = vi.fn()
vi.mock('@/lib/llaves', () => ({ duenoDeLaLlave: (...args: unknown[]) => dueno(...args) }))
const leer = vi.fn()
vi.mock('@/lib/planes/uso', () => ({ usoDelPlan: (...args: unknown[]) => leer(...args) }))

const { GET } = await import('./route')
const peticion = () => new Request('https://ejemplo.cl/api/schedule/plan', { headers: { authorization: 'Bearer tp_llave' } })

describe('GET /api/schedule/plan', () => {
  it('sin una llave válida es 401 y no lee nada', async () => {
    dueno.mockResolvedValueOnce(null)
    expect((await GET(peticion())).status).toBe(401)
    expect(leer).not.toHaveBeenCalled()
  })

  it('lee el plan del dueño de la llave', async () => {
    dueno.mockResolvedValueOnce('usuario-7')
    const plan = {
      clave: 'gratis',
      nombre: 'Gratis',
      precioClp: 0,
      diasDePrueba: 0,
      cuentasMax: 7,
      enLaParrillaMax: 50,
      bodegaBytes: 100,
      tokensMes: 1000,
      prioridad: 0,
    }
    leer.mockResolvedValueOnce({
      plan,
      persona: { plan: 'gratis', planHasta: null, planOrigen: null, bodegaBytes: null, zona: 'America/Santiago', pruebaUsadaEn: null },
      planes: { gratis: plan, pagado: plan },
      cuentas: 2,
      enLaParrilla: 10,
      camara: { ocupados: 40, cuota: 100 },
      tokens: 0,
    })
    const r = await GET(peticion())
    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ plan: 'Gratis', vence: null, esperando: { ahora: 10, tope: 50, libres: 40 } })
    expect(leer.mock.calls[0]![0]).toBe('usuario-7')
  })
})
