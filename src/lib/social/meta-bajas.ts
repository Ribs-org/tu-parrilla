import 'server-only'
import { randomBytes } from 'node:crypto'
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { getDb, scheduledPostTargets, socialAccounts, solicitudesBorrado } from '@/db'

// Las dos cosas que Meta puede pedirnos por un usuario que quitó la app: la baja
// (deauthorize) y el borrado (data deletion request). Vienen de dos casos de uso de la misma
// app, cada uno con sus propios callbacks: el de Instagram y Facebook, que identifica a la
// persona por su `meta_user_id`, y el de Threads, que la identifica por su id de Threads, el
// mismo que su cuenta guarda en `external_id`.
//
// Buscan por ese id y no por dueño **a propósito**: Meta no sabe quién es nuestro
// dueño, y la petición no llega con una sesión sino firmada con el app secret. Es la única
// excepción al arnés de aislamiento de `src/lib` (ver `docs/deuda-tecnica.md`, entrada «El
// arnés de aislamiento solo llega a `src/lib`»), y por eso nada de acá se llama desde una
// acción con sesión sin haber pasado antes por `leerSignedRequest`.

export const BAJA_DESDE_FACEBOOK = 'Quitaste la app desde Facebook: vuelve a conectar.'
export const BAJA_DESDE_THREADS = 'Quitaste la app desde Threads: vuelve a conectar.'

/** De qué caso de uso llegó el callback: decide qué cuentas toca y cómo se las busca. */
export type Origen = 'meta' | 'threads'

/** Las dos redes que salen del caso de uso de Instagram y Facebook; nada más se toca por un callback suyo. */
const REDES_META = ['instagram', 'facebook'] as const

/** Las cuentas de esa persona, acotadas a las redes de ese origen. */
function suyas(origen: Origen, userId: string) {
  return origen === 'threads'
    ? and(eq(socialAccounts.externalId, userId), eq(socialAccounts.network, 'threads'))
    : and(eq(socialAccounts.metaUserId, userId), inArray(socialAccounts.network, [...REDES_META]))
}

/**
 * Deja sin credencial las cuentas de Meta de ese usuario; devuelve cuántas.
 *
 * Es lo mismo que «Desconectar» en el panel, con el motivo escrito en `last_sync_error`
 * para que la tarjeta diga por qué. El historial se queda: quitar la app no es pedir que
 * se borre lo que ya pasó.
 */
export async function darDeBaja(userId: string, origen: Origen = 'meta'): Promise<number> {
  const motivo = origen === 'threads' ? BAJA_DESDE_THREADS : BAJA_DESDE_FACEBOOK
  const filas = await getDb()
    .update(socialAccounts)
    .set({ accessToken: null, refreshToken: null, expiresAt: null, lastSyncError: motivo })
    .where(suyas(origen, userId))
    .returning({ id: socialAccounts.id })
  return filas.length
}

/**
 * Los pasos del borrado, en orden, para correr dentro de una sola transacción.
 *
 * El orden lo manda el esquema: `social_posts`, `account_metrics` y
 * `scheduled_post_targets` referencian `social_accounts` **sin** cascada, así que la fila
 * de la cuenta no se puede borrar mientras alguna de las tres siga en pie; y
 * `post_metrics` cuelga de los posts, no de la cuenta, así que va antes que ellos.
 * `post_comments` sí tiene cascada, pero se borra explícito para que el orden completo se
 * vea de una lectura.
 *
 * Los `scheduled_posts` que conservan algún destino no se tocan: el texto y la media son
 * del dueño, no de Meta. Los que esta operación deja sin ningún destino se borran con
 * ellos (`pasoDeHuerfanos`), porque la parrilla lee por `innerJoin` con los destinos y un
 * post sin ninguno desaparece de todas las vistas sin que el dueño pueda ni abrirlo ni
 * borrarlo.
 *
 * Devuelve `SQL` y no texto —mismo criterio que `pasosDeFusion`— para que el test pueda
 * renderizarlo con el dialecto y afirmar el orden y los parámetros sin base.
 */
export function pasosDeBorrado(userId: string, origen: Origen = 'meta'): SQL[] {
  // Las redes van literales y no como parámetros: es la lista cerrada de cada origen, y así
  // la condición se lee en el texto de cada paso.
  const cuentas =
    origen === 'threads'
      ? sql`select id from social_accounts where external_id = ${userId} and network = 'threads'`
      : sql`select id from social_accounts where meta_user_id = ${userId} and network in ('instagram', 'facebook')`
  return [
    sql`delete from post_metrics where post_id in (select id from social_posts where account_id in (${cuentas}))`,
    sql`delete from post_comments where account_id in (${cuentas})`,
    sql`delete from social_posts where account_id in (${cuentas})`,
    sql`delete from account_metrics where account_id in (${cuentas})`,
    sql`delete from scheduled_post_targets where account_id in (${cuentas})`,
    sql`delete from social_accounts where id in (${cuentas})`,
  ]
}

/**
 * El séptimo paso: los cortes que se quedaron sin ningún destino, del texto a la media.
 *
 * Va aparte de `pasosDeBorrado` porque necesita algo que solo se sabe leyendo antes de
 * borrar —qué cortes tocaban esas cuentas— y porque los seis primeros comparten dos
 * invariantes que este no: llevar el `meta_user_id` como parámetro y acotarse a las dos
 * redes de Meta. Sigue siendo pura, así que su SQL se prueba sin base.
 *
 * El `not exists` es la mitad que importa: borra solo lo que **esta** operación dejó
 * huérfano. Un corte que conserve un destino en otra red sigue en la parrilla, y un
 * borrador que ya estaba sin destinos —el dueño lo dejó así— no se toca. La media y la
 * regla cuelgan de `scheduled_posts` en cascada; los archivos los borra el barrido de
 * huérfanos en la hora siguiente, como con cualquier borrado.
 *
 * Los ids van en un solo parámetro, un arreglo: uno por id, como antes, deja de funcionar
 * pasados los 65 535 que Postgres acepta por consulta, y es justo la baja de una cuenta con
 * mucho historial la que llega ahí.
 *
 * Sin ids devuelve `null`: nada que borrar, ningún paso que correr.
 */
export function pasoDeHuerfanos(postIds: string[]): SQL | null {
  if (postIds.length === 0) return null
  return sql`delete from scheduled_posts where id = any(${sql.param(postIds)}::uuid[]) and not exists (select 1 from scheduled_post_targets t where t.post_id = scheduled_posts.id)`
}

/**
 * 16 caracteres de base32 en minúscula: legible en una URL y sin ambigüedad 0/O, 1/l.
 *
 * `b % 32` no sesga nada porque 256 es múltiplo de 32: cada letra sale igual de probable.
 */
export function codigoDeBorrado(): string {
  const alfabeto = 'abcdefghijklmnopqrstuvwxyz234567'
  return [...randomBytes(16)].map((b) => alfabeto[b % 32]).join('')
}

/**
 * Borra lo que vino de Meta para ese usuario y deja constancia; devuelve el código que la
 * respuesta a Meta lleva y que la página de estado sabe leer.
 *
 * Las cuentas se cuentan antes de borrarlas: después ya no existen. Y los cortes que
 * tocaban esas cuentas se leen antes también, por la misma razón: el quinto paso borra
 * sus destinos, que es el único camino que llevaba hasta ellos.
 */
export async function borrarDatosDe(userId: string, origen: Origen = 'meta'): Promise<{ codigo: string; cuentas: number }> {
  const db = getDb()
  const codigo = codigoDeBorrado()
  return db.transaction(async (tx) => {
    const afectadas = await tx
      .select({ id: socialAccounts.id })
      .from(socialAccounts)
      .where(suyas(origen, userId))
    const cuentaIds = afectadas.map((c) => c.id)
    const cortes = cuentaIds.length
      ? await tx
          .selectDistinct({ postId: scheduledPostTargets.postId })
          .from(scheduledPostTargets)
          .where(inArray(scheduledPostTargets.accountId, cuentaIds))
      : []
    for (const paso of pasosDeBorrado(userId, origen)) await tx.execute(paso)
    const huerfanos = pasoDeHuerfanos(cortes.map((c) => c.postId))
    if (huerfanos) await tx.execute(huerfanos)
    // `meta_user_id` guarda el id con que llegó el pedido; `red` dice cuál de los dos es.
    await tx.insert(solicitudesBorrado).values({ codigo, red: origen, metaUserId: userId, cuentas: afectadas.length })
    return { codigo, cuentas: afectadas.length }
  })
}
