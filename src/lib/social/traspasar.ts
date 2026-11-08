import 'server-only'
import { asc, eq, sql, type SQL } from 'drizzle-orm'
import { getDb, socialAccounts, users } from '@/db'
import { esUuid } from '@/lib/uuid'
import { CUENTA_NO_ESTA } from './quitar'

// «Traspasar una cuenta» en Los Maestros: le cambia el dueño a una cuenta sin borrar nada. Es lo
// que separa esto de «Quitar», la otra forma de liberar una cuenta, que se lleva su historial.
// Cruza dueños a propósito, así que solo lo llama el admin (`traspasarCuentaAccion`).

export const DESTINO_NO_ESTA = 'Esa persona ya no está en Los Maestros.'
export const YA_ES_SUYA = 'Esa cuenta ya es de esa persona.'
export const TRASPASO_FALLIDO = 'No se pudo traspasar la cuenta. Intenta de nuevo.'

export type CuentaTraspasable = {
  id: string
  network: string
  nombre: string
  duenoId: string
  dueno: string
  publicaciones: number
  porSalir: number
}

/** Todas las cuentas con dueño, de todos los usuarios: la lista del admin, por dueño y por red. */
export async function listarCuentasTraspasables(): Promise<CuentaTraspasable[]> {
  const filas = await getDb()
    .select({
      id: socialAccounts.id,
      network: socialAccounts.network,
      handle: socialAccounts.handle,
      externalId: socialAccounts.externalId,
      duenoId: users.id,
      dueno: users.correo,
      publicaciones: sql<number>`(select count(*)::int from social_posts p where p.account_id = ${socialAccounts.id})`,
      porSalir: sql<number>`(
        select count(*)::int from scheduled_post_targets t
        where t.account_id = ${socialAccounts.id} and t.status in ('scheduled', 'publishing')
      )`,
    })
    .from(socialAccounts)
    .innerJoin(users, eq(users.id, socialAccounts.ownerId))
    .orderBy(asc(users.correo), asc(socialAccounts.network), asc(socialAccounts.handle))
  return filas.map(({ handle, externalId, ...fila }) => ({ ...fila, nombre: handle ?? externalId ?? 'la cuenta' }))
}

/**
 * Los pasos del traspaso. Lo que cuelga de la cuenta por `account_id` —comentarios, métricas y
 * destinos— la sigue solo; lo que lleva su propio `owner_id` hay que moverlo:
 *
 * - sus publicaciones, porque Los Números las lee por dueño;
 * - los cortes que salen solo a esta cuenta, porque sin ellos sus atributos no se cruzan con las
 *   publicaciones y su historial se queda en la parrilla de quien ya no tiene la cuenta.
 *
 * Un corte que sale además a otras cuentas se queda con quien lo programó: es suyo, y sus otros
 * destinos también. Sigue saliendo, porque la publicación busca la cuenta por su id.
 *
 * `ref` es única por dueño: si quien recibe ya usó esa referencia, la del corte que llega se
 * borra. Solo sirve para reconocer un lote reenviado, y no vale perder el traspaso por ella.
 *
 * Devuelve `SQL` para que el test lo renderice sin base.
 */
export function pasosDeTraspaso(accountId: string, destinoId: string): SQL[] {
  return [
    sql`update social_posts set owner_id = ${destinoId} where account_id = ${accountId}`,
    sql`update scheduled_posts p set
          owner_id = ${destinoId},
          ref = case when exists (
            select 1 from scheduled_posts otro where otro.owner_id = ${destinoId} and otro.ref = p.ref
          ) then null else p.ref end,
          updated_at = now()
        where p.id in (select t.post_id from scheduled_post_targets t where t.account_id = ${accountId})
          and not exists (
            select 1 from scheduled_post_targets t where t.post_id = p.id and t.account_id <> ${accountId}
          )`,
    sql`update social_accounts set owner_id = ${destinoId} where id = ${accountId}`,
    // Lo de TikTok for Business vive en `ajustes`, por dueño: la credencial (`social/tiktok-business.ts`)
    // y los números guardados (`social/tiktok-numeros-guardar.ts`). Pasa con la cuenta, como la
    // credencial de la fila.
    sql`update ajustes set owner_id = ${destinoId}, updated_at = now()
        where owner_id is distinct from ${destinoId}
          and (clave = 'tiktok_comentarios:' || ${accountId} or starts_with(clave, 'tiktok_business:' || ${accountId} || ':'))`,
  ]
}

/**
 * Pasa una cuenta a otro usuario, todo o nada. La credencial se queda como está: la cuenta sigue
 * funcionando, y quien la recibe la reconecta para dejarla a su nombre. Para devolverla basta con
 * traspasarla de vuelta. Nunca lanza: Los Maestros muestra la frase.
 */
export async function traspasarCuenta(
  accountId: string,
  destinoId: string,
): Promise<{ nombre: string; correo: string } | { error: string }> {
  if (!esUuid(accountId)) return { error: CUENTA_NO_ESTA }
  if (!esUuid(destinoId)) return { error: DESTINO_NO_ESTA }
  try {
    const resultado = await getDb().transaction(async (tx) => {
      // Con la fila tomada: dos traspasos a la vez no pueden decidir sobre el mismo dueño.
      const [cuenta] = await tx
        .select({ handle: socialAccounts.handle, externalId: socialAccounts.externalId, ownerId: socialAccounts.ownerId })
        .from(socialAccounts)
        .where(eq(socialAccounts.id, accountId))
        .for('update')
      if (!cuenta?.ownerId) return { error: CUENTA_NO_ESTA }
      const [destino] = await tx.select({ correo: users.correo }).from(users).where(eq(users.id, destinoId))
      if (!destino) return { error: DESTINO_NO_ESTA }
      if (cuenta.ownerId === destinoId) return { error: YA_ES_SUYA }

      for (const paso of pasosDeTraspaso(accountId, destinoId)) await tx.execute(paso)
      console.log(`[traspaso] cuenta ${accountId}: de ${cuenta.ownerId} a ${destinoId}`)
      return { nombre: cuenta.handle ?? cuenta.externalId ?? 'la cuenta', correo: destino.correo }
    })
    return resultado
  } catch (error) {
    console.error('traspasarCuenta:', error)
    return { error: TRASPASO_FALLIDO }
  }
}
