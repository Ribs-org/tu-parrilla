import type { PublishMedia, PublishInput, PublishOutcome, Publisher } from './publisher'
import {
  PLAZO_RED_MS,
  PUBLISH_NETWORK_ERROR,
  PUBLISH_REJECTED,
  TOPE_INSTAGRAM,
  historiaSoloEmpresa,
  rechazoDeInstagram,
  trialNoDisponible,
  trialSinSeguidores,
} from './publisher'
import { esHistoria, type OpcionesDestino } from './opciones'

/**
 * Cada cuánto se vuelve a probar un destino que chocó con el tope diario. El tope es una
 * ventana móvil de 24 horas —cada cupo se libera un día después de la publicación que lo
 * gastó—, así que probar cada cinco minutos solo gasta llamadas, y una hora es lo más que
 * un post se atrasa por esperar de más.
 */
export const ESPERA_TOPE_INSTAGRAM_MS = 60 * 60_000

export function photoContainerParams(caption: string, media: PublishMedia): Record<string, string> {
  return { image_url: media.url, caption }
}

// Always MANUAL: the owner graduates the reel from the Instagram app (their call,
// 2026-09-28). `trial_params` is a JSON object on Meta's side, but /media is form
// encoded, so it travels as a JSON string.
const TRIAL_PARAMS = JSON.stringify({ graduation_strategy: 'MANUAL' })

// REELS rather than VIDEO: since v21 it is the only media_type Graph accepts for
// standalone feed video.
// La portada diseñada del reel; el carrusel y la foto no la llevan — Graph solo
// la acepta en el contenedor REELS.
export function reelContainerParams(
  caption: string,
  media: PublishMedia,
  coverUrl: string | null,
  opciones: OpcionesDestino | null = null,
): Record<string, string> {
  const params: Record<string, string> = { media_type: 'REELS', video_url: media.url, caption }
  if (coverUrl) params.cover_url = coverUrl
  if (opciones && 'trialReel' in opciones) params.trial_params = TRIAL_PARAMS
  return params
}

/**
 * Una historia: el mismo contenedor con `media_type=STORIES`, sin texto ni portada, porque una
 * historia no los lleva. Foto o video, uno solo.
 */
export function storyContainerParams(media: PublishMedia): Record<string, string> {
  return media.mediaType === 'video'
    ? { media_type: 'STORIES', video_url: media.url }
    : { media_type: 'STORIES', image_url: media.url }
}

/**
 * Lo que Meta dice de un rechazo. `titulo` y `mensaje` son los que Meta le muestra a una
 * persona (`error_user_title`, `error_user_msg`), en el idioma de quien conectó la cuenta;
 * `tecnico` es su `message`, en inglés y a veces genérico («Application does not have
 * permission for this action»). Cualquiera puede faltar.
 */
export type ErrorDeMeta = {
  codigo: number | null
  subcodigo: number | null
  titulo: string | null
  mensaje: string | null
  tecnico: string | null
}

function textoDe(cuerpo: string, campo: string): string | null {
  const m = new RegExp(`"${campo}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(cuerpo)
  if (!m) return null
  try {
    const texto = (JSON.parse(`"${m[1]}"`) as string).trim()
    return texto || null
  } catch {
    return null
  }
}

function numeroDe(cuerpo: string, campo: string): number | null {
  const m = new RegExp(`"${campo}"\\s*:\\s*(\\d+)`).exec(cuerpo)
  return m ? Number(m[1]) : null
}

/**
 * El error de Meta dentro del cuerpo de un rechazo, o null si el cuerpo no es uno (un 502 de
 * un proxy, por ejemplo). Con expresiones y no con `JSON.parse`, como `esTopeDiario`: el
 * cuerpo llega cortado a 2000 caracteres, y un campo cortado a la mitad solo se pierde él.
 */
export function leerErrorDeMeta(cuerpo: string): ErrorDeMeta | null {
  const e: ErrorDeMeta = {
    codigo: numeroDe(cuerpo, 'code'),
    subcodigo: numeroDe(cuerpo, 'error_subcode'),
    titulo: textoDe(cuerpo, 'error_user_title'),
    mensaje: textoDe(cuerpo, 'error_user_msg'),
    tecnico: textoDe(cuerpo, 'message'),
  }
  if (e.codigo === null && !e.titulo && !e.mensaje && !e.tecnico) return null
  return e
}

/** Cuánto de lo que dijo Meta entra en una frase: lo de una persona, no un párrafo. */
const LARGO_EXPLICACION = 280

/**
 * Lo que dijo Meta, listo para ir en una frase: entre comillas, con su código al final para
 * buscarlo. Prefiere lo que Meta le muestra a una persona; si no hay, su mensaje técnico.
 */
export function explicacionDeMeta(e: ErrorDeMeta): string {
  const humano = [e.titulo, e.mensaje].filter(Boolean).join('. ').replace(/\.\.\s/g, '. ')
  let texto = humano || e.tecnico || 'sin explicación'
  if (texto.length > LARGO_EXPLICACION) texto = `${texto.slice(0, LARGO_EXPLICACION - 1).trimEnd()}…`
  const codigo =
    e.codigo === null ? '' : e.subcodigo === null ? ` (código ${e.codigo})` : ` (código ${e.codigo}, subcódigo ${e.subcodigo})`
  return `«${texto}»${codigo}`
}

/**
 * El subcódigo con que Meta rechaza un trial reel porque la cuenta no tiene los seguidores
 * que pide la función. Visto en producción el 2026-10-22, en una cuenta nueva: código 10,
 * `is_transient: false`, «No tienes suficientes seguidores para crear reels de prueba».
 */
export const SUBCODIGO_TRIAL_SIN_SEGUIDORES = 2207081

/**
 * Si el rechazo de un trial reel es uno que reintentar no cambia, la frase con que falla.
 * Solo cuando se pidió un trial reel, para que un reel normal siga con su trato de siempre.
 *
 * El subcódigo es lo seguro: Meta lo documenta poco, pero no lo traduce. El texto es el
 * respaldo para un rechazo de trial reels con otro código, y busca en inglés y en español
 * porque el mensaje que lee una persona llega traducido: así se escapó el primero que se vio,
 * que decía «reels de prueba» y no «trial». Lo que no reconoce ninguna de las dos se reintenta
 * como cualquier rechazo, ahora con lo que Meta dijo a la vista (`rechazoDeInstagram`).
 * El tope diario es aparte, y no es un rechazo: `esTopeDiario`.
 *
 * Una historia desde una cuenta de creador también es definitiva: Instagram la rechazaba con el
 * código 10 diciendo que la cuenta no es de empresa, y eso no lo cambia reintentar.
 */
export function motivoDeRechazo(
  cuerpo: string,
  opciones: OpcionesDestino | null,
  cuenta: string | null = null,
): string | null {
  if (esHistoria(opciones)) {
    const e = leerErrorDeMeta(cuerpo)
    return e?.codigo === 10 && /business|empresa/i.test(cuerpo) ? historiaSoloEmpresa(cuenta) : null
  }
  if (!opciones || !('trialReel' in opciones)) return null
  const e = leerErrorDeMeta(cuerpo)
  if (e?.subcodigo === SUBCODIGO_TRIAL_SIN_SEGUIDORES) return trialSinSeguidores(cuenta)
  if (/trial|reels? de prueba/i.test(cuerpo)) return trialNoDisponible(cuenta, e ? explicacionDeMeta(e) : null)
  return null
}

/** Lo que se le dice al dueño de un rechazo que no se reconoce: con lo que Meta dijo, si dijo algo. */
function rechazoSinReconocer(cuerpo: string, cuenta: string | null | undefined, sinExplicacion: string): string {
  const e = leerErrorDeMeta(cuerpo)
  return e ? rechazoDeInstagram(cuenta, explicacionDeMeta(e)) : sinExplicacion
}

/**
 * Si Meta dijo que la cuenta llegó a su tope de publicaciones por API en 24 horas: el
 * subcódigo 2207042 (código 9) de la tabla de errores de la plataforma de Instagram. Meta
 * lo cobra al publicar el contenedor, pero se mira también al crearlo por si lo adelanta.
 *
 * No es un fallo del post: el cupo vuelve solo. Por eso no gasta intento ni lo quema
 * (`diferidoPorTope`). Se lee el subcódigo y no el mensaje, que Meta traduce; con una
 * expresión y no con `JSON.parse`, porque el cuerpo puede venir cortado.
 */
export function esTopeDiario(cuerpo: string): boolean {
  return /"error_subcode"\s*:\s*2207042\b/.test(cuerpo)
}

/**
 * Si Meta dijo que el contenedor todavía no está listo para publicarse: el subcódigo 2207027
 * (código 9007, «El contenido multimedia no está listo para publicarse. Espera un momento.»). Le
 * pasa también a una foto, que suele estar lista al tiro. No es un rechazo: el contenedor sigue
 * siendo bueno, y la corrida siguiente le pregunta su estado y lo publica cuando termine.
 */
export function esMediaNoLista(cuerpo: string): boolean {
  return /"error_subcode"\s*:\s*2207027\b/.test(cuerpo)
}

/** La espera del tope diario, con el contenedor ya hecho si lo hay: el reintento solo lo publica. */
function diferidoPorTope(containerId?: string): PublishOutcome {
  return { kind: 'deferred', esperaMs: ESPERA_TOPE_INSTAGRAM_MS, motivo: TOPE_INSTAGRAM, ...(containerId ? { containerId } : {}) }
}

export function carouselChildParams(media: PublishMedia): Record<string, string> {
  if (media.mediaType === 'video') {
    return { media_type: 'VIDEO', video_url: media.url, is_carousel_item: 'true' }
  }
  return { image_url: media.url, is_carousel_item: 'true' }
}

export function carouselParentParams(caption: string, childIds: string[]): Record<string, string> {
  return { media_type: 'CAROUSEL', children: childIds.join(','), caption }
}

/**
 * Only FINISHED/PUBLISHED/ERROR/EXPIRED are verdicts. Anything else — IN_PROGRESS, an
 * absent field, a status we don't know — keeps waiting: guessing "done" publishes a broken
 * container, guessing "error" throws away a post that was about to finish.
 *
 * PUBLISHED es uno de los estados que Meta documenta para un contenedor: ya salió. Pasa
 * cuando un intento anterior publicó y su respuesta se perdió (la corrida murió, la llamada
 * no contestó). Antes caía en «sigue procesando», esperaba 24 horas y se quemaba con el
 * reel ya publicado; reprogramarlo lo publicaba otra vez.
 *
 * EXPIRED es un contenedor que no se publicó en 24 horas y que Meta descartó: nunca salió,
 * así que se arma otro en el mismo intento. Pasa al reprogramar un destino que se quemó con
 * su contenedor guardado.
 */
export function classifyContainerStatus(
  payload: Record<string, unknown>,
): 'finished' | 'published' | 'in_progress' | 'error' | 'expired' {
  const status = payload.status_code
  if (status === 'FINISHED') return 'finished'
  if (status === 'PUBLISHED') return 'published'
  if (status === 'ERROR') return 'error'
  if (status === 'EXPIRED') return 'expired'
  return 'in_progress'
}

/**
 * La frase de un contenedor que Meta dio por fallido: con su `status`, que dice el porqué
 * («Error: …»), cuando trae algo más que el estado. Sin eso, la frase de siempre.
 */
export function rechazoDelContenedor(payload: Record<string, unknown>, cuenta: string | null | undefined): string {
  const status = typeof payload.status === 'string' ? payload.status.trim() : ''
  if (!status || status === payload.status_code) return PUBLISH_REJECTED
  return rechazoDeInstagram(cuenta, explicacionDeMeta({ codigo: null, subcodigo: null, titulo: null, mensaje: null, tecnico: status }))
}

const GRAPH = 'https://graph.facebook.com/v23.0'

// POST with form params, never JSON: it is what /media and /media_publish expect.
// Upstream error bodies go to the log as always, and now also come back to the caller
// (as `rechazo`, the raw text) so a trial-reel rejection can be told apart from a
// plain network failure. `postForm` itself does not know what a trial reel is — that
// judgement is `motivoDeRechazo`'s, in the one caller that has `opciones` to ask it.
// The log keeps 300 characters; the caller gets more, so the subcode that comes after a
// long message (`esTopeDiario`) is still there to read.
async function postForm(
  url: string,
  params: Record<string, string>,
): Promise<{ data: Record<string, unknown> } | { rechazo: string }> {
  const response = await fetch(url, {
    method: 'POST',
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(PLAZO_RED_MS),
  })
  if (!response.ok) {
    const rechazo = (await response.text()).slice(0, 2000)
    console.error('Instagram publish:', response.status, rechazo.slice(0, 300))
    return { rechazo }
  }
  return { data: await response.json() }
}

/**
 * `definitivo: true` viaja solo cuando `motivoDeRechazo` reconoció el rechazo: Meta ya
 * decidió que no, y `resolveOutcome` lo hace fallar en este mismo intento en vez de
 * reintentarlo. Cualquier otro `failed` —incluido el de `publishContainer`, que no pasa
 * por acá— sigue sin la propiedad, y `resolveOutcome` lo trata exactamente como hoy.
 * `tope` es el tope diario, que no es un rechazo (`esTopeDiario`).
 */
async function createContainer(
  input: PublishInput,
  params: Record<string, string>,
): Promise<{ id: string } | { failed: string; definitivo?: true; sinTrial?: true } | { tope: true }> {
  const r = await postForm(`${GRAPH}/${input.accountExternalId}/media`, {
    ...params,
    access_token: input.token,
  })
  if ('rechazo' in r) {
    if (esTopeDiario(r.rechazo)) return { tope: true }
    const motivo = motivoDeRechazo(r.rechazo, input.opciones, input.cuenta)
    // Un rechazo de trial reel que se reconoce es de la cuenta: no acepta trial reels. El de
    // una historia también es definitivo, pero no dice nada de los trial reels.
    if (motivo && esHistoria(input.opciones)) return { failed: motivo, definitivo: true }
    if (motivo) return { failed: motivo, definitivo: true, sinTrial: true }
    // Sin el error de Meta en el cuerpo, no sabemos si fue Meta: se sigue tratando como la red.
    return { failed: rechazoSinReconocer(r.rechazo, input.cuenta, PUBLISH_NETWORK_ERROR) }
  }
  const id = r.data.id
  return typeof id === 'string' ? { id } : { failed: PUBLISH_NETWORK_ERROR }
}

/** El `PublishOutcome` que corresponde a lo que devolvió `createContainer` sin un id:
 * la espera del tope, o el `failed` llevando `definitivo` solo si venía puesto. */
function fromCreate(r: { failed: string; definitivo?: true; sinTrial?: true } | { tope: true }): PublishOutcome {
  if ('tope' in r) return diferidoPorTope()
  if (!r.definitivo) return { kind: 'failed', reason: r.failed }
  return r.sinTrial
    ? { kind: 'failed', reason: r.failed, definitivo: true, sinTrial: true }
    : { kind: 'failed', reason: r.failed, definitivo: true }
}

/**
 * Publica el contenedor. Si la publicación no dio un id —Meta la rechazó, o la llamada no
 * contestó—, el fallo se lleva el contenedor: el intento siguiente le pregunta a Meta cómo
 * quedó antes de hacer otro, porque un `media_publish` sin respuesta pudo haber publicado.
 */
async function publishContainer(input: PublishInput, containerId: string): Promise<PublishOutcome> {
  let r: Awaited<ReturnType<typeof postForm>>
  try {
    r = await postForm(`${GRAPH}/${input.accountExternalId}/media_publish`, {
      creation_id: containerId,
      access_token: input.token,
    })
  } catch (error) {
    console.error('Instagram media_publish sin respuesta:', String(error).slice(0, 300))
    return { kind: 'failed', reason: PUBLISH_NETWORK_ERROR, containerId }
  }
  if ('rechazo' in r) {
    if (esTopeDiario(r.rechazo)) return diferidoPorTope(containerId)
    if (esMediaNoLista(r.rechazo)) return { kind: 'processing', containerId }
    return { kind: 'failed', reason: rechazoSinReconocer(r.rechazo, input.cuenta, PUBLISH_REJECTED), containerId }
  }
  const id = r.data.id
  if (typeof id !== 'string') return { kind: 'failed', reason: PUBLISH_REJECTED, containerId }
  return { kind: 'published', externalId: id }
}

export const instagramPublisher: Publisher = {
  network: 'instagram',

  async publish(input: PublishInput): Promise<PublishOutcome> {
    // Resuming: a previous run created the container and Meta was still processing.
    if (input.containerId) {
      let payload: Record<string, unknown>
      try {
        const response = await fetch(
          `${GRAPH}/${input.containerId}?fields=status_code,status&access_token=${input.token}`,
          { signal: AbortSignal.timeout(PLAZO_RED_MS) },
        )
        if (!response.ok) {
          console.error('Instagram container status:', response.status, (await response.text()).slice(0, 300))
          // Un sondeo que no contestó no dice nada del contenedor: seguir esperando, como
          // YouTube, Facebook y TikTok. Fallar tiraba el contenedor, y el intento siguiente
          // creaba otro aunque el primero ya hubiera salido. El corte de 24 horas sigue.
          return { kind: 'processing', containerId: input.containerId }
        }
        payload = await response.json()
      } catch (error) {
        console.error('Instagram container status:', String(error).slice(0, 300))
        return { kind: 'processing', containerId: input.containerId }
      }
      const verdict = classifyContainerStatus(payload)
      if (verdict === 'error') return { kind: 'failed', reason: rechazoDelContenedor(payload, input.cuenta) }
      if (verdict === 'in_progress') return { kind: 'processing', containerId: input.containerId }
      // Ya salió, pero no sabemos con qué id: el contenedor no lo dice. Sin id, sus números no
      // se cruzan con este destino; publicarlo otra vez sería peor.
      if (verdict === 'published') return { kind: 'published', externalId: null }
      if (verdict === 'finished') return publishContainer(input, input.containerId)
      // Vencido: Meta lo descartó sin publicarlo. Sigue abajo, como si no hubiera habido
      // ninguno.
    }

    const media = [...input.media].sort((a, b) => a.position - b.position)

    // Historia: un solo archivo. La foto sale en la misma corrida, como la foto suelta; el video
    // queda procesando y la corrida siguiente lo publica, como un reel.
    if (esHistoria(input.opciones) && media.length === 1) {
      const r = await createContainer(input, storyContainerParams(media[0]!))
      if (!('id' in r)) return fromCreate(r)
      if (media[0]!.mediaType === 'image') return publishContainer(input, r.id)
      return { kind: 'processing', containerId: r.id }
    }

    // Single photo is the one synchronous path: containers for images are ready at
    // once, so create-and-publish in the same run.
    if (media.length === 1 && media[0]!.mediaType === 'image') {
      const r = await createContainer(input, photoContainerParams(input.caption, media[0]!))
      if (!('id' in r)) return fromCreate(r)
      return publishContainer(input, r.id)
    }

    // Single video: create the container and park — Meta processes it asynchronously
    // and the next cron run polls status_code before publishing.
    if (media.length === 1) {
      const r = await createContainer(
        input,
        reelContainerParams(input.caption, media[0]!, input.coverUrl, input.opciones),
      )
      if (!('id' in r)) return fromCreate(r)
      return { kind: 'processing', containerId: r.id }
    }

    // Carousel: children first, then the parent, then park on the parent — its
    // status_code only turns FINISHED once every child (video included) is done.
    const childIds: string[] = []
    for (const item of media) {
      const r = await createContainer(input, carouselChildParams(item))
      if (!('id' in r)) return fromCreate(r)
      childIds.push(r.id)
    }
    const parent = await createContainer(input, carouselParentParams(input.caption, childIds))
    if (!('id' in parent)) return fromCreate(parent)
    return { kind: 'processing', containerId: parent.id }
  },
}
