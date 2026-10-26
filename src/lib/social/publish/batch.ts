import { fromZonedInput } from '@/lib/utils'
import { extensionDe, validateScheduleDraft } from './validate'
import { validateAtributos } from './atributos'
import {
  validarOpcionesPorCuenta,
  errorDeHistoria,
  errorDeMediaPorOpciones,
  HISTORIA_MEDIA,
  MAX_HISTORIAS_SECUENCIA,
  OPCIONES_ERROR,
  type OpcionesDestino,
} from './opciones'
import { basePublica, guardar, keyDesdeUrl, objetoEnAlmacen } from '@/lib/storage'
import { ARCHIVO_MUY_GRANDE, MAX_BYTES_ARCHIVO } from './limites'
import { getDb, scheduledPosts, scheduledPostMedia, scheduledPostTargets, reglasClave } from '@/db'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { CuentaInvalida, cuentaUnicaPorRed, verificarCuentas, type CuentaDestino } from '../cuentas'
import { validarRegla, REGLA_DOCUMENTO } from '../comentarios/reglas'
import { descargarSeguro, leerConTope, TOPE_POR_DEFECTO_MS, type MotivoDeDescarga } from './descarga-segura'
import { Cupo, enParalelo } from './concurrencia'
import { documentoToBlob } from './documento'
import { esChoqueCon } from '@/lib/choque-de-unicidad'
import { buscarPorId } from '@/lib/usuarios'
import { ZONA_POR_DEFECTO } from '@/lib/zona'

/**
 * Parse a fecha string (YYYY-MM-DD HH:MM format) to a Date in the owner's timezone.
 * Returns null if the date cannot be parsed.
 */
function parseFecha(fecha: string, zone: string): Date | null {
  // fromZonedInput slices to 16 chars, which would silently discard a Z or seconds
  // an API caller sent — reinterpreting their UTC instant as the owner's wall-clock time.
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(fecha.trim())) return null
  const isoDateTime = fecha.replace(' ', 'T')
  return fromZonedInput(isoDateTime, zone)
}

export type BatchItem = {
  fecha: string
  texto: string
  /** Identificadores de cuenta elegidos como destino. Si hay alguno, manda sobre `redes`. */
  cuentas: string[]
  redes: string[]
  media: string[]
  /** URL pública de imagen; vacía o ausente = sin portada. Solo válida con video. */
  portada?: string
  /** JSON plano libre del editor-LLM; se valida con validateAtributos. */
  atributos?: unknown
  /**
   * Lo que cada destino exige elegir, llaveado por clave: `{ "<clave>": { … } }`. Cada
   * clave se busca primero entre los identificadores de cuenta de los destinos de la
   * fila; si no coincide con ninguno se acepta como nombre de red y se resuelve a su
   * destino solo si la fila tiene exactamente uno. Se valida con validarOpcionesPorCuenta.
   */
  opciones?: unknown
  /** { palabra, mensaje, respuestaPublica? }; se valida con validarRegla. */
  regla?: unknown
  /** La referencia del que llama, única por dueño, para reconocer la fila si reenvía el lote; se valida con refDeFila. */
  ref?: unknown
  /**
   * El atajo de las secuencias: la fila sale como una historia por archivo, en el orden de
   * `media` y a la misma hora (`expandirHistoria`). Sin él, cada fila es un post.
   */
  historia?: boolean
}

export const HISTORIA_CON_OPCIONES = 'Con «historia» la fila no lleva «opciones»: la historia ya dice todo.'
export const HISTORIA_DEMASIADAS = `Una secuencia lleva hasta ${MAX_HISTORIAS_SECUENCIA} historias.`

/**
 * El atajo: una fila con `historia: true` se expande en una historia por archivo, en ese
 * orden, con la misma hora y una secuencia compartida (`secuencia`), para que salgan en orden
 * (`secuencia.ts`). Con un solo archivo es una historia suelta. Las opciones las pone el atajo,
 * para cada destino de la fila —por cuenta o por red, como las pediría el que llama—; si la
 * fila trae las suyas, se rechaza en vez de elegir unas en silencio. Una `ref` se vuelve una por
 * historia (`<ref>#1`, `<ref>#2`…), así un reenvío reconoce las que ya entraron.
 */
export function expandirHistoria(item: BatchItem, secuencia: string): BatchItem[] | { error: string } {
  if (item.historia !== true) return [item]
  if (item.opciones !== undefined && item.opciones !== null) return { error: HISTORIA_CON_OPCIONES }
  if (item.media.length === 0) return { error: HISTORIA_MEDIA }
  if (item.media.length > MAX_HISTORIAS_SECUENCIA) return { error: HISTORIA_DEMASIADAS }
  const claves = item.cuentas.length > 0 ? item.cuentas : item.redes
  const suelta = item.media.length === 1
  return item.media.map((url, i) => {
    const historia = suelta ? true : { secuencia, orden: i + 1 }
    return {
      ...item,
      historia: undefined,
      media: [url],
      opciones: Object.fromEntries(claves.map((clave) => [clave, { historia }])),
      ref: typeof item.ref === 'string' && !suelta ? `${item.ref}#${i + 1}` : item.ref,
    }
  })
}

/**
 * Lo que vuelve de una fila del atajo: un resultado con un `postId` por historia, en su orden
 * (`null` la que no entró). Sale bien si entraron todas; si no, con la frase de la primera que
 * falló, y las demás quedan programadas igual: una historia que falla no arrastra al resto.
 */
function juntarHistorias(index: number, partes: BatchResult[]): BatchResult {
  const postIds = partes.map((p) => (p.ok ? p.postId : null))
  const ms = partes.reduce((total, p) => total + p.ms, 0)
  const fallida = partes.find((p): p is BatchResult & { ok: false } => !p.ok)
  if (!fallida) return { index, ok: true, postId: postIds[0]!, postIds, ms }
  return { index, ok: false, error: fallida.error, ...(fallida.motivo ? { motivo: fallida.motivo } : {}), postIds, ms }
}

/** Lo que se dice de una fila, sin su medición. */
type Veredicto =
  // `repetido`: ya había un post con esa `ref`, y es el que vuelve; la fila no se programó otra vez.
  | { ok: true; postId: string; repetido?: true }
  // `motivo`: por qué no se pudo traer la media, cuando el problema fue ese.
  | { ok: false; error: string; motivo?: MotivoDeDescarga }

/**
 * Cada fila dice además cuánto tardó en el servidor (`ms`). Si llegó a su media, también
 * cuánto bajó (`bytes`) y de dónde salió (`origen`): `descarga` si bajó algo, `cache` si
 * no bajó nada pero algo venía de otra fila del mismo lote con la misma URL, y `almacen` si
 * toda estaba ya en el almacén, subida con `POST /api/media`.
 */
export type BatchResult = { index: number } & Veredicto & {
  ms: number
  bytes?: number
  origen?: 'descarga' | 'cache' | 'almacen'
  /** Solo en una fila del atajo de historias: un id por historia, en su orden (`juntarHistorias`). */
  postIds?: Array<string | null>
}

export const MAX_BATCH_ITEMS = 50

export const MAX_REF = 100
export const REF_ERROR = `«ref» tiene que ser un texto de 1 a ${MAX_REF} caracteres.`

/** El nombre de la unicidad (dueño, ref) en `scheduled_posts`: el choque que delata un lote reenviado a la vez. */
const REF_UNICA = 'scheduled_posts_owner_ref_key'

/**
 * La `ref` de una fila, limpia: nula si no vino, la frase si vino mal. Se recorta, así que
 * « a1 » y «a1» son la misma fila.
 */
export function refDeFila(raw: unknown): { ref: string | null } | { error: string } {
  if (raw === undefined || raw === null) return { ref: null }
  if (typeof raw !== 'string') return { error: REF_ERROR }
  const ref = raw.trim()
  return ref.length >= 1 && ref.length <= MAX_REF ? { ref } : { error: REF_ERROR }
}

/** El post de este dueño que ya lleva esa `ref`, o null. */
async function postConRef(ownerId: string, ref: string): Promise<string | null> {
  const [fila] = await getDb()
    .select({ id: scheduledPosts.id })
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.ownerId, ownerId), eq(scheduledPosts.ref, ref)))
    .limit(1)
  return fila?.id ?? null
}

export const PORTADA_NEEDS_VIDEO = 'La portada requiere un video en media.'
export const PORTADA_NOT_IMAGE = 'La portada debe ser una imagen.'
export const PORTADA_FORMAT = 'La portada debe ser JPG o PNG.'

// The six networks with a publisher.
// Twin of ENABLED in the composer (schedule/composer.tsx) — update both together.
export const PUBLISHABLE = new Set(['instagram', 'facebook', 'youtube', 'threads', 'x', 'tiktok'])

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'webm'])
// Graph puede rechazar un thumb gif/webp, y como en FB/IG la portada viaja en el POST
// del video, un formato indigesto tumba el video entero tras los 3 reintentos.
const COVER_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])

function extensionFromUrl(url: string): string {
  const path = url.split('?')[0] ?? ''
  return path.split('.').pop()?.toLowerCase() ?? ''
}

/** By extension, cheaply, before any download; null means the content-type decides. */
export function mediaTypeFromUrl(url: string): 'image' | 'video' | null {
  const extension = extensionFromUrl(url)
  if (IMAGE_EXTENSIONS.has(extension)) return 'image'
  if (VIDEO_EXTENSIONS.has(extension)) return 'video'
  return null
}

// A URL with no recognizable extension (a Drive link) counts as an image here and gets
// its real type from the download's content-type, which re-runs these rules. Image is
// the safe guess: the only type-dependent rules are X's, and for X any count that fails
// as images fails as videos too — so nothing valid is rejected early, and nothing
// invalid slips past the re-check.
/** Por extensión declarada, antes de descargar nada — el mismo criterio en los dos sitios que lo necesitan. */
export function contarMedia(media: string[]): { imageCount: number; videoCount: number } {
  let imageCount = 0
  let videoCount = 0
  for (const url of media) {
    if (mediaTypeFromUrl(url) === 'video') videoCount++
    else imageCount++
  }
  return { imageCount, videoCount }
}

/**
 * Portada verdict by extension alone, before any download: a video extension is
 * always rejected, and a recognized image extension outside JPG/PNG (gif/webp) is
 * rejected too. An unrecognized extension returns null — still deferred, same as
 * mediaTypeFromUrl.
 */
export function portadaExtensionError(url: string): string | null {
  const type = mediaTypeFromUrl(url)
  if (type === 'video') return PORTADA_NOT_IMAGE
  if (type === 'image' && !COVER_EXTENSIONS.has(extensionFromUrl(url))) return PORTADA_FORMAT
  return null
}

/**
 * Same verdict once the download is in hand: the real media type first, then the
 * extension typeFromContentType derived — stored.url ends in it, so no need to widen
 * mediaToBlob's public shape just to carry it separately.
 */
export function portadaTypeError(stored: { url: string; mediaType: 'image' | 'video' }): string | null {
  if (stored.mediaType !== 'image') return PORTADA_NOT_IMAGE
  if (!COVER_EXTENSIONS.has(extensionFromUrl(stored.url))) return PORTADA_FORMAT
  return null
}

// Subtypes whose conventional extension is not the subtype itself.
const EXTENSION_BY_SUBTYPE: Record<string, string> = { jpeg: 'jpg', quicktime: 'mov' }
// Inverse, for the extension → MIME subtype direction (tipoDesdeNombre, below).
const SUBTYPE_BY_EXTENSION: Record<string, string> = { jpg: 'jpeg', mov: 'quicktime' }

/**
 * Los subtipos que se publican: los mismos formatos que reconocen las extensiones de arriba.
 * Antes valía cualquier `image/*` o `video/*`, y el tipo que declaraba quien subía quedaba
 * firmado en el objeto del almacén, que es público: un `image/svg+xml` se servía como tal.
 */
const SUBTIPOS: Record<'image' | 'video', ReadonlySet<string>> = {
  image: new Set(['jpeg', 'png', 'gif', 'webp']),
  video: new Set(['mp4', 'quicktime', 'webm']),
}

/**
 * El content-type de la descarga, resuelto a un tipo de media, una extensión para el
 * nombre del blob, y `tipo` — el `tipo/subtipo` canónico, sin parámetros como
 * `; charset=…`, listo para pasarle a Meta o YouTube como content-type del objeto. Null si
 * no es un formato que se publica (`SUBTIPOS`).
 */
export function typeFromContentType(
  contentType: string,
): { mediaType: 'image' | 'video'; extension: string; tipo: string } | null {
  const [type, crudo = ''] = (contentType.split(';')[0] ?? '').trim().toLowerCase().split('/')
  if (type !== 'image' && type !== 'video') return null
  // `image/jpg` no es un tipo registrado, pero hay teléfonos que lo mandan.
  const subtype = crudo === 'jpg' ? 'jpeg' : crudo
  if (!SUBTIPOS[type].has(subtype)) return null
  return {
    mediaType: type,
    extension: EXTENSION_BY_SUBTYPE[subtype] ?? (subtype || 'bin'),
    tipo: `${type}/${subtype}`,
  }
}

/**
 * `file.type` real, o el que corresponde a su extensión cuando el navegador no lo dio
 * (pasa con algunos .mov y con archivos que llegan por apps que no lo setean). Sin
 * esto `guardar` recibía un content-type vacío y el archivo terminaba sirviéndose sin
 * uno. Reutiliza las extensiones que este módulo ya reconoce en vez de mantener una
 * segunda lista.
 */
export function tipoDesdeNombre(nombre: string): string {
  const extension = extensionFromUrl(nombre)
  if (IMAGE_EXTENSIONS.has(extension)) return `image/${SUBTYPE_BY_EXTENSION[extension] ?? extension}`
  if (VIDEO_EXTENSIONS.has(extension)) return `video/${SUBTYPE_BY_EXTENSION[extension] ?? extension}`
  return ''
}

/**
 * Qué destinos pide una fila. Nombrar la cuenta manda sobre nombrar la red: lo primero es
 * siempre inequívoco, y lo segundo solo se puede resolver cuando no hay dos candidatas.
 */
export function destinoPedido(item: BatchItem): { cuentas: string[] } | { redes: string[] } {
  return item.cuentas.length > 0 ? { cuentas: item.cuentas } : { redes: item.redes }
}

/** Con dos destinos de la misma red, una clave de `opciones` que nombra la red no alcanza. */
export function opcionesClaveAmbigua(network: string, handles: Array<string | null>): string {
  const lista = handles.map((h) => h ?? 'sin nombre').join(', ')
  return `«${network}» en opciones es ambiguo: la fila tiene ${handles.length} cuentas de esa red (${lista}). Usa el id de cada cuenta como clave.`
}

/** Dos claves de `opciones` que, resueltas, nombran el mismo destino: una pisaría a la otra. */
export function opcionesClaveDuplicada(clave1: string, clave2: string): string {
  return `«${clave1}» y «${clave2}» en opciones nombran el mismo destino. Deja una sola clave por destino.`
}

/**
 * Reescribe las claves crudas de `opciones` a identificadores de cuenta, listas para
 * `validarOpcionesPorCuenta`. Cada clave se busca primero entre los identificadores de
 * `destinos`; si no coincide con ninguno se acepta como nombre de red y se resuelve al
 * destino de esa red solo si la fila tiene exactamente uno — con dos, la clave es
 * ambigua y la fila falla nombrando las candidatas y sus handles. Una clave que no es ni
 * un identificador de la fila ni una de sus redes se ignora, igual que antes ignoraba
 * una red no pedida.
 *
 * Dos claves que resuelven al mismo destino (el id de una cuenta y el nombre de su
 * única red, por ejemplo) no se dejan pisar en silencio con la última que trae el
 * JSON: la fila falla nombrando las dos claves. El sistema no elige entre dos.
 */
export function clavesDeOpciones(
  destinos: CuentaDestino[],
  raw: Record<string, unknown>,
): { raw: Record<string, unknown> } | { error: string } {
  const idsConocidos = new Set(destinos.map((d) => d.id))
  const porRed = new Map<string, CuentaDestino[]>()
  for (const destino of destinos) {
    const lista = porRed.get(destino.network) ?? []
    lista.push(destino)
    porRed.set(destino.network, lista)
  }

  const resultado: Record<string, unknown> = {}
  // Clave cruda que ya resolvió cada destino, para detectar dos claves distintas
  // pisándose sobre el mismo id.
  const claveDe = new Map<string, string>()
  for (const [clave, valor] of Object.entries(raw)) {
    let destinoId: string
    if (idsConocidos.has(clave)) {
      destinoId = clave
    } else {
      const candidatas = porRed.get(clave)
      if (!candidatas || candidatas.length === 0) continue
      if (candidatas.length > 1) {
        return { error: opcionesClaveAmbigua(clave, candidatas.map((c) => c.handle)) }
      }
      destinoId = candidatas[0]!.id
    }
    const claveAnterior = claveDe.get(destinoId)
    if (claveAnterior !== undefined) {
      return { error: opcionesClaveDuplicada(claveAnterior, clave) }
    }
    claveDe.set(destinoId, clave)
    resultado[destinoId] = valor
  }
  return { raw: resultado }
}

/**
 * Las opciones de la fila ya limpias, o la frase. Un valor que no es objeto se rechaza
 * entero, aunque `destinos` no se conozca todavía.
 *
 * `destinos` es `null` en la comprobación previa a la base para una fila que nombró
 * cuentas: sin ir a la base no se sabe la red de cada una, así que ahí solo se
 * comprueba la forma y la resolución completa queda para cuando `scheduleBatch` ya
 * tenga los destinos verificados.
 */
export function opcionesDeFila(
  item: BatchItem,
  destinos: CuentaDestino[] | null,
): { opciones: Record<string, OpcionesDestino> } | { error: string } {
  const raw = item.opciones
  if (raw !== undefined && raw !== null && (typeof raw !== 'object' || Array.isArray(raw))) {
    return { error: OPCIONES_ERROR }
  }
  if (!destinos) return { opciones: {} }

  const claves = clavesDeOpciones(destinos, (raw ?? {}) as Record<string, unknown>)
  if ('error' in claves) return claves
  return validarOpcionesPorCuenta(destinos, claves.raw)
}

/**
 * The batch item's whole rulebook: its own shape first, then the composer's exact
 * rules via validateScheduleDraft — one source of truth for limits and media shapes.
 *
 * `zone` es la del dueño del lote: «2026-10-01 19:00» son las siete de su tarde, no las
 * de un sitio.
 */
export function validateBatchItem(item: BatchItem, now: Date, zone: string): string | null {
  const scheduledAt = parseFecha(item.fecha, zone)
  if (!scheduledAt) return 'La fecha no se entendió (usa YYYY-MM-DD HH:MM).'

  const pedido = destinoPedido(item)
  if ('redes' in pedido && pedido.redes.length === 0) {
    return 'Elige al menos una cuenta o una red.'
  }

  for (const red of item.redes) {
    if (!PUBLISHABLE.has(red)) return `Red desconocida o sin publicación: ${red}.`
  }

  if (new Set(item.redes).size !== item.redes.length) {
    return 'Hay redes repetidas en la fila.'
  }

  const { imageCount, videoCount } = contarMedia(item.media)

  const portada = item.portada?.trim()
  if (portada) {
    const extensionError = portadaExtensionError(portada)
    if (extensionError) return extensionError
    // Un tipo diferido en media puede resultar video (un link de Drive), así que
    // solo se rechaza aquí cuando TODA la media es imagen segura; la re-validación
    // post-descarga da el veredicto final con los tipos reales.
    const videoPossible = item.media.some((url) => mediaTypeFromUrl(url) !== 'image')
    if (!videoPossible) return PORTADA_NEEDS_VIDEO
  }

  const atributosCheck = validateAtributos(item.atributos)
  if ('error' in atributosCheck) return atributosCheck.error

  // Con redes nombradas, cada una implica un único destino conceptual: se arma un
  // destino de mentira por red (su id es el propio nombre) para poder pasar por
  // `validarOpcionesPorCuenta` sin tocar la base. Con cuentas nombradas no hay con qué
  // armarlo — la red real de cada cuenta solo la sabe la base — así que aquí solo se
  // comprueba la forma; `scheduleBatch` hace la comprobación completa ya con los
  // destinos verificados, antes de subir nada.
  const destinosParaOpciones = 'redes' in pedido
    ? pedido.redes.map((network) => ({ id: network, network, handle: null }))
    : null
  const opcionesCheck = opcionesDeFila(item, destinosParaOpciones)
  if ('error' in opcionesCheck) return opcionesCheck.error

  // La regla de media que depende de la opción y no de la red (un trial reel es un solo
  // video). Con cuentas nombradas `opciones` viene vacío acá y la corre `scheduleBatch`.
  const sinTipo = item.media.filter((url) => mediaTypeFromUrl(url) === null).length
  const mediaPorOpciones = errorDeMediaPorOpciones(opcionesCheck.opciones, {
    videos: videoCount,
    fotos: imageCount - sinTipo,
    sinTipo,
  })
  if (mediaPorOpciones) return mediaPorOpciones

  const reglaCheck = validarRegla(item.regla)
  if ('error' in reglaCheck) return reglaCheck.error

  // Lo que una historia no lleva. Con cuentas nombradas `opciones` viene vacío y lo corre
  // `scheduleBatch`; un link sin tipo conocido espera a que se descargue para lo del JPG.
  const historia = errorDeHistoria(opcionesCheck.opciones, {
    caption: item.texto,
    conPalabraClave: reglaCheck.regla !== null,
    conPortada: Boolean(item.portada?.trim()),
    aInstagram: 'redes' in pedido && pedido.redes.includes('instagram'),
    fotos: item.media.filter((url) => mediaTypeFromUrl(url) === 'image').map(extensionDe),
  })
  if (historia) return historia

  // Igual que con las opciones: las reglas de forma por red (TikTok, X, Threads, el
  // tope del carrusel) solo se pueden aplicar cuando la fila nombra redes. Con cuentas
  // nombradas, `scheduleBatch` las vuelve a correr con las redes reales de los destinos
  // verificados.
  if (!('redes' in pedido)) return null

  return validateScheduleDraft(
    {
      caption: item.texto,
      imageCount,
      videoCount,
      networks: pedido.redes,
      scheduledAt,
      formats: item.media.map(extensionDe),
    },
    now,
  )
}

/** La frase de una media que no se pudo traer; el porqué viaja aparte, en `motivo`. */
export const MEDIA_ILEGIBLE = 'No se pudo leer una media de la fila.'

/**
 * La de una fila que no alcanzó a terminar antes de que la función tuviera que contestar.
 * Reenviarla con su `ref` es seguro: si alcanzó a entrar, vuelve como repetida.
 */
export const LOTE_SIN_TIEMPO = 'Al lote se le acabó el tiempo antes de terminar esta fila. Reenvíala.'

/** Una media ya copiada al almacén, con lo que pesó; o por qué no se pudo traer. */
export type Copia =
  | { ok: true; url: string; mediaType: 'image' | 'video'; bytes: number }
  | { ok: false; motivo: MotivoDeDescarga }

/**
 * Cuántos bytes de media caben en memoria a la vez en este proceso, sumando las filas que
 * bajan en paralelo y los lotes que caigan en la misma instancia. Cada archivo está entero
 * en memoria entre que baja y que se sube, y en el peor momento dos veces (`leerConTope`
 * arma un Blob y `guardar` lo copia a un Buffer): 400 MB de archivos son hasta 800 MB, lejos
 * de los 2 GB de una función de Vercel. Un archivo más pesado que el cupo —se aceptan hasta
 * 500 MB, `MAX_BYTES_ARCHIVO`— baja solo, como bajaba todo antes de que hubiera paralelo.
 */
const BYTES_EN_MEMORIA = 400 * 1024 * 1024
const memoria = new Cupo(BYTES_EN_MEMORIA)

const ESPERA_REINTENTO_MS = 2_000
/** Con menos que esto por delante, un segundo intento moriría a medias: mejor contestar el primero. */
const MINIMO_PARA_REINTENTAR_MS = 10_000

/** Lo que puede andar a la segunda: el origen no contestó, se quedó quieto, cortó, o tuvo un mal momento. */
function valeReintentar(motivo: MotivoDeDescarga): boolean {
  if (motivo === 'sin respuesta' || motivo === 'estancada' || motivo === 'cortada') return true
  const status = /^http (\d{3})$/.exec(motivo)?.[1]
  return status !== undefined && (status === '429' || status.startsWith('5'))
}

async function copiarUnaVez(url: string, expected: 'image' | 'video' | null, hasta: number): Promise<Copia> {
  // `descargarSeguro` es la comprobación de red interna compartida con `documentoToBlob`
  // (documento.ts): sin ella, esta fila pedía cualquier URL que trajera el CSV en nombre
  // del servidor.
  const descarga = await descargarSeguro(url, 'la media del lote', hasta)
  if (!descarga.ok) return descarga
  const response = descarga.response
  const contentType = response.headers.get('content-type') ?? ''
  // The server's content-type is the truth: with an extension it must agree (a PDF
  // renamed .jpg would otherwise reach Meta as an "image"); without one — a Drive
  // link — it decides the type. Anything but image/* or video/* refuses the row,
  // which is also what catches Drive's HTML interstitial pages.
  const detected = typeFromContentType(contentType)
  if (!detected || (expected && detected.mediaType !== expected)) {
    console.error('Content-type inesperado en la media del lote:', contentType, url.slice(0, 200))
    await response.body?.cancel().catch(() => {})
    const tipo = (contentType.split(';')[0] ?? '').trim().toLowerCase().slice(0, 60)
    return { ok: false, motivo: `tipo ${tipo || 'ausente'}` }
  }
  // El cuerpo se lee con tope (`leerConTope`): `response.blob()` bufferea el archivo entero
  // antes de que nadie pueda mirar su tamaño, y un origen que sirve gigas los servía igual.
  // El `content-length` declarado ahorra abrir la lectura de un archivo que ya avisa de más.
  const declarado = Number(response.headers.get('content-length') ?? '0')
  if (declarado > MAX_BYTES_ARCHIVO) {
    await response.body?.cancel().catch(() => {})
    console.error('La media del lote:', ARCHIVO_MUY_GRANDE, url.slice(0, 200))
    return { ok: false, motivo: 'muy grande' }
  }
  // Sin un tamaño declarado que sirva, se aparta el máximo: es lo que podría llegar a pesar.
  const soltar = await memoria.tomar(declarado > 0 ? declarado : MAX_BYTES_ARCHIVO)
  try {
    const leido = await leerConTope(response, MAX_BYTES_ARCHIVO, url, 'la media del lote')
    if ('motivo' in leido) return { ok: false, motivo: leido.motivo }
    const publicUrl = await guardar(
      `scheduled/${randomUUID()}.${detected.extension}`,
      leido.blob,
      // El canónico que typeFromContentType ya parseó, no el header crudo: sin sus
      // parámetros (`; charset=binary` y similares) para que Meta y YouTube lean un
      // tipo limpio al descargar la media desde acá.
      detected.tipo,
    )
    return { ok: true, url: publicUrl, mediaType: detected.mediaType, bytes: leido.blob.size }
  } finally {
    soltar()
  }
}

/**
 * Una media por URL, copiada al almacén. Si el primer intento falla por algo pasajero
 * (`valeReintentar`) y queda tiempo, espera un poco y prueba otra vez: así volvían, el
 * 2026-10-21, filas de Drive con enlaces sanos. No lanza por la descarga; sí si falla
 * `guardar`, que no es culpa de la URL. `hasta` es el instante en que todo se corta: el del
 * lote, o `TOPE_POR_DEFECTO_MS` desde ahora, el tope de siempre por archivo.
 */
export async function copiarMedia(
  url: string,
  expected: 'image' | 'video' | null,
  hasta: number = Date.now() + TOPE_POR_DEFECTO_MS,
): Promise<Copia> {
  const primera = await copiarUnaVez(url, expected, hasta)
  if (primera.ok || !valeReintentar(primera.motivo)) return primera
  if (hasta - Date.now() < ESPERA_REINTENTO_MS + MINIMO_PARA_REINTENTAR_MS) return primera
  console.warn('La media del lote: segundo intento tras', primera.motivo, url.slice(0, 200))
  await new Promise((seguir) => setTimeout(seguir, ESPERA_REINTENTO_MS))
  return copiarUnaVez(url, expected, hasta)
}

/** `copiarMedia` para quien solo necesita saber si se pudo: el editor del panel, que tiene su propia frase. */
export async function mediaToBlob(
  url: string,
  expected: 'image' | 'video' | null,
): Promise<{ url: string; mediaType: 'image' | 'video' } | null> {
  const copia = await copiarMedia(url, expected)
  return copia.ok ? { url: copia.url, mediaType: copia.mediaType } : null
}

/** Cuántas filas de un lote corren a la vez. El cuello es el origen (Drive), no este servidor. */
export const FILAS_A_LA_VEZ = 4

/** Lo que comparten las filas de un lote mientras corren a la vez. */
type Lote = {
  ownerId: string
  zone: string
  now: Date
  hasta: number
  /** Una copia por URL en todo el lote: la misma media en tres filas se baja una vez. */
  copias: Map<string, Promise<Copia>>
  /** La cola de cada `ref`: dos filas con la misma van una detrás de otra, y la segunda ve a la primera. */
  refs: Map<string, Promise<unknown>>
}

/** Lo que una fila bajó, para `bytes` y `origen` en su resultado. */
type Medicion = { bytes: number; descargo: boolean; reuso: boolean; almacen: boolean }

/**
 * Dónde guarda `POST /api/media` lo que sube cada dueño. El lote acepta sin bajarlo lo que
 * esté en la carpeta del dueño del lote, y solo eso: una URL de otra carpeta se trata como
 * cualquier URL pública.
 */
export function carpetaDeLaApi(ownerId: string): string {
  return `scheduled/${ownerId}/`
}

function esDeSuCarpeta(ownerId: string, url: string): boolean {
  const base = basePublica()
  const key = base ? keyDesdeUrl(base, url) : null
  return key !== null && key.startsWith(carpetaDeLaApi(ownerId))
}

/**
 * Un archivo que el dueño subió con `POST /api/media`: ya está en el almacén, así que no se
 * baja ni se copia; solo se comprueba que esté, lo que pesa y el tipo con que se firmó.
 * `no subido` es que el PUT nunca terminó, o que el archivo ya se borró: el barrido se lleva
 * lo que nadie nombró en una hora, y un video se va cuando el último post que lo usa salió.
 */
async function verificarSubida(url: string, expected: 'image' | 'video' | null): Promise<Copia> {
  const objeto = await objetoEnAlmacen(url)
  if (!objeto) return { ok: false, motivo: 'no subido' }
  if (objeto.bytes > MAX_BYTES_ARCHIVO) return { ok: false, motivo: 'muy grande' }
  const detected = typeFromContentType(objeto.tipo)
  if (!detected || (expected && detected.mediaType !== expected)) {
    return { ok: false, motivo: `tipo ${objeto.tipo.slice(0, 60) || 'ausente'}` }
  }
  return { ok: true, url, mediaType: detected.mediaType, bytes: objeto.bytes }
}

/**
 * La copia de una media para esta fila: la que ya hizo (o está haciendo) otra fila del lote
 * con la misma URL, o una nueva. Una que falló no queda guardada, para que una fila de más
 * adelante pueda intentarlo de nuevo. Lo que el dueño ya subió con `POST /api/media` no se
 * copia: se usa tal cual (`verificarSubida`). Que dos posts compartan el objeto es seguro: al
 * publicar, `limpiarMedia` (run.ts) solo lo borra si ningún otro post ni borrador lo usa, y
 * el barrido de huérfanos (`storage-gc.ts`) solo lo que nadie referencia.
 */
async function traerMedia(
  lote: Lote,
  medicion: Medicion,
  url: string,
  expected: 'image' | 'video' | null,
): Promise<Copia> {
  if (esDeSuCarpeta(lote.ownerId, url)) {
    medicion.almacen = true
    return verificarSubida(url, expected)
  }
  const clave = `${expected ?? 'cualquiera'} ${url}`
  const enCurso = lote.copias.get(clave)
  if (enCurso) {
    medicion.reuso = true
    return enCurso
  }
  const copia = copiarMedia(url, expected, lote.hasta)
  lote.copias.set(clave, copia)
  medicion.descargo = true
  try {
    const hecha = await copia
    if (hecha.ok) medicion.bytes += hecha.bytes
    else lote.copias.delete(clave)
    return hecha
  } catch (error) {
    lote.copias.delete(clave)
    throw error
  }
}

/** El rechazo de una fila cuya media no llegó, con su porqué. */
function sinMedia(motivo: MotivoDeDescarga): Veredicto {
  return { ok: false, error: motivo === 'sin tiempo' ? LOTE_SIN_TIEMPO : MEDIA_ILEGIBLE, motivo }
}

/**
 * Un lote, con `FILAS_A_LA_VEZ` filas a la vez: así baja varias veces más rápido sin que
 * cincuenta descargas simultáneas choquen con los límites del origen, y sin pasarse de
 * memoria (`BYTES_EN_MEMORIA`). La media de cada fila baja en orden, un archivo tras otro.
 * Una fila rechazada anota su frase fija y las demás siguen: el éxito parcial es el
 * contrato. Los resultados vuelven en el orden de `items`.
 *
 * `hasta` es el instante en que el lote deja de empezar filas y corta las descargas en
 * curso, para que la función alcance a contestar antes de su `maxDuration`: las que no
 * alcanzaron vuelven con `LOTE_SIN_TIEMPO`.
 *
 * Una fila con `ref` es reconocible: si el lote se corta a mitad (la función se queda sin
 * tiempo, se cae la conexión), reenviarlo entero devuelve los posts que ya habían entrado,
 * con `repetido`, en vez de programarlos de nuevo. Para que eso valga, cada post se guarda
 * con sus destinos, su media y su regla en una sola transacción: un corte a mitad de una
 * fila no deja un post a medias que la `ref` daría por hecho.
 */
export async function scheduleBatch(
  ownerId: string,
  items: BatchItem[],
  hasta: number = Date.now() + 200_000,
): Promise<BatchResult[]> {
  // Una sola vez por lote: las cincuenta filas son del mismo dueño y sus horas se leen
  // en la misma zona. Un dueño que ya no existe no debería llegar acá (la llave o la
  // sesión ya lo resolvieron), pero si llega, el default del sitio es mejor que reventar.
  const zone = (await buscarPorId(ownerId))?.zona ?? ZONA_POR_DEFECTO
  const lote: Lote = { ownerId, zone, now: new Date(), hasta, copias: new Map(), refs: new Map() }

  // El atajo de las historias se expande antes: cada historia es una fila más del lote, y su
  // resultado vuelve a juntarse en el índice de la fila que la pidió.
  const filas: Array<{ item: BatchItem; origen: number }> = []
  const rechazadas = new Map<number, string>()
  items.forEach((item, origen) => {
    const expandida = expandirHistoria(item, randomUUID())
    if ('error' in expandida) rechazadas.set(origen, expandida.error)
    else for (const fila of expandida) filas.push({ item: fila, origen })
  })

  const hechos = await enParalelo(filas, FILAS_A_LA_VEZ, async ({ item, origen }, index): Promise<BatchResult> => {
    const inicio = Date.now()
    const medicion: Medicion = { bytes: 0, descargo: false, reuso: false, almacen: false }
    const veredicto = await programarFila(lote, item, index, medicion)
    const resultado: BatchResult = { index: origen, ...veredicto, ms: Date.now() - inicio }
    if (medicion.descargo || medicion.reuso || medicion.almacen) {
      resultado.bytes = medicion.bytes
      resultado.origen = medicion.descargo ? 'descarga' : medicion.reuso ? 'cache' : 'almacen'
    }
    return resultado
  })

  return items.map((item, index): BatchResult => {
    const rechazo = rechazadas.get(index)
    if (rechazo) return { index, ok: false, error: rechazo, ms: 0 }
    const partes = hechos.filter((h) => h.index === index)
    return item.historia === true ? juntarHistorias(index, partes) : partes[0]!
  })
}

async function programarFila(lote: Lote, item: BatchItem, index: number, medicion: Medicion): Promise<Veredicto> {
  if (Date.now() >= lote.hasta) return { ok: false, error: LOTE_SIN_TIEMPO }
  // La `ref` va antes que todo lo demás: una fila reenviada no se vuelve a validar, porque
  // ya entró y su hora pudo pasar desde el primer envío. Se compara sin mirar el contenido.
  const refCheck = refDeFila(item.ref)
  if ('error' in refCheck) return { ok: false, error: refCheck.error }
  const ref = refCheck.ref
  if (!ref) return programarSinRepetir(lote, item, index, null, medicion)
  // Otra fila de este mismo lote con la misma `ref`: se espera a que termine, para que esta
  // la encuentre y vuelva como repetida en vez de bajar la media y chocar al guardar.
  const anterior = lote.refs.get(ref) ?? Promise.resolve()
  const esta = anterior.then(() => programarSinRepetir(lote, item, index, ref, medicion))
  lote.refs.set(ref, esta.catch(() => {}))
  return esta
}

async function programarSinRepetir(
  lote: Lote,
  item: BatchItem,
  index: number,
  ref: string | null,
  medicion: Medicion,
): Promise<Veredicto> {
  const { ownerId, zone, now } = lote
  if (ref) {
    const existente = await postConRef(ownerId, ref)
    if (existente) return { ok: true, postId: existente, repetido: true }
  }

  const invalid = validateBatchItem(item, now, zone)
  if (invalid) return { ok: false, error: invalid }

  try {
    // Antes de subir nada: un destino sin cuenta se rechaza acá, no después de gastar
    // la subida de toda la media de la fila.
    const pedido = destinoPedido(item)
    const destinos =
      'cuentas' in pedido
        ? await verificarCuentas(ownerId, pedido.cuentas)
        : [...(await cuentaUnicaPorRed(ownerId, pedido.redes)).values()]

    // Igual de temprano: con cuentas nombradas, `validateBatchItem` solo comprobó la
    // forma de `opciones` (no conocía la red de cada cuenta sin ir a la base). Ahora
    // que los destinos están verificados, esta es la comprobación completa.
    const opcionesCheck = opcionesDeFila(item, destinos)
    if ('error' in opcionesCheck) return { ok: false, error: opcionesCheck.error }
    const opciones = opcionesCheck.opciones

    // Igual de temprano: con cuentas nombradas, `validateBatchItem` solo corrió la
    // regla de media del trial reel con `opciones` vacío (no conocía los destinos).
    // Ahora que `opciones` está resuelto de verdad, esta es la comprobación completa
    // con los tipos declarados — todavía antes de descargar nada.
    const { imageCount: imageCountDeclarado, videoCount: videoCountDeclarado } = contarMedia(item.media)
    const sinTipoDeclarado = item.media.filter((url) => mediaTypeFromUrl(url) === null).length
    const mediaPorOpciones = errorDeMediaPorOpciones(opciones, {
      videos: videoCountDeclarado,
      fotos: imageCountDeclarado - sinTipoDeclarado,
      sinTipo: sinTipoDeclarado,
    })
    if (mediaPorOpciones) return { ok: false, error: mediaPorOpciones }

    // Las reglas de forma por red (TikTok exige video, X no admite más de 4 fotos, …)
    // usaban `item.redes`, que con cuentas nombradas puede venir vacío: la red real
    // de cada destino solo se sabe acá. `validateScheduleDraft` se vuelve a correr
    // más abajo, siempre con las redes de `destinos`.
    const networks = [...new Set(destinos.map((d) => d.network))]
    const scheduledAt = parseFecha(item.fecha, zone)!

    // Todavía antes de subir nada: con redes nombradas, `validateBatchItem` ya corrió
    // estas mismas reglas de forma (TikTok exige video, X hasta 4 fotos, Threads un
    // solo archivo, el tope del carrusel, los límites de caption, la fecha futura…).
    // Con cuentas nombradas, esta es la primera vez que `networks` existe — sin este
    // chequeo, una fila con fecha pasada o sin texto se descargaba y subía entera
    // antes de rechazarse.
    const preUploadError = validateScheduleDraft(
      {
        caption: item.texto,
        imageCount: imageCountDeclarado,
        videoCount: videoCountDeclarado,
        networks,
        scheduledAt,
        formats: item.media.map(extensionDe),
      },
      now,
    )
    if (preUploadError) return { ok: false, error: preUploadError }

    // Todavía antes de subir nada: `validarRegla` es pura y `validateBatchItem` ya la
    // corrió, así que la forma de `documentoUrl` está garantizada; lo que falta es
    // traer el archivo de verdad. Va acá, junto a los demás rechazos tempranos, y no
    // más abajo (después del bucle que sube la media) porque el PDF pesa hasta 25 MB
    // y la media de la fila puede pesar cientos de veces más — una fila que de todos
    // modos se va a rechazar no debe pagar esa subida primero.
    const reglaCheck = validarRegla(item.regla)
    const historia = errorDeHistoria(opciones, {
      caption: item.texto,
      conPalabraClave: !('error' in reglaCheck) && reglaCheck.regla !== null,
      conPortada: Boolean(item.portada?.trim()),
      aInstagram: networks.includes('instagram'),
      fotos: item.media.filter((url) => mediaTypeFromUrl(url) === 'image').map(extensionDe),
    })
    if (historia) return { ok: false, error: historia }
    let documentoUrl: string | null = null
    if (!('error' in reglaCheck) && reglaCheck.regla?.documentoUrl) {
      documentoUrl = await documentoToBlob(
        reglaCheck.regla.documentoUrl,
        Math.min(lote.hasta, Date.now() + TOPE_POR_DEFECTO_MS),
      )
      if (!documentoUrl) {
        return { ok: false, error: Date.now() >= lote.hasta ? LOTE_SIN_TIEMPO : REGLA_DOCUMENTO }
      }
    }

    const uploaded: Array<{ url: string; mediaType: 'image' | 'video' }> = []
    for (const url of item.media) {
      const copia = await traerMedia(lote, medicion, url, mediaTypeFromUrl(url))
      if (!copia.ok) return sinMedia(copia.motivo)
      uploaded.push(copia)
    }

    // Deferred types are now real: re-run the composer's rules with the true
    // image/video split — a Drive link that turned out to be a video where only
    // images fit fails here, with the same fixed sentence the composer would use.
    const shapeError = validateScheduleDraft(
      {
        caption: item.texto,
        imageCount: uploaded.filter((m) => m.mediaType === 'image').length,
        videoCount: uploaded.filter((m) => m.mediaType === 'video').length,
        networks,
        scheduledAt,
        formats: uploaded.map((m) => extensionDe(m.url)),
      },
      now,
    )
    if (shapeError) return { ok: false, error: shapeError }

    // Misma regla del trial reel, ahora con los tipos reales: un Drive que resultó
    // imagen (o video de más) se rechaza acá, con la media ya subida pero nada
    // todavía escrito en la base.
    const mediaReal = errorDeMediaPorOpciones(opciones, {
      videos: uploaded.filter((m) => m.mediaType === 'video').length,
      fotos: uploaded.filter((m) => m.mediaType === 'image').length,
      sinTipo: 0,
    })
    if (mediaReal) return { ok: false, error: mediaReal }
    // Y lo del JPG con los tipos reales: un Drive que resultó PNG no sale como historia.
    const historiaReal = errorDeHistoria(opciones, {
      caption: item.texto,
      conPalabraClave: false,
      aInstagram: networks.includes('instagram'),
      fotos: uploaded.filter((m) => m.mediaType === 'image').map((m) => extensionDe(m.url)),
    })
    if (historiaReal) return { ok: false, error: historiaReal }

    // La portada sigue la misma tubería que la media, con dos veredictos propios:
    // los tipos reales deben incluir un video, y la portada misma debe ser imagen.
    const portada = item.portada?.trim()
    let coverUrl: string | null = null
    if (portada) {
      if (!uploaded.some((m) => m.mediaType === 'video')) return { ok: false, error: PORTADA_NEEDS_VIDEO }
      // expected=null: deja que el content-type decida, así un .jpg cuyo content-type
      // real es video cae en PORTADA_NOT_IMAGE en vez de heredar la sospecha por
      // extensión.
      const copia = await traerMedia(lote, medicion, portada, null)
      if (!copia.ok) return sinMedia(copia.motivo)
      const typeError = portadaTypeError(copia)
      if (typeError) return { ok: false, error: typeError }
      coverUrl = copia.url
    }

    const atributosCheck = validateAtributos(item.atributos)
    const atributos = 'error' in atributosCheck ? null : atributosCheck.atributos

    const postId = await getDb().transaction(async (tx) => {
      const [post] = await tx
        .insert(scheduledPosts)
        .values({ ownerId, caption: item.texto, scheduledAt, coverUrl, atributos, ref })
        .returning()
      if (uploaded.length > 0) {
        await tx.insert(scheduledPostMedia).values(
          uploaded.map((m, position) => ({
            postId: post!.id,
            blobUrl: m.url,
            mediaType: m.mediaType,
            position,
          })),
        )
      }
      // Dos caminos crean posts programados y no comparten código: este, y
      // `crearPostProgramado` (`./crear.ts`), que usan el compositor y la ruta móvil.
      // Ese no sirve acá porque no sabe de `coverUrl` ni de `atributos` — el lote es
      // hoy el único llamador que los necesita al crear. Un cambio en cómo se escribe
      // un target (esta forma de `scheduledPostTargets.values`) hay que replicarlo ahí.
      await tx.insert(scheduledPostTargets).values(
        destinos.map((cuenta) => ({
          postId: post!.id,
          network: cuenta.network,
          accountId: cuenta.id,
          opciones: opciones[cuenta.id] ?? null,
        })),
      )

      if (!('error' in reglaCheck) && reglaCheck.regla) {
        // La URL de R2 (`documentoUrl`, del paso de arriba) manda sobre la del que llamó:
        // `...reglaCheck.regla` la trae también, pero ya copiada, no la ajena.
        await tx.insert(reglasClave).values({ postId: post!.id, ...reglaCheck.regla, documentoUrl })
      }
      return post!.id
    })

    return { ok: true, postId }
  } catch (error) {
    if (error instanceof CuentaInvalida) return { ok: false, error: error.message }
    // Otro envío guardó esta `ref` mientras esta fila descargaba su media: el post ya está,
    // y es ese el que vuelve. Lo que esta fila subió a R2 queda sin referencia y se lo lleva
    // el barrido de huérfanos.
    if (ref && esChoqueCon(error, REF_UNICA)) {
      const existente = await postConRef(ownerId, ref)
      if (existente) return { ok: true, postId: existente, repetido: true }
    }
    console.error(`Falló el item ${index} del lote:`, error)
    return { ok: false, error: 'No se pudo guardar la fila. Inténtalo de nuevo.' }
  }
}
