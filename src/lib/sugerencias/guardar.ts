import 'server-only'
import { and, asc, count, eq, gte, isNull, lt, or, sql } from 'drizzle-orm'
import { getDb, socialAccounts, sugerencias, type Usuario } from '@/db'
import { env } from '@/lib/env'
import {
  SUGERENCIA_TOPE,
  TOPE_DIARIO,
  cuerpoDelIssue,
  etiquetasDe,
  limpiarCommit,
  tituloDelIssue,
  validarSugerencia,
  type Contexto,
} from './formato'
import { SIN_TOKEN, type ClienteGithub } from './github'

// El libro de sugerencias contra la base: guardar primero y mandar después. Lo que la persona
// escribió queda en `sugerencias` antes de tocar GitHub, así que nada se pierde si GitHub falla
// o si todavía no hay token: queda pendiente y lo reintenta el cron diario
// (`/api/cron/sync-social`). La persona ve «recibido» igual, porque lo fue.

const DIA_MS = 24 * 60 * 60_000

/**
 * Cuánto se espera antes de volver a tomar una sugerencia que alguien ya está mandando. Es el
 * reclamo: el envío de recién escrita y el cron no pueden abrir dos issues de la misma.
 */
export const RECLAMO_MS = 5 * 60_000

/** De dónde llega: el panel con su ruta y su navegador, o la app con su versión. */
export type Origen = Pick<Contexto, 'origen' | 'pantalla' | 'navegador'>

/**
 * Guarda una sugerencia a nombre de quien la escribió, con sus metadatos. Revisa el texto y el
 * tope diario; no manda nada a GitHub: eso es `mandarSugerencia`, que quien llama corre
 * después de responder.
 */
export async function recibirSugerencia(
  usuario: Pick<Usuario, 'id' | 'rol' | 'zona' | 'tema'>,
  entrada: unknown,
  origen: Origen,
  ahora = new Date(),
): Promise<{ id: string } | { error: string }> {
  const valida = validarSugerencia(entrada)
  if ('error' in valida) return valida

  const db = getDb()
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(sugerencias)
    .where(and(eq(sugerencias.ownerId, usuario.id), gte(sugerencias.creadaEn, new Date(ahora.getTime() - DIA_MS))))
  if (total >= TOPE_DIARIO) return { error: SUGERENCIA_TOPE }

  const porRed = await db
    .select({ red: socialAccounts.network, total: count() })
    .from(socialAccounts)
    .where(eq(socialAccounts.ownerId, usuario.id))
    .groupBy(socialAccounts.network)

  const contexto: Contexto = {
    ...origen,
    zona: usuario.zona,
    modo: usuario.tema,
    cuentasPorRed: Object.fromEntries(porRed.map((r) => [r.red, r.total])),
    esAdmin: usuario.rol === 'admin',
    commit: limpiarCommit(env('VERCEL_GIT_COMMIT_SHA')),
  }
  const [fila] = await db
    .insert(sugerencias)
    .values({ ownerId: usuario.id, tipo: valida.tipo, texto: valida.texto, contexto, creadaEn: ahora })
    .returning({ id: sugerencias.id })
  return { id: fila!.id }
}

/** Una sugerencia que nadie está mandando: sin enviar, y sin un intento de hace menos de cinco minutos. */
function libre(ahora: Date) {
  return and(
    isNull(sugerencias.enviadaEn),
    or(isNull(sugerencias.intentadaEn), lt(sugerencias.intentadaEn, new Date(ahora.getTime() - RECLAMO_MS))),
  )
}

export type Resultado = 'enviada' | 'pendiente' | 'ocupada'

/**
 * Abre el issue de una sugerencia y anota su número. Primero la reclama —suma el intento y anota
 * la hora en una sola escritura que solo gana uno—: si otro la está mandando, o ya salió, no
 * hace nada (`ocupada`). Si GitHub falla, queda pendiente con el error, para el próximo cron.
 *
 * Si GitHub abre el issue y la respuesta se pierde en el camino, el reintento abre otro: un
 * duplicado es mejor que una sugerencia perdida.
 */
export async function mandarSugerencia(id: string, cliente: ClienteGithub | null, ahora = new Date()): Promise<Resultado> {
  const db = getDb()
  if (!cliente) {
    await db.update(sugerencias).set({ ultimoError: SIN_TOKEN }).where(and(eq(sugerencias.id, id), isNull(sugerencias.enviadaEn)))
    return 'pendiente'
  }
  const [fila] = await db
    .update(sugerencias)
    .set({ intentos: sql`${sugerencias.intentos} + 1`, intentadaEn: ahora })
    .where(and(eq(sugerencias.id, id), libre(ahora)))
    .returning()
  if (!fila) return 'ocupada'

  const datos = { ...fila, contexto: fila.contexto as Contexto }
  try {
    const issue = await cliente.crearIssue({
      titulo: tituloDelIssue(datos),
      cuerpo: cuerpoDelIssue(datos),
      etiquetas: etiquetasDe(fila.tipo),
    })
    await db
      .update(sugerencias)
      .set({ issueNumero: issue.numero, issueUrl: issue.url, enviadaEn: new Date(), ultimoError: null })
      .where(eq(sugerencias.id, id))
    return 'enviada'
  } catch (error) {
    await db
      .update(sugerencias)
      .set({ ultimoError: String(error instanceof Error ? error.message : error).slice(0, 500) })
      .where(eq(sugerencias.id, id))
    return 'pendiente'
  }
}

/**
 * Lo del cron: manda las que quedaron pendientes, de la más vieja a la más nueva, hasta `max`
 * por corrida. Sin token no toca nada y solo cuenta cuántas esperan.
 */
export async function reintentarSugerencias(
  cliente: ClienteGithub | null,
  ahora = new Date(),
  max = 25,
): Promise<{ enviadas: number; pendientes: number; sinToken: boolean }> {
  const filas = await getDb()
    .select({ id: sugerencias.id })
    .from(sugerencias)
    .where(libre(ahora))
    .orderBy(asc(sugerencias.creadaEn))
    .limit(max)
  if (!cliente) return { enviadas: 0, pendientes: filas.length, sinToken: true }

  let enviadas = 0
  let pendientes = 0
  for (const { id } of filas) {
    const resultado = await mandarSugerencia(id, cliente, ahora)
    if (resultado === 'enviada') enviadas += 1
    if (resultado === 'pendiente') pendientes += 1
  }
  return { enviadas, pendientes, sinToken: false }
}
