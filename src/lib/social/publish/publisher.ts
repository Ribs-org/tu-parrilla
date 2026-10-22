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
  /** El handle de la cuenta (`@vicente`), para nombrarla en las frases de error; null si no lo tiene. */
  cuenta?: string | null
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
  // `definitivo` lo ponen pocos sitios, y solo ante un rechazo que reintentar no cambia:
  // `createContainer` (instagram.ts) cuando `motivoDeRechazo` lo reconoció, el init de
  // TikTok cuando la app sin auditar choca con una cuenta pública (tiktok.ts), y `publishDue`
  // con lo que se venció, lo que se quedó sin intentos por cortes y las redes en
  // «Próximamente». Un `failed` sin `definitivo` es indistinguible del de siempre.
  //
  // `containerId` viaja cuando la red ya pudo haber recibido el post y el intento siguiente
  // tiene que mirar ese contenedor antes de rehacerlo: un `media_publish` de Instagram que no
  // contestó pudo haber publicado, y crear otro contenedor lo publicaría dos veces.
  //
  // `sinTrial` dice que la cuenta no acepta trial reels: lo pone `instagram.ts` cuando reconoce
  // el rechazo de elegibilidad, y `trial-reels.ts` lo anota en la cuenta.
  | { kind: 'failed'; reason: string; definitivo?: true; containerId?: string; sinTrial?: true }

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

// Every sentence the owner can see. Upstream detail goes to the server log, salvo en
// Instagram: ahí el rechazo nombra la cuenta y cita lo que Meta dijo (las funciones de abajo),
// porque «Instagram rechazó la publicación.» a secas no deja decidir si esperar, reconectar o
// cambiar el plan.
export const PUBLISH_REJECTED = 'Instagram rechazó la publicación.'
export const PUBLISH_NETWORK_ERROR = 'No se pudo hablar con la red. Se reintentará.'
export const NO_PUBLISH_TOKEN = 'La cuenta no está conectada. Reconéctala y reprograma.'
export const STALE_PROCESSING = 'La red no terminó de procesar el video.'
export const TOPE_INSTAGRAM = 'Instagram llegó a su tope de publicaciones por día: sale apenas se libere un cupo.'
export const PUBLICACION_CORTADA = 'La publicación se cortó a la mitad y ya no quedan intentos. Revisa el archivo y reprográmala.'

/**
 * Las colas fijas de los dos rechazos de un trial reel: la frase entera empieza con la cuenta
 * (`trialSinSeguidores`, `trialNoDisponible`). Las guías las citan así, con la cuenta delante.
 */
export const SIN_SEGUIDORES_PARA_TRIAL =
  'no tiene trial reels: Instagram los da solo a cuentas con un mínimo de seguidores, y esta no lo alcanza. Prográmalo como reel normal o en otra cuenta.'
export const TRIAL_REEL_NO_DISPONIBLE =
  'no tiene trial reels disponibles, probablemente porque Instagram no le habilitó la función. Prográmalo como reel normal o en otra cuenta.'

function alEmpezar(cuenta: string | null | undefined): string {
  return cuenta?.trim() || 'La cuenta'
}

/** Meta dijo, con su código, que a la cuenta le faltan seguidores para los trial reels. */
export function trialSinSeguidores(cuenta: string | null | undefined): string {
  return `${alEmpezar(cuenta)} ${SIN_SEGUIDORES_PARA_TRIAL}`
}

/**
 * Meta rechazó el trial reel hablando de trial reels, pero sin un código que digamos conocer:
 * el porqué es una suposición, y lo que Meta dijo va al final, para que se pueda corregir.
 */
export function trialNoDisponible(cuenta: string | null | undefined, explicacion: string | null): string {
  const base = `${alEmpezar(cuenta)} ${TRIAL_REEL_NO_DISPONIBLE}`
  return explicacion ? `${base} Instagram dice: ${explicacion}.` : base
}

/**
 * Cualquier otro rechazo de Instagram que traiga su explicación (`explicacionDeMeta`, en
 * instagram.ts). Se reintenta como antes —no sabemos si es pasajero—; lo que cambia es que se
 * lee qué pasó.
 */
export function rechazoDeInstagram(cuenta: string | null | undefined, explicacion: string): string {
  return `Instagram rechazó la publicación en ${cuenta?.trim() || 'la cuenta'}: ${explicacion}.`
}

export const MAX_PUBLISH_ATTEMPTS = 3
export const STALE_PROCESSING_HOURS = 24

/**
 * Cuánto se le espera a una llamada a la red antes de darla por perdida. Sin plazo, una
 * llamada colgada se llevaba la corrida entera hasta que Vercel la cortaba a los 240
 * segundos, sin anotar nada, y todo lo que venía detrás en la fila esperaba otra corrida.
 * La subida del video a YouTube y su descarga desde el almacén llevan plazos propios: son
 * los únicos pasos que mueven el archivo entero. La portada de YouTube lleva uno solo para
 * sus dos llamadas (bajarla y subirla).
 */
export const PLAZO_RED_MS = 30_000
export const PLAZO_DESCARGA_VIDEO_MS = 45_000
export const PLAZO_SUBIDA_VIDEO_MS = 120_000
export const PLAZO_PORTADA_MS = 20_000

/**
 * Lo más que puede tardar un intento de subir un video nuevo a YouTube, sumando los plazos
 * de cada paso: renovar el token, bajar el video, subirlo y ponerle la portada. Es el único
 * intento largo, y tiene que caber entero en una corrida (ver `alcanzaElTiempo`).
 */
export const PEOR_SUBIDA_YOUTUBE_MS = PLAZO_RED_MS + PLAZO_DESCARGA_VIDEO_MS + PLAZO_SUBIDA_VIDEO_MS + PLAZO_PORTADA_MS

/** Hasta cuándo una corrida puede empezar intentos, y antes de cuándo tienen que haber terminado. */
export type Plazos = { empezarHasta: number; terminarAntesDe: number }

/**
 * Si a la corrida todavía le alcanza el tiempo para empezar el intento de este destino.
 * Ninguno empieza pasado `empezarHasta`. Subir un video nuevo a YouTube empieza solo si todos
 * sus plazos caben antes de `terminarAntesDe`: cortado a la mitad, el video pudo quedar en el
 * canal sin que nadie lo anote, y el reintento subiría otro. Lo que no alcanza lo toma la
 * corrida siguiente, sin gastar intentos.
 */
export function alcanzaElTiempo(
  target: { network: string; containerId: string | null },
  plazos: Plazos,
  ahora: number,
): boolean {
  if (ahora > plazos.empezarHasta) return false
  const subidaNueva = target.network === 'youtube' && !target.containerId
  return !subidaNueva || ahora + PEOR_SUBIDA_YOUTUBE_MS <= plazos.terminarAntesDe
}

/**
 * Cuánto dura el reclamo de un destino (`reclamadoHasta`): bastante más que una corrida —el
 * cron se corta a los 240 segundos— para que una corrida viva nunca lo pierda, y poco para que
 * el destino de una corrida que murió vuelva pronto a la fila.
 */
export const RECLAMO_MS = 10 * 60_000

/**
 * Si una corrida tiene el destino entre manos ahora mismo. Mientras dura su reclamo el
 * destino sigue diciendo `scheduled`, así que su estado solo no alcanza para saber que está
 * saliendo: el editor y el borrado preguntan por esto antes de tocarlo.
 */
export function enVuelo(target: { reclamadoHasta?: Date | null }, now: Date): boolean {
  return target.reclamadoHasta != null && target.reclamadoHasta.getTime() > now.getTime()
}

/**
 * Lo que un rearme le escribe a un destino quemado —«Subir ahora», «Reprogramar», el
 * editor—: vuelve a `scheduled` sin intentos, sin error ni espera, y las 24 horas de
 * `publishing` se cuentan de nuevo. El contenedor se queda: el intento siguiente le pregunta
 * primero a la red cómo terminó el anterior —si salió, se anota sin publicar otra vez; si el
 * contenedor ya no sirve, empieza de cero—. Tirarlo subía el video otra vez aunque la red ya
 * lo tuviera.
 *
 * Y deja de estar archivado: lo que vuelve a la parrilla puede quemarse otra vez, y entonces
 * tiene que volver a pedir una acción en «Se quemó».
 */
export const REARME = {
  status: 'scheduled',
  attemptCount: 0,
  lastError: null,
  reintentarDesde: null,
  publicandoDesde: null,
  archivadoEn: null,
} as const

/**
 * Si el contenedor de un destino es un borrador que todavía no salió. En Instagram lo es: el
 * contenedor guarda el texto y los archivos, y sale recién con `media_publish`, así que si el
 * editor cambia el texto se puede tirar y armar otro. En YouTube, Facebook y TikTok el
 * contenedor es el video que ya se subió y la red está procesando para publicar: tirarlo por
 * un texto subiría una copia del mismo video.
 */
export function contenedorEsBorrador(network: string): boolean {
  return network === 'instagram'
}

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
    containerId: outcome.containerId ?? null,
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

/**
 * A target parked in 'publishing' must never wait forever: 24 hours is a verdict. Se mide
 * desde que el destino entró a `publishing` (`publicandoDesde`), no desde la hora del post:
 * ver `publishDue`.
 */
export function isStaleProcessing(desde: Date, now: Date): boolean {
  return now.getTime() - desde.getTime() >= STALE_PROCESSING_HOURS * 60 * 60 * 1000
}
