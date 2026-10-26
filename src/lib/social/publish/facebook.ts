import {
  PLAZO_RED_MS,
  PUBLISH_NETWORK_ERROR,
  type PublishInput,
  type PublishMedia,
  type PublishOutcome,
  type Publisher,
} from './publisher'
import { esHistoria } from './opciones'

export const FACEBOOK_MIXED_MEDIA = 'Facebook no admite mezclar video y fotos en un post.'
export const FACEBOOK_REJECTED = 'Facebook rechazó la publicación.'
export const FACEBOOK_HISTORIA_RECHAZADA = 'Facebook rechazó la historia.'

export function photoPostParams(caption: string, media: PublishMedia): Record<string, string> {
  return { url: media.url, caption }
}

// The text goes once, on the /feed post; each photo waits unpublished and invisible
// until the parent post attaches it.
export function unpublishedPhotoParams(media: PublishMedia): Record<string, string> {
  return { url: media.url, published: 'false' }
}

export function multiPhotoFeedParams(caption: string, fbids: string[]): Record<string, string> {
  const params: Record<string, string> = { message: caption }
  fbids.forEach((fbid, index) => {
    params[`attached_media[${index}]`] = JSON.stringify({ media_fbid: fbid })
  })
  return params
}

export function videoPostParams(caption: string, media: PublishMedia): Record<string, string> {
  return { file_url: media.url, description: caption }
}

/**
 * The feed post id (`{pageId}_{postId}`) — the id space the read connector stores in
 * socialPosts (it lists `/{page}/published_posts`). A video's own id and a photo's own
 * id live in different spaces, so recording those instead means the metrics API can
 * never join a post's attributes to how it actually did. The fallback keeps a publish
 * from failing over a missing field: a wrong-space id still beats losing the post.
 *
 * Graph lo llama «story» (`page_post`), pero es el post del feed, no una historia de la
 * página: por eso se llama así y no `storyId`.
 */
export function idDelFeed(
  payload: Record<string, unknown> | null,
  pageId: string,
  fallback: string,
): string {
  const postId = payload?.post_id
  if (typeof postId !== 'string' || postId.length === 0) return fallback
  // Graph responde el post_id pelado, pero /published_posts —de donde salen las
  // métricas— los lista como `páginaID_postID`. Componerlo es lo que hace que las
  // dos mitades del sistema hablen del mismo post. Si ya viene compuesto, se deja.
  return postId.includes('_') ? postId : `${pageId}_${postId}`
}

/**
 * Only 'ready' and 'error' are verdicts. Everything else — processing, upload_complete,
 * an absent field — keeps waiting: same anti-guessing rule as Instagram's containers.
 */
export function classifyVideoStatus(
  payload: Record<string, unknown>,
): 'ready' | 'processing' | 'error' {
  const status = (payload.status as { video_status?: string } | undefined)?.video_status
  if (status === 'ready') return 'ready'
  if (status === 'error') return 'error'
  return 'processing'
}

/**
 * El estado de una historia en video, entre la subida y el `finish`. Se espera solo a que la
 * subida termine: la guía de Meta no pide esperar el procesamiento antes de cerrar, y el
 * procesamiento de una historia sigue después del `finish`. Cualquier fase en `error`, o el
 * video vencido, es un rechazo.
 */
export function classifyStoryUpload(payload: Record<string, unknown>): 'uploaded' | 'uploading' | 'error' {
  const status = payload.status as Record<string, unknown> | undefined
  if (!status) return 'uploading'
  if (status.video_status === 'error' || status.video_status === 'expired') return 'error'
  const fase = (nombre: string) => (status[nombre] as { status?: string } | undefined)?.status
  if (['uploading_phase', 'processing_phase', 'publishing_phase'].some((f) => fase(f) === 'error')) return 'error'
  return fase('uploading_phase') === 'complete' ? 'uploaded' : 'uploading'
}

/** El `post_id` de una historia publicada: Meta lo documenta como número y como texto. */
export function postIdDeHistoria(payload: Record<string, unknown> | null): string | null {
  const id = payload?.post_id
  if (typeof id === 'number') return String(id)
  return typeof id === 'string' && id.length > 0 ? id : null
}

/** One /feed post cannot attach a video alongside photos; refusing beats surprising. */
export function hasMixedMedia(media: PublishMedia[]): boolean {
  return media.some((m) => m.mediaType === 'video') && media.some((m) => m.mediaType === 'image')
}

const GRAPH = 'https://graph.facebook.com/v23.0'

/**
 * /videos no acepta una URL de portada — `thumb` viaja en bytes. La portada ya
 * vive en nuestro Blob; si su descarga falla, el video sale sin ella (best-effort:
 * jamás se sacrifica el video por la portada) y el motivo queda en el log.
 */
async function fetchCoverBlob(coverUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(coverUrl, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) {
      console.error('Portada de Facebook:', response.status, coverUrl.slice(0, 200))
      return null
    }
    return await response.blob()
  } catch (error) {
    console.error('Portada de Facebook:', String(error).slice(0, 300))
    return null
  }
}

// Same shape as the Instagram publisher's postForm, duplicated on purpose — the
// connectors already set that precedent, and sharing it would couple two networks'
// error logs. Upstream bodies go to the log; callers only see fixed sentences.
async function postForm(
  url: string,
  params: Record<string, string>,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(url, {
    method: 'POST',
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(PLAZO_RED_MS),
  })
  if (!response.ok) {
    console.error('Facebook publish:', response.status, (await response.text()).slice(0, 300))
    return null
  }
  return response.json()
}

/**
 * La subida de una historia en video: se le pasa a Meta la URL del almacén (`file_url`) y Meta
 * la descarga por su cuenta, como en `/videos`.
 */
async function subirHistoria(uploadUrl: string, token: string, fileUrl: string): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `OAuth ${token}`, file_url: fileUrl },
      signal: AbortSignal.timeout(PLAZO_RED_MS),
    })
    if (!response.ok) {
      console.error('Facebook historia, subida:', response.status, (await response.text()).slice(0, 300))
      return false
    }
    return true
  } catch (error) {
    console.error('Facebook historia, subida:', String(error).slice(0, 300))
    return false
  }
}

/**
 * Una historia de la página. La foto sube sin publicar (`published=false`) y `/photo_stories`
 * la cuelga, en la misma corrida. El video va en tres pasos: `start` da el id y la dirección de
 * subida, se sube, y queda procesando con ese id; la corrida siguiente mira el estado y, con la
 * subida completa, el `finish` lo publica (`seguirHistoria`).
 */
async function publicarHistoria(input: PublishInput, media: PublishMedia): Promise<PublishOutcome> {
  const page = input.accountExternalId
  if (media.mediaType === 'image') {
    const foto = await postForm(`${GRAPH}/${page}/photos`, {
      ...unpublishedPhotoParams(media),
      access_token: input.token,
    })
    const photoId = foto?.id
    if (typeof photoId !== 'string') return { kind: 'failed', reason: FACEBOOK_HISTORIA_RECHAZADA }
    const historia = await postForm(`${GRAPH}/${page}/photo_stories`, { photo_id: photoId, access_token: input.token })
    const postId = postIdDeHistoria(historia)
    if (!postId) return { kind: 'failed', reason: FACEBOOK_HISTORIA_RECHAZADA }
    return { kind: 'published', externalId: postId }
  }

  const inicio = await postForm(`${GRAPH}/${page}/video_stories`, { upload_phase: 'start', access_token: input.token })
  const videoId = inicio?.video_id
  const uploadUrl = inicio?.upload_url
  if (typeof videoId !== 'string' || typeof uploadUrl !== 'string') {
    return { kind: 'failed', reason: PUBLISH_NETWORK_ERROR }
  }
  if (!(await subirHistoria(uploadUrl, input.token, media.url))) return { kind: 'failed', reason: PUBLISH_NETWORK_ERROR }
  return { kind: 'processing', containerId: videoId }
}

/** La corrida siguiente de una historia en video: esperar la subida y cerrarla. */
async function seguirHistoria(input: PublishInput, videoId: string): Promise<PublishOutcome> {
  let payload: Record<string, unknown>
  try {
    const response = await fetch(`${GRAPH}/${videoId}?fields=status&access_token=${input.token}`, {
      signal: AbortSignal.timeout(PLAZO_RED_MS),
    })
    if (!response.ok) {
      console.error('Facebook historia, estado:', response.status, (await response.text()).slice(0, 300))
      return { kind: 'processing', containerId: videoId }
    }
    payload = (await response.json()) as Record<string, unknown>
  } catch (error) {
    console.error('Facebook historia, estado:', String(error).slice(0, 300))
    return { kind: 'processing', containerId: videoId }
  }
  const estado = classifyStoryUpload(payload)
  if (estado === 'error') return { kind: 'failed', reason: FACEBOOK_HISTORIA_RECHAZADA }
  if (estado === 'uploading') return { kind: 'processing', containerId: videoId }

  const fin = await postForm(`${GRAPH}/${input.accountExternalId}/video_stories`, {
    upload_phase: 'finish',
    video_id: videoId,
    access_token: input.token,
  })
  const postId = postIdDeHistoria(fin)
  // Sin respuesta no se sabe si salió: se guarda el id para no subir una segunda copia.
  if (!postId) return { kind: 'failed', reason: FACEBOOK_HISTORIA_RECHAZADA, containerId: videoId }
  return { kind: 'published', externalId: postId }
}

export const facebookPublisher: Publisher = {
  network: 'facebook',

  async publish(input: PublishInput): Promise<PublishOutcome> {
    const token = input.token
    const historia = esHistoria(input.opciones)

    // Una historia en video que quedó esperando: su id no es el de un video del feed, y se
    // distingue por las opciones del destino, no por el id.
    if (input.containerId && historia) return seguirHistoria(input, input.containerId)

    // Resuming: a previous run posted the video and Facebook was still processing it.
    if (input.containerId) {
      let payload: Record<string, unknown>
      try {
        const response = await fetch(
          `${GRAPH}/${input.containerId}?fields=status,post_id&access_token=${token}`,
          { signal: AbortSignal.timeout(PLAZO_RED_MS) },
        )
        if (!response.ok) {
          console.error('Facebook video status:', response.status, (await response.text()).slice(0, 300))
          // A poll that didn't answer says nothing about the video: stay parked instead of
          // failing — a retry from scratch would upload a second public copy. The 24h stale
          // cut still bounds how long this can wait.
          return { kind: 'processing', containerId: input.containerId }
        }
        payload = (await response.json()) as Record<string, unknown>
      } catch (error) {
        // Lo mismo si la consulta se cortó (el plazo, la red).
        console.error('Facebook video status:', String(error).slice(0, 300))
        return { kind: 'processing', containerId: input.containerId }
      }
      const verdict = classifyVideoStatus(payload)
      if (verdict === 'error') return { kind: 'failed', reason: FACEBOOK_REJECTED }
      if (verdict === 'processing') return { kind: 'processing', containerId: input.containerId }
      return { kind: 'published', externalId: idDelFeed(payload, input.accountExternalId, input.containerId) }
    }

    const media = [...input.media].sort((a, b) => a.position - b.position)

    if (historia && media.length === 1) return publicarHistoria(input, media[0]!)

    // A text-only post goes straight to /feed — the gift the per-target validation
    // paid for when Threads and X made file-less posts legal.
    if (media.length === 0) {
      const data = await postForm(`${GRAPH}/${input.accountExternalId}/feed`, {
        message: input.caption,
        access_token: token,
      })
      const id = data?.id
      if (typeof id !== 'string') return { kind: 'failed', reason: FACEBOOK_REJECTED }
      return { kind: 'published', externalId: id }
    }

    if (hasMixedMedia(media)) return { kind: 'failed', reason: FACEBOOK_MIXED_MEDIA }

    // Single video: /videos answers with the id right away and processes on its own;
    // parking on it reuses the same state machine as Instagram's containers.
    if (media.length === 1 && media[0]!.mediaType === 'video') {
      const params = { ...videoPostParams(input.caption, media[0]!), access_token: token }
      const cover = input.coverUrl ? await fetchCoverBlob(input.coverUrl) : null
      let data: Record<string, unknown> | null
      if (cover) {
        const form = new FormData()
        for (const [key, value] of Object.entries(params)) form.set(key, value)
        form.set('thumb', cover, 'portada.jpg')
        const response = await fetch(`${GRAPH}/${input.accountExternalId}/videos`, {
          method: 'POST',
          body: form,
          signal: AbortSignal.timeout(PLAZO_RED_MS),
        })
        if (!response.ok) {
          console.error('Facebook publish:', response.status, (await response.text()).slice(0, 300))
          data = null
        } else {
          data = await response.json()
        }
      } else {
        data = await postForm(`${GRAPH}/${input.accountExternalId}/videos`, params)
      }
      const id = data?.id
      if (typeof id !== 'string') return { kind: 'failed', reason: PUBLISH_NETWORK_ERROR }
      return { kind: 'processing', containerId: id }
    }

    // Single photo publishes in one call.
    if (media.length === 1) {
      const data = await postForm(`${GRAPH}/${input.accountExternalId}/photos`, {
        ...photoPostParams(input.caption, media[0]!),
        access_token: token,
      })
      const id = data?.id
      if (typeof id !== 'string') return { kind: 'failed', reason: FACEBOOK_REJECTED }
      // /photos answers with the photo's own id; its `post_id` is the feed story.
      return { kind: 'published', externalId: idDelFeed(data, input.accountExternalId, id) }
    }

    // Several photos: upload each unpublished, then one /feed post attaches them all.
    const fbids: string[] = []
    for (const item of media) {
      const data = await postForm(`${GRAPH}/${input.accountExternalId}/photos`, {
        ...unpublishedPhotoParams(item),
        access_token: token,
      })
      const id = data?.id
      if (typeof id !== 'string') return { kind: 'failed', reason: PUBLISH_NETWORK_ERROR }
      fbids.push(id)
    }
    const post = await postForm(`${GRAPH}/${input.accountExternalId}/feed`, {
      ...multiPhotoFeedParams(input.caption, fbids),
      access_token: token,
    })
    const postId = post?.id
    if (typeof postId !== 'string') return { kind: 'failed', reason: FACEBOOK_REJECTED }
    return { kind: 'published', externalId: postId }
  },
}
