import 'server-only'
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { getDb, scheduledPostTargets, socialAccounts } from '@/db'
import type { Tema } from '@/lib/tema'
import { nombreDe } from '@/lib/vocabulario'
import { pasoDeHuerfanos } from './meta-bajas'
import { esUuid } from '@/lib/uuid'

// «Quitar» en Los Fierros: saca una cuenta de Tu Parrilla con todo su historial, y la deja
// libre para que otro usuario la conecte. Mientras una fila exista, su cuenta queda atada a
// ese dueño (la única es (red, id externo)): «Desconectar» guarda el historial y por eso no
// la libera. Es el mismo borrado que pide Meta (`meta-bajas.ts`), acotado a una cuenta.

export const CUENTA_NO_ESTA = 'Esa cuenta ya no está.'
export const CUENTA_CONECTADA = 'Desconecta la cuenta antes de quitarla.'

/**
 * Lo que se dice cuando la cuenta todavía tiene publicaciones por salir: quitarla las dejaría
 * sin ese destino sin que nadie lo viera. Nombra La Parrilla como la ve la cuenta: de día, La
 * Barra.
 */
export function fraseConPendientes(cuantas: number, tema: Tema = 'noche'): string {
  const donde = nombreDe('/admin/schedule', tema)
  return cuantas === 1
    ? `Tiene una publicación programada hacia esta cuenta: bórrala en ${donde}, o espera a que salga, antes de quitarla.`
    : `Tiene ${cuantas} publicaciones programadas hacia esta cuenta: bórralas en ${donde}, o espera a que salgan, antes de quitarla.`
}


/**
 * Los pasos del borrado de una cuenta, en el orden que manda el esquema —el mismo de
 * `pasosDeBorrado`—: lo que la referencia sin cascada antes que la cuenta, y las métricas de
 * los posts antes que los posts. El último paso repite el dueño: la cuenta ya se leyó atada
 * a él en la misma transacción, pero la fila que se borra no depende de eso.
 *
 * Devuelve `SQL` para que el test lo renderice sin base.
 */
export function pasosParaQuitar(ownerId: string, accountId: string): SQL[] {
  return [
    sql`delete from post_metrics where post_id in (select id from social_posts where account_id = ${accountId})`,
    sql`delete from post_comments where account_id = ${accountId}`,
    sql`delete from social_posts where account_id = ${accountId}`,
    sql`delete from account_metrics where account_id = ${accountId}`,
    sql`delete from scheduled_post_targets where account_id = ${accountId}`,
    sql`delete from social_accounts where id = ${accountId} and owner_id = ${ownerId}`,
  ]
}

/**
 * Quita una cuenta del dueño. Solo una desconectada —así no se borra por un toque una cuenta
 * que está trabajando— y sin publicaciones por salir hacia ella. Los cortes que se queden sin
 * ningún destino se borran con ella, como en el borrado de Meta: la parrilla los lee por sus
 * destinos, y uno sin ninguno ya no se podría ni abrir.
 */
export async function quitarCuenta(
  ownerId: string,
  accountId: string,
  tema: Tema = 'noche',
): Promise<{ nombre: string } | { error: string }> {
  if (!esUuid(accountId)) return { error: CUENTA_NO_ESTA }
  return getDb().transaction(async (tx) => {
    const [cuenta] = await tx
      .select({
        handle: socialAccounts.handle,
        externalId: socialAccounts.externalId,
        conectada: sql<boolean>`${socialAccounts.accessToken} is not null`,
      })
      .from(socialAccounts)
      .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.ownerId, ownerId)))
      .limit(1)
    if (!cuenta) return { error: CUENTA_NO_ESTA }
    if (cuenta.conectada) return { error: CUENTA_CONECTADA }

    // Por el id que la lectura de arriba ya probó como del dueño.
    const [{ pendientes }] = await tx
      .select({ pendientes: sql<number>`count(*)::int` })
      .from(scheduledPostTargets)
      .where(
        and(
          eq(scheduledPostTargets.accountId, accountId),
          inArray(scheduledPostTargets.status, ['scheduled', 'publishing']),
        ),
      )
    if (pendientes > 0) return { error: fraseConPendientes(pendientes, tema) }

    const cortes = await tx
      .selectDistinct({ postId: scheduledPostTargets.postId })
      .from(scheduledPostTargets)
      .where(eq(scheduledPostTargets.accountId, accountId))
    for (const paso of pasosParaQuitar(ownerId, accountId)) await tx.execute(paso)
    const huerfanos = pasoDeHuerfanos(cortes.map((c) => c.postId))
    if (huerfanos) await tx.execute(huerfanos)
    return { nombre: cuenta.handle ?? cuenta.externalId ?? 'la cuenta' }
  })
}
