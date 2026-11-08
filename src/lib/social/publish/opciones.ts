// Lo que cada red obliga o deja elegir por destino antes de publicar. TikTok, Instagram,
// Facebook y YouTube tienen algo hoy; la unión crece red por red y el resto del sistema solo
// transporta el objeto.

import type { CuentaDestino } from '../cuentas'

export type PrivacidadTikTok = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'
export type ComercialTikTok = 'no' | 'marca_propia' | 'patrocinado'

export type OpcionesTikTok =
  | { modo: 'borrador' }
  | {
      modo: 'directo'
      privacidad: PrivacidadTikTok
      comentarios: boolean
      duo: boolean
      pegar: boolean
      comercial: ComercialTikTok
      /**
       * Hecho con IA: TikTok le pone la etiqueta «Creator labeled as AI-generated» (`is_aigc`).
       * Opcional y solo cuando está encendido, para que lo guardado antes siga igual.
       */
      ia?: true
      /**
       * Música de TikTok: TikTok le pone a las fotos una canción recomendada, que la persona
       * puede cambiar después en la app (`auto_add_music`). Solo existe en fotos publicadas
       * directo: en un video o en la bandeja no se manda aunque esté guardada. Opcional y solo
       * cuando está encendida, como `ia`.
       */
      musica?: true
    }

/**
 * Instagram: un reel puede salir como trial reel —solo lo ven quienes no siguen la cuenta,
 * hasta que el dueño lo comparte con todos desde la app de Instagram—. La graduación no
 * viaja: el publicador manda siempre `MANUAL` (decisión del dueño, 2026-09-28). El día
 * que se quiera que decida Instagram, es un campo opcional acá con `manual` por defecto,
 * y lo ya guardado sigue valiendo.
 */
export type OpcionesInstagram = { trialReel?: true; musica?: MusicaInstagram } | { historia: Historia }

/**
 * «Música de Instagram»: una canción de la biblioteca de Instagram que se le pega al reel al
 * crear su contenedor (`audio_configuration`, Audio API de Meta, 2026-06-01). Se guarda lo que
 * hace falta para publicar —el id— y lo que hace falta para nombrarla sin volver a preguntarle a
 * Meta —título y artista—; el link de la muestra no, porque vence en día y medio.
 *
 * Los volúmenes van de 1 a 100, como los pide Meta: `volumenMusica` es el de la canción y
 * `volumenVideo` el del sonido propio del video, para que la canción no tape la voz.
 *
 * Solo viaja en un reel: un video solo, con login de Facebook. Con fotos o carrusel no se manda
 * aunque esté guardada (como la música de TikTok en un video), y una historia no la lleva.
 * Otro módulo («Qué te funciona») cuenta como «con música» un destino cuyas opciones tengan un
 * `musica` verdadero —el `true` de TikTok o este objeto—: la clave no se renombra.
 */
export type MusicaInstagram = {
  audioId: string
  titulo: string
  artista: string | null
  volumenMusica: number
  volumenVideo: number
}

/** Facebook solo pide algo cuando el post es una historia de la página. */
export type OpcionesFacebook = { historia: Historia }

/**
 * Una historia de Instagram o de Facebook. Suelta es `true`; parte de una secuencia que sale
 * en orden lleva la secuencia que comparten todas y su lugar en ella, desde 1. Cada historia
 * es su propio post con un solo archivo: una que falla no arrastra a las demás.
 */
export type Historia = true | { secuencia: string; orden: number }

/**
 * YouTube: quién lo ve, si es contenido hecho o alterado con IA, y una playlist del canal donde
 * agregarlo. Todo opcional y guardado solo cuando no es lo de siempre —público, sin IA, sin
 * playlist—, para que un destino sin opciones siga diciendo exactamente eso, como antes de que
 * existieran. Nada de esto pide un permiso de Google nuevo: `videos.insert` lo lleva en
 * `status`, y `playlists.list` y `playlistItems.insert` van con `youtube.force-ssl`, que la app
 * ya tiene.
 */
export type OpcionesYoutube = {
  /** `status.privacyStatus` del video. Ausente es público. */
  visibilidad?: Exclude<VisibilidadYoutube, 'public'>
  /**
   * Hecho con IA: la declaración de contenido alterado o sintético de YouTube
   * (`status.containsSyntheticMedia`). Opcional y solo cuando está encendido, como en TikTok.
   */
  ia?: true
  /**
   * El id de una playlist del canal, para `playlistItems.insert` cuando el video sale. Solo el
   * id: el título se le pregunta a YouTube cuando hay que mostrarlo (`playlists-youtube.ts`) y
   * no se guarda, porque las políticas de la API de YouTube no dejan guardar sus datos sin
   * refrescarlos (`politica-youtube.ts`).
   */
  playlist?: string
}

export type VisibilidadYoutube = 'public' | 'unlisted' | 'private'

export type OpcionesDestino = OpcionesTikTok | OpcionesInstagram | OpcionesFacebook | OpcionesYoutube

export const PRIVACIDADES_TIKTOK: readonly PrivacidadTikTok[] = [
  'PUBLIC_TO_EVERYONE',
  'MUTUAL_FOLLOW_FRIENDS',
  'FOLLOWER_OF_CREATOR',
  'SELF_ONLY',
]

export const ETIQUETA_PRIVACIDAD: Record<PrivacidadTikTok, string> = {
  PUBLIC_TO_EVERYONE: 'Todos',
  MUTUAL_FOLLOW_FRIENDS: 'Amigos mutuos',
  FOLLOWER_OF_CREATOR: 'Seguidores',
  SELF_ONLY: 'Solo yo',
}

const COMERCIALES: readonly ComercialTikTok[] = ['no', 'marca_propia', 'patrocinado']

export const VISIBILIDADES_YOUTUBE: readonly VisibilidadYoutube[] = ['public', 'unlisted', 'private']

export const ETIQUETA_VISIBILIDAD_YOUTUBE: Record<VisibilidadYoutube, string> = {
  public: 'Público',
  unlisted: 'No listado',
  private: 'Privado',
}

/** Lo que dice cada visibilidad al elegirla, en el compositor y en el teléfono. */
export const AYUDA_VISIBILIDAD_YOUTUBE: Record<VisibilidadYoutube, string> = {
  public: 'Lo ve cualquiera en YouTube.',
  unlisted: 'Solo quien tenga el link: no sale en tu canal ni en las búsquedas.',
  private: 'Solo tú, desde YouTube Studio.',
}

/**
 * Las dos frases del interruptor «Hecho con IA» de YouTube, apagado y encendido. YouTube pide
 * declararlo cuando lo realista se hizo o se cambió con IA y podría pasar por real; una
 * animación evidente o un filtro de color no.
 */
export const IA_YOUTUBE_APAGADO =
  'Enciéndelo si el video muestra de forma realista una persona, un lugar o un hecho que se hizo o se cambió con IA: YouTube pide avisarlo.'
export const IA_YOUTUBE_ENCENDIDO = 'YouTube lo marcará como contenido alterado o sintético.'

/** El id de una playlist de YouTube: `PL…` las que hace una persona; las del sistema tienen otras formas. */
const PLAYLIST_ID = /^[A-Za-z0-9_-]{2,64}$/
const CLAVES_YOUTUBE = ['visibilidad', 'ia', 'playlist']

export const TIKTOK_SIN_PRIVACIDAD = 'TikTok necesita que elijas la privacidad.'
export const TIKTOK_PATROCINADO_PRIVADO = 'Un contenido patrocinado no puede ser privado.'
export const OPCIONES_ERROR = 'Las opciones de la red no se entendieron.'
export const TRIAL_REEL_MEDIA = 'Un trial reel es un solo video, sin fotos.'
export const HISTORIA_DESTINOS = 'Una historia va solo a Instagram y Facebook, y todos sus destinos son historia.'
export const HISTORIA_SIN_TEXTO = 'Una historia no lleva texto.'
export const HISTORIA_SIN_CLAVE = 'Una historia no tiene comentarios: no lleva palabra clave.'
export const HISTORIA_SIN_PORTADA = 'Una historia no lleva portada.'
export const HISTORIA_MEDIA = 'Una historia es un solo archivo, foto o video.'
export const HISTORIA_JPG = 'Instagram recibe la historia en foto solo en JPG.'
export const HISTORIA_TRIAL = 'Una historia no puede ser trial reel.'
export const HISTORIA_MUSICA = 'Una historia no lleva música de Instagram.'
export const MUSICA_LOGIN_INSTAGRAM =
  'La música de Instagram solo funciona en cuentas conectadas con Facebook, y esta se conectó con el login de Instagram.'

/** El volumen con que nace cada pista: el de Meta por defecto, el máximo. */
export const VOLUMEN_POR_DEFECTO = 100
const AUDIO_ID = /^[A-Za-z0-9_-]{1,64}$/
const MAX_NOMBRE_CANCION = 200
const CLAVES_MUSICA = ['audioId', 'titulo', 'artista', 'volumenMusica', 'volumenVideo']

/** Cuántas historias como mucho en una secuencia; Instagram no pone tope, esto es cordura. */
export const MAX_HISTORIAS_SECUENCIA = 30
const SECUENCIA = /^[A-Za-z0-9_-]{1,64}$/

/**
 * El aviso de una cuenta donde Meta ya rechazó un trial reel (`trial-reels.ts`): la frase del
 * rechazo, que nombra la cuenta y dice el porqué, o esta si no quedó ninguna.
 */
export const SIN_TRIAL_GENERICO = 'Instagram ya rechazó un trial reel en esta cuenta: prográmalo como reel normal.'

export function avisoSinTrial(motivo: string | null | undefined): string {
  return motivo?.trim() || SIN_TRIAL_GENERICO
}

const MAX_SERIALIZED = 2000

function esObjeto(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function esPrivacidad(value: unknown): value is PrivacidadTikTok {
  return typeof value === 'string' && (PRIVACIDADES_TIKTOK as readonly string[]).includes(value)
}

/** Ausente vale false; cualquier cosa que no sea booleano es un error de forma. */
function casilla(value: unknown): boolean | null {
  if (value === undefined) return false
  return typeof value === 'boolean' ? value : null
}

function validarTikTok(raw: unknown): { opciones: OpcionesTikTok } | { error: string } {
  if (raw === undefined || raw === null) return { error: TIKTOK_SIN_PRIVACIDAD }
  if (!esObjeto(raw)) return { error: OPCIONES_ERROR }
  if (JSON.stringify(raw).length > MAX_SERIALIZED) return { error: OPCIONES_ERROR }

  if (raw.modo === 'borrador') return { opciones: { modo: 'borrador' } }
  if (raw.modo !== 'directo') return { error: OPCIONES_ERROR }

  if (!esPrivacidad(raw.privacidad)) return { error: TIKTOK_SIN_PRIVACIDAD }
  const comentarios = casilla(raw.comentarios)
  const duo = casilla(raw.duo)
  const pegar = casilla(raw.pegar)
  const ia = casilla(raw.ia)
  const musica = casilla(raw.musica)
  if (comentarios === null || duo === null || pegar === null || ia === null || musica === null) {
    return { error: OPCIONES_ERROR }
  }
  const comercial = raw.comercial === undefined ? 'no' : raw.comercial
  if (!(COMERCIALES as readonly unknown[]).includes(comercial)) return { error: OPCIONES_ERROR }
  if (comercial === 'patrocinado' && raw.privacidad === 'SELF_ONLY') {
    return { error: TIKTOK_PATROCINADO_PRIVADO }
  }

  return {
    opciones: {
      modo: 'directo',
      privacidad: raw.privacidad,
      comentarios,
      duo,
      pegar,
      comercial: comercial as ComercialTikTok,
      ...(ia ? { ia: true as const } : {}),
      ...(musica ? { musica: true as const } : {}),
    },
  }
}

/**
 * Ausente o apagado es un reel normal y no se guarda nada; encendido se guarda tal cual.
 * Cualquier otra forma se rechaza —incluida una clave desconocida—: quien manda
 * `trialreel` mal escrito, o una `graduacion` que todavía no existe, tiene que enterarse,
 * no recibir un reel normal creyendo que pidió otra cosa. (TikTok ignora claves de más;
 * acá no, porque esta opción la manda sobre todo un modelo a ciegas.) Lo mismo vale para
 * `historia`, que excluye al trial reel y a la música. La música (`validarMusica`) sí va con
 * un trial reel: también es un reel.
 */
function validarInstagram(raw: unknown): { opciones: OpcionesInstagram | null } | { error: string } {
  if (raw === undefined || raw === null) return { opciones: null }
  if (!esObjeto(raw)) return { error: OPCIONES_ERROR }
  if (JSON.stringify(raw).length > MAX_SERIALIZED) return { error: OPCIONES_ERROR }
  for (const clave of Object.keys(raw)) {
    if (clave !== 'trialReel' && clave !== 'historia' && clave !== 'musica') return { error: OPCIONES_ERROR }
  }
  const trialReel = casilla(raw.trialReel)
  if (trialReel === null) return { error: OPCIONES_ERROR }
  const check = validarHistoria(raw.historia)
  if ('error' in check) return check
  const conMusica = validarMusica(raw.musica)
  if ('error' in conMusica) return conMusica
  const { musica } = conMusica
  if (check.historia !== null && trialReel) return { error: HISTORIA_TRIAL }
  if (check.historia !== null && musica) return { error: HISTORIA_MUSICA }
  if (check.historia !== null) return { opciones: { historia: check.historia } }
  if (!trialReel && !musica) return { opciones: null }
  return { opciones: { ...(trialReel ? { trialReel: true as const } : {}), ...(musica ? { musica } : {}) } }
}

/**
 * `musica`: ausente, `null` o `false` es sin música. Un objeto tiene que traer el id de la
 * canción y su título, que es lo que la nombra en el editor y en el calendario; el artista y
 * los volúmenes pueden faltar (sin artista, o los dos al máximo, como hace Meta). Un volumen
 * fuera de 1–100 o con decimales se rechaza, no se redondea: quien manda 0 seguramente quería
 * silencio, y Meta no lo admite. Una clave de más también, como en el resto de Instagram.
 */
function validarMusica(raw: unknown): { musica: MusicaInstagram | null } | { error: string } {
  if (raw === undefined || raw === null || raw === false) return { musica: null }
  if (!esObjeto(raw)) return { error: OPCIONES_ERROR }
  for (const clave of Object.keys(raw)) if (!CLAVES_MUSICA.includes(clave)) return { error: OPCIONES_ERROR }
  const { audioId, titulo, artista } = raw
  if (typeof audioId !== 'string' || !AUDIO_ID.test(audioId)) return { error: OPCIONES_ERROR }
  if (typeof titulo !== 'string' || !titulo.trim() || titulo.length > MAX_NOMBRE_CANCION) return { error: OPCIONES_ERROR }
  if (artista !== undefined && artista !== null && (typeof artista !== 'string' || artista.length > MAX_NOMBRE_CANCION)) {
    return { error: OPCIONES_ERROR }
  }
  const volumenMusica = volumen(raw.volumenMusica)
  const volumenVideo = volumen(raw.volumenVideo)
  if (volumenMusica === null || volumenVideo === null) return { error: OPCIONES_ERROR }
  return {
    musica: {
      audioId,
      titulo: titulo.trim(),
      artista: typeof artista === 'string' && artista.trim() ? artista.trim() : null,
      volumenMusica,
      volumenVideo,
    },
  }
}

/** Un volumen de Meta: entero de 1 a 100; ausente es el máximo. */
function volumen(raw: unknown): number | null {
  if (raw === undefined) return VOLUMEN_POR_DEFECTO
  return typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 100 ? raw : null
}

/**
 * La música de Instagram de un destino tal como quedó guardada, o null si no tiene (o si lo
 * guardado no se entiende). La leen el publicador, el resumen y la validación por cuenta.
 */
export function musicaDe(network: string, opciones: unknown): MusicaInstagram | null {
  if (network !== 'instagram') return null
  const check = validarInstagram(opciones)
  if ('error' in check || !check.opciones || !('musica' in check.opciones)) return null
  return check.opciones.musica ?? null
}

/** «Título» de Artista, o el título solo si no tiene artista. */
export function nombreDeCancion(m: Pick<MusicaInstagram, 'titulo' | 'artista'>): string {
  return m.artista ? `«${m.titulo}» de ${m.artista}` : `«${m.titulo}»`
}

/** Facebook: solo `historia`, con la misma forma que en Instagram. */
function validarFacebook(raw: unknown): { opciones: OpcionesFacebook | null } | { error: string } {
  if (raw === undefined || raw === null) return { opciones: null }
  if (!esObjeto(raw)) return { error: OPCIONES_ERROR }
  if (JSON.stringify(raw).length > MAX_SERIALIZED) return { error: OPCIONES_ERROR }
  for (const clave of Object.keys(raw)) if (clave !== 'historia') return { error: OPCIONES_ERROR }
  const check = validarHistoria(raw.historia)
  if ('error' in check) return check
  return { opciones: check.historia !== null ? { historia: check.historia } : null }
}

/**
 * YouTube: `visibilidad` (`public`, `unlisted` o `private`; ausente es `public`), `ia`
 * (booleano) y `playlist` (el id, o `null` sin playlist). Todo en lo de siempre es `null`: no se
 * guarda nada. Una clave desconocida se rechaza, como en Instagram: quien manda `privacidad` en
 * vez de `visibilidad` tiene que enterarse, no recibir un video público creyendo que era privado.
 */
function validarYoutube(raw: unknown): { opciones: OpcionesYoutube | null } | { error: string } {
  if (raw === undefined || raw === null) return { opciones: null }
  if (!esObjeto(raw)) return { error: OPCIONES_ERROR }
  if (JSON.stringify(raw).length > MAX_SERIALIZED) return { error: OPCIONES_ERROR }
  for (const clave of Object.keys(raw)) if (!CLAVES_YOUTUBE.includes(clave)) return { error: OPCIONES_ERROR }
  const visibilidad = raw.visibilidad === undefined ? 'public' : raw.visibilidad
  if (!(VISIBILIDADES_YOUTUBE as readonly unknown[]).includes(visibilidad)) return { error: OPCIONES_ERROR }
  const ia = casilla(raw.ia)
  if (ia === null) return { error: OPCIONES_ERROR }
  const { playlist } = raw
  if (playlist !== undefined && playlist !== null && (typeof playlist !== 'string' || !PLAYLIST_ID.test(playlist))) {
    return { error: OPCIONES_ERROR }
  }
  const opciones: OpcionesYoutube = {
    ...(visibilidad !== 'public' ? { visibilidad: visibilidad as Exclude<VisibilidadYoutube, 'public'> } : {}),
    ...(ia ? { ia: true as const } : {}),
    ...(typeof playlist === 'string' ? { playlist } : {}),
  }
  return { opciones: Object.keys(opciones).length > 0 ? opciones : null }
}

/**
 * Las opciones de YouTube de un destino tal como quedaron guardadas, o null si no tiene (o si lo
 * guardado no se entiende). Las leen el publicador, el resumen y el editor.
 */
export function youtubeDe(network: string, opciones: unknown): OpcionesYoutube | null {
  if (network !== 'youtube') return null
  const check = validarYoutube(opciones)
  return 'error' in check ? null : check.opciones
}

/**
 * `historia`: ausente o `false` es que no lo es; `true`, una suelta; un objeto, una de una
 * secuencia. Lo demás es un error de forma, como en el trial reel.
 */
function validarHistoria(raw: unknown): { historia: Historia | null } | { error: string } {
  if (raw === undefined || raw === false) return { historia: null }
  if (raw === true) return { historia: true }
  if (!esObjeto(raw)) return { error: OPCIONES_ERROR }
  for (const clave of Object.keys(raw)) if (clave !== 'secuencia' && clave !== 'orden') return { error: OPCIONES_ERROR }
  const { secuencia, orden } = raw
  if (typeof secuencia !== 'string' || !SECUENCIA.test(secuencia)) return { error: OPCIONES_ERROR }
  if (typeof orden !== 'number' || !Number.isInteger(orden) || orden < 1 || orden > MAX_HISTORIAS_SECUENCIA) {
    return { error: OPCIONES_ERROR }
  }
  return { historia: { secuencia, orden } }
}

/** Si estas opciones son de una historia. Acepta lo que venga de la base, sin validar. */
export function esHistoria(opciones: unknown): boolean {
  return esObjeto(opciones) && opciones.historia !== undefined && opciones.historia !== false
}

/**
 * La historia de un destino tal como quedó guardada, o null si no lo es (o si lo guardado no
 * se entiende). La leen el publicador, la parrilla y la regla de la secuencia.
 */
export function historiaDe(network: string, opciones: unknown): Historia | null {
  const check =
    network === 'instagram' ? validarInstagram(opciones) : network === 'facebook' ? validarFacebook(opciones) : null
  if (!check || 'error' in check || !check.opciones || !('historia' in check.opciones)) return null
  return check.opciones.historia
}

/**
 * Las opciones de un destino, ya limpias, o la frase que explica qué falta. Una red que
 * no pide nada solo acepta no recibir nada.
 */
export function validarOpciones(
  network: string,
  raw: unknown,
): { opciones: OpcionesDestino | null } | { error: string } {
  if (network === 'tiktok') return validarTikTok(raw)
  if (network === 'instagram') return validarInstagram(raw)
  if (network === 'facebook') return validarFacebook(raw)
  if (network === 'youtube') return validarYoutube(raw)
  if (raw === undefined || raw === null) return { opciones: null }
  return { error: OPCIONES_ERROR }
}

/**
 * Un post historia es historia en todos sus destinos, y en todos la misma: «reel en Instagram
 * e historia en Facebook» son dos posts. Se mira sobre las opciones ya limpias de la fila.
 */
function errorDeHistoriaEnDestinos(cuentas: CuentaDestino[], opciones: Record<string, OpcionesDestino>): string | null {
  const historias = cuentas.map((c) => opciones[c.id]).filter(esHistoria) as Array<{ historia: Historia }>
  if (historias.length === 0) return null
  if (historias.length !== cuentas.length) return HISTORIA_DESTINOS
  const primera = JSON.stringify(historias[0]!.historia)
  if (historias.some((h) => JSON.stringify(h.historia) !== primera)) return OPCIONES_ERROR
  return null
}

/**
 * Las opciones guardadas de un destino como las devuelve `GET /api/schedule/posts`: la forma
 * que se aceptó, con cada casilla de TikTok explícita —`ia` y `musica` en false incluidas— para que quien
 * programó a ciegas pueda comprobar qué quedó sin adivinar qué significa una clave ausente.
 * YouTube igual: con alguna opción, sus tres claves explícitas (`visibilidad`, `ia`, `playlist`).
 * Lo guardado ya pasó por `validarOpciones`; si una fila vieja no la pasara, sale tal cual.
 */
export function opcionesParaApi(network: string, guardadas: unknown): Record<string, unknown> | null {
  if (guardadas === undefined || guardadas === null) return null
  const check = validarOpciones(network, guardadas)
  if ('error' in check) return esObjeto(guardadas) ? guardadas : null
  const o = check.opciones
  if (o && 'modo' in o && o.modo === 'directo') return { ...o, ia: Boolean(o.ia), musica: Boolean(o.musica) }
  if (o && network === 'youtube') {
    const y = o as OpcionesYoutube
    return { visibilidad: y.visibilidad ?? 'public', ia: Boolean(y.ia), playlist: y.playlist ?? null }
  }
  return o
}

/**
 * Un trial reel es exactamente un video, sin fotos. Depende de la opción y no de la red,
 * por eso no vive en `validateScheduleDraft`: la aplican los cuatro caminos que crean
 * posts (lote, compositor, chequeo y creación del teléfono) sobre las opciones ya
 * resueltas por cuenta. `sinTipo` son los archivos cuyo tipo todavía no se conoce (una
 * URL de Drive antes de descargarla): uno solo puede ser el video, así que no se rechaza;
 * la re-validación con los tipos reales da el veredicto final.
 */
export function errorDeMediaPorOpciones(
  opciones: Record<string, OpcionesDestino>,
  conteos: { videos: number; fotos: number; sinTipo: number },
): string | null {
  if (Object.values(opciones).some(esHistoria)) {
    return conteos.videos + conteos.fotos + conteos.sinTipo === 1 ? null : HISTORIA_MEDIA
  }
  const hayTrial = Object.values(opciones).some((o) => 'trialReel' in o)
  if (!hayTrial) return null
  if (conteos.fotos > 0 || conteos.videos > 1) return TRIAL_REEL_MEDIA
  if (conteos.videos + conteos.sinTipo !== 1) return TRIAL_REEL_MEDIA
  return null
}

/**
 * Lo que una historia no lleva, más allá de los archivos: texto, palabra clave, portada, y —si
 * va a Instagram— una foto que no sea JPG (Meta no acepta otra y el almacén no convierte nada).
 * `fotos` son las extensiones de las fotos de tipo conocido; un archivo todavía sin tipo (un
 * link de Drive) no cuenta hasta que la re-validación lo descargue. El texto se rechaza en vez
 * de perderlo en silencio.
 */
export function errorDeHistoria(
  opciones: Record<string, OpcionesDestino>,
  post: {
    caption: string
    conPalabraClave: boolean
    conPortada?: boolean
    aInstagram: boolean
    fotos: readonly string[]
  },
): string | null {
  if (!Object.values(opciones).some(esHistoria)) return null
  if (post.caption.trim().length > 0) return HISTORIA_SIN_TEXTO
  if (post.conPalabraClave) return HISTORIA_SIN_CLAVE
  if (post.conPortada) return HISTORIA_SIN_PORTADA
  if (post.aInstagram && post.fotos.some((f) => f !== 'jpg' && f !== 'jpeg')) return HISTORIA_JPG
  return null
}

/**
 * Para una fila entera: un objeto por cuenta elegida, solo con las que tienen opciones.
 *
 * Por cuenta y no por red: la API de TikTok consulta `creator_info` por creador, y las
 * privacidades permitidas pueden diferir entre dos cuentas del mismo dueño. Compartirlas
 * dejaría mandar a una cuenta una privacidad que no admite, y eso se descubre publicando.
 *
 * Cuando el dueño tiene dos o más cuentas de la misma red, un bloque idéntico se repite
 * en pantalla por cada una y la frase fija («TikTok necesita que elijas la privacidad.»)
 * ya no dice a cuál se refiere. En ese caso, y solo en ese caso, se antepone el handle de
 * la cuenta que falló; con una sola cuenta de esa red nombrarla sería ruido.
 */
export function validarOpcionesPorCuenta(
  cuentas: CuentaDestino[],
  raw: Record<string, unknown>,
): { opciones: Record<string, OpcionesDestino> } | { error: string } {
  const cuentasPorRed = new Map<string, number>()
  for (const cuenta of cuentas) cuentasPorRed.set(cuenta.network, (cuentasPorRed.get(cuenta.network) ?? 0) + 1)

  const opciones: Record<string, OpcionesDestino> = {}
  for (const cuenta of cuentas) {
    const check = validarOpciones(cuenta.network, raw[cuenta.id])
    if ('error' in check) {
      const redAmbigua = (cuentasPorRed.get(cuenta.network) ?? 0) > 1
      return redAmbigua ? { error: `«${cuenta.handle ?? cuenta.network}»: ${check.error}` } : check
    }
    // La Audio API de Meta no existe con el login de Instagram (`instagram-login.ts`): el
    // compositor ni ofrece el bloque, pero la API y un borrador viejo pueden traerla.
    if (cuenta.login === 'instagram' && musicaDe(cuenta.network, check.opciones)) {
      const redAmbigua = (cuentasPorRed.get(cuenta.network) ?? 0) > 1
      return { error: redAmbigua ? `«${cuenta.handle ?? cuenta.network}»: ${MUSICA_LOGIN_INSTAGRAM}` : MUSICA_LOGIN_INSTAGRAM }
    }
    if (check.opciones) opciones[cuenta.id] = check.opciones
  }
  const historia = errorDeHistoriaEnDestinos(cuentas, opciones)
  if (historia) return { error: historia }
  return { opciones }
}

/**
 * Lo que el compositor manda, tal cual, listo para `validarOpcionesPorCuenta`. Los campos
 * de TikTok llevan el identificador de la cuenta como sufijo (`tiktokModo:<id>`) porque
 * puede haber dos bloques en el mismo formulario. Con TikTok marcado y sin campos, la
 * privacidad viaja vacía a propósito: así la validación responde con la frase de la
 * privacidad y no con la de la forma. El interruptor de Instagram (`instagramTrial:<id>`)
 * y la canción de «Música de Instagram» (`instagramMusica:<id>`, en JSON) siguen la misma
 * convención de sufijo por cuenta, y los tres campos de YouTube también (`youtubeDesdeFormulario`).
 */
export function opcionesDesdeFormularioPorCuenta(
  formData: FormData,
  cuentas: CuentaDestino[],
): Record<string, unknown> {
  const raw: Record<string, unknown> = {}
  for (const cuenta of cuentas) {
    if (cuenta.network === 'instagram') {
      // `Toggle` con `name` manda 'on' encendido y '' apagado; apagado no produce entrada.
      const trial = formData.get(`instagramTrial:${cuenta.id}`) === 'on'
      const musica = musicaDesdeCampo(formData.get(`instagramMusica:${cuenta.id}`))
      if (trial || musica !== undefined) {
        raw[cuenta.id] = { ...(trial ? { trialReel: true } : {}), ...(musica !== undefined ? { musica } : {}) }
      }
      continue
    }
    if (cuenta.network === 'youtube') {
      const youtube = youtubeDesdeFormulario(formData, cuenta.id)
      if (youtube) raw[cuenta.id] = youtube
      continue
    }
    if (cuenta.network !== 'tiktok') continue
    const modo = String(formData.get(`tiktokModo:${cuenta.id}`) ?? 'directo')
    raw[cuenta.id] =
      modo === 'borrador'
        ? { modo: 'borrador' }
        : {
            modo: 'directo',
            privacidad: String(formData.get(`tiktokPrivacidad:${cuenta.id}`) ?? ''),
            comentarios: formData.get(`tiktokComentarios:${cuenta.id}`) === 'on',
            duo: formData.get(`tiktokDuo:${cuenta.id}`) === 'on',
            pegar: formData.get(`tiktokPegar:${cuenta.id}`) === 'on',
            comercial: String(formData.get(`tiktokComercial:${cuenta.id}`) ?? 'no'),
            ia: formData.get(`tiktokIA:${cuenta.id}`) === 'on',
            // El interruptor solo se dibuja con fotos: con un video no llega y vale apagado.
            musica: formData.get(`tiktokMusica:${cuenta.id}`) === 'on',
          }
  }
  return raw
}

/**
 * El bloque de YouTube de una cuenta: `youtubeVisibilidad:<id>`, `youtubeIA:<id>` y
 * `youtubePlaylist:<id>` (el id, o vacío sin playlist). Si todo está en lo de siempre es
 * undefined: no hay nada que mandar. Lo que no se entiende viaja tal cual, para que la
 * validación lo rechace con su frase en vez de publicar con otra visibilidad.
 */
export function youtubeDesdeFormulario(formData: FormData, cuentaId: string): Record<string, unknown> | undefined {
  const visibilidad = String(formData.get(`youtubeVisibilidad:${cuentaId}`) ?? '')
  const ia = formData.get(`youtubeIA:${cuentaId}`) === 'on'
  const playlist = String(formData.get(`youtubePlaylist:${cuentaId}`) ?? '').trim()
  const raw: Record<string, unknown> = {
    ...(visibilidad && visibilidad !== 'public' ? { visibilidad } : {}),
    ...(ia ? { ia: true } : {}),
    ...(playlist ? { playlist } : {}),
  }
  return Object.keys(raw).length > 0 ? raw : undefined
}

/**
 * El campo oculto de «Música de Instagram» (`instagramMusica:<id>`): la canción elegida en JSON,
 * o vacío sin canción. Vacío o ausente es `undefined` —no hay nada que mandar—; un JSON que no
 * se entiende viaja como texto, para que la validación lo rechace con su frase en vez de
 * publicar sin la canción que la persona eligió.
 */
export function musicaDesdeCampo(valor: unknown): unknown {
  if (typeof valor !== 'string' || valor.trim() === '') return undefined
  try {
    return JSON.parse(valor) as unknown
  } catch {
    return valor
  }
}

/**
 * Lo que el compositor recuerda de cada cuenta de TikTok al programar: si sus fotos iban con
 * música (`social_accounts.tiktok_musica`), para que el interruptor nazca así la próxima vez.
 * Solo cuando el interruptor estaba a la vista —todo fotos y publicación directa—: un video o
 * un envío a la bandeja no dicen nada de lo que la persona quiere para sus fotos.
 */
export function musicaParaRecordar(
  opciones: Record<string, OpcionesDestino>,
  conteos: { videos: number; fotos: number },
): Array<{ cuentaId: string; musica: boolean }> {
  if (conteos.videos > 0 || conteos.fotos === 0) return []
  return Object.entries(opciones).flatMap(([cuentaId, o]) =>
    'modo' in o && o.modo === 'directo' ? [{ cuentaId, musica: Boolean(o.musica) }] : [],
  )
}

/**
 * Una línea para el editor y el calendario; null cuando no hay nada legible. `fotos` dice si
 * el post es todo fotos: la música de TikTok solo se nombra entonces, porque en un video no
 * viaja aunque haya quedado guardada. `unVideo` dice si es un video solo: la música de
 * Instagram solo se nombra entonces, por lo mismo al revés.
 */
export function resumenOpciones(network: string, opciones: unknown, fotos = false, unVideo = false): string | null {
  const historia = historiaDe(network, opciones)
  if (historia !== null) return historia === true ? 'Historia' : `Historia ${historia.orden} de una secuencia`
  if (network === 'instagram') {
    const check = validarInstagram(opciones)
    if ('error' in check || !check.opciones || 'historia' in check.opciones) return null
    const partes: string[] = []
    if (check.opciones.trialReel) partes.push('Trial reel — lo compartes tú desde Instagram')
    if (check.opciones.musica && unVideo) partes.push(`Con música de Instagram: ${nombreDeCancion(check.opciones.musica)}`)
    return partes.length > 0 ? partes.join(' · ') : null
  }
  if (network === 'youtube') {
    const y = youtubeDe(network, opciones)
    if (!y) return null
    return [
      ETIQUETA_VISIBILIDAD_YOUTUBE[y.visibilidad ?? 'public'],
      ...(y.ia ? ['hecho con IA'] : []),
      ...(y.playlist ? ['a una playlist'] : []),
    ].join(' · ')
  }
  if (network !== 'tiktok') return null
  const check = validarTikTok(opciones)
  if ('error' in check) return null
  const o = check.opciones
  if (o.modo === 'borrador') return 'Borrador a tu bandeja de TikTok'
  const comercial =
    o.comercial === 'no' ? 'sin comercial' : o.comercial === 'marca_propia' ? 'marca propia' : 'patrocinado'
  return [
    'Directo',
    ETIQUETA_PRIVACIDAD[o.privacidad],
    o.comentarios ? 'con comentarios' : 'sin comentarios',
    o.duo ? 'con dúo' : 'sin dúo',
    o.pegar ? 'con pegar' : 'sin pegar',
    comercial,
    ...(o.ia ? ['hecho con IA'] : []),
    ...(o.musica && fotos ? ['con música de TikTok'] : []),
  ].join(' · ')
}
