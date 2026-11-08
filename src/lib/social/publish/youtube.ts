import type { PublishMedia, PublishInput, PublishOutcome, Publisher } from './publisher'
import {
  PLAZO_DESCARGA_VIDEO_MS,
  PLAZO_PORTADA_MS,
  PLAZO_RED_MS,
  PLAZO_SUBIDA_VIDEO_MS,
  PUBLISH_NETWORK_ERROR,
} from './publisher'
import type { SocialAccount } from '@/db'
import { ARCHIVO_MUY_GRANDE, MAX_BYTES_ARCHIVO } from './limites'
import { getDb, socialAccounts } from '@/db'
import { eq } from 'drizzle-orm'
import { env } from '@/lib/env'
import { decryptToken, encryptToken } from '../crypto'
import { randomUUID } from 'node:crypto'

export const YOUTUBE_ONLY_VIDEO = 'YouTube solo recibe video.'
export const YOUTUBE_REJECTED = 'YouTube rechazó el video.'

const MAX_TITLE = 100

/** YouTube demands a non-empty title; an untitled post falls back to a plain word. */
export function youtubeTitle(caption: string): string {
  const firstLine = caption
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  return (firstLine ?? 'Video').slice(0, MAX_TITLE) || 'Video'
}

export function youtubeMetadata(caption: string): {
  snippet: { title: string; description: string }
  status: { privacyStatus: 'public'; selfDeclaredMadeForKids: false }
} {
  return {
    snippet: { title: youtubeTitle(caption), description: caption },
    // Business content, deliberately declared not-for-kids: the spec's default, and a
    // declaration YouTube requires on every upload.
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  }
}

export function singleVideo(media: PublishMedia[]): PublishMedia | null {
  if (media.length !== 1) return null
  const only = media[0]!
  return only.mediaType === 'video' ? only : null
}

/**
 * Only processed/failed/rejected/deleted are verdicts; anything else keeps waiting —
 * the same anti-guessing rule as the Meta publishers. An empty list is a verdict too:
 * a video that vanished from videos.list is never going to finish.
 */
export function classifyUploadStatus(
  payload: Record<string, unknown>,
): 'ready' | 'processing' | 'error' {
  const items = payload.items as Array<{ status?: { uploadStatus?: string } }> | undefined
  if (!items || items.length === 0) return 'error'
  const status = items[0]?.status?.uploadStatus
  if (status === 'processed') return 'ready'
  if (status === 'failed' || status === 'rejected' || status === 'deleted') return 'error'
  return 'processing'
}

/** The two-part multipart/related body videos.insert expects: metadata, then bytes. */
export function youtubeUploadBody(
  metadataJson: string,
  video: Uint8Array,
  boundary: string,
): Uint8Array {
  const encoder = new TextEncoder()
  const head = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataJson}\r\n--${boundary}\r\nContent-Type: video/*\r\n\r\n`,
  )
  const tail = encoder.encode(`\r\n--${boundary}--\r\n`)
  const body = new Uint8Array(head.length + video.length + tail.length)
  body.set(head, 0)
  body.set(video, head.length)
  body.set(tail, head.length + video.length)
  return body
}

/**
 * Best-effort a conciencia: cuando esto corre el video YA subió, así que un fallo
 * aquí (canal sin teléfono verificado → 403, portada ilegible, red) solo pierde la
 * portada — devolver failed reintentaría el insert y duplicaría el video público.
 * Se llama una sola vez, junto al insert; el camino de reanudación no la repite.
 */
async function setThumbnail(token: string, videoId: string, coverUrl: string): Promise<void> {
  // Un solo plazo para las dos llamadas: es parte de lo que la corrida le reserva al intento
  // (`PEOR_SUBIDA_YOUTUBE_MS`).
  const plazo = AbortSignal.timeout(PLAZO_PORTADA_MS)
  try {
    const cover = await fetch(coverUrl, { signal: plazo })
    if (!cover.ok) {
      console.error('Portada de YouTube:', cover.status, coverUrl.slice(0, 200))
      return
    }
    const response = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': cover.headers.get('content-type') ?? 'image/jpeg',
        },
        body: new Uint8Array(await cover.arrayBuffer()),
        signal: plazo,
      },
    )
    if (!response.ok) {
      console.error('Portada de YouTube:', response.status, (await response.text()).slice(0, 300))
    }
  } catch (error) {
    console.error('Portada de YouTube:', String(error).slice(0, 300))
  }
}

const REFRESH_WINDOW_MS = 5 * 60 * 1000

/**
 * Lo que dice la tarjeta del canal (`last_sync_error`) cuando Google ya no da acceso. Neutra a
 * propósito: el `invalid_grant` no dice si el dueño quitó Tu Parrilla en
 * myaccount.google.com/permissions o si el token venció solo, por seis meses sin usarse.
 */
export const YOUTUBE_REVOCADO = 'Google dejó de dar acceso a este canal: vuelve a conectar.'

/**
 * Si la respuesta de Google al renovar dice que el refresh token ya no sirve, y no que algo
 * tropezó. `invalid_grant` es «el token es inválido, venció o se revocó»: ningún reintento lo
 * arregla y solo reconectar da otro. Cualquier otra cosa —un 5xx, un `invalid_client` por una
 * variable mal puesta— no dice nada del canal, y desconectarlo por eso apagaría a todos.
 */
export function esTokenRevocado(status: number, cuerpo: string): boolean {
  if (status !== 400) return false
  try {
    return (JSON.parse(cuerpo) as { error?: unknown }).error === 'invalid_grant'
  } catch {
    return false
  }
}

/**
 * La credencial de escritura, o por qué no la hay: `revocada` si Google ya no da acceso, y
 * entonces la cuenta ya quedó desconectada; `sin` si no hay credencial o no se pudo renovar
 * ahora (la red, un 5xx), que no dice nada del canal.
 */
export type RenovacionYoutube = { token: string } | { revocada: true } | { sin: true }

/**
 * The write credential: OAuth, not the read-side API key. Refreshes itself when the
 * hourly token is about to die — Google's refresh answer carries no new refresh token,
 * so the stored one survives — and re-encrypts what it saves, like every credential
 * in this repo.
 *
 * Quitar Tu Parrilla desde la cuenta de Google no le avisa a Tu Parrilla: se sabe acá, cuando
 * Google contesta `invalid_grant`. Entonces la cuenta se desconecta como con «Desconectar»
 * —sin credenciales y con lo de YouTube borrado, porque desconectado no se refresca nunca y las
 * políticas no dejan guardarlo así— y con `YOUTUBE_REVOCADO` en la tarjeta. Pasa por acá todo lo
 * que usa el token: publicar, el sondeo de comentarios y, desde que lo revisa, la
 * sincronización diaria (`youtubeConnector.ensureCredential`).
 */
export async function renovarYoutube(account: SocialAccount): Promise<RenovacionYoutube> {
  if (!account.accessToken || !account.refreshToken) return { sin: true }
  const token = decryptToken(account.accessToken)

  const stillValid =
    account.expiresAt && account.expiresAt.getTime() - Date.now() > REFRESH_WINDOW_MS
  if (stillValid) return { token }

  const clientId = env('GOOGLE_CLIENT_ID')
  const clientSecret = env('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) return { token }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    signal: AbortSignal.timeout(PLAZO_RED_MS),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: decryptToken(account.refreshToken),
    }),
  })
  if (!response.ok) {
    const cuerpo = await response.text()
    console.error('Google refresh:', response.status, cuerpo.slice(0, 300))
    if (!esTokenRevocado(response.status, cuerpo)) return { sin: true }
    await soltarCanalRevocado(account, account.refreshToken)
    return { revocada: true }
  }
  const data = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) return { sin: true }

  await getDb()
    .update(socialAccounts)
    .set({
      accessToken: encryptToken(data.access_token),
      expiresAt: new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
    })
    .where(eq(socialAccounts.id, account.id))

  return { token: data.access_token }
}

/** `renovarYoutube` para quien solo necesita el token: publicar y el sondeo de comentarios. */
export async function ensureYoutubeCredential(account: SocialAccount): Promise<string | null> {
  const renovacion = await renovarYoutube(account)
  return 'token' in renovacion ? renovacion.token : null
}

/**
 * Desconecta el canal que Google ya no deja leer. Por import dinámico porque `desconectar.ts` es
 * solo de servidor y este archivo lo importan módulos puros con tests (`arreglo.ts`). Una fila
 * sin dueño —anterior a los usuarios— no se puede desconectar por dueño: se queda como está, y
 * su sondeo seguirá encontrando el mismo `invalid_grant` en el log.
 */
async function soltarCanalRevocado(account: SocialAccount, refreshToken: string): Promise<void> {
  if (!account.ownerId) return
  const { desconectarCuenta } = await import('../desconectar')
  const solto = await desconectarCuenta(account.ownerId, account.id, { motivo: YOUTUBE_REVOCADO, refreshToken })
  if (solto) {
    console.warn(`[youtube] ${account.handle ?? account.id}: Google ya no da acceso; quedó desconectada y sin lo de YouTube`)
  }
}

const UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart'

export const youtubePublisher: Publisher = {
  network: 'youtube',
  ensureCredential: ensureYoutubeCredential,

  async publish(input: PublishInput): Promise<PublishOutcome> {
    // Resuming: the video is uploaded and YouTube is still processing it.
    if (input.containerId) {
      let payload: Record<string, unknown>
      try {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=status&id=${input.containerId}`,
          { headers: { Authorization: `Bearer ${input.token}` }, signal: AbortSignal.timeout(PLAZO_RED_MS) },
        )
        if (!response.ok) {
          console.error('YouTube video status:', response.status, (await response.text()).slice(0, 300))
          // A poll that didn't answer says nothing about the video: stay parked instead of
          // failing — a retry from scratch would upload a second public copy. The 24h stale
          // cut still bounds how long this can wait.
          return { kind: 'processing', containerId: input.containerId }
        }
        payload = await response.json()
      } catch (error) {
        // Lo mismo si la consulta se cortó (el plazo, la red).
        console.error('YouTube video status:', String(error).slice(0, 300))
        return { kind: 'processing', containerId: input.containerId }
      }
      const verdict = classifyUploadStatus(payload)
      if (verdict === 'error') return { kind: 'failed', reason: YOUTUBE_REJECTED }
      if (verdict === 'processing') return { kind: 'processing', containerId: input.containerId }
      return { kind: 'published', externalId: input.containerId }
    }

    const video = singleVideo(input.media)
    if (!video) return { kind: 'failed', reason: YOUTUBE_ONLY_VIDEO }

    // Accepted window: if the function dies after Google takes the insert but before
    // the state patch lands, the next run re-uploads and the channel gets a duplicate.
    // The bytes travel inside this function (no file_url handoff like Facebook). El cron
    // empieza esta subida solo si todos sus plazos caben antes de su corte
    // (`alcanzaElTiempo`), así que la ventana queda para una caída de la función, o para
    // «Subir ahora», que corre sin ese presupuesto. Lo que la cierra es la subida
    // reanudable: ver `docs/deuda-tecnica.md`.
    const blob = await fetch(video.url, { signal: AbortSignal.timeout(PLAZO_DESCARGA_VIDEO_MS) })
    if (!blob.ok) {
      console.error('No se pudo leer el video del Blob:', blob.status)
      return { kind: 'failed', reason: PUBLISH_NETWORK_ERROR }
    }
    // El tamaño antes de bajarlo: el video entra entero en la memoria de la función, y uno
    // más grande que lo que se deja programar la tumba. Programar ya lo rechaza; esto cubre
    // lo que se programó antes de esa comprobación. Reintentar no lo achica: es definitivo.
    if (Number(blob.headers.get('content-length') ?? '0') > MAX_BYTES_ARCHIVO) {
      await blob.body?.cancel().catch(() => {})
      return { kind: 'failed', reason: ARCHIVO_MUY_GRANDE, definitivo: true }
    }
    const bytes = new Uint8Array(await blob.arrayBuffer())

    const boundary = `frontera-${randomUUID()}`
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      signal: AbortSignal.timeout(PLAZO_SUBIDA_VIDEO_MS),
      headers: {
        Authorization: `Bearer ${input.token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: youtubeUploadBody(JSON.stringify(youtubeMetadata(input.caption)), bytes, boundary) as BodyInit,
    })
    if (!response.ok) {
      console.error('YouTube upload:', response.status, (await response.text()).slice(0, 300))
      return { kind: 'failed', reason: YOUTUBE_REJECTED }
    }
    const data = (await response.json()) as { id?: string }
    if (typeof data.id !== 'string') return { kind: 'failed', reason: YOUTUBE_REJECTED }
    if (input.coverUrl) await setThumbnail(input.token, data.id, input.coverUrl)
    return { kind: 'processing', containerId: data.id }
  },
}
