import { isoInZone } from '@/lib/metrics-api'
import { claveQueRige } from './plan'
import type { UsoDelPlan } from './uso'

// El plan del dueño de la llave, para la API (`GET /api/schedule/plan`, issue #394): qué plan rige,
// cada tope y lo que lleva usado, con la misma cuenta que usan los rechazos. Sin base: lo que lee la
// base es `usoDelPlan`, el mismo que dibuja «Tu plan» en Tu Cuenta, así que el panel y la API no
// pueden decir cosas distintas.

/** Un tope: lo usado, el máximo (`null` es sin tope) y lo que queda (`null` sin tope, nunca negativo). */
export type TopeEnLaApi = { ahora: number; tope: number | null; libres: number | null }

export type PlanEnLaApi = {
  /** El nombre, como sale en la frase de un rechazo («Tu plan Gratis deja…»). */
  plan: string
  /** Hasta cuándo rige si no es el gratis y tiene fecha (una suscripción o una cortesía); si no, `null`. */
  vence: string | null
  /** Las publicaciones esperando salir: una cuenta una vez aunque vaya a varias redes. */
  esperando: TopeEnLaApi
  /** Las cuentas conectadas. */
  cuentas: TopeEnLaApi
  /** La cámara de frío de La Cocina, en bytes: lo guardado más lo que se está subiendo. */
  camara: TopeEnLaApi
  /** Los tokens de IA del mes en curso, en la zona del dueño. */
  tokens: TopeEnLaApi & { mes: string }
}

function tope(ahora: number, maximo: number | null): TopeEnLaApi {
  return { ahora, tope: maximo, libres: maximo === null ? null : Math.max(0, maximo - ahora) }
}

export function planParaApi(uso: UsoDelPlan, ahora: Date, mes: string): PlanEnLaApi {
  const { plan, persona } = uso
  const rigeElPagado = claveQueRige(persona, ahora) !== 'gratis'
  return {
    plan: plan.nombre,
    vence: rigeElPagado && persona.planHasta ? isoInZone(persona.planHasta, persona.zona) : null,
    esperando: tope(uso.enLaParrilla, plan.enLaParrillaMax),
    cuentas: tope(uso.cuentas, plan.cuentasMax),
    camara: tope(uso.camara.ocupados, uso.camara.cuota),
    tokens: { ...tope(uso.tokens, plan.tokensMes), mes },
  }
}
