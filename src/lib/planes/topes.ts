import { and, eq, inArray, ne } from 'drizzle-orm'
import { getDb, scheduledPostTargets, users } from '@/db'
import { cabe, topeDeCuentas, topeEnLaParrilla } from './plan'
import { cuentasConectadas, esperandoEnLaParrilla, planDe } from './planes'

// Los dos topes del plan que se miran al escribir: las cuentas conectadas y las publicaciones que
// esperan en la parrilla. Corren dentro de la transacción que escribe, con la fila del dueño
// trabada: dos pestañas que programan a la vez no se pasan del tope entre las dos.

type Transaccion = Pick<ReturnType<typeof getDb>, 'select'>

/** Lo que se le dice a la persona cuando su plan no deja: la frase va tal cual a la pantalla. */
export class TopeDelPlan extends Error {
  constructor(frase: string) {
    super(frase)
    this.name = 'TopeDelPlan'
  }
}

async function trabarDueno(tx: Transaccion, ownerId: string): Promise<void> {
  await tx.select({ id: users.id }).from(users).where(eq(users.id, ownerId)).for('update')
}

/** Que `nuevas` publicaciones más quepan en la parrilla del dueño; si no, `TopeDelPlan`. */
export async function exigirCupoEnLaParrilla(tx: Transaccion, ownerId: string, nuevas: number, ahora = new Date()): Promise<void> {
  if (nuevas <= 0) return
  await trabarDueno(tx, ownerId)
  const { plan } = await planDe(ownerId, ahora, tx)
  if (plan.enLaParrillaMax === null) return
  const esperando = await esperandoEnLaParrilla(tx, ownerId)
  if (!cabe(esperando, nuevas, plan.enLaParrillaMax)) throw new TopeDelPlan(topeEnLaParrilla(plan))
}

/**
 * Antes de devolver a la fila un destino quemado («Reprogramar»): si era el único del post que
 * esperaba, el post vuelve a contar entre las publicaciones que esperan, y tiene que caber.
 */
export async function exigirCupoAlRearmar(tx: Transaccion, ownerId: string, postId: string, targetId: string): Promise<void> {
  const [otroEsperando] = await tx
    .select({ id: scheduledPostTargets.id })
    .from(scheduledPostTargets)
    .where(
      and(
        eq(scheduledPostTargets.postId, postId),
        inArray(scheduledPostTargets.status, ['scheduled', 'publishing']),
        ne(scheduledPostTargets.id, targetId),
      ),
    )
    .limit(1)
  if (!otroEsperando) await exigirCupoEnLaParrilla(tx, ownerId, 1)
}

/**
 * La misma cuenta sin trabar nada, para rechazar temprano —antes de bajar la media de una fila del
 * lote— lo que la transacción va a rechazar igual. Null si cabe una más.
 */
export async function sinCupoEnLaParrilla(ownerId: string, ahora = new Date()): Promise<string | null> {
  const db = getDb()
  const { plan } = await planDe(ownerId, ahora, db)
  if (plan.enLaParrillaMax === null) return null
  return cabe(await esperandoEnLaParrilla(db, ownerId), 1, plan.enLaParrillaMax) ? null : topeEnLaParrilla(plan)
}

/**
 * Que una cuenta más quepa entre las conectadas del dueño. `cuenta` es la fila que se va a
 * reconectar, si ya existía: reconectar una que estaba conectada no suma, y una desconectada sí.
 */
export async function exigirCupoDeCuentas(tx: Transaccion, ownerId: string, cuenta: string | null, ahora = new Date()): Promise<void> {
  await trabarDueno(tx, ownerId)
  const { plan } = await planDe(ownerId, ahora, tx)
  if (plan.cuentasMax === null) return
  const conectadas = await cuentasConectadas(tx, ownerId, cuenta ?? undefined)
  if (!cabe(conectadas, 1, plan.cuentasMax)) throw new TopeDelPlan(topeDeCuentas(plan))
}
