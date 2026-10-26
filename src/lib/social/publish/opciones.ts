// Lo que cada red obliga a elegir por destino antes de publicar. TikTok, Instagram y Facebook
// piden algo hoy; la unión crece red por red y el resto del sistema solo transporta el objeto.

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
    }

/**
 * Instagram: un reel puede salir como trial reel —solo lo ven quienes no siguen la cuenta,
 * hasta que el dueño lo comparte con todos desde la app de Instagram—. La graduación no
 * viaja: el publicador manda siempre `MANUAL` (decisión del dueño, 2026-09-28). El día
 * que se quiera que decida Instagram, es un campo opcional acá con `manual` por defecto,
 * y lo ya guardado sigue valiendo.
 */
export type OpcionesInstagram = { trialReel: true } | { historia: Historia }

/** Facebook solo pide algo cuando el post es una historia de la página. */
export type OpcionesFacebook = { historia: Historia }

/**
 * Una historia de Instagram o de Facebook. Suelta es `true`; parte de una secuencia que sale
 * en orden lleva la secuencia que comparten todas y su lugar en ella, desde 1. Cada historia
 * es su propio post con un solo archivo: una que falla no arrastra a las demás.
 */
export type Historia = true | { secuencia: string; orden: number }

export type OpcionesDestino = OpcionesTikTok | OpcionesInstagram | OpcionesFacebook

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
  if (comentarios === null || duo === null || pegar === null || ia === null) return { error: OPCIONES_ERROR }
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
    },
  }
}

/**
 * Ausente o apagado es un reel normal y no se guarda nada; encendido se guarda tal cual.
 * Cualquier otra forma se rechaza —incluida una clave desconocida—: quien manda
 * `trialreel` mal escrito, o una `graduacion` que todavía no existe, tiene que enterarse,
 * no recibir un reel normal creyendo que pidió otra cosa. (TikTok ignora claves de más;
 * acá no, porque esta opción la manda sobre todo un modelo a ciegas.) Lo mismo vale para
 * `historia`, que excluye al trial reel.
 */
function validarInstagram(raw: unknown): { opciones: OpcionesInstagram | null } | { error: string } {
  if (raw === undefined || raw === null) return { opciones: null }
  if (!esObjeto(raw)) return { error: OPCIONES_ERROR }
  if (JSON.stringify(raw).length > MAX_SERIALIZED) return { error: OPCIONES_ERROR }
  for (const clave of Object.keys(raw)) if (clave !== 'trialReel' && clave !== 'historia') return { error: OPCIONES_ERROR }
  const trialReel = casilla(raw.trialReel)
  if (trialReel === null) return { error: OPCIONES_ERROR }
  const check = validarHistoria(raw.historia)
  if ('error' in check) return check
  if (check.historia !== null && trialReel) return { error: HISTORIA_TRIAL }
  if (check.historia !== null) return { opciones: { historia: check.historia } }
  return { opciones: trialReel ? { trialReel: true } : null }
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
 * que se aceptó, con cada casilla de TikTok explícita —`ia: false` incluida— para que quien
 * programó a ciegas pueda comprobar qué quedó sin adivinar qué significa una clave ausente.
 * Lo guardado ya pasó por `validarOpciones`; si una fila vieja no la pasara, sale tal cual.
 */
export function opcionesParaApi(network: string, guardadas: unknown): Record<string, unknown> | null {
  if (guardadas === undefined || guardadas === null) return null
  const check = validarOpciones(network, guardadas)
  if ('error' in check) return esObjeto(guardadas) ? guardadas : null
  const o = check.opciones
  if (o && 'modo' in o && o.modo === 'directo') return { ...o, ia: Boolean(o.ia) }
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
 * sigue la misma convención de sufijo por cuenta.
 */
export function opcionesDesdeFormularioPorCuenta(
  formData: FormData,
  cuentas: CuentaDestino[],
): Record<string, unknown> {
  const raw: Record<string, unknown> = {}
  for (const cuenta of cuentas) {
    if (cuenta.network === 'instagram') {
      // `Toggle` con `name` manda 'on' encendido y '' apagado; apagado no produce entrada.
      if (formData.get(`instagramTrial:${cuenta.id}`) === 'on') raw[cuenta.id] = { trialReel: true }
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
          }
  }
  return raw
}

/** Una línea para el editor y el calendario; null cuando no hay nada legible. */
export function resumenOpciones(network: string, opciones: unknown): string | null {
  const historia = historiaDe(network, opciones)
  if (historia !== null) return historia === true ? 'Historia' : `Historia ${historia.orden} de una secuencia`
  if (network === 'instagram') {
    const check = validarInstagram(opciones)
    return 'error' in check || !check.opciones ? null : 'Trial reel — lo compartes tú desde Instagram'
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
  ].join(' · ')
}
