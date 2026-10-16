import 'server-only'
import { asc, eq, inArray } from 'drizzle-orm'
import { accountMetrics, getDb, socialAccounts } from '@/db'

/**
 * Todas las lecturas diarias de las cuentas de un dueño, para las tarjetas de seguidores de
 * Los Números: la del panel y la de la app. Sin filtro de fecha a propósito: la variación
 * necesita la lectura anterior a la ventana, y la tabla crece una fila por cuenta y día —
 * nada que paginar.
 */
export async function lecturasDeCuentas(ownerId: string) {
  return getDb()
    .select({
      network: accountMetrics.network,
      accountId: accountMetrics.accountId,
      day: accountMetrics.day,
      followers: accountMetrics.followers,
      profileViews: accountMetrics.profileViews,
      reach: accountMetrics.reach,
    })
    .from(accountMetrics)
    .where(
      inArray(
        accountMetrics.accountId,
        getDb().select({ id: socialAccounts.id }).from(socialAccounts).where(eq(socialAccounts.ownerId, ownerId)),
      ),
    )
    .orderBy(asc(accountMetrics.day), asc(accountMetrics.network))
}
