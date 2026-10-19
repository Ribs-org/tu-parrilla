import type { TargetStatus } from '@/db/schema'
import type { SocialAccount } from '@/db'
import type { OpcionesDestino } from './opciones'

export type PublishMedia = { url: string; mediaType: 'image' | 'video'; position: number }

export type PublishInput = {
  caption: string
  media: PublishMedia[]
  containerId: string | null
  token: string
  accountExternalId: string
  /** Imagen de portada (URL del Blob) para los caminos de video; null si no hay. */
  coverUrl: string | null
  /** Lo que la red exigió elegir por destino (TikTok, Instagram); null en las redes que no piden nada. */
  opciones: OpcionesDestino | null
}

export type PublishOutcome =
  // `externalId` nulo cuando la red no entrega un id que cruce con el connector: el
  // borrador a la bandeja de TikTok publica "en la bandeja", no en el perfil.
  | { kind: 'published'; externalId: string | null }
  | { kind: 'processing'; containerId: string }
  // La red pidió esperar: se vuelve a intentar sin gastar intento, porque nada salió mal
  // con el post. Sin más datos, en la próxima corrida y sin motivo (el cupo por minuto de
  // TikTok). Con `esperaMs`, no antes de ese plazo; con `motivo`, el panel dice por qué
  // espera; con `containerId`, el contenedor ya hecho se guarda para no rehacerlo (el tope
  // diario de Instagram, que se cobra al publicar el contenedor, no al crearlo).
  | { kind: 'deferred'; esperaMs?: number; motivo?: string; containerId?: string }
  // `definitivo` lo ponen dos sitios, y solo ante un rechazo que reintentar no cambia:
  // `createContainer` (instagram.ts) cuando `motivoDeRechazo` lo reconoció, y el init de
  // TikTok cuando la app sin auditar choca con una cuenta pública (tiktok.ts). Un `failed`
  // sin `definitivo` es indistinguible del de siempre.
  | { kind: 'failed'; reason: string; definitivo?: true }

/** Adding a network in later phases is a file plus a line, same as Connector. */
export type Publisher = {
  network: string
  /** Write credential, when it differs from the connector's read credential. */
  ensureCredential?(account: SocialAccount): Promise<string | null>
  publish(input: PublishInput): Promise<PublishOutcome>
}

export type TargetPatch = {
  status: TargetStatus
  containerId: string | null
  externalId: string | null
  attemptCount: number
  lastError: string | null
  reintentarDesde: Date | null
}

// Every sentence the owner can see. Upstream detail goes to the server log only.
export const PUBLISH_REJECTED = 'Instagram rechazó la publicación.'
export const TRIAL_REEL_NO_DISPONIBLE = 'Instagram no permite trial reels en esta cuenta.'
export const PUBLISH_NETWORK_ERROR = 'No se pudo hablar con la red. Se reintentará.'
export const NO_PUBLISH_TOKEN = 'La cuenta no está conectada. Reconéctala y reprograma.'
export const STALE_PROCESSING = 'La red no terminó de procesar el video.'
export const TOPE_INSTAGRAM = 'Instagram llegó a su tope de publicaciones por día: sale apenas se libere un cupo.'

export const MAX_PUBLISH_ATTEMPTS = 3
export const STALE_PROCESSING_HOURS = 24

/**
 * Cuánto se espera después de cada intento fallido antes del siguiente: quince minutos
 * después del primero y dos horas después del segundo. Antes los tres intentos iban en
 * corridas seguidas y se gastaban en diez minutos, así que una red caída una hora quemaba
 * el post igual. Con estas esperas, un destino se quema recién unas dos horas y cuarto
 * después de su hora, y una caída de la red de hasta dos horas ya no lo pierde.
 */
export const ESPERAS_TRAS_FALLO_MS = [15 * 60_000, 2 * 60 * 60_000] as const

/**
 * The whole state machine in one pure spot. Waiting on Meta ('processing') spends no
 * attempt — attempts are for things that went wrong. Only the last allowed failure
 * lands on 'failed', which is also what makes the alert email fire exactly once — the
 * `due` query in run.ts only ever selects 'scheduled' or 'publishing', so once a target
 * reaches 'failed' this function never runs on it again for that rejection.
 *
 * `definitivo` short-circuits that count: a rejection the network already decided (today,
 * a recognised Instagram trial-reel rejection, or TikTok refusing a public account while
 * the app is unaudited) lands on 'failed' on this very attempt, no matter
 * how many are left. It still goes through the same 'failed' branch as the third
 * ordinary failure, so the email-fires-once property above holds unchanged — it is
 * still the transition into 'failed', and only into it, that sends the alert.
 *
 * `reintentarDesde` es el otro lado de la misma decisión: un fallo que todavía tiene
 * intentos espera `ESPERAS_TRAS_FALLO_MS` antes del siguiente, y una red que pidió esperar
 * con plazo (`deferred` con `esperaMs`) no se vuelve a probar antes. Todo lo demás la deja
 * nula, para que nada arrastre la espera de un intento viejo.
 */
export function resolveOutcome(outcome: PublishOutcome, attemptCount: number, now: Date): TargetPatch {
  if (outcome.kind === 'published') {
    return {
      status: 'published',
      containerId: null,
      externalId: outcome.externalId,
      attemptCount,
      lastError: null,
      reintentarDesde: null,
    }
  }
  if (outcome.kind === 'processing') {
    return {
      status: 'publishing',
      containerId: outcome.containerId,
      externalId: null,
      attemptCount,
      lastError: null,
      reintentarDesde: null,
    }
  }
  if (outcome.kind === 'deferred') {
    return {
      status: 'scheduled',
      containerId: outcome.containerId ?? null,
      externalId: null,
      attemptCount,
      lastError: outcome.motivo ?? null,
      reintentarDesde: outcome.esperaMs ? new Date(now.getTime() + outcome.esperaMs) : null,
    }
  }
  const attempts = attemptCount + 1
  const quemado = Boolean(outcome.definitivo) || attempts >= MAX_PUBLISH_ATTEMPTS
  const espera = ESPERAS_TRAS_FALLO_MS[Math.min(attempts, ESPERAS_TRAS_FALLO_MS.length) - 1]!
  return {
    status: quemado ? 'failed' : 'scheduled',
    containerId: null,
    externalId: null,
    attemptCount: attempts,
    lastError: outcome.reason,
    reintentarDesde: quemado ? null : new Date(now.getTime() + espera),
  }
}

/**
 * Qué media dejó de tener razón de existir en nuestro almacenamiento.
 *
 * La copia en el almacén existe para una sola cosa: entregarle el archivo a la red. Una
 * vez que TODOS los destinos publicaron, el video vive en Instagram, Facebook y
 * YouTube, y la nuestra solo ocupa espacio — con el 1 GB del Blob de antes, un mes de
 * parrilla lo llenaba, y así se cayó la carga masiva el 4 de septiembre; R2 tiene diez
 * veces eso, y a volumen se llenaría igual.
 *
 * Las fotos y la portada se conservan a propósito: pesan cientos de kilobytes contra
 * decenas de megabytes, y son lo que el editor muestra de un post que ya salió.
 * Mientras un solo destino siga pendiente, no se toca nada: podría reintentarse.
 *
 * Lo que se borra no se olvida: el post cuenta sus videos liberados (`videosLiberados`),
 * y su corte sigue siendo el de un video.
 */
export function mediaParaBorrar<T extends { mediaType: string }>(
  targets: Array<{ status: string }>,
  media: T[],
): T[] {
  const publicado = targets.length > 0 && targets.every((t) => t.status === 'published')
  return publicado ? media.filter((m) => m.mediaType === 'video') : []
}

/** A target parked in 'publishing' must never wait forever: 24 hours is a verdict. */
export function isStaleProcessing(updatedAt: Date, now: Date): boolean {
  return now.getTime() - updatedAt.getTime() >= STALE_PROCESSING_HOURS * 60 * 60 * 1000
}
