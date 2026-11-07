import 'server-only'
import { and, count, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { getDb, sugerencias, users, type TipoSugerencia, type Usuario } from '@/db'
import { enviarCorreo } from '@/lib/correo'
import { dominioProducto } from '@/lib/dominios'
import { avisoDeRespuesta } from '@/lib/push/avisos'
import { avisarAlTelefono } from '@/lib/push/enviar'
import { temaDe } from '@/lib/tema'
import type { ClienteGithub } from './github'
import { SOLO_EL_ADMIN, SUGERENCIA_NO_EXISTE, comentarioDeRespuesta, correoDeRespuesta, type Cual } from './respuestas'

// La respuesta del equipo contra la base. Dos lados:
//
// - El del equipo (`sugerenciasParaElEquipo`, `responderSugerencia`): ve las de todos y escribe
//   en cualquiera. Es lo único del libro que cruza dueños, y por eso solo lo llama quien ya
//   comprobó que es el admin —la pantalla Las Sugerencias y `POST /api/sugerencias/respuesta`—,
//   y `responderSugerencia` lo comprueba otra vez.
// - El de la persona (`misSugerencias`, `respuestasSinLeer`, `marcarRespuestaLeida`): cada
//   consulta va atada a su dueño, como todo lo demás (`src/lib/aislamiento.test.ts`).
//
// Guardar la respuesta y avisar van por separado: el correo, el aviso al teléfono y el comentario
// del issue salen después de responder (`avisarDeLaRespuesta`, en un `after`), y si fallan la
// respuesta ya quedó.

/** Lo que Las Sugerencias muestra de cada una. */
export type SugerenciaDelEquipo = {
  id: string
  tipo: TipoSugerencia
  texto: string
  creadaEn: Date
  origen: 'panel' | 'telefono' | null
  issueNumero: number | null
  issueUrl: string | null
  correo: string
  nombre: string | null
  respuesta: string | null
  respondidaEn: Date | null
  respondidaPor: string | null
  respuestaLeidaEn: Date | null
}

/** Hasta cuántas muestra la pantalla de una vez: las más nuevas. */
export const LIMITE_DEL_EQUIPO = 200

/** Todas, de la más nueva a la más vieja, con quién las escribió y quién respondió. Solo para el admin. */
export async function sugerenciasParaElEquipo(
  { sinResponder = false }: { sinResponder?: boolean } = {},
  limite = LIMITE_DEL_EQUIPO,
): Promise<SugerenciaDelEquipo[]> {
  const respondedor = alias(users, 'respondedor')
  const filas = await getDb()
    .select({
      id: sugerencias.id,
      tipo: sugerencias.tipo,
      texto: sugerencias.texto,
      creadaEn: sugerencias.creadaEn,
      contexto: sugerencias.contexto,
      issueNumero: sugerencias.issueNumero,
      issueUrl: sugerencias.issueUrl,
      correo: users.correo,
      nombre: users.nombre,
      respuesta: sugerencias.respuesta,
      respondidaEn: sugerencias.respondidaEn,
      respondidaPorNombre: respondedor.nombre,
      respondidaPorCorreo: respondedor.correo,
      respuestaLeidaEn: sugerencias.respuestaLeidaEn,
    })
    .from(sugerencias)
    .innerJoin(users, eq(users.id, sugerencias.ownerId))
    .leftJoin(respondedor, eq(respondedor.id, sugerencias.respondidaPor))
    .where(sinResponder ? isNull(sugerencias.respuesta) : undefined)
    .orderBy(desc(sugerencias.creadaEn))
    .limit(limite)
  return filas.map(({ contexto, respondidaPorNombre, respondidaPorCorreo, ...f }) => {
    const origen = (contexto as { origen?: unknown }).origen
    return {
      ...f,
      origen: origen === 'panel' || origen === 'telefono' ? origen : null,
      respondidaPor: respondidaPorNombre ?? respondidaPorCorreo ?? null,
    }
  })
}

export type Respondida = {
  id: string
  issue: number | null
  /** Que no tenía respuesta: es la vez que sale el correo. */
  primera: boolean
  /** Que el texto cambió. Igual al que ya tenía, no se toca nada ni se avisa. */
  cambio: boolean
}

/**
 * Guarda la respuesta del equipo en una sugerencia, buscada por su id o por el número de su
 * issue. Si cambia el texto, vuelve a quedar sin leer. No avisa a nadie: eso es
 * `avisarDeLaRespuesta`, que quien llama corre después de responder.
 */
export async function responderSugerencia(
  admin: Pick<Usuario, 'id' | 'rol'>,
  cual: Cual,
  texto: string,
  ahora = new Date(),
): Promise<Respondida | { error: string; status: 403 | 404 }> {
  if (admin.rol !== 'admin') return { error: SOLO_EL_ADMIN, status: 403 }
  const db = getDb()
  const [fila] = await db
    .select({ id: sugerencias.id, issue: sugerencias.issueNumero, respuesta: sugerencias.respuesta })
    .from(sugerencias)
    .where('id' in cual ? eq(sugerencias.id, cual.id) : eq(sugerencias.issueNumero, cual.issue))
    .orderBy(desc(sugerencias.creadaEn))
    .limit(1)
  if (!fila) return { error: SUGERENCIA_NO_EXISTE, status: 404 }
  if (fila.respuesta === texto) return { id: fila.id, issue: fila.issue, primera: false, cambio: false }
  await db
    .update(sugerencias)
    .set({ respuesta: texto, respondidaEn: ahora, respondidaPor: admin.id, respuestaLeidaEn: null })
    .where(eq(sugerencias.id, fila.id))
  return { id: fila.id, issue: fila.issue, primera: fila.respuesta === null, cambio: true }
}

/** El origen del panel para el enlace del correo; sin dominio del producto, el correo va sin enlace. */
function sitio(): string {
  const dominio = dominioProducto()
  return dominio ? `https://${dominio}` : ''
}

/**
 * Le avisa a la persona y deja la respuesta en el issue. El correo sale solo la primera vez: una
 * respuesta corregida le aparece sin leer en el libro, sin otro correo. El comentario sale cada vez
 * que cambia, si la sugerencia ya tiene su issue y hay token. Nunca lanza: corre después de
 * responder, y lo que no sale no deshace la respuesta.
 */
export async function avisarDeLaRespuesta(
  id: string,
  primera: boolean,
  cliente: ClienteGithub | null,
): Promise<{ correo: boolean; comentario: boolean }> {
  const salio = { correo: false, comentario: false }
  let fila
  try {
    ;[fila] = await getDb()
      .select({
        texto: sugerencias.texto,
        creadaEn: sugerencias.creadaEn,
        respuesta: sugerencias.respuesta,
        issue: sugerencias.issueNumero,
        correo: users.correo,
        nombre: users.nombre,
        zona: users.zona,
        tema: users.tema,
        ownerId: sugerencias.ownerId,
      })
      .from(sugerencias)
      .innerJoin(users, eq(users.id, sugerencias.ownerId))
      .where(eq(sugerencias.id, id))
  } catch (error) {
    console.error('No se pudo leer la sugerencia para avisar de la respuesta:', String(error).slice(0, 300))
    return salio
  }
  if (!fila?.respuesta) return salio

  if (primera) {
    const respuesta = fila.respuesta
    // El aviso al teléfono sale con el correo, también solo la primera vez. No lanza.
    ;[salio.correo] = await Promise.all([
      enviarCorreo({
        to: fila.correo,
        ...correoDeRespuesta({ ...fila, respuesta }, sitio(), temaDe(fila.tema)),
      }),
      avisarAlTelefono(fila.ownerId, (tema) => avisoDeRespuesta({ id, respuesta }, tema)),
    ])
  }
  if (fila.issue !== null && cliente) {
    try {
      await cliente.comentarIssue(fila.issue, comentarioDeRespuesta(fila.respuesta, { cambiada: !primera, nombre: fila.nombre }))
      salio.comentario = true
    } catch (error) {
      console.error('No se pudo comentar la respuesta en el issue:', String(error).slice(0, 300))
    }
  }
  return salio
}

/** Lo que la persona ve en el libro de cada cosa que escribió. */
export type MiSugerencia = {
  id: string
  tipo: TipoSugerencia
  texto: string
  creadaEn: Date
  respuesta: string | null
  respondidaEn: Date | null
  respuestaLeidaEn: Date | null
}

/** Cuántas le muestra el libro: las más nuevas. Con cinco al día, son semanas. */
export const LIMITE_DEL_LIBRO = 50

/** Lo que escribió una persona, de lo más nuevo a lo más viejo, con lo que le respondimos. */
export async function misSugerencias(ownerId: string, limite = LIMITE_DEL_LIBRO): Promise<MiSugerencia[]> {
  return getDb()
    .select({
      id: sugerencias.id,
      tipo: sugerencias.tipo,
      texto: sugerencias.texto,
      creadaEn: sugerencias.creadaEn,
      respuesta: sugerencias.respuesta,
      respondidaEn: sugerencias.respondidaEn,
      respuestaLeidaEn: sugerencias.respuestaLeidaEn,
    })
    .from(sugerencias)
    .where(eq(sugerencias.ownerId, ownerId))
    .orderBy(desc(sugerencias.creadaEn))
    .limit(limite)
}

/** Cuántas respuestas suyas esperan que las lea: el punto del botón de Ajustes. */
export async function respuestasSinLeer(ownerId: string): Promise<number> {
  const [{ total } = { total: 0 }] = await getDb()
    .select({ total: count() })
    .from(sugerencias)
    .where(and(isNotNull(sugerencias.respuesta), isNull(sugerencias.respuestaLeidaEn), eq(sugerencias.ownerId, ownerId)))
  return total
}

/**
 * La persona abrió la respuesta: deja de estar sin leer. El id llega del navegador o del
 * teléfono, así que va atado al dueño: nadie marca como leída la respuesta de otro. Devuelve si
 * cambió algo.
 */
export async function marcarRespuestaLeida(ownerId: string, id: string, ahora = new Date()): Promise<boolean> {
  const filas = await getDb()
    .update(sugerencias)
    .set({ respuestaLeidaEn: ahora })
    .where(
      and(
        eq(sugerencias.id, id),
        isNotNull(sugerencias.respuesta),
        isNull(sugerencias.respuestaLeidaEn),
        eq(sugerencias.ownerId, ownerId),
      ),
    )
    .returning({ id: sugerencias.id })
  return filas.length > 0
}
