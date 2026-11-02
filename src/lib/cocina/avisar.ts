import { and, count, eq } from 'drizzle-orm'
import { comandas, creativos, getDb, insumos, users } from '@/db'
import { dominioProducto } from '@/lib/dominios'
import { destinatario, enviarAviso } from '@/lib/social/publish/alert'
import { temaDe } from '@/lib/tema'
import { correoDeComanda, type AvisoDeComanda } from './correo-de-comanda'

// El correo al dueño cuando su comanda termina. Lo pide la ruta del chef
// (`/api/cocina/comandas/{id}/estado`) después de responder, y solo cuando `cambiarEstado` dice
// que ese cambio lo debe (`aviso`): la que escribió la transición es una sola petición, así que el
// correo sale una vez por cambio aunque el chef reintente o mande dos a la vez.
//
// Sale con el remitente de los avisos (`enviarAviso`, `PUBLISH_ALERT_FROM`), como la publicación
// que se quemó y la cuenta que se cayó. Si Resend falla, no se reintenta: la tarjeta de La Cocina
// dice el estado igual. Reintentarlo sin arriesgar un segundo correo pide marcarlo en la comanda
// (`docs/deuda-tecnica.md`, «El correo de la comanda no se reintenta»).

/** El origen del panel para el enlace del correo; sin dominio del producto, la ruta sola. */
function sitio(): string {
  const dominio = dominioProducto()
  return dominio ? `https://${dominio}` : ''
}

/**
 * Le manda al dueño el correo de ese cambio: lista, rechazada o fallida. Devuelve si salió. Nunca
 * lanza: corre después de que el chef ya tuvo su respuesta, y un correo que no sale no deshace el
 * cambio.
 */
export async function avisarDeLaComanda(comandaId: string, estado: AvisoDeComanda): Promise<boolean> {
  try {
    const db = getDb()
    const [fila] = await db
      .select({ motivo: comandas.motivo, correo: users.correo, tema: users.tema })
      .from(comandas)
      .innerJoin(users, eq(users.id, comandas.ownerId))
      .where(eq(comandas.id, comandaId))
    if (!fila) return false
    const para = destinatario(fila.correo ?? undefined)
    if (!para) return false
    const [principal] = await db
      .select({ nombre: insumos.nombre })
      .from(insumos)
      .where(and(eq(insumos.comandaId, comandaId), eq(insumos.tipo, 'principal')))
      .limit(1)
    const [{ n } = { n: 0 }] = await db
      .select({ n: count() })
      .from(creativos)
      .where(and(eq(creativos.comandaId, comandaId), eq(creativos.estado, 'mesa')))
    const correo = correoDeComanda(
      { id: comandaId, estado, principal: principal?.nombre ?? null, motivo: fila.motivo, enElMeson: n },
      sitio(),
      temaDe(fila.tema),
    )
    return await enviarAviso(para, correo)
  } catch (error) {
    console.error('No se pudo mandar el correo de la comanda:', String(error).slice(0, 300))
    return false
  }
}
