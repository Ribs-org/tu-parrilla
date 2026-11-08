import 'server-only'
import { and, eq, sql, type SQL } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { esUuid } from '@/lib/uuid'

// «Desconectar» en Los Fierros: la cuenta deja sus credenciales y no se lee más, pero la fila se
// queda —con ella vuelve el historial al reconectar, y su (red, id externo) sigue atado al
// dueño; para soltarla está «Quitar» (`quitar.ts`)—.
//
// En YouTube, además, se borra en el acto lo que vino de su API: las políticas (§III.E.4) no
// dejan guardar datos de un canal que ya no se refresca, y desconectado no se refresca nunca.
// Es lo mismo que `retencion-youtube` borraría a los 30 días, acotado a esta cuenta: las
// lecturas de los videos y del canal, los comentarios, y el título y la miniatura de cada
// video. La fila del video se queda, porque es la que une las visitas a su etiqueta `?s=`, y
// esas visitas las midió Tu Parrilla; también lo programado desde Tu Parrilla, que lo escribió
// el dueño. De la cuenta quedan su id de canal y su nombre, para que la tarjeta siga ahí y se
// pueda reconectar o quitar.
//
// Las demás redes conservan su historial: sus términos no piden borrarlo al desconectar.

/**
 * Los pasos del borrado de YouTube de una cuenta, puros para que el test los renderice sin base
 * —mismo criterio que `pasosParaQuitar`—. Todos por `account_id`: la cuenta ya se probó del
 * dueño en la misma transacción.
 */
export function pasosParaBorrarYoutube(accountId: string): SQL[] {
  return [
    sql`delete from post_metrics where post_id in (select id from social_posts where account_id = ${accountId})`,
    sql`delete from account_metrics where account_id = ${accountId}`,
    sql`delete from post_comments where account_id = ${accountId}`,
    sql`update social_posts set caption = null, thumbnail_url = null where account_id = ${accountId} and (caption is not null or thumbnail_url is not null)`,
  ]
}

/** La credencial de comentarios de TikTok de la cuenta (`tiktok-business.ts`, `claveDeComentarios`). */
export function pasoParaBorrarComentariosTiktok(ownerId: string, accountId: string): SQL {
  return sql`delete from ajustes where owner_id = ${ownerId} and clave = 'tiktok_comentarios:' || ${accountId}`
}

/** Cuando no es el dueño quien desconecta, sino la red que dejó de dar acceso. */
export type Desconexion = {
  /**
   * Por qué, en `last_sync_error`: la tarjeta lo dice al pasar el mouse, y con él la cuenta
   * cuenta como caída —avisa por correo y al teléfono— y no como desconectada a propósito
   * (`avisos/reglas.ts`). Es lo que hace una baja desde Facebook (`meta-bajas.ts`).
   */
  motivo: string
  /**
   * El refresh token que la red rechazó, cifrado como está en la base. Solo se desconecta si la
   * fila lo sigue teniendo: si el dueño reconectó mientras tanto, la conexión nueva no se toca.
   */
  refreshToken: string
}

/**
 * Desconecta una cuenta del dueño y, si es de YouTube, borra lo que vino de su API, todo en una
 * transacción: no queda una cuenta desconectada con sus datos a medio borrar. Devuelve false si
 * la cuenta no es suya (o no existe), y entonces no toca nada.
 *
 * Sin `porLaRed` es «Desconectar» en Los Fierros. Con él, la red ya no da acceso (Google contestó
 * `invalid_grant`, en `publish/youtube.ts`): se borra lo mismo, con su motivo.
 *
 * Una sincronización que ya estaba leyendo el canal puede alcanzar a escribir la lectura del
 * día después de esto; esa la borra `retencion-youtube` en su plazo, y la siguiente ya no lee
 * el canal, porque sin credencial no se sincroniza.
 */
export async function desconectarCuenta(
  ownerId: string,
  accountId: string,
  porLaRed?: Desconexion,
): Promise<boolean> {
  if (!esUuid(accountId)) return false
  return getDb().transaction(async (tx) => {
    const [cuenta] = await tx
      .update(socialAccounts)
      .set({ accessToken: null, refreshToken: null, expiresAt: null, lastSyncError: porLaRed?.motivo ?? null })
      .where(
        and(
          eq(socialAccounts.id, accountId),
          eq(socialAccounts.ownerId, ownerId),
          porLaRed ? eq(socialAccounts.refreshToken, porLaRed.refreshToken) : undefined,
        ),
      )
      .returning({ network: socialAccounts.network })
    if (!cuenta) return false
    if (cuenta.network === 'youtube') {
      for (const paso of pasosParaBorrarYoutube(accountId)) await tx.execute(paso)
    }
    // En TikTok se apagan también sus comentarios, que tienen credencial propia en `ajustes`
    // (`tiktok-business.ts`): reconectar no los vuelve a activar solo.
    if (cuenta.network === 'tiktok') await tx.execute(pasoParaBorrarComentariosTiktok(ownerId, accountId))
    return true
  })
}
