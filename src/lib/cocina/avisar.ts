import { and, count, eq } from 'drizzle-orm'
import { comandas, creativos, getDb, insumos, preguntas, users } from '@/db'
import { dominioProducto } from '@/lib/dominios'
import { destinatario, enviarAviso } from '@/lib/social/publish/alert'
import { avisoDeComanda, avisoDePregunta } from '@/lib/push/avisos'
import { avisarAlTelefono } from '@/lib/push/enviar'
import { temaDe } from '@/lib/tema'
import { leerAjuste } from '@/lib/ajustes'
import {
  CLAVE_CORREOS_DE_LA_COCINA,
  correoDeComanda,
  correoDePregunta,
  correosApagados,
  type AvisoDeComanda,
} from './correo-de-comanda'
import { siNoContestas } from './pregunta'

// Los correos al dueño de una comanda. El de una entrega o un final —la primera tanda, lista,
// rechazada o fallida— lo pide la ruta del chef (`/api/cocina/comandas/{id}/estado`) después de
// responder, y solo cuando `cambiarEstado` dice que ese cambio lo debe (`aviso`): la que escribió
// la transición es una sola petición, así que el correo sale una vez por cambio aunque el chef
// reintente o mande dos a la vez. El dueño los puede apagar en Tu Cuenta. El de cuando el
// chef pregunta, igual: lo pide `/api/cocina/comandas/{id}/preguntas` solo si esa llamada hizo la
// pregunta, y no un reintento.
//
// Sale con el remitente de los avisos (`enviarAviso`, `PUBLISH_ALERT_FROM`), como la publicación
// que se quemó y la cuenta que se cayó. Si Resend falla, no se reintenta: la tarjeta de La Cocina
// dice el estado igual. Reintentarlo sin arriesgar un segundo correo pide marcarlo en la comanda
// (`docs/deuda-tecnica.md`, «El correo de la comanda no se reintenta»).
//
// Al lado de cada correo sale el aviso al teléfono (`src/lib/push/enviar.ts`), con la misma regla:
// una vez, sin reintento. Sale aunque el dueño no tenga correo, y su fallo no toca el del correo.

/** El origen del panel para el enlace del correo; sin dominio del producto, la ruta sola. */
function sitio(): string {
  const dominio = dominioProducto()
  return dominio ? `https://${dominio}` : ''
}

/**
 * Lo que dijo el chef en el cambio que avisa, tal como quedó escrito: lo trae la ruta y no se lee
 * de nuevo, porque el correo sale después de responder y para entonces el chef ya puede haber
 * mandado la tanda siguiente, con otro mensaje y otro «2 de 5».
 */
export type DelCambio = {
  asunto?: string | null
  mensaje?: string | null
  tandas?: { servidas: number; total: number | null }
}

/**
 * Le manda al dueño el correo de ese cambio —la primera tanda, lista, rechazada o fallida— con el
 * asunto que haya mandado el chef. Devuelve si salió. Si el dueño los apagó en Tu Cuenta, no sale
 * (y devuelve false), pero el aviso al teléfono sí. Nunca lanza: corre después de que el chef ya
 * tuvo su respuesta, y un correo que no sale no deshace el cambio.
 */
export async function avisarDeLaComanda(comandaId: string, estado: AvisoDeComanda, delCambio: DelCambio = {}): Promise<boolean> {
  try {
    const db = getDb()
    const [fila] = await db
      .select({ motivo: comandas.motivo, correo: users.correo, tema: users.tema, ownerId: comandas.ownerId })
      .from(comandas)
      .innerJoin(users, eq(users.id, comandas.ownerId))
      .where(eq(comandas.id, comandaId))
    if (!fila) return false
    const apagados = correosApagados(await leerAjuste(fila.ownerId, CLAVE_CORREOS_DE_LA_COCINA))
    const para = apagados ? undefined : destinatario(fila.correo ?? undefined)
    const [principal] = await db
      .select({ nombre: insumos.nombre })
      .from(insumos)
      .where(and(eq(insumos.comandaId, comandaId), eq(insumos.tipo, 'principal')))
      .limit(1)
    const [{ n } = { n: 0 }] = await db
      .select({ n: count() })
      .from(creativos)
      .where(and(eq(creativos.comandaId, comandaId), eq(creativos.estado, 'mesa')))
    const comanda = {
      id: comandaId,
      estado,
      principal: principal?.nombre ?? null,
      motivo: fila.motivo,
      mensaje: delCambio.mensaje ?? null,
      asunto: delCambio.asunto ?? null,
      enElMeson: n,
      tandas: estado === 'sirviendo' ? delCambio.tandas : undefined,
    }
    const [salio] = await Promise.all([
      para ? enviarAviso(para, correoDeComanda(comanda, sitio(), temaDe(fila.tema))) : Promise.resolve(false),
      avisarAlTelefono(fila.ownerId, (tema) => avisoDeComanda(comanda, tema)),
    ])
    return salio
  } catch (error) {
    console.error('No se pudo mandar el correo de la comanda:', String(error).slice(0, 300))
    return false
  }
}

/**
 * Le manda al dueño el correo de una pregunta del chef, con el plazo dicho en su zona. Devuelve si
 * salió. Nunca lanza, como el de arriba: el chef ya tuvo su respuesta.
 */
export async function avisarDeLaPregunta(preguntaId: string, ahora: Date = new Date()): Promise<boolean> {
  try {
    const db = getDb()
    const [fila] = await db
      .select({ pregunta: preguntas, correo: users.correo, zona: users.zona })
      .from(preguntas)
      .innerJoin(users, eq(users.id, preguntas.ownerId))
      .where(eq(preguntas.id, preguntaId))
    if (!fila) return false
    const para = destinatario(fila.correo ?? undefined)
    const p = fila.pregunta
    const [principal] = await db
      .select({ nombre: insumos.nombre })
      .from(insumos)
      .where(and(eq(insumos.comandaId, p.comandaId), eq(insumos.tipo, 'principal')))
      .limit(1)
    const correo = correoDePregunta(
      {
        principal: principal?.nombre ?? null,
        texto: p.texto,
        opciones: p.opciones ?? null,
        siNoContestas: siNoContestas(p.plazo, p.porDefecto, ahora, fila.zona),
      },
      sitio(),
    )
    const [salio] = await Promise.all([
      para ? enviarAviso(para, correo) : Promise.resolve(false),
      avisarAlTelefono(p.ownerId, () => avisoDePregunta({ comandaId: p.comandaId, principal: principal?.nombre ?? null, texto: p.texto })),
    ])
    return salio
  } catch (error) {
    console.error('No se pudo mandar el correo de la pregunta:', String(error).slice(0, 300))
    return false
  }
}
