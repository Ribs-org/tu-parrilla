import 'server-only'
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import { getDb, postComments, reglasClave, scheduledPostTargets } from '@/db'
import type { SocialAccount } from '@/db'
import { env } from '@/lib/env'
import { COMENTARIO_AUSENTE, PRIVADO_RECHAZADO, RED_RECHAZO } from './comentarista'
import { comentaristaFor } from './index'
import { reclamarEnvio } from './reclamo'
import { mandarPrivado, privadoActivo } from './privado'
import { decidirAutomatica, type ReglaLimpia } from './reglas'
import { seAcaboElTiempo } from './ventana'

/**
 * El host del sitio propio, para etiquetar el enlace del mensaje. `SITE_URL` si el dueño
 * la puso; si no, el dominio de producción que Vercel inyecta; sin ninguno, null y el
 * enlace va sin etiqueta.
 */
export function hostDelSitio(): string | null {
  const crudo = env('SITE_URL') ?? env('VERCEL_PROJECT_PRODUCTION_URL')
  if (!crudo) return null
  try {
    return new URL(crudo.startsWith('http') ? crudo : `https://${crudo}`).hostname
  } catch {
    return null
  }
}

/** Las reglas de los posts de una cuenta, por id de red del post. */
export async function reglasPara(accountId: string, postExternalIds: string[]): Promise<Map<string, ReglaLimpia>> {
  const mapa = new Map<string, ReglaLimpia>()
  if (postExternalIds.length === 0) return mapa
  const filas = await getDb()
    .select({
      externalId: scheduledPostTargets.externalId,
      palabra: reglasClave.palabra,
      mensaje: reglasClave.mensaje,
      respuestaPublica: reglasClave.respuestaPublica,
      documentoUrl: reglasClave.documentoUrl,
    })
    .from(reglasClave)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, reglasClave.postId))
    .where(
      and(eq(scheduledPostTargets.accountId, accountId), inArray(scheduledPostTargets.externalId, postExternalIds)),
    )
  for (const f of filas) {
    if (f.externalId)
      mapa.set(f.externalId, {
        palabra: f.palabra,
        mensaje: f.mensaje,
        respuestaPublica: f.respuestaPublica,
        documentoUrl: f.documentoUrl,
      })
  }
  return mapa
}

/**
 * Todas las reglas de la cuenta, por id de red del post, sin filtrar por un lote de posts.
 * La usa `aplicarReglas` para saber qué posts tienen regla antes de buscar los comentarios
 * rezagados (los que el cupo o el reloj dejaron `pendiente` en una corrida anterior).
 */
export async function reglasDeCuenta(accountId: string): Promise<Map<string, ReglaLimpia>> {
  const mapa = new Map<string, ReglaLimpia>()
  const filas = await getDb()
    .select({
      externalId: scheduledPostTargets.externalId,
      palabra: reglasClave.palabra,
      mensaje: reglasClave.mensaje,
      respuestaPublica: reglasClave.respuestaPublica,
      documentoUrl: reglasClave.documentoUrl,
    })
    .from(reglasClave)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, reglasClave.postId))
    .where(and(eq(scheduledPostTargets.accountId, accountId), isNotNull(scheduledPostTargets.externalId)))
  for (const f of filas) {
    if (f.externalId)
      mapa.set(f.externalId, {
        palabra: f.palabra,
        mensaje: f.mensaje,
        respuestaPublica: f.respuestaPublica,
        documentoUrl: f.documentoUrl,
      })
  }
  return mapa
}

type Nuevo = {
  id: string
  postExternalId: string
  externalId: string
  authorExternalId: string | null
  text: string
  publishedAt: Date
  state: string
}

/**
 * Responde en el acto los comentarios que dicen la palabra clave de su post: los recién
 * insertados de esta pasada del sondeo (`nuevos`), y también los rezagados — comentarios
 * `pendiente` y sin `automatico` de una pasada anterior que el cupo (`cupo.restantes`) o
 * el reloj (`seAcaboElTiempo`) dejaron sin tomar. Sin esta segunda fuente un comentario
 * rezagado nunca vuelve a aparecer en `nuevos` (la pasada siguiente lo trae como
 * `conocido`, no como insertado) y queda huérfano: ni la regla lo toma de nuevo ni
 * `redactarPendientes` lo redacta, porque coincide con una regla y ella lo salta a
 * propósito. Corre dentro del sondeo, con el token que el sondeo ya consiguió. Con el privado
 * encendido para el dueño (`privadoActivo`), la respuesta pública es la corta y el mensaje con
 * el enlace va por privado, una sola vez por persona en cada post: Meta deja uno por comentario,
 * y a quien comenta dos veces la palabra le basta con uno. `cupo.restantes` es compartido por
 * toda la corrida.
 */
export async function aplicarReglas(
  account: SocialAccount,
  token: string,
  nuevos: Nuevo[],
  cupo: { restantes: number },
  inicio: number,
): Promise<{ respondidos: number; fallidos: number }> {
  const resultado = { respondidos: 0, fallidos: 0 }
  if (cupo.restantes <= 0) return resultado
  const comentarista = comentaristaFor(account.network)
  if (!comentarista) return resultado
  // Solo la credencial del propio comentarista escribe; si no tiene una propia, la del
  // sondeo (que viene del conector) es la misma que usaría el dueño al responder a mano.
  const tokenEscritura = comentarista.ensureCredential ? await comentarista.ensureCredential(account) : token
  if (!tokenEscritura) return resultado

  const reglas = await reglasDeCuenta(account.id)
  if (reglas.size === 0) return resultado
  const db = getDb()

  const frescos = nuevos.filter((n) => n.state === 'pendiente' && reglas.has(n.postExternalId))
  const rezagados = await db
    .select({
      id: postComments.id,
      postExternalId: postComments.postExternalId,
      externalId: postComments.externalId,
      authorExternalId: postComments.authorExternalId,
      text: postComments.text,
      publishedAt: postComments.publishedAt,
      state: postComments.state,
    })
    .from(postComments)
    .where(
      and(
        eq(postComments.accountId, account.id),
        eq(postComments.state, 'pendiente'),
        eq(postComments.automatico, false),
        inArray(postComments.postExternalId, [...reglas.keys()]),
      ),
    )
    .orderBy(desc(postComments.publishedAt))
    .limit(cupo.restantes)

  // Los frescos primero: son los que este sondeo acaba de ver, y si uno quedara repetido
  // en ambas listas (recién insertado y ya `pendiente`) su versión fresca es la buena.
  const vistos = new Set<string>()
  const candidatos: Nuevo[] = []
  for (const c of [...frescos, ...rezagados]) {
    if (vistos.has(c.id)) continue
    vistos.add(c.id)
    candidatos.push(c)
  }
  if (candidatos.length === 0) return resultado

  const sitioHost = hostDelSitio()
  const now = new Date()
  const conPrivado = privadoActivo(account.ownerId)

  for (const c of candidatos) {
    if (cupo.restantes <= 0 || seAcaboElTiempo(inicio, Date.now())) break
    const regla = reglas.get(c.postExternalId)
    if (!regla) continue

    const plan = decidirAutomatica({
      texto: c.text,
      esPropio: false,
      yaRecibioPrivado: conPrivado && (await yaRecibioPrivado(account.id, c.postExternalId, c.authorExternalId)),
      network: account.network,
      publishedAt: c.publishedAt,
      now,
      privadoEncendido: conPrivado,
      regla,
      sitioHost,
    })
    if (plan.accion === 'ignorar') continue
    // Reclamado antes de mandar: dos sondeos encimados, o el dueño respondiendo a mano a la
    // vez, mandarían dos respuestas públicas al mismo comentario.
    if (!(await reclamarEnvio(c.id))) continue

    cupo.restantes -= 1
    try {
      const replyId = await comentarista.responder(account, tokenEscritura, c.externalId, plan.publico)
      await db
        .update(postComments)
        .set({
          state: 'enviado',
          replyExternalId: replyId,
          draft: plan.publico,
          error: null,
          automatico: true,
          enviandoHasta: null,
          updatedAt: new Date(),
        })
        // El dueño pudo responder a mano mientras esto corría: si la fila ya no está
        // `pendiente`, esta escritura no la pisa.
        .where(and(eq(postComments.id, c.id), eq(postComments.state, 'pendiente')))
      resultado.respondidos += 1
      if (plan.privado) await mandarYAnotar(account, tokenEscritura, c, plan.privado)
    } catch (error) {
      console.error(`[comentarios] automática ${account.network}:`, String(error).slice(0, 300))
      const borrado = error instanceof Error && error.message === COMENTARIO_AUSENTE
      await db
        .update(postComments)
        .set({
          state: borrado ? 'descartado' : 'fallido',
          error: borrado ? COMENTARIO_AUSENTE : RED_RECHAZO,
          draft: plan.publico,
          automatico: true,
          enviandoHasta: null,
          updatedAt: new Date(),
        })
        // Mismo resguardo: un fallo de la red no debe pisar una respuesta que el dueño
        // ya mandó a mano.
        .where(and(eq(postComments.id, c.id), eq(postComments.state, 'pendiente')))
      resultado.fallidos += 1
    }
  }
  return resultado
}

/**
 * Si quien comentó ya recibió el privado de este post: comentar la palabra dos veces no le
 * manda el enlace dos veces. Sin autor conocido no se puede saber, y se le manda.
 */
async function yaRecibioPrivado(accountId: string, postExternalId: string, autor: string | null): Promise<boolean> {
  if (!autor) return false
  const [fila] = await getDb()
    .select({ id: postComments.id })
    .from(postComments)
    .where(
      and(
        eq(postComments.accountId, accountId),
        eq(postComments.postExternalId, postExternalId),
        eq(postComments.authorExternalId, autor),
        eq(postComments.dmState, 'enviado'),
      ),
    )
    .limit(1)
  return fila !== undefined
}

/**
 * El privado de la regla, después de la respuesta pública que ya salió. Su fallo no deshace esa
 * respuesta: queda anotado en la fila (`dm_state`) y se ve en La Mesa.
 */
async function mandarYAnotar(account: SocialAccount, token: string, c: Nuevo, texto: string): Promise<void> {
  let dmState: 'enviado' | 'fallido' = 'enviado'
  try {
    await mandarPrivado(account, token, c.externalId, texto)
  } catch (error) {
    console.error(`[comentarios] privado automático ${account.network}:`, String(error).slice(0, 300))
    dmState = 'fallido'
  }
  await getDb()
    .update(postComments)
    .set({ dmState, dmError: dmState === 'fallido' ? PRIVADO_RECHAZADO : null, updatedAt: new Date() })
    .where(eq(postComments.id, c.id))
}
