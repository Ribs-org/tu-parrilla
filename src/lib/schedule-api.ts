// Pure pieces of GET /api/schedule/posts. The zone arrives as a parameter — this
// module must stay importable by vitest (no server-only imports).
import { isoInZone, parseRango } from '@/lib/metrics-api'
import { addDays, dayKey } from '@/lib/schedule-week'
import { TARGET_STATUSES, type TargetStatus } from '@/db/schema'
import type { Atributos } from '@/lib/social/publish/atributos'
import { enVuelo } from '@/lib/social/publish/publisher'

/**
 * La frase con la que el panel y `DELETE /api/schedule/posts/{id}` rechazan borrar un post
 * que ya salió. Borrar la fila no despublica nada en la red: se rechaza en vez de mentir.
 */
export const BORRADO_YA_PUBLICADO = 'Ya se publicó (o está publicando): elimínalo en la red.'

/**
 * Si los destinos de un post impiden borrarlo: basta uno publicado o publicando, o uno que
 * una corrida tiene entre manos ahora mismo (`reclamadoHasta` vigente): mientras dura su
 * intento sigue diciendo `scheduled`, y borrarlo dejaba el post saliendo sin nadie que lo
 * anotara. Un `failed` no impide nada —no salió—, y un post sin destinos tampoco.
 * Compartida por el panel y la API para que nunca se desacuerden.
 */
export function impideBorrar(
  targets: ReadonlyArray<{ status: string; reclamadoHasta?: Date | null }>,
  now: Date = new Date(),
): boolean {
  return targets.some(
    (t) =>
      t.status === 'published' ||
      t.status === 'publishing' ||
      enVuelo(t, now),
  )
}

/** Un calendario mira hacia adelante: sin parámetros, de hoy a 30 días. */
const DIAS_ADELANTE = 30

/**
 * La ventana del calendario en días de Chile, ambos inclusive. A diferencia de
 * `parseRango` (métricas, que mira hacia atrás), el default parte hoy y va hacia
 * adelante: lo que el editor quiere ver es la parrilla que viene. Devuelve también las
 * claves de día para que la respuesta diga qué ventana aplicó.
 */
export function parseVentana(
  desde: string | null,
  hasta: string | null,
  now: Date,
  zone: string,
): { from: Date; to: Date; desde: string; hasta: string } | { error: string } {
  const hoy = dayKey(now, zone)
  const desdeKey = desde ?? hoy
  // Sin `hasta`, 30 días desde el inicio pedido — no desde hoy — para que
  // «desde el 1» signifique el mes que empieza el 1.
  const hastaKey = hasta ?? (/^\d{4}-\d{2}-\d{2}$/.test(desdeKey) ? addDays(desdeKey, DIAS_ADELANTE) : desdeKey)
  const rango = parseRango(desdeKey, hastaKey, now, zone)
  if ('error' in rango) return rango
  return { ...rango, desde: desdeKey, hasta: hastaKey }
}

export const ESTADO_ERROR = '«estado» tiene que ser scheduled, publishing, published o failed.'

/**
 * El filtro `estado` del calendario: solo los posts con algún destino en ese estado, con todos
 * sus destinos. Sirve sobre todo para pedir lo quemado (`failed`) sin bajar el calendario
 * entero; por eso, con `estado` y sin `desde` ni `hasta`, no hay ventana de fechas.
 */
export function parseEstado(valor: string | null): { estado: TargetStatus | null } | { error: string } {
  if (valor === null || valor === '') return { estado: null }
  return (TARGET_STATUSES as readonly string[]).includes(valor) ? { estado: valor as TargetStatus } : { error: ESTADO_ERROR }
}

export type FilaProgramada = {
  post: {
    id: string
    caption: string
    scheduledAt: Date
    coverUrl: string | null
    atributos: unknown
    ref: string | null
  }
  target: {
    network: string
    status: string
    lastError: string | null
    externalId: string | null
    attemptCount: number
    reintentarDesde: Date | null
    accountId: string
    // Cuándo se archivó, si se quemó y alguien lo archivó (`archivar.ts`); null si no.
    archivadoEn?: Date | null
  }
  // De un `leftJoin` con `socialAccounts`: null si la cuenta ya no existe. El
  // identificador (`target.accountId`) sí sigue firme — es a la fila de destino a la
  // que pertenece, no a la cuenta — así que un destino huérfano no pierde su id, solo
  // su handle.
  handle: string | null
}

export type MediaProgramada = {
  postId: string
  blobUrl: string
  mediaType: 'image' | 'video'
  position: number
}

export type PostProgramadoApi = {
  id: string
  texto: string
  fecha: string
  portada: string | null
  media: Array<{ url: string; tipo: 'image' | 'video' }>
  atributos: Atributos | null
  // La `ref` con que llegó por `POST /api/schedule/batch`, o null: con ella se cruza un lote
  // reenviado contra lo que ya entró.
  ref: string | null
  redes: Array<{
    red: string
    estado: string
    error: string | null
    externalId: string | null
    intentos: number
    // Cuándo es el próximo intento de un destino que espera (tras un fallo, o por el tope
    // de Instagram); null si no espera nada más que su hora.
    proximoIntento: string | null
    // La superficie para descubrir identificadores de cuenta: `POST /api/schedule/batch`
    // los pide en `cuentas`, y este es el único lugar público donde se pueden leer.
    cuentaId: string
    handle: string | null
    // Un destino quemado que alguien archivó: sigue `failed` y con su error, pero ya no cuenta
    // en el resumen ni en «Se quemó».
    archivado: boolean
  }>
}

/**
 * Una fila por (post, red) del join → un post con su lista de redes. El orden de los
 * posts es el de llegada (el query ordena por fecha); la media va por `position`, que
 * es el orden del carrusel.
 */
export function armarProgramados(
  filas: FilaProgramada[],
  medias: MediaProgramada[],
  zone: string,
): PostProgramadoApi[] {
  const mediaPorPost = new Map<string, MediaProgramada[]>()
  for (const media of medias) {
    const lista = mediaPorPost.get(media.postId) ?? []
    lista.push(media)
    mediaPorPost.set(media.postId, lista)
  }

  const posts = new Map<string, PostProgramadoApi>()
  for (const { post, target, handle } of filas) {
    const entrada = posts.get(post.id) ?? {
      id: post.id,
      texto: post.caption,
      fecha: isoInZone(post.scheduledAt, zone),
      portada: post.coverUrl,
      media: (mediaPorPost.get(post.id) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((m) => ({ url: m.blobUrl, tipo: m.mediaType })),
      atributos: (post.atributos as Atributos | null) ?? null,
      ref: post.ref,
      redes: [],
    }
    entrada.redes.push({
      red: target.network,
      estado: target.status,
      error: target.lastError,
      externalId: target.externalId,
      intentos: target.attemptCount,
      proximoIntento:
        target.status === 'scheduled' && target.reintentarDesde ? isoInZone(target.reintentarDesde, zone) : null,
      cuentaId: target.accountId,
      handle,
      archivado: Boolean(target.archivadoEn),
    })
    posts.set(post.id, entrada)
  }
  return [...posts.values()]
}
