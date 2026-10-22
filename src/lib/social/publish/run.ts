import { and, asc, eq, inArray, isNull, lt, lte, ne, or, sql } from 'drizzle-orm'
import {
  borradorMedia,
  getDb,
  scheduledPostMedia,
  scheduledPosts,
  scheduledPostTargets,
  socialAccounts,
  users,
} from '@/db'
import { REDES_PROXIMAMENTE, fraseProximamente } from '@/lib/networks'
import { CONNECTORS } from '@/lib/social'
import { PUBLISHERS } from './index'
import { borrar } from '@/lib/storage'
import {
  MAX_PUBLISH_ATTEMPTS,
  NO_PUBLISH_TOKEN,
  alcanzaElTiempo,
  type Plazos,
  PUBLICACION_CORTADA,
  PUBLISH_NETWORK_ERROR,
  RECLAMO_MS,
  STALE_PROCESSING,
  isStaleProcessing,
  mediaParaBorrar,
  resolveOutcome,
  type PublishOutcome,
} from './publisher'
import { sendFailureAlert } from './alert'
import { MOTIVOS_DE_CONEXION } from './conexion'
import type { OpcionesDestino } from './opciones'
import { marcarCaida } from '@/lib/avisos/run'

export type Report = {
  published: number
  processing: number
  retried: number
  deferred: number
  failed: number
  /** Destinos vencidos que esta corrida no alcanzó a empezar: los toma la siguiente. */
  sinTiempo: number
}

/**
 * One cron run: advance every due target one step. Sequential on purpose — the volume
 * is one person's calendar, and the connectors already taught us that low concurrency
 * against Meta is the cheap way to never meet a 429.
 *
 * `soloPost` es el botón «Subir ahora» del calendario: restringe la corrida a los destinos
 * de ese post y no mira la hora, para publicar antes de lo programado. Pasa por aquí y no
 * por un camino propio a propósito — así hereda el reclamo de fila, los reintentos, el
 * aviso al dueño y, sobre todo, las opciones guardadas de cada destino. Tampoco mira la
 * espera entre intentos (`reintentarDesde`): quien aprieta el botón quiere el intento ahora.
 */
export async function publishDue(
  now: Date = new Date(),
  soloPost?: string,
  /** Los plazos de la corrida (ver el cron); sin ellos, todo lo vencido se intenta. */
  plazos?: Plazos,
): Promise<Report> {
  const db = getDb()
  const report: Report = { published: 0, processing: 0, retried: 0, deferred: 0, failed: 0, sinTiempo: 0 }
  const correoPorOwner = new Map<string, string | undefined>()

  const due = await db
    .select({ target: scheduledPostTargets, post: scheduledPosts })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .where(
      soloPost
        ? and(
            eq(scheduledPosts.id, soloPost),
            inArray(scheduledPostTargets.status, ['scheduled', 'publishing']),
          )
        : or(
            and(
              eq(scheduledPostTargets.status, 'scheduled'),
              lte(scheduledPosts.scheduledAt, now),
              or(isNull(scheduledPostTargets.reintentarDesde), lte(scheduledPostTargets.reintentarDesde, now)),
            ),
            eq(scheduledPostTargets.status, 'publishing'),
          ),
    )
    .orderBy(asc(scheduledPosts.scheduledAt))

  for (const { target, post } of due) {
    let outcome: PublishOutcome

    // Sin tiempo para un intento entero: lo que queda lo toma la corrida siguiente. Empezar
    // uno que no alcanza a terminar es peor que no empezarlo: la red pudo recibirlo y nadie
    // anota el resultado.
    if (plazos && !alcanzaElTiempo(target, plazos, Date.now())) {
      report.sinTiempo++
      continue
    }

    // El reclamo: hasta `reclamo`, este destino es de esta corrida. Dos corridas pueden
    // cruzarse —el respaldo diario de Vercel cae encima del pinger, o «Subir ahora» encima
    // del cron—, y sin el reclamo la segunda leía el destino a mitad del intento de la
    // primera y lo publicaba otra vez. El `updatedAt` leído sigue en el `where` para que
    // quien escribió el destino entre la lectura y acá (el editor, otra corrida que ya
    // terminó) gane. Un intento nuevo se cuenta al reclamarlo y no al terminar: si la corrida
    // muere a la mitad, ese intento ya quedó gastado, y tres cortes seguidos lo queman
    // (`PUBLICACION_CORTADA`) en vez de reintentarlo para siempre.
    const reclamo = new Date(Date.now() + RECLAMO_MS)
    const esIntento = target.status === 'scheduled'
    const claimed = await db
      .update(scheduledPostTargets)
      .set({
        reclamadoHasta: reclamo,
        updatedAt: now,
        ...(esIntento ? { attemptCount: sql`${scheduledPostTargets.attemptCount} + 1` } : {}),
      })
      .where(
        and(
          eq(scheduledPostTargets.id, target.id),
          eq(scheduledPostTargets.updatedAt, target.updatedAt),
          or(isNull(scheduledPostTargets.reclamadoHasta), lt(scheduledPostTargets.reclamadoHasta, now)),
        ),
      )
      .returning({ id: scheduledPostTargets.id })
    if (claimed.length === 0) continue

    if (esIntento && target.attemptCount >= MAX_PUBLISH_ATTEMPTS) {
      // Un destino `scheduled` con los intentos ya gastados solo llega acá si las corridas
      // murieron a la mitad del intento: `resolveOutcome` lo habría quemado.
      outcome = { kind: 'failed', reason: PUBLICACION_CORTADA, definitivo: true }
    } else if (target.status === 'publishing' && isStaleProcessing(target.publicandoDesde ?? post.scheduledAt, now)) {
      // Veinticuatro horas desde que entró a `publishing` (las filas de antes de la columna
      // se miden desde la hora del post). Definitivo y con su contenedor: la red ya recibió el
      // video, y reintentarlo desde cero subiría una copia más. Que se vuelva a intentar lo
      // decide el dueño, reprogramándolo.
      outcome = {
        kind: 'failed',
        reason: STALE_PROCESSING,
        definitivo: true,
        ...(target.containerId ? { containerId: target.containerId } : {}),
      }
    } else {
      // El texto y la portada se releen ahora, después del reclamo: la lista de vencidos de
      // arriba puede tener minutos, y el editor pudo cambiarlos en el medio. Su transacción
      // bloquea los destinos mientras escribe, así que lo que se lee acá ya es lo guardado.
      const [vigente] = await db
        .select({ caption: scheduledPosts.caption, coverUrl: scheduledPosts.coverUrl })
        .from(scheduledPosts)
        .where(eq(scheduledPosts.id, post.id))
      outcome = await attempt(target, target.id, post.id, target.containerId, {
        caption: target.captionOverride ?? vigente?.caption ?? post.caption,
        coverUrl: vigente ? vigente.coverUrl : post.coverUrl,
        opciones: (target.opciones as OpcionesDestino | null) ?? null,
      })
    }

    const patch = resolveOutcome(outcome, target.attemptCount, now)
    // `publishing` guarda desde cuándo; un reintento que conserva su contenedor también (es
    // el mismo intento de publicar); lo demás lo limpia.
    const publicandoDesde =
      patch.status === 'publishing' ? (target.publicandoDesde ?? now) : patch.containerId ? target.publicandoDesde : null
    // Solo si el reclamo sigue siendo de esta corrida: si venció y otra lo tomó, el resultado
    // de esa manda, y pisarlo devolvería a la fila algo que ya salió.
    const escrito = await db
      .update(scheduledPostTargets)
      .set({ ...patch, publicandoDesde, reclamadoHasta: null, updatedAt: now })
      .where(and(eq(scheduledPostTargets.id, target.id), eq(scheduledPostTargets.reclamadoHasta, reclamo)))
      .returning({ id: scheduledPostTargets.id })
    if (escrito.length === 0) {
      console.error(
        `[publicar] No se anotó el resultado del destino ${target.id} (${patch.status}): su reclamo venció y otra corrida lo tomó, o el destino ya no existe.`,
      )
      continue
    }

    // La cuenta perdió la conexión o el permiso: eso es de la cuenta, no de este post. Se
    // anota en la cuenta desde el primer intento, para que el correo de la caída salga ya
    // (`vigilarConexiones`, después de esta corrida) y no recién cuando el post se queme.
    const deConexion = outcome.kind === 'failed' && MOTIVOS_DE_CONEXION.has(outcome.reason) ? outcome.reason : null
    if (deConexion) await marcarCaida(target.accountId, deConexion)

    if (patch.status === 'published') {
      report.published++
      await limpiarMedia(post.id)
    } else if (patch.status === 'publishing') report.processing++
    else if (patch.status === 'scheduled') {
      // Mismo attemptCount que antes = la red pidió esperar (deferred): no es un reintento.
      if (patch.attemptCount === target.attemptCount) report.deferred++
      else report.retried++
    } else {
      report.failed++
      // Una cuenta caída avisa una vez por cuenta, no una por post: trece posts de una
      // cuenta de TikTok desconectada eran trece correos con la misma frase. El que sí
      // llega es el de la caída; estos posts quedan en el resumen del día.
      if (deConexion) continue
      // Al dueño del post, no al del despliegue: el fallo es de su publicación. El correo no
      // puede tumbar la corrida: el destino ya quedó anotado, y lo que viene detrás en la
      // fila tiene que salir igual.
      try {
        let correoDueno: string | undefined
        if (post.ownerId) {
          if (!correoPorOwner.has(post.ownerId)) {
            correoPorOwner.set(post.ownerId, await correoDelDueno(post.ownerId))
          }
          correoDueno = correoPorOwner.get(post.ownerId)
        }
        await sendFailureAlert(correoDueno, post.caption, target.network, patch.lastError ?? '')
      } catch (error) {
        console.error(`[publicar] No se pudo avisar el fallo del destino ${target.id}:`, String(error).slice(0, 300))
      }
    }
  }

  return report
}

/** El correo del dueño del post, para la alerta de fallo. Undefined si no existe la fila del dueño (post sin adoptar). */
async function correoDelDueno(ownerId: string): Promise<string | undefined> {
  const [fila] = await getDb().select({ correo: users.correo }).from(users).where(eq(users.id, ownerId)).limit(1)
  return fila?.correo ?? undefined
}

/**
 * Devuelve al almacenamiento el espacio del video cuando el post ya salió en todas
 * sus redes. Se llama tras cada destino publicado porque solo entonces puede haberse
 * completado el último; la regla de qué borrar vive en `mediaParaBorrar`.
 *
 * Falla en silencio a propósito: no poder borrar un archivo no es motivo para
 * arruinar una publicación que sí funcionó. Un archivo que no se pudo borrar queda en R2
 * hasta el barrido de huérfanos (`storage-gc.ts`) o a mano: el post publicado no vuelve a
 * pasar por acá.
 *
 * El archivo se deja en R2 si otro post o un borrador todavía lo usa: la misma dirección
 * puede estar en dos filas (un borrador que se programó dos veces, una dirección copiada a
 * otro post), y borrarla dejaría al otro sin su video antes de que salga. La fila de este
 * post se va igual.
 *
 * La fila se va con su video, y el post se queda con la cuenta (`videosLiberados`): es
 * lo único que dice que llevaba un video, y el corte se dibuja con ella. Van en una
 * transacción para que no quede una sin la otra, y la cuenta sube solo si la fila
 * todavía estaba: si dos pasadas se cruzan, la segunda no borra nada y no cuenta dos veces.
 */
async function limpiarMedia(postId: string): Promise<void> {
  try {
    const db = getDb()
    const [targets, media] = await Promise.all([
      db
        .select({ status: scheduledPostTargets.status })
        .from(scheduledPostTargets)
        .where(eq(scheduledPostTargets.postId, postId)),
      db.select().from(scheduledPostMedia).where(eq(scheduledPostMedia.postId, postId)),
    ])

    for (const item of mediaParaBorrar(targets, media)) {
      const [enOtroPost] = await db
        .select({ id: scheduledPostMedia.id })
        .from(scheduledPostMedia)
        .where(and(eq(scheduledPostMedia.blobUrl, item.blobUrl), ne(scheduledPostMedia.postId, postId)))
        .limit(1)
      const [enUnBorrador] = await db
        .select({ id: borradorMedia.id })
        .from(borradorMedia)
        .where(eq(borradorMedia.blobUrl, item.blobUrl))
        .limit(1)
      if (!enOtroPost && !enUnBorrador) await borrar(item.blobUrl)
      await db.transaction(async (tx) => {
        const borradas = await tx
          .delete(scheduledPostMedia)
          .where(eq(scheduledPostMedia.id, item.id))
          .returning({ id: scheduledPostMedia.id })
        if (borradas.length === 0) return
        await tx
          .update(scheduledPosts)
          .set({ videosLiberados: sql`${scheduledPosts.videosLiberados} + 1` })
          .where(eq(scheduledPosts.id, postId))
      })
    }
  } catch (error) {
    console.error('No se pudo liberar la media publicada:', String(error).slice(0, 300))
  }
}

async function attempt(
  target: { network: string; accountId: string },
  targetId: string,
  postId: string,
  containerId: string | null,
  content: { caption: string; coverUrl: string | null; opciones: OpcionesDestino | null },
): Promise<PublishOutcome> {
  const db = getDb()
  const network = target.network
  // Threads y X dicen «Próximamente» (`REDES_PROXIMAMENTE`): un destino viejo a una de ellas
  // no va a salir por reintentar, así que se quema en el primer intento y con su frase, en vez
  // de gastar tres y mandar el correo de una red que nunca respondió.
  if (REDES_PROXIMAMENTE.has(network)) return { kind: 'failed', reason: fraseProximamente(network), definitivo: true }
  const publisher = PUBLISHERS.find((p) => p.network === network)
  if (!publisher) return { kind: 'failed', reason: NO_PUBLISH_TOKEN }
  // The publisher's own credential wins: YouTube reads with an API key but writes
  // with OAuth, and the read connector must not learn about writing.
  const connector = CONNECTORS.find((c) => c.network === network)
  const ensure = publisher.ensureCredential ?? connector?.ensureCredential
  if (!ensure) return { kind: 'failed', reason: NO_PUBLISH_TOKEN }

  try {
    // Por la cuenta del destino: con dos páginas de Facebook, la red no dice cuál. Dentro del
    // try: un tropiezo de la base acá tumbaba la corrida entera después de reclamar.
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, target.accountId))

    // Dentro del try: renovar el token es una llamada a la red (el refresco de TikTok lanza
    // con un 5xx), y una que lanzaba acá tumbaba la corrida entera, con todo lo que venía
    // detrás en la fila sin publicar.
    const token = account ? await ensure(account) : null
    if (!token || !account?.externalId) return { kind: 'failed', reason: NO_PUBLISH_TOKEN }

    const media = await db
      .select()
      .from(scheduledPostMedia)
      .where(eq(scheduledPostMedia.postId, postId))
      .orderBy(asc(scheduledPostMedia.position))

    return await publisher.publish({
      caption: content.caption,
      media: media.map((m) => ({ url: m.blobUrl, mediaType: m.mediaType, position: m.position })),
      containerId,
      token,
      accountExternalId: account.externalId,
      coverUrl: content.coverUrl,
      opciones: content.opciones,
      cuenta: account.handle,
    })
  } catch (error) {
    // A publisher that throws (network hiccup, DNS, a timeout) is a retryable failure, not
    // a crash of the whole run. El contenedor que el destino ya tenía sigue con él: tirarlo
    // haría que el reintento suba el video desde cero aunque la red ya lo tenga.
    console.error(`Falló publicar el destino ${targetId}:`, error)
    return { kind: 'failed', reason: PUBLISH_NETWORK_ERROR, ...(containerId ? { containerId } : {}) }
  }
}
