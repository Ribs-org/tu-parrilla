import { describe, expect, it } from 'vitest'
import type { Plan } from './plan'
import { planParaApi } from './plan-api'
import type { UsoDelPlan } from './uso'

// El plan para la API, sin base (issue #394): los topes con lo usado y lo que queda, «sin tope» como
// `null`, y la fecha de vencimiento solo cuando rige un plan que vence.

const GRATIS: Plan = {
  clave: 'gratis',
  nombre: 'Gratis',
  precioClp: 0,
  diasDePrueba: 0,
  cuentasMax: 7,
  enLaParrillaMax: 50,
  bodegaBytes: 20 * 1024 ** 3,
  tokensMes: 100_000,
  prioridad: 0,
}
const PAGADO: Plan = { ...GRATIS, clave: 'pagado', nombre: 'Maestro Parrillero', cuentasMax: 15, enLaParrillaMax: null, tokensMes: 2_000_000, prioridad: 1 }
const AHORA = new Date('2026-11-12T15:00:00Z')

function uso(plan: Plan, persona: Partial<UsoDelPlan['persona']>, usado: Partial<Pick<UsoDelPlan, 'cuentas' | 'enLaParrilla' | 'tokens' | 'camara'>> = {}): UsoDelPlan {
  return {
    plan,
    persona: { plan: plan.clave, planHasta: null, planOrigen: null, bodegaBytes: null, zona: 'America/Santiago', pruebaUsadaEn: null, ...persona },
    planes: { gratis: GRATIS, pagado: PAGADO },
    cuentas: 0,
    enLaParrilla: 0,
    camara: { ocupados: 0, cuota: plan.bodegaBytes },
    tokens: 0,
    ...usado,
  }
}

describe('planParaApi', () => {
  it('el gratis: cada tope con lo usado y lo que queda, como cuentan los rechazos', () => {
    const r = planParaApi(uso(GRATIS, {}, { enLaParrilla: 44, cuentas: 3, tokens: 1_200, camara: { ocupados: 5, cuota: 20 } }), AHORA, '2026-11')
    expect(r).toEqual({
      plan: 'Gratis',
      vence: null,
      esperando: { ahora: 44, tope: 50, libres: 6 },
      cuentas: { ahora: 3, tope: 7, libres: 4 },
      camara: { ahora: 5, tope: 20, libres: 15 },
      tokens: { ahora: 1_200, tope: 100_000, libres: 98_800, mes: '2026-11' },
    })
  })

  it('pasado del tope, lo que queda es cero, no negativo', () => {
    expect(planParaApi(uso(GRATIS, {}, { enLaParrilla: 561 }), AHORA, '2026-11').esperando).toEqual({ ahora: 561, tope: 50, libres: 0 })
  })

  it('el pagado: sin tope es null, y vence en la zona del dueño', () => {
    const r = planParaApi(
      uso(PAGADO, { planHasta: new Date('2026-12-08T16:00:00Z'), planOrigen: 'suscripcion' }, { enLaParrilla: 544 }),
      AHORA,
      '2026-11',
    )
    expect(r.plan).toBe('Maestro Parrillero')
    expect(r.esperando).toEqual({ ahora: 544, tope: null, libres: null })
    expect(r.vence).toBe('2026-12-08T13:00:00-03:00')
  })

  it('una cortesía sin fecha no vence', () => {
    expect(planParaApi(uso(PAGADO, { planOrigen: 'cortesia' }), AHORA, '2026-11').vence).toBeNull()
  })
})
