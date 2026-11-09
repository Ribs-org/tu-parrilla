import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { getDb, planes, scheduledPostTargets, scheduledPosts, socialAccounts, users, usoIa } from '@/db'
import type { ClavePlan } from '@/db/schema'
import { claveQueRige, mesDelDueno, type CambiosDePlan, type ConPlan, type Plan } from './plan'

// Los planes contra la base: leerlos, el que rige para alguien, cuánto lleva usado y lo que cambia
// el admin. Las reglas sin base están en `plan.ts`.

type Lector = Pick<ReturnType<typeof getDb>, 'select'>

const COLUMNAS_PLAN = {
  clave: planes.clave,
  nombre: planes.nombre,
  precioClp: planes.precioClp,
  diasDePrueba: planes.diasDePrueba,
  cuentasMax: planes.cuentasMax,
  enLaParrillaMax: planes.enLaParrillaMax,
  bodegaBytes: planes.bodegaBytes,
  tokensMes: planes.tokensMes,
  prioridad: planes.prioridad,
}

/** Los dos planes, por clave. Nacen en la migración `0035_planes.sql`: si falta uno, la base está mal. */
export async function leerPlanes(db: Lector = getDb()): Promise<Record<ClavePlan, Plan>> {
  const filas = await db.select(COLUMNAS_PLAN).from(planes)
  const porClave = Object.fromEntries(filas.map((p) => [p.clave, p])) as Partial<Record<ClavePlan, Plan>>
  if (!porClave.gratis || !porClave.pagado) throw new Error('Faltan los planes en la tabla planes')
  return { gratis: porClave.gratis, pagado: porClave.pagado }
}

export type PlanDeAlguien = {
  /** El plan que rige ahora, con sus topes. */
  plan: Plan
  /** Lo que tiene escrito, aunque haya vencido: el admin y «Tu plan» lo muestran. */
  persona: ConPlan & { bodegaBytes: number | null; zona: string; pruebaUsadaEn: Date | null }
}

/** El plan que rige para una persona, con sus topes. */
export async function planDe(ownerId: string, ahora = new Date(), db: Lector = getDb()): Promise<PlanDeAlguien> {
  const [persona] = await db
    .select({
      plan: users.plan,
      planHasta: users.planHasta,
      planOrigen: users.planOrigen,
      bodegaBytes: users.bodegaBytes,
      zona: users.zona,
      pruebaUsadaEn: users.pruebaUsadaEn,
    })
    .from(users)
    .where(eq(users.id, ownerId))
  if (!persona) throw new Error('La persona del plan no existe')
  const todos = await leerPlanes(db)
  return { plan: todos[claveQueRige(persona, ahora)], persona }
}

/** Las cuentas conectadas del dueño —las que tienen credencial—, sin contar `menos`. */
export async function cuentasConectadas(db: Lector, ownerId: string, menos?: string): Promise<number> {
  const [fila] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.ownerId, ownerId),
        isNotNull(socialAccounts.accessToken),
        menos ? sql`${socialAccounts.id} <> ${menos}` : undefined,
      ),
    )
  return fila?.n ?? 0
}

/**
 * Las publicaciones del dueño que esperan salir: cortes de La Parrilla con algún destino por
 * publicar o publicándose. Una que sale a cuatro redes es una.
 */
export async function esperandoEnLaParrilla(db: Lector, ownerId: string): Promise<number> {
  const [fila] = await db
    .select({ n: sql<number>`count(distinct ${scheduledPosts.id})`.mapWith(Number) })
    .from(scheduledPosts)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .where(and(eq(scheduledPosts.ownerId, ownerId), inArray(scheduledPostTargets.status, ['scheduled', 'publishing'])))
  return fila?.n ?? 0
}

/** Los tokens de IA que el dueño lleva gastados en el mes de `ahora`, en su zona. */
export async function tokensDelMes(db: Lector, ownerId: string, zona: string, ahora: Date): Promise<number> {
  const [fila] = await db
    .select({ tokens: usoIa.tokens })
    .from(usoIa)
    .where(and(eq(usoIa.ownerId, ownerId), eq(usoIa.mes, mesDelDueno(ahora, zona))))
  return fila?.tokens ?? 0
}

// --- Lo que cambia el admin ----------------------------------------------------------------------

export async function guardarPlan(clave: ClavePlan, cambios: CambiosDePlan): Promise<void> {
  await getDb()
    .update(planes)
    .set({ ...cambios, actualizadoEn: new Date() })
    .where(eq(planes.clave, clave))
}

/**
 * El pagado sin pagar, hasta una fecha o sin ella. Pisa lo que tuviera: una cortesía sobre una
 * suscripción que se paga no la cancela en Mercado Pago, y por eso el admin lo ve al lado.
 */
export async function darCortesia(userId: string, hasta: Date | null): Promise<boolean> {
  const filas = await getDb()
    .update(users)
    .set({ plan: 'pagado', planHasta: hasta, planOrigen: 'cortesia', updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id })
  return filas.length > 0
}

export async function pasarAlGratis(userId: string): Promise<boolean> {
  const filas = await getDb()
    .update(users)
    .set({ plan: 'gratis', planHasta: null, planOrigen: null, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id })
  return filas.length > 0
}
