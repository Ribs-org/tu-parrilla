import 'server-only'
import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm'
import { getDb, postComments } from '@/db'

/**
 * Cuánto dura el reclamo de un envío (`enviandoHasta`): más que cualquier respuesta a la
 * red, poco para que un envío que murió a la mitad vuelva a poder mandarse.
 */
export const ENVIO_MS = 2 * 60_000

/**
 * Reclama un comentario para mandarle la respuesta. Un solo `UPDATE … RETURNING` que pide
 * que siga respondible (`pendiente` o `fallido`) y que nadie lo tenga reclamado: si dos
 * toques, dos pestañas del panel o dos sondeos encimados llegan a la vez, uno solo lo
 * obtiene y el otro no manda nada. Leer el estado y después mandar no alcanzaba: los dos
 * leían `pendiente` antes de que el primero escribiera `enviado`.
 *
 * Devuelve la hora del reclamo, o null si otro lo tiene. Quien reclamó escribe el resultado
 * con `enviandoHasta: null`.
 */
export async function reclamarEnvio(id: string, ahora: Date = new Date()): Promise<Date | null> {
  const hasta = new Date(ahora.getTime() + ENVIO_MS)
  const tomados = await getDb()
    .update(postComments)
    .set({ enviandoHasta: hasta })
    .where(
      and(
        eq(postComments.id, id),
        inArray(postComments.state, ['pendiente', 'fallido']),
        or(isNull(postComments.enviandoHasta), lt(postComments.enviandoHasta, ahora)),
      ),
    )
    .returning({ id: postComments.id })
  return tomados.length > 0 ? hasta : null
}
