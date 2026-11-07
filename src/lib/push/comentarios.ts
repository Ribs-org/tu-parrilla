import 'server-only'
import { and, eq, exists, gt, isNull, lte, or, sql } from 'drizzle-orm'
import { getDb, postComments, pushTokens, socialAccounts, users } from '@/db'
import { avisoDeComentarios } from './avisos'
import { avisarAlTelefono, noSalio } from './enviar'

// El resumen de La Mesa al teléfono: no un aviso por comentario —una publicación que prende son
// cuarenta en una tarde—, sino uno que cuenta los que entraron, y como mucho uno por hora. Corre en
// cada pasada del cron de publicación, después del sondeo de comentarios.

/** Lo mínimo entre dos resúmenes de una misma cuenta. */
export const MINUTOS_ENTRE_RESUMENES = 60

/**
 * Le cuenta a cada dueño con avisos encendidos los comentarios que entraron a La Mesa desde su último
 * resumen y siguen esperando respuesta. El primero sale en la pasada siguiente a que entre un
 * comentario; los que entran después esperan a que pase la hora. La primera vez cuenta solo la última
 * hora: encender los avisos no trae el atraso entero.
 *
 * La marca (`users.push_comentarios_hasta`) se toma antes de mandar, con el valor que se leyó en el
 * `where`, porque dos corridas pueden cruzarse; si Expo no aceptó ninguno, se suelta para la pasada
 * siguiente. Lo automático de una palabra clave ya se respondió solo, y no cuenta. Nunca lanza.
 */
export async function resumirComentarios(ahora: Date = new Date()): Promise<{ avisados: number }> {
  let avisados = 0
  try {
    const db = getDb()
    const antes = new Date(ahora.getTime() - MINUTOS_ENTRE_RESUMENES * 60_000)
    const desde = sql`coalesce(${users.pushComentariosHasta}, ${antes.toISOString()}::timestamptz)`
    const filas = await db
      .select({
        ownerId: users.id,
        hasta: users.pushComentariosHasta,
        red: postComments.network,
        n: sql<number>`count(*)`.mapWith(Number),
      })
      .from(users)
      .innerJoin(socialAccounts, eq(socialAccounts.ownerId, users.id))
      .innerJoin(postComments, eq(postComments.accountId, socialAccounts.id))
      .where(
        and(
          or(isNull(users.pushComentariosHasta), lte(users.pushComentariosHasta, antes)),
          exists(db.select({ uno: sql`1` }).from(pushTokens).where(eq(pushTokens.ownerId, users.id))),
          eq(postComments.state, 'pendiente'),
          eq(postComments.automatico, false),
          gt(postComments.createdAt, desde),
          lte(postComments.createdAt, ahora),
        ),
      )
      .groupBy(users.id, users.pushComentariosHasta, postComments.network)

    const porDueno = new Map<string, { hasta: Date | null; n: number; redes: string[] }>()
    for (const f of filas) {
      const d = porDueno.get(f.ownerId) ?? { hasta: f.hasta, n: 0, redes: [] }
      d.n += f.n
      d.redes.push(f.red)
      porDueno.set(f.ownerId, d)
    }

    for (const [ownerId, d] of porDueno) {
      const tomada = await db
        .update(users)
        .set({ pushComentariosHasta: ahora })
        .where(
          and(
            eq(users.id, ownerId),
            d.hasta ? eq(users.pushComentariosHasta, d.hasta) : isNull(users.pushComentariosHasta),
          ),
        )
        .returning({ id: users.id })
      if (tomada.length === 0) continue
      const enviado = await avisarAlTelefono(ownerId, () => avisoDeComentarios(d.n, d.redes))
      if (noSalio(enviado)) {
        await db
          .update(users)
          .set({ pushComentariosHasta: d.hasta })
          .where(and(eq(users.id, ownerId), eq(users.pushComentariosHasta, ahora)))
      } else if (enviado.aceptados > 0) {
        avisados++
      }
    }
  } catch (error) {
    console.error('[push] Falló el resumen de comentarios:', String(error).slice(0, 300))
  }
  return { avisados }
}
