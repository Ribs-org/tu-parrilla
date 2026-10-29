import 'server-only'
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { getDb, postComments, scheduledPostTargets, socialAccounts, socialPosts } from '@/db'
import type { SocialAccount } from '@/db'
import { connectorFor } from '../index'
import { aplicarReglas } from './automatico'
import { comentaristaFor } from './index'
import { redactarPendientes, type RedaccionReport } from './redaccion'
import { MAX_AUTOMATICAS_POR_CORRIDA } from './reglas'
import {
  DIAS_VENTANA,
  estadoInicial,
  postsAsondear,
  respuestaDelDueno,
  seAcaboElTiempo,
  tocaSondear,
  unirPosts,
} from './ventana'

/**
 * Lo único que el dueño llega a leer de un sondeo fallido. El detalle de la red —que trae
 * el cuerpo crudo de Meta— se queda en el log del servidor y no viaja en la respuesta.
 */
export const SONDEO_FALLIDO = 'No se pudieron leer los comentarios de esta cuenta.'

/**
 * Cuántos fallos seguidos bastan para abandonar una cuenta en esta pasada: una cuenta a la
 * que todavía no le concedieron el permiso falla en todas sus publicaciones, y no vale la
 * pena gastarle veinte llamadas por pasada para confirmarlo.
 */
const MAX_FALLOS_SEGUIDOS = 3

export type SondeoReport = {
  cuentas: Array<{
    network: string
    handle: string | null
    posts: number
    /** Los comentarios que la red devolvió en esta pasada, nuevos o ya conocidos. */
    leidos: number
    nuevos: number
    /** Publicaciones que la red no dejó leer en esta pasada; las demás igual se sondearon. */
    salteados: number
    /** Comentarios que una regla de palabra clave respondió en el acto, en esta pasada. */
    automaticas: number
    /** Comentarios que el dueño ya había respondido desde la app de la red: salieron de la cola. */
    enLaRed: number
    error?: string
  }>
  /** Cuentas que el tope de tiempo dejó para la pasada siguiente; no es un fallo. */
  sinSondear: number
  /** Lo que la fase de redacción alcanzó a hacer en esta misma corrida. */
  redaccion: RedaccionReport
}

type Cuenta = { posts: number; leidos: number; nuevos: number; salteados: number; automaticas: number; enLaRed: number }

async function sondearCuenta(
  account: SocialAccount,
  now: Date,
  cupo: { restantes: number },
  inicio: number,
): Promise<Cuenta> {
  const vacio: Cuenta = { posts: 0, leidos: 0, nuevos: 0, salteados: 0, automaticas: 0, enLaRed: 0 }
  const comentarista = comentaristaFor(account.network)
  if (!comentarista) return vacio
  const db = getDb()

  // La credencial del comentarista cuando difiere de la de lectura, y si no la del
  // conector: el mismo molde que usa `attempt` en publish/run.ts.
  const ensure = comentarista.ensureCredential ?? connectorFor(account.network)?.ensureCredential
  const token = ensure ? await ensure(account) : null
  // Sin credencial no es un fallo: es una cuenta que el dueño desconectó, o una red
  // cuyo permiso nuevo todavía no autorizó. Se sale antes de tocar la red.
  if (!token) return vacio

  // Las publicaciones ya están en la base: la sincronización diaria las trajo. Y las que
  // el calendario publicó después del último sync también, con el id que la red devolvió
  // al publicar: sin ellas un post de hace diez minutos no entraría a la cola hasta mañana.
  const desde = new Date(now.getTime() - DIAS_VENTANA * 864e5)
  const [recientes, publicados] = await Promise.all([
    db
      .select({ externalId: socialPosts.externalId, publishedAt: socialPosts.publishedAt })
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.accountId, account.id),
          isNull(socialPosts.archivedAt),
          gte(socialPosts.publishedAt, desde),
        ),
      )
      .orderBy(desc(socialPosts.publishedAt)),
    // Lo que el sync ya archivó (borrado en la red) no vuelve por esta puerta. Las historias
    // tampoco: no tienen comentarios, y cada una que falla al listarlos suma a los tres fallos
    // seguidos que dejan sin mirar a los posts de verdad de la cuenta.
    db
      .select({ externalId: scheduledPostTargets.externalId, publishedAt: scheduledPostTargets.updatedAt })
      .from(scheduledPostTargets)
      .leftJoin(
        socialPosts,
        and(
          eq(socialPosts.accountId, scheduledPostTargets.accountId),
          eq(socialPosts.externalId, scheduledPostTargets.externalId),
        ),
      )
      .where(
        and(
          eq(scheduledPostTargets.accountId, account.id),
          eq(scheduledPostTargets.status, 'published'),
          isNotNull(scheduledPostTargets.externalId),
          gte(scheduledPostTargets.updatedAt, desde),
          isNull(socialPosts.archivedAt),
          isNull(sql`${scheduledPostTargets.opciones} -> 'historia'`),
        ),
      ),
  ])

  const ids = postsAsondear(
    unirPosts(
      recientes,
      publicados.flatMap((p) => (p.externalId ? [{ externalId: p.externalId, publishedAt: p.publishedAt }] : [])),
    ),
    now,
  )
  if (ids.length === 0) return vacio

  // Todos los comentarios ya conocidos de esta cuenta en esos posts, de una consulta:
  // preguntar por cada comentario sería una consulta por comentario y por pasada. Con su
  // estado, para saber cuáles siguen esperando en la cola.
  const conocidos = new Map(
    (
      await db
        .select({ externalId: postComments.externalId, state: postComments.state })
        .from(postComments)
        .where(and(eq(postComments.accountId, account.id), inArray(postComments.postExternalId, ids)))
    ).map((fila) => [fila.externalId, fila.state]),
  )

  let nuevos = 0
  let totalLeidos = 0
  let salteados = 0
  let automaticas = 0
  let enLaRed = 0
  let seguidos = 0
  for (const [i, postExternalId] of ids.entries()) {
    // Cada publicación va sola. Una borrada en la red sigue sin `archivedAt` hasta el sync
    // de la mañana, y con veinte o menos la rotación tampoco la esquiva: dejar que su
    // fallo saliera de acá dejaría a la cuenta sin descubrir nada por hasta un día entero.
    try {
      const leidos = await comentarista.listar(account, token, postExternalId)
      totalLeidos += leidos.length
      seguidos = 0

      // Lo que sigue en la cola y el dueño ya respondió desde la app de la red sale de ella,
      // para que no se le responda dos veces. En cada pasada, porque leer las respuestas no
      // cuesta una llamada más.
      for (const c of leidos) {
        const estado = conocidos.get(c.externalId)
        if (estado !== 'pendiente' && estado !== 'fallido') continue
        const suya = respuestaDelDueno(c.respuestas, account)
        if (!suya) continue
        const ahora = new Date()
        const movidos = await db
          .update(postComments)
          .set({ state: 'en_la_red', replyExternalId: suya.externalId, draft: suya.text, error: null, updatedAt: ahora })
          // Sigue esperando y nadie la está mandando: un envío en curso desde la cola escribe
          // su propio resultado, y esta escritura no lo pisa.
          .where(
            and(
              eq(postComments.accountId, account.id),
              eq(postComments.externalId, c.externalId),
              inArray(postComments.state, ['pendiente', 'fallido']),
              or(isNull(postComments.enviandoHasta), lt(postComments.enviandoHasta, ahora)),
            ),
          )
          .returning({ id: postComments.id })
        if (movidos.length > 0) {
          conocidos.set(c.externalId, 'en_la_red')
          enLaRed += 1
        }
      }

      const frescos = leidos.filter((c) => !conocidos.has(c.externalId))
      if (frescos.length === 0) continue

      // Con qué estado entra cada uno: el que el dueño ya respondió desde la red no entra a la cola.
      const entrada = new Map(
        frescos.map((c) => {
          const inicial = estadoInicial(c.authorExternalId, account.externalId)
          const suya = inicial === 'pendiente' ? respuestaDelDueno(c.respuestas, account) : null
          return [c.externalId, { state: suya ? ('en_la_red' as const) : inicial, suya }]
        }),
      )

      const insertados = await db
        .insert(postComments)
        .values(
          frescos.map((c) => ({
            accountId: account.id,
            network: account.network,
            postExternalId: c.postExternalId,
            externalId: c.externalId,
            author: c.author,
            authorExternalId: c.authorExternalId,
            text: c.text,
            publishedAt: c.publishedAt,
            state: entrada.get(c.externalId)!.state,
            replyExternalId: entrada.get(c.externalId)!.suya?.externalId ?? null,
            draft: entrada.get(c.externalId)!.suya?.text ?? null,
          })),
        )
        // Dos pasadas que se solapan verían los mismos comentarios; la unique decide y la
        // segunda no pisa nada.
        .onConflictDoNothing({ target: [postComments.accountId, postComments.externalId] })
        .returning({ id: postComments.id, externalId: postComments.externalId })
      const idPorExternal = new Map(insertados.map((f) => [f.externalId, f.id]))
      for (const c of frescos) conocidos.set(c.externalId, entrada.get(c.externalId)!.state)
      nuevos += frescos.length
      enLaRed += insertados.filter((f) => entrada.get(f.externalId)?.state === 'en_la_red').length

      const { respondidos } = await aplicarReglas(
        account,
        token,
        frescos.flatMap((c) => {
          const id = idPorExternal.get(c.externalId)
          return id
            ? [{ id, postExternalId: c.postExternalId, externalId: c.externalId, authorExternalId: c.authorExternalId, text: c.text, publishedAt: c.publishedAt, state: entrada.get(c.externalId)!.state }]
            : []
        }),
        cupo,
        inicio,
      )
      automaticas += respondidos
    } catch (error) {
      console.error(
        `[comentarios] ${account.network} ${postExternalId}:`,
        String(error).slice(0, 300),
      )
      salteados += 1
      seguidos += 1
      if (seguidos >= MAX_FALLOS_SEGUIDOS) {
        console.error(
          `[comentarios] ${account.network}: se abandona la cuenta en esta pasada tras ${seguidos} fallos seguidos.`,
        )
        // Las que quedaron sin mirar cuentan como salteadas, para que el reporte cuadre.
        salteados += ids.length - i - 1
        break
      }
    }
  }

  return { posts: ids.length, leidos: totalLeidos, nuevos, salteados, automaticas, enLaRed }
}

/**
 * Una pasada de descubrimiento. Corre dentro de la corrida de publicación, después de
 * publicar: el fallo de una cuenta no detiene a las demás, y ninguno detiene la corrida.
 */
export async function sondearComentarios(
  now: Date = new Date(),
  /** Desde cuándo corre la corrida que lo llama: su presupuesto se cuenta desde ahí, no desde acá. */
  inicio: number = Date.now(),
): Promise<SondeoReport> {
  const cuentas = await getDb()
    .select()
    .from(socialAccounts)
    .where(isNotNull(socialAccounts.accessToken))

  // A la que no le toca esta pasada se la salta acá: antes de pedirle credencial y antes
  // de preguntarle nada a la base. No lleva entrada en el reporte porque no es un fallo,
  // es que todavía no es su turno.
  const aSondear = cuentas.filter(
    (cuenta) => comentaristaFor(cuenta.network) && tocaSondear(cuenta.network, now),
  )
  const reporte: SondeoReport = {
    cuentas: [],
    sinSondear: 0,
    redaccion: { redactados: 0, fallidos: 0, sinPasarela: false },
  }
  // Compartido por toda la corrida: la primera cuenta no puede gastarse las veinte
  // automáticas de las que vienen después.
  const cupo = { restantes: MAX_AUTOMATICAS_POR_CORRIDA }
  // En serie, como la sincronización: la casa nunca pega concurrente contra Meta.
  for (const [i, cuenta] of aSondear.entries()) {
    // El tope por cuenta no acota la corrida: con varias cuentas son veinte llamadas por
    // cada una. Lo que queda se sondea en la pasada siguiente, y no es un fallo.
    if (seAcaboElTiempo(inicio, Date.now())) {
      reporte.sinSondear = aSondear.length - i
      break
    }
    const desdeCuenta = Date.now()
    try {
      const resultado = await sondearCuenta(cuenta, now, cupo, inicio)
      reporte.cuentas.push({ network: cuenta.network, handle: cuenta.handle, ...resultado })
      // Cuántas publicaciones miró y qué encontró: sin eso, «no llegó el comentario» no distingue
      // entre una publicación que no se miró y una red que no lo entregó.
      console.log(
        `[comentarios] ${cuenta.network} ${cuenta.handle ?? ''}: ${Date.now() - desdeCuenta} ms · ${resultado.posts} publicaciones · ${resultado.leidos} comentarios leídos · ${resultado.nuevos} nuevos ·${resultado.automaticas} automáticas`,
      )
    } catch (error) {
      // El detalle de la red se queda en el log: la respuesta del cron lleva una frase fija.
      console.error(`[comentarios] ${cuenta.network}:`, String(error).slice(0, 300))
      reporte.cuentas.push({
        network: cuenta.network,
        handle: cuenta.handle,
        posts: 0,
        nuevos: 0,
        salteados: 0,
        automaticas: 0,
        enLaRed: 0,
        error: SONDEO_FALLIDO,
      })
    }
  }
  const desdeRedaccion = Date.now()
  try {
    reporte.redaccion = await redactarPendientes(inicio)
    console.log(`[comentarios] redacción: ${Date.now() - desdeRedaccion} ms`)
  } catch (error) {
    // Publicar y descubrir mandan sobre redactar: si la fase entera revienta, la corrida
    // conserva lo que ya descubrió y los borradores esperan la pasada siguiente.
    console.error('[comentarios] redacción:', String(error).slice(0, 300))
  }
  return reporte
}
