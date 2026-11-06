import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb, reglasClave, scheduledPostMedia, scheduledPostTargets, scheduledPosts } from '@/db'
import { columnasEditablesDeRegla, validarRegla, type ReglaLimpia } from '@/lib/social/comentarios/reglas'
import { CuentaInvalida, verificarCuentas, type CuentaDestino } from '@/lib/social/cuentas'
import type { MediaMovil } from '@/lib/mobile-api'
import { proximamentePara } from '@/lib/redes-abiertas'
import type { Atributos } from './atributos'
import { PORTADA_NEEDS_VIDEO, mediaToBlob, mediaTypeFromUrl, portadaExtensionError, portadaTypeError } from './batch'
import { diffMedia, diffTargets } from './edit'
import {
  HISTORIA_DESTINOS,
  errorDeHistoria,
  errorDeMediaPorOpciones,
  esHistoria,
  validarOpciones,
  type OpcionesDestino,
} from './opciones'
import { REARME, contenedorEsBorrador, enVuelo } from './publisher'
import { extensionDe, validateScheduleDraft } from './validate'

/** Lo que el editor dice cuando algún destino está saliendo: «Publicando…» o reclamado ahora. */
export const EN_CURSO = 'Hay una publicación en curso. Vuelve en un minuto.'
export const POST_NO_EXISTE = 'El post ya no existe.'
/**
 * Lo que dice la app del teléfono al tocar un post que ya salió en alguna cuenta: lo publicado
 * no cambia por editar la fila, y el editor del panel, que sí lo deja, muestra qué cuenta salió.
 */
export const YA_SALIO_EN_ALGUNA = 'Ya salió en alguna cuenta: lo que queda se corrige en el panel web.'

/** Lo que el que llama no toca: queda como está guardado. */
export const CONSERVAR = 'conservar' as const
type Conservar = typeof CONSERVAR

/**
 * Lo que se guarda de un post programado. `scheduledAt` ya viene resuelto (la zona la pone
 * quien llama); null es una fecha que no se entendió. `cuentas` son los ids de cuenta elegidos,
 * los publicados incluidos —el editor del panel los manda con su casilla bloqueada—.
 *
 * El panel manda todo; la app del teléfono, que solo edita el texto y la hora y quita cuentas,
 * manda `CONSERVAR` en lo demás, y eso queda tal como está guardado: los archivos, la portada,
 * los atributos y la palabra clave. Las opciones de cada destino (TikTok, el trial reel, la
 * historia) no las cambia ninguno de los dos: viven en el destino, y este no las toca.
 */
export type EdicionDePost = {
  caption: string
  /** `conservar`: la hora guardada, aunque ya haya pasado (corregir el texto de lo que falló). */
  scheduledAt: Conservar | Date | null
  /** Los ids de cuenta elegidos, o las de ahora menos los destinos de `quitar` (el teléfono). */
  cuentas: string[] | { quitar: string[] }
  /** Los archivos que siguen (ids, en su orden), los recién subidos ya revisados y los que llegan por URL. */
  media: Conservar | { kept: string[]; nuevos: MediaMovil[]; urls: string[] }
  /** `conservar`, la portada guardada que el formulario dice mantener; `nueva`, una URL para bajar. */
  portada: Conservar | { conservar: string; nueva: string }
  atributos: Conservar | Atributos | null
  /** La regla cruda del formulario, para `validarRegla`: `undefined` es «sin regla». */
  regla: Conservar | { cruda: unknown }
}

/**
 * Guarda los cambios de un post programado: la regla que comparten el editor del panel
 * (`updateScheduledPost`) y la app del teléfono (`PATCH /api/mobile/schedule/posts/{id}`), para
 * que no puedan divergir. Devuelve la frase del rechazo, o `ok`; repintar y volver es de quien
 * llama.
 *
 * `soloSinPublicar` es la reja del teléfono: rechaza el post que ya salió en alguna cuenta. El
 * panel no la pone: deja corregir el texto de lo que falta y la palabra clave de lo publicado.
 */
export async function editarPostProgramado(
  ownerId: string,
  postId: string,
  edicion: EdicionDePost,
  { soloSinPublicar = false }: { soloSinPublicar?: boolean } = {},
): Promise<{ error: string } | { ok: true }> {
  const db = getDb()

  const [post] = await db
    .select()
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.ownerId, ownerId)))
  if (!post) return { error: POST_NO_EXISTE }

  const targets = await db
    .select()
    .from(scheduledPostTargets)
    .where(eq(scheduledPostTargets.postId, postId))
  // En curso es `publishing`, o un destino que una corrida tiene reclamado ahora mismo
  // (`enVuelo`): durante su intento sigue diciendo `scheduled`.
  const ahora = new Date()
  if (targets.some((t) => t.status === 'publishing' || enVuelo(t, ahora))) {
    return { error: EN_CURSO }
  }
  if (soloSinPublicar && targets.some((t) => t.status === 'published')) {
    return { error: YA_SALIO_EN_ALGUNA }
  }
  // Un reclamo que ocurra entre esta lectura y los writes de abajo también bumpa updatedAt:
  // este mapa es lo que lo hace visible ahí —si el cron reclamó, el write no-opea y el target
  // conserva su historia en vez de que la pisemos—.
  const readTargets = new Map(targets.map((t) => [t.id, t]))

  const existingMedia = await db
    .select()
    .from(scheduledPostMedia)
    .where(eq(scheduledPostMedia.postId, postId))
    .orderBy(asc(scheduledPostMedia.position))

  const { caption } = edicion
  const scheduledAt = edicion.scheduledAt === CONSERVAR ? post.scheduledAt : edicion.scheduledAt
  // Quitar destinos es elegir las cuentas de los demás: el teléfono no suma cuentas, y un id que
  // no es de este post no quita nada.
  const quitar = Array.isArray(edicion.cuentas) ? null : new Set(edicion.cuentas.quitar)
  const idsElegidos = Array.isArray(edicion.cuentas)
    ? edicion.cuentas
    : targets.filter((t) => !quitar!.has(t.id)).map((t) => t.accountId)
  const publicadas = new Set(targets.filter((t) => t.status === 'published').map((t) => t.accountId))
  // Las publicadas no se verifican: no se va a escribir ni publicar nada nuevo con
  // ellas, y verificarlas es lo que convertía una cuenta desconectada *después* de
  // publicar en un post que ya no se puede volver a tocar (ni el texto, ni la fecha,
  // ni la media) — el gemelo oculto del checkbox las manda igual, pero su pertenencia
  // ya la probó ser destino de este post, que ya se acotó al dueño arriba.
  let cuentasPendientes: CuentaDestino[]
  try {
    cuentasPendientes = await verificarCuentas(
      ownerId,
      idsElegidos.filter((id) => !publicadas.has(id)),
    )
  } catch (error) {
    if (error instanceof CuentaInvalida) return { error: error.message }
    throw error
  }
  const idsElegidosSet = new Set(idsElegidos)
  // Su red sale del target, no de una consulta: no hace falta verificarlas de nuevo
  // para saber a qué red pertenecen.
  const cuentasPublicadasElegidas: CuentaDestino[] = targets
    .filter((t) => t.status === 'published' && idsElegidosSet.has(t.accountId))
    .map((t) => ({ id: t.accountId, network: t.network, handle: null }))
  const cuentas = [...cuentasPendientes, ...cuentasPublicadasElegidas]

  // Conservar los archivos es mantenerlos todos, en el orden en que están.
  const { kept: keptIds, nuevos, urls } =
    edicion.media === CONSERVAR ? { kept: existingMedia.map((m) => m.id), nuevos: [], urls: [] } : edicion.media
  // Conservar la portada es mantener la guardada, sin una nueva.
  const { conservar: keepPortada, nueva: portadaUrl } =
    edicion.portada === CONSERVAR ? { conservar: post.coverUrl ?? '', nueva: '' } : edicion.portada
  const atributos = edicion.atributos === CONSERVAR ? (post.atributos as Atributos | null) : edicion.atributos

  // Editar un post cuya hora ya pasó (p.ej. corregir el texto que X rechazó) no debe
  // exigir mover la fecha: si la fecha no cambió, se permite guardar en el pasado — el
  // re-arm lo manda al próximo cron, el "reintenta ahora" natural.
  const dateUnchanged = scheduledAt !== null && scheduledAt.getTime() === post.scheduledAt.getTime()

  // Una cuenta ya publicada no debe imponer sus límites a lo que aún queda por salir:
  // `cuentasPendientes` ya las excluye, al no haber pasado por la verificación de arriba.
  const pendingNetworks = [...new Set(cuentasPendientes.map((c) => c.network))]

  const targetsPlan = diffTargets(targets, cuentas)
  if ('error' in targetsPlan) return { error: targetsPlan.error }

  // Una red que exige opciones no se puede agregar desde el editor, que no las pide:
  // el compositor y el lote sí; aquí la creación se rechaza con la misma frase.
  for (const cuenta of targetsPlan.create) {
    const check = validarOpciones(cuenta.network, null)
    if ('error' in check) return { error: check.error }
  }
  // Por lo mismo, a una historia no se le suma una cuenta: saldría como post normal.
  if (targetsPlan.create.length > 0 && targets.some((t) => esHistoria(t.opciones))) {
    return { error: HISTORIA_DESTINOS }
  }

  // Conservar la regla es no tocarla: solo hace falta saber si hay una, para la regla de
  // las historias, que no llevan palabra clave.
  let regla: ReglaLimpia | null = null
  let conPalabraClave: boolean
  if (edicion.regla === CONSERVAR) {
    const guardadas = await db
      .select({ postId: reglasClave.postId })
      .from(reglasClave)
      .where(eq(reglasClave.postId, postId))
    conPalabraClave = guardadas.length > 0
  } else {
    const reglaCheck = validarRegla(edicion.regla.cruda)
    if ('error' in reglaCheck) return { error: reglaCheck.error }
    regla = reglaCheck.regla
    conPalabraClave = regla !== null
  }

  // Pre-validation before downloading anything: kept media with their stored types, the new
  // uploads with the type the upload signed, URLs counted as images — the batch's
  // deferred-type rule (image is the guess that never falsely rejects; the re-check below
  // settles it).
  const typeById = new Map(existingMedia.map((m) => [m.id, m.mediaType]))
  const urlById = new Map(existingMedia.map((m) => [m.id, m.blobUrl]))
  const keptTypes = keptIds
    .map((id) => typeById.get(id))
    .filter((t): t is 'image' | 'video' => t === 'image' || t === 'video')
  const fileVideo = nuevos.filter((m) => m.mediaType === 'video').length
  const preImages =
    keptTypes.filter((t) => t === 'image').length + (nuevos.length - fileVideo) + urls.length
  const preVideos = keptTypes.filter((t) => t === 'video').length + fileVideo
  // Igual que arriba con los tipos: la extensión conocida de cada media pendiente,
  // para que TikTok rechace un formato ajeno antes de tocar el almacén.
  const preFormats = [
    ...keptIds
      .map((id) => urlById.get(id))
      .filter((url): url is string => Boolean(url))
      .map(extensionDe),
    ...nuevos.map((m) => extensionDe(m.url)),
    ...urls.map(extensionDe),
  ]
  if (pendingNetworks.length === 0) {
    // Sin pendientes hay dos casos: todo publicado (válido — solo se corrige texto o
    // media) o un form que desmarcó todas las redes de un post nunca publicado, lo
    // que dejaría un post huérfano sin destinos. El validador saltado habría dicho
    // exactamente esto:
    if (publicadas.size === 0) return { error: 'Elige al menos una cuenta.' }
    // Igual exige una fecha legible antes de persistir.
    if (!scheduledAt) return { error: 'La fecha no se entendió.' }
  } else {
    const preError = validateScheduleDraft(
      {
        caption,
        imageCount: preImages,
        videoCount: preVideos,
        networks: pendingNetworks,
        scheduledAt,
        formats: preFormats,
      },
      new Date(),
      { allowPast: dateUnchanged, proximamente: proximamentePara(ownerId) },
    )
    if (preError) return { error: preError }
  }

  if (portadaUrl) {
    const extensionError = portadaExtensionError(portadaUrl)
    if (extensionError) return { error: extensionError }
  }

  // Las URLs se resuelven primero: mediaToBlob es la falla más probable (enlace roto,
  // host que no responde). Si falla acá, no quedan archivos huérfanos en el almacén
  // — el loop de guardar() de archivos corre después, solo si las URLs ya resolvieron.
  const urlMedia: Array<{ url: string; mediaType: 'image' | 'video' }> = []
  for (const url of urls) {
    const stored = await mediaToBlob(url, mediaTypeFromUrl(url))
    if (!stored) return { error: 'No se pudo leer una media por URL.' }
    urlMedia.push(stored)
  }
  const added = [...nuevos, ...urlMedia]

  const mediaPlan = diffMedia(existingMedia.map((m) => m.id), keptIds, added)

  // Re-check with the real types now that every URL resolved (a Drive link that
  // turned out to be a video where only images fit fails here, nothing saved).
  const finalTypes = mediaPlan.order.map((entry) =>
    entry.kind === 'kept' ? typeById.get(entry.id)! : entry.mediaType,
  )
  const finalFormats = mediaPlan.order.map((entry) =>
    extensionDe(entry.kind === 'kept' ? urlById.get(entry.id)! : entry.url),
  )
  if (pendingNetworks.length > 0) {
    const error = validateScheduleDraft(
      {
        caption,
        imageCount: finalTypes.filter((t) => t === 'image').length,
        videoCount: finalTypes.filter((t) => t === 'video').length,
        networks: pendingNetworks,
        scheduledAt,
        formats: finalFormats,
      },
      new Date(),
      { allowPast: dateUnchanged, proximamente: proximamentePara(ownerId) },
    )
    if (error) return { error }

    // El editor no deja tocar `opciones` (spec §9), pero sí la media: un trial reel
    // programado con un video puede terminar aquí con dos fotos si nadie repite la
    // regla. Las opciones vienen de los targets ya existentes que siguen elegidos y
    // todavía no publicaron — los que de verdad van a usar esta media al publicar —,
    // tipadas con `validarOpciones` porque en la base son `unknown`/`jsonb`.
    const opcionesDeTargets: Record<string, OpcionesDestino> = {}
    for (const target of targets) {
      if (target.status === 'published' || !idsElegidosSet.has(target.accountId)) continue
      const check = validarOpciones(target.network, target.opciones)
      if ('opciones' in check && check.opciones) opcionesDeTargets[target.id] = check.opciones
    }
    const mediaPorOpciones = errorDeMediaPorOpciones(opcionesDeTargets, {
      videos: finalTypes.filter((t) => t === 'video').length,
      fotos: finalTypes.filter((t) => t === 'image').length,
      sinTipo: 0,
    })
    if (mediaPorOpciones) return { error: mediaPorOpciones }

    const historia = errorDeHistoria(opcionesDeTargets, {
      caption,
      conPalabraClave,
      conPortada: Boolean(portadaUrl) || (Boolean(keepPortada) && keepPortada === post.coverUrl),
      aInstagram: pendingNetworks.includes('instagram'),
      fotos: finalTypes.flatMap((t, i) => (t === 'image' ? [finalFormats[i]!] : [])),
    })
    if (historia) return { error: historia }
  }

  // Conservar solo coteja contra lo guardado — el mismo trato que keptMedia con sus
  // ids: el form dice «mantén lo que hay», nunca dicta una URL cruda.
  const portadaKept = Boolean(keepPortada) && keepPortada === post.coverUrl

  // El chequeo de video corre ANTES de descargar/subir la portada nueva — igual que en
  // el lote (batch.ts): si el resultado ya es una portada sin video, no vale la pena
  // pagar esa descarga. El video de un post que ya salió en todas sus redes cuenta aunque
  // ya no esté en el almacén (`videosLiberados`): sin eso, el editor de cualquier post
  // publicado con portada rechazaba guardar, con la portada que el mismo editor conservó.
  if ((portadaUrl || portadaKept) && !finalTypes.includes('video') && post.videosLiberados === 0) {
    return { error: PORTADA_NEEDS_VIDEO }
  }

  // La URL nueva gana sobre la conservada; ninguna de las dos = quitarla (null).
  let coverUrl: string | null = portadaKept ? keepPortada : null
  if (portadaUrl) {
    const stored = await mediaToBlob(portadaUrl, null)
    if (!stored) return { error: 'No se pudo leer una media por URL.' }
    const typeError = portadaTypeError(stored)
    if (typeError) return { error: typeError }
    coverUrl = stored.url
  }

  // Qué pasa con un contenedor guardado (el de un intento anterior), que lleva lo de antes. Si
  // cambiaron los archivos —cuáles o en qué orden—, ya no es este post en ninguna red: se tira.
  // Si cambió solo el texto o la portada, se tira en Instagram, donde el contenedor es un
  // borrador que todavía no salió (`contenedorEsBorrador`); en las demás la red ya tiene el
  // video, y subirlo otra vez por un texto dejaría dos.
  const mediaCambio =
    mediaPlan.deleteIds.length > 0 ||
    mediaPlan.order.some((entry, i) => entry.kind === 'new' || entry.id !== existingMedia[i]?.id)
  const textoCambio = caption !== post.caption || coverUrl !== post.coverUrl
  const tiraContenedor = (network: string) => mediaCambio || (textoCambio && contenedorEsBorrador(network))

  // Las escrituras van en una transacción: un corte a la mitad —la base que no contesta, la
  // función que se cae— ya no deja la media nueva con los destinos de antes, ni el texto nuevo
  // sin su regla. Adentro, lo primero es bloquear los destinos del post (`FOR UPDATE`) y volver
  // a mirar que nada esté saliendo: una corrida que reclamó uno entre la lectura de arriba y acá
  // se ve ahora, y una que quiera reclamarlo espera a que esto termine —y relee el texto después
  // de reclamar (`publishDue`)—. Cada escritura de un destino sigue llevando su reja de estado y
  // el `updatedAt` leído arriba (`readTargets`), así que un reclamo que ya pasó la deja sin
  // efecto en vez de pisar el intento.
  const bloqueo = await db.transaction(async (tx) => {
    const bloqueados = await tx
      .select({ status: scheduledPostTargets.status, reclamadoHasta: scheduledPostTargets.reclamadoHasta })
      .from(scheduledPostTargets)
      .where(eq(scheduledPostTargets.postId, postId))
      .for('update')
    if (bloqueados.some((t) => t.status === 'publishing' || enVuelo(t, new Date()))) return EN_CURSO
    // El teléfono: una corrida que publicó entre la lectura de arriba y este bloqueo.
    if (soloSinPublicar && bloqueados.some((t) => t.status === 'published')) return YA_SALIO_EN_ALGUNA

    await tx
      .update(scheduledPosts)
      .set({ caption, scheduledAt: scheduledAt!, coverUrl, atributos, updatedAt: new Date() })
      .where(eq(scheduledPosts.id, postId))

    if (mediaPlan.deleteIds.length > 0) {
      await tx.delete(scheduledPostMedia).where(inArray(scheduledPostMedia.id, mediaPlan.deleteIds))
    }
    for (const [position, entry] of mediaPlan.order.entries()) {
      if (entry.kind === 'kept') {
        await tx.update(scheduledPostMedia).set({ position }).where(eq(scheduledPostMedia.id, entry.id))
      } else {
        await tx.insert(scheduledPostMedia).values({
          postId,
          blobUrl: entry.url,
          mediaType: entry.mediaType,
          position,
        })
      }
    }

    if (targetsPlan.create.length > 0) {
      await tx.insert(scheduledPostTargets).values(
        targetsPlan.create.map((cuenta) => ({
          postId,
          network: cuenta.network,
          accountId: cuenta.id,
        })),
      )
    }
    for (const id of targetsPlan.deleteIds) {
      await tx.delete(scheduledPostTargets).where(
        and(
          eq(scheduledPostTargets.id, id),
          inArray(scheduledPostTargets.status, ['scheduled', 'failed']),
          eq(scheduledPostTargets.updatedAt, readTargets.get(id)!.updatedAt),
        ),
      )
    }
    for (const id of targetsPlan.rearmIds) {
      // El rearme conserva el contenedor (`REARME`): el intento siguiente le pregunta a la red
      // cómo terminó el anterior antes de subir nada. Salvo que lo de antes ya no sirva
      // (`tiraContenedor`, arriba).
      const tirar = tiraContenedor(readTargets.get(id)!.network)
      await tx
        .update(scheduledPostTargets)
        .set({ ...REARME, ...(tirar ? { containerId: null } : {}), updatedAt: new Date() })
        .where(
          and(
            eq(scheduledPostTargets.id, id),
            eq(scheduledPostTargets.status, 'failed'),
            eq(scheduledPostTargets.updatedAt, readTargets.get(id)!.updatedAt),
          ),
        )
    }
    // Lo mismo para un destino que espera su reintento con su contenedor guardado (el tope
    // diario de Instagram, una publicación que no contestó): con lo de antes inservible, se tira y
    // el intento siguiente arma otro con lo de ahora. Si la publicación que no contestó sí había
    // salido, sale otra con lo nuevo: pasa solo si se edita en el rato entre dos intentos, y lo
    // contrario —publicar lo viejo— sería peor.
    if (mediaCambio || textoCambio) {
      for (const target of targets) {
        if (target.status !== 'scheduled' || !target.containerId) continue
        if (!idsElegidosSet.has(target.accountId) || !tiraContenedor(target.network)) continue
        await tx
          .update(scheduledPostTargets)
          .set({ containerId: null, publicandoDesde: null, updatedAt: new Date() })
          .where(
            and(
              eq(scheduledPostTargets.id, target.id),
              eq(scheduledPostTargets.status, 'scheduled'),
              eq(scheduledPostTargets.updatedAt, readTargets.get(target.id)!.updatedAt),
            ),
          )
      }
    }

    // La regla se edita siempre, incluso publicado el post: rige para los comentarios que
    // lleguen desde ahora. Palabra vacía la borra. Conservada (el teléfono), no se toca.
    if (edicion.regla === CONSERVAR) return null
    if (regla) {
      await tx
        .insert(reglasClave)
        .values({ postId, ...regla })
        .onConflictDoUpdate({
          target: reglasClave.postId,
          // Solo las columnas que este editor administra (palabra, mensaje, respuesta
          // pública): un `set` con la regla entera pisaría `documentoUrl` con `null` en
          // cada guardado, aunque la regla se haya creado por API con su PDF. Ver
          // `columnasEditablesDeRegla`.
          set: { ...columnasEditablesDeRegla(regla), updatedAt: new Date() },
        })
    } else {
      await tx.delete(reglasClave).where(eq(reglasClave.postId, postId))
    }

    return null
  })
  if (bloqueo) return { error: bloqueo }
  return { ok: true }
}
