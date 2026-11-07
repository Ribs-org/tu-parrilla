import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb, pushTokens, users, type Usuario } from '@/db'
import { env } from '@/lib/env'
import { sesionDelTelefono } from '@/lib/mobile-token'
import { temaDe, type Tema } from '@/lib/tema'
import { mandarAExpo, mensajeExpo, type AvisoAlTelefono } from './expo'

// Los avisos al teléfono contra la base: registrar el token de una instalación, borrarlo y mandarle
// a una cuenta un aviso a todos sus teléfonos. Van al lado del correo, nunca en su lugar: cada aviso
// que sale por acá sale también por correo como siempre, y si esto falla el correo no se entera.

/**
 * Registra el token de este teléfono a nombre de la cuenta. El token es único: si ya estaba con otra
 * cuenta —otra persona entró en el mismo teléfono—, pasa a esta, y la anterior deja de recibir avisos
 * en él. La app lo llama cada vez que abre con los avisos encendidos, porque Expo puede cambiarlo.
 */
export async function registrarToken(
  usuario: Pick<Usuario, 'id' | 'sesionVersion'>,
  token: string,
  plataforma: 'android' | 'ios',
  ahora = new Date(),
): Promise<void> {
  const ownerId = usuario.id
  const sesion = sesionDelTelefono(usuario.sesionVersion)
  await getDb()
    .insert(pushTokens)
    .values({ ownerId, token, plataforma, sesion, creadoEn: ahora, actualizadoEn: ahora })
    .onConflictDoUpdate({ target: pushTokens.token, set: { ownerId, plataforma, sesion, actualizadoEn: ahora } })
}

/** Borra el token de este teléfono, solo si es de esta cuenta: nadie apaga los avisos de otro. Devuelve si había. */
export async function borrarToken(ownerId: string, token: string): Promise<boolean> {
  const filas = await getDb()
    .delete(pushTokens)
    .where(and(eq(pushTokens.ownerId, ownerId), eq(pushTokens.token, token)))
    .returning({ id: pushTokens.id })
  return filas.length > 0
}

/** Lo que salió: cuántos teléfonos tenía la cuenta y cuántos avisos aceptó Expo. */
export type Enviado = { telefonos: number; aceptados: number }

/**
 * Le manda un aviso a cada teléfono de una cuenta. El aviso se arma con el modo de la cuenta (de día,
 * con las palabras del día). Los tokens que Expo dice que ya no sirven se borran, y también los de
 * una sesión revocada (`push_tokens.sesion`), sin mandarles nada. Nunca lanza: corre al lado del
 * correo, y lo que no sale no deshace nada.
 */
export async function avisarAlTelefono(
  ownerId: string | null | undefined,
  armar: (tema: Tema) => AvisoAlTelefono,
): Promise<Enviado> {
  if (!ownerId) return { telefonos: 0, aceptados: 0 }
  try {
    const db = getDb()
    const filas = await db
      .select({ token: pushTokens.token, sesion: pushTokens.sesion, tema: users.tema, sesionVersion: users.sesionVersion })
      .from(pushTokens)
      .innerJoin(users, eq(users.id, pushTokens.ownerId))
      .where(eq(pushTokens.ownerId, ownerId))
    const vigentes = filas.filter((f) => f.sesion === sesionDelTelefono(f.sesionVersion))
    const revocados = filas.filter((f) => !vigentes.includes(f)).map((f) => f.token)
    let resultado = { aceptados: 0, vencidos: [] as string[] }
    if (vigentes.length > 0) {
      const aviso = armar(temaDe(vigentes[0]!.tema))
      resultado = await mandarAExpo(
        vigentes.map((f) => mensajeExpo(f.token, aviso)),
        { accessToken: env('EXPO_ACCESS_TOKEN') },
      )
    }
    const olvidar = [...revocados, ...resultado.vencidos]
    if (olvidar.length > 0) {
      await db.delete(pushTokens).where(and(eq(pushTokens.ownerId, ownerId), inArray(pushTokens.token, olvidar)))
    }
    return { telefonos: vigentes.length, aceptados: resultado.aceptados }
  } catch (error) {
    console.error('[push] No se pudo avisar al teléfono:', String(error).slice(0, 300))
    return { telefonos: 0, aceptados: 0 }
  }
}

/** Si el aviso no salió habiendo a quién mandarlo: es lo que se reintenta en la pasada siguiente. */
export function noSalio(e: Enviado): boolean {
  return e.telefonos > 0 && e.aceptados === 0
}
