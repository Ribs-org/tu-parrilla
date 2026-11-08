// Los planes, sin base: qué plan rige, cuánto le cabe a cada uno y las frases de los topes. El diseño
// está en `docs/superpowers/specs/2026-11-08-planes-design.md`; lo que lee y escribe la base, en
// `planes.ts` y `topes.ts`, al lado.

import type { ClavePlan, OrigenPlan } from '@/db/schema'

/** Una fila de `planes`, como la leen el panel y los topes. */
export type Plan = {
  clave: ClavePlan
  nombre: string
  precioClp: number
  diasDePrueba: number
  /** Nulo es sin tope. */
  cuentasMax: number | null
  enLaParrillaMax: number | null
  bodegaBytes: number
  tokensMes: number | null
  prioridad: number
}

/** Lo que de una persona decide su plan. */
export type ConPlan = {
  plan: ClavePlan
  planHasta: Date | null
  planOrigen: OrigenPlan | null
}

/**
 * La clave del plan que rige ahora: el de la persona si no es el gratis y su fecha no pasó; si no,
 * el gratis. Se calcula al leer, así que una cortesía que vence o una suscripción que dejó de
 * pagarse vuelven solas al gratis, sin que nadie escriba nada a medianoche.
 */
export function claveQueRige(persona: ConPlan, ahora: Date): ClavePlan {
  if (persona.plan === 'gratis') return 'gratis'
  if (persona.planHasta && persona.planHasta.getTime() <= ahora.getTime()) return 'gratis'
  return persona.plan
}

/**
 * La cámara de frío de una persona: la que el admin puso a mano en Los Maestros (`users.bodega_bytes`)
 * gana sobre la del plan; sin ella, la del plan que rige.
 */
export function cuotaDeLaCamara(persona: { bodegaBytes: number | null }, plan: Pick<Plan, 'bodegaBytes'>): number {
  return persona.bodegaBytes ?? plan.bodegaBytes
}

/** El mes de los tokens, `2026-11`, en la zona del dueño: como todo lo que se cuenta por mes. */
export function mesDelDueno(ahora: Date, zona: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit' }).format(ahora)
}

/** Si a una persona le queda espacio bajo un tope: sin tope, siempre. */
export function cabe(usados: number, nuevos: number, tope: number | null): boolean {
  return tope === null || usados + nuevos <= tope
}

export function topeDeCuentas(plan: Pick<Plan, 'nombre' | 'cuentasMax'>): string {
  return `Tu plan ${plan.nombre} conecta hasta ${cuantas(plan.cuentasMax ?? 0, 'cuenta', 'cuentas')}: desconecta una en Los Fierros para conectar esta.`
}

export function topeEnLaParrilla(plan: Pick<Plan, 'nombre' | 'enLaParrillaMax'>): string {
  return `Tu plan ${plan.nombre} deja hasta ${cuantas(plan.enLaParrillaMax ?? 0, 'publicación esperando', 'publicaciones esperando')} a la vez: espera a que salga alguna o borra una.`
}

export const SIN_TOKENS = 'Se acabaron los tokens de IA de tu plan este mes.'

/** «4.000», «2.000.000»: los números grandes de «Tu plan» y del admin. */
export function enMiles(n: number): string {
  return n.toLocaleString('es-CL')
}

/** «$34.990». */
export function enPesos(n: number): string {
  return `$${enMiles(n)}`
}

function cuantas(n: number, uno: string, varios: string): string {
  return `${enMiles(n)} ${n === 1 ? uno : varios}`
}

// --- Lo que escribe el admin ---------------------------------------------------------------------

export const PLAN_ILEGIBLE = {
  nombre: 'El nombre del plan va de 1 a 40 caracteres.',
  precio: 'El precio es un número entero de pesos, como 34990. El gratis va en 0.',
  prueba: 'Los días de prueba van de 0 a 60.',
  tope: 'Cada tope es un número entero mayor que cero, o vacío para dejarlo sin tope.',
  bodega: 'La cámara de frío es un número de GB, de 1 a 10.000, como 20 o 100.',
  prioridad: 'La prioridad es un número entero de 0 a 9.',
} as const

export const FECHA_ILEGIBLE = 'La fecha no se entendió: elige un día, o déjala vacía para que sea sin fecha.'
export const FECHA_PASADA = 'La cortesía tiene que terminar después de hoy.'

/** Lo que el admin puede cambiar de un plan; la clave no se cambia. */
export type CambiosDePlan = Omit<Plan, 'clave'>

const entero = (texto: string) => (/^\d+$/.test(texto) ? Number(texto) : null)

/**
 * Lee el formulario de un plan en Los Maestros: los topes vacíos son sin tope; los números, sin
 * puntos de miles («34.990» y «34990» valen lo mismo). En el gratis el precio y la prueba se
 * fuerzan a cero: no se cobra.
 */
export function leerPlan(clave: ClavePlan, campos: Record<string, unknown>): CambiosDePlan | { error: string } {
  const texto = (k: string) => (typeof campos[k] === 'string' ? (campos[k] as string).trim() : '')
  const numero = (k: string) => texto(k).replace(/\./g, '')

  const nombre = texto('nombre')
  if (nombre.length < 1 || nombre.length > 40) return { error: PLAN_ILEGIBLE.nombre }

  const precio = clave === 'gratis' ? 0 : entero(numero('precioClp'))
  if (precio === null || precio > 10_000_000) return { error: PLAN_ILEGIBLE.precio }

  const prueba = clave === 'gratis' ? 0 : entero(numero('diasDePrueba') || '0')
  if (prueba === null || prueba > 60) return { error: PLAN_ILEGIBLE.prueba }

  const topes: Record<'cuentasMax' | 'enLaParrillaMax' | 'tokensMes', number | null> = {
    cuentasMax: null,
    enLaParrillaMax: null,
    tokensMes: null,
  }
  for (const k of ['cuentasMax', 'enLaParrillaMax', 'tokensMes'] as const) {
    const t = numero(k)
    if (t === '') continue
    const n = entero(t)
    if (n === null || n < 1 || n > 2_000_000_000) return { error: PLAN_ILEGIBLE.tope }
    topes[k] = n
  }

  const gigas = texto('bodegaGb').replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(gigas) || Number(gigas) < 1 || Number(gigas) > 10_000) return { error: PLAN_ILEGIBLE.bodega }

  const prioridad = entero(numero('prioridad') || '0')
  if (prioridad === null || prioridad > 9) return { error: PLAN_ILEGIBLE.prioridad }

  return {
    nombre,
    precioClp: precio,
    diasDePrueba: prueba,
    ...topes,
    bodegaBytes: Math.round(Number(gigas) * 1024 ** 3),
    prioridad,
  }
}

/**
 * El plan de alguien en una línea, para su fila en Los Maestros: «Gratis», «Asador · cortesía hasta
 * el 8 dic 2026», «Asador · cortesía», «Asador · lo paga hasta el 8 dic 2026», o, si venció,
 * «Gratis · su Asador venció el 8 dic 2026». `fecha` escribe el día en la zona de quien mira.
 */
export function planEnPalabras(
  persona: ConPlan,
  planes: Record<ClavePlan, Pick<Plan, 'nombre'>>,
  ahora: Date,
  fecha: (d: Date) => string,
): string {
  if (persona.plan === 'gratis') return planes.gratis.nombre
  const nombre = planes[persona.plan].nombre
  if (claveQueRige(persona, ahora) === 'gratis') return `${planes.gratis.nombre} · su ${nombre} venció el ${fecha(persona.planHasta!)}`
  const como = persona.planOrigen === 'suscripcion' ? 'lo paga' : 'cortesía'
  return persona.planHasta ? `${nombre} · ${como} hasta el ${fecha(persona.planHasta)}` : `${nombre} · ${como}`
}
