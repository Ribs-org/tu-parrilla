import { NOMBRE_RED, type CuentaApp } from './tipos'

export const MAX_BYTES = 500 * 1024 * 1024
export const MAX_ARCHIVOS = 10

export const TIPO_NO_PUBLICABLE = 'Ese tipo de archivo no se puede publicar.'
export const ARCHIVO_MUY_GRANDE = 'El archivo supera los 500 MB.'
export const SIN_SENAL = 'No se pudo conectar. Revisa tu señal.'
export const SIN_SENAL_SUBIDA = 'No se pudo subir el archivo. Revisa tu señal.'
/** Copia la frase del servidor (src/lib/mobile-api.ts): la app tiene que reconocerla. */
export const ARCHIVO_FALTANTE = 'Falta subir un archivo.'

// Las mismas extensiones que `tipoDesdeNombre` en el sitio (src/lib/social/publish/batch.ts),
// con los tipos que la subida acepta (`typeFromContentType`, en el mismo archivo): el selector de
// Android a veces entrega mimeType vacío para un .mov. Lo compara `src/lib/telefono-copias.test.ts`.
const TIPO_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

/**
 * Los formatos que la subida acepta: los de `typeFromContentType` en el sitio. Lo demás —un HEIC
 * de Android, un 3GP— se dice al elegirlo, y no después, cuando la subida falla.
 */
const SUBTIPOS: Record<'image' | 'video', ReadonlySet<string>> = {
  image: new Set(['jpeg', 'png', 'gif', 'webp']),
  video: new Set(['mp4', 'quicktime', 'webm']),
}

/** El tipo declarado, canónico si se publica; null si no. */
function tipoPublicable(declarado: string): string | null {
  const [clase, crudo = ''] = declarado.split('/')
  if (clase !== 'image' && clase !== 'video') return null
  // `image/jpg` no es un tipo registrado, pero hay galerías que lo mandan. El servidor firma la
  // subida con el canónico, y el PUT tiene que llevar el mismo.
  const subtipo = crudo === 'jpg' ? 'jpeg' : crudo
  return SUBTIPOS[clase].has(subtipo) ? `${clase}/${subtipo}` : null
}

export type Elegido = {
  uri: string
  nombre: string
  tipo: string
  bytes: number
  mediaType: 'image' | 'video'
}

/**
 * Lo que la app necesita saber de un archivo elegido, resuelto una vez: el tipo (del
 * selector o de la extensión), el nombre (del selector o de la uri) y el tamaño. Un
 * tamaño desconocido no bloquea: el servidor es la puerta; acá solo se evita pedir una
 * URL que sabemos que va a negar.
 */
export function describirArchivo(asset: {
  uri: string
  fileName?: string | null
  mimeType?: string | null
  fileSize?: number | null
}): Elegido | { error: string } {
  const nombre = asset.fileName?.trim() || asset.uri.split('/').pop() || 'archivo'
  const extension = nombre.split('.').pop()?.toLowerCase() ?? ''
  const declarado = asset.mimeType?.split(';')[0]?.trim().toLowerCase() ?? ''
  // Lo que dice el selector manda; la extensión, solo si el selector no dijo nada de media.
  const tipo =
    declarado.startsWith('image/') || declarado.startsWith('video/')
      ? tipoPublicable(declarado)
      : (TIPO_POR_EXTENSION[extension] ?? null)
  if (!tipo) return { error: TIPO_NO_PUBLICABLE }
  const bytes = asset.fileSize ?? 0
  if (bytes > MAX_BYTES) return { error: ARCHIVO_MUY_GRANDE }
  return { uri: asset.uri, nombre, tipo, bytes, mediaType: tipo.startsWith('video/') ? 'video' : 'image' }
}

/**
 * Un archivo de Publicar. Se sube apenas se elige —como en el compositor del panel— para
 * que el borrador lo pueda guardar. Uno que llega de un borrador ya está subido y no tiene
 * `local`: no hay desde dónde volver a subirlo.
 */
export type Archivo = {
  /** Única en la pantalla: la clave de React y la de la subida en curso. */
  clave: string
  nombre: string
  mediaType: 'image' | 'video'
  /** Lo que muestra la miniatura: el archivo del teléfono, o la URL si vino de un borrador. */
  vista: string
  local: Elegido | null
  /** La URL en R2; null mientras no termina de subir. */
  url: string | null
  estado: 'subiendo' | 'listo' | 'fallo'
  progreso: number
  error: string | null
}

let claves = 0

function nuevaClave(): string {
  claves += 1
  return `archivo-${claves}`
}

/** Un archivo recién elegido: entra a la cola de subida. */
export function archivoElegido(elegido: Elegido): Archivo {
  return {
    clave: nuevaClave(),
    nombre: elegido.nombre,
    mediaType: elegido.mediaType,
    vista: elegido.uri,
    local: elegido,
    url: null,
    estado: 'subiendo',
    progreso: 0,
    error: null,
  }
}

/** Un archivo de un borrador: ya está en R2. */
export function archivoDelBorrador(media: { url: string; mediaType: 'image' | 'video'; nombre: string }): Archivo {
  return {
    clave: nuevaClave(),
    nombre: media.nombre,
    mediaType: media.mediaType,
    vista: media.url,
    local: null,
    url: media.url,
    estado: 'listo',
    progreso: 1,
    error: null,
  }
}

export type MediaSubida = { url: string; mediaType: 'image' | 'video'; nombre: string }

/** Los que ya están en R2, en el orden elegido: lo único que un borrador o un post pueden llevar. */
export function subidos(archivos: Archivo[]): MediaSubida[] {
  return archivos.flatMap((a) => (a.url ? [{ url: a.url, mediaType: a.mediaType, nombre: a.nombre }] : []))
}

/** Si algún archivo todavía no está listo para programar: subiendo o con la subida caída. */
export function hayPendientes(archivos: Archivo[]): boolean {
  return archivos.some((a) => a.estado !== 'listo')
}

/** Qué decir de las subidas bajo los botones, o null si no hay nada pendiente. */
export function estadoSubidas(archivos: Archivo[]): { texto: string; error: boolean } | null {
  const caido = archivos.find((a) => a.estado === 'fallo')
  if (caido) return { texto: `${caido.error ?? SIN_SENAL_SUBIDA} Toca el archivo para reintentar.`, error: true }
  const pendientes = archivos.filter((a) => a.estado === 'subiendo').length
  if (pendientes === 0) return null
  return { texto: pendientes === 1 ? 'Subiendo el archivo…' : `Subiendo ${pendientes} archivos…`, error: false }
}

/**
 * Lo que dice la miniatura de un archivo que no está listo. Se suben de a uno y en orden,
 * así que el primero que está subiendo es el que avanza; los demás esperan.
 */
export function notaDeArchivo(archivos: Archivo[], indice: number): string | null {
  const archivo = archivos[indice]
  if (!archivo || archivo.estado === 'listo') return null
  if (archivo.estado === 'fallo') return 'Reintentar'
  const enCurso = archivos.findIndex((a) => a.estado === 'subiendo')
  return enCurso === indice ? `${Math.round(archivo.progreso * 100)} %` : 'En cola'
}

/**
 * El servidor dijo que falta un archivo: el barrido de huérfanos borra a la hora lo que nada
 * nombra, y un archivo que nunca alcanzó a entrar a un borrador pudo irse. Los del teléfono
 * vuelven a la cola; los que vinieron de un borrador no tienen desde dónde subirse otra vez.
 */
export function volverASubir(archivos: Archivo[]): Archivo[] {
  return archivos.map((a) => (a.local ? { ...a, url: null, estado: 'subiendo', progreso: 0, error: null } : a))
}

export type Envio = { paso: 'listo'; error: string | null } | { paso: 'creando'; ahora: boolean } | { paso: 'hecho' }

export type Evento =
  | { tipo: 'crear'; ahora: boolean }
  | { tipo: 'rechazado'; mensaje: string }
  | { tipo: 'hecho' }
  | { tipo: 'cancelar' }

export const ENVIO_INICIAL: Envio = { paso: 'listo', error: null }

/**
 * El envío ya no sube nada —los archivos subieron al elegirlos—, así que es un solo pedido.
 * Un rechazo del servidor y la red caída terminan igual: de vuelta en listo con la frase, y
 * reintentar es volver a tocar el botón.
 */
export function reducirEnvio(_estado: Envio, evento: Evento): Envio {
  switch (evento.tipo) {
    case 'crear':
      return { paso: 'creando', ahora: evento.ahora }
    case 'rechazado':
      return { paso: 'listo', error: evento.mensaje }
    case 'hecho':
      return { paso: 'hecho' }
    case 'cancelar':
      return ENVIO_INICIAL
  }
}

/** Qué mostrar bajo los botones mientras el envío corre; null cuando no hay nada que decir. */
export function etiquetaEnvio(estado: Envio): string | null {
  switch (estado.paso) {
    case 'creando':
      return estado.ahora ? 'Publicando…' : 'Programando…'
    case 'hecho':
      return 'Listo'
    default:
      return null
  }
}

/** El texto del `Alert` de «Publicar ahora»: nombra los handles, no las redes. */
export function textoConfirmacion(cuentas: CuentaApp[]): string {
  const nombres = cuentas.map((c) => c.handle ?? NOMBRE_RED[c.red] ?? c.red)
  const lista =
    nombres.length <= 1 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
  return `¿Publicar ahora en ${lista}? Saldrá en los próximos 5 minutos.`
}

/**
 * Si tienes una sola cuenta conectada, viene marcada: no hay entre qué elegir. Con dos
 * o más no viene ninguna — misma regla que `vieneMarcada` en el panel
 * (`admin/(dash)/schedule/composer.tsx`), pero contada sobre `disponibles`, que acá es
 * lo que trae `GET /api/mobile/schedule/accounts`: las cuentas del dueño en las redes
 * que la app publica, sin TikTok. El panel cuenta sobre todas las cuentas del dueño,
 * TikTok incluido, así que con una sola cuenta de Instagram y una de TikTok el panel
 * no marca nada (dos candidatas) y el teléfono marca la de Instagram (una sola
 * posibilidad ahí, que es la única que existe de verdad en esta pantalla). No es una
 * discrepancia: son dos universos distintos, cada uno correcto para su superficie.
 */
export function vieneMarcada(cuenta: CuentaApp, disponibles: CuentaApp[]): boolean {
  return cuenta.conectada && disponibles.filter((c) => c.conectada).length === 1
}

/**
 * Cómo se nombra una cuenta en pantalla: la red y el handle, o «sin nombre» si no lo
 * tiene. Sirve tanto para el chip que se elige como para el destino que se mira en el
 * calendario y en el resumen: ninguna de las tres pantallas dibuja un icono de la red, así
 * que el handle solo obligaba a adivinar de qué red era cada destino.
 *
 * Recibe la forma mínima —red y handle— y no una `CuentaApp` entera, porque un destino del
 * calendario trae su estado y su error, pero no si la cuenta sigue conectada.
 */
export function etiquetaCuenta(cuenta: { red: string; handle: string | null }): string {
  return `${NOMBRE_RED[cuenta.red] ?? cuenta.red} · ${cuenta.handle ?? 'sin nombre'}`
}

/** El valor inicial del selector: la próxima hora en punto, nunca «ahora mismo». */
export function proximaHoraEnPunto(now: Date): Date {
  const siguiente = new Date(now)
  siguiente.setHours(now.getHours() + 1, 0, 0, 0)
  return siguiente
}

/**
 * La fecha con que abre Publicar desde el «+» de un día de La Parrilla: ese día, a la hora
 * en punto que viene. Si el día es hoy, o ya pasó, la próxima hora en punto sin más. El día
 * es `YYYY-MM-DD`; uno que no se entiende no cambia nada.
 */
export function fechaParaElDia(dia: string, now: Date): Date {
  const base = proximaHoraEnPunto(now)
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia)
  if (!partes) return base
  const fecha = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]), base.getHours(), 0, 0, 0)
  return fecha.getTime() > base.getTime() ? fecha : base
}

/**
 * Las dos reglas que la app aplica sola, antes de que el servidor diga nada: algo que
 * mandar (texto o archivo) y al menos un destino elegido. Sin la segunda, el envío
 * llegaba a rechazarse recién en el servidor con «Elige al menos una plataforma»
 * debajo de una fila de chips que ya no dicen «plataforma», dicen cuenta.
 */
export function puedeEnviar(texto: string, archivos: number, cuentas: number): boolean {
  return (texto.trim().length > 0 || archivos > 0) && cuentas > 0
}

export type OpcionesApp = Record<string, { trialReel: true }>

/** Un solo video, sin fotos: la única media con la que un trial reel es posible. */
function esUnVideo(archivos: Pick<Elegido, 'mediaType'>[]): boolean {
  return archivos.length === 1 && archivos[0]!.mediaType === 'video'
}

/**
 * El aviso de una cuenta donde Meta ya rechazó un trial reel (`src/lib/social/publish/trial-reels.ts`,
 * en el sitio): la frase del rechazo, que nombra la cuenta y dice el porqué, o esta si no quedó ninguna.
 * La misma del panel: la cuida `src/lib/telefono-copias.test.ts`.
 */
export const SIN_TRIAL_GENERICO = 'Instagram ya rechazó un trial reel en esta cuenta: prográmalo como reel normal.'

export function avisoSinTrial(motivo: string | null | undefined): string {
  return motivo?.trim() || SIN_TRIAL_GENERICO
}

/**
 * Las cuentas a las que se les ofrece el trial reel: las de Instagram marcadas, y solo
 * cuando hay exactamente un video elegido — un trial reel es un solo video, sin fotos,
 * y ofrecer el interruptor con fotos sería ofrecer algo que el servidor va a rechazar.
 * Derivado, no guardado: si el dueño quita el video o desmarca la cuenta, desaparece solo.
 */
export function cuentasConTrial(
  disponibles: CuentaApp[],
  marcadas: string[],
  archivos: Pick<Elegido, 'mediaType'>[],
): CuentaApp[] {
  if (!esUnVideo(archivos)) return []
  return disponibles.filter((c) => c.red === 'instagram' && marcadas.includes(c.id))
}

/** Lo que viaja en `opciones`: de las que se ofrecen, las que están encendidas. */
export function opcionesDelBorrador(
  disponibles: CuentaApp[],
  marcadas: string[],
  trial: string[],
  archivos: Pick<Elegido, 'mediaType'>[],
): OpcionesApp {
  const salida: OpcionesApp = {}
  for (const c of cuentasConTrial(disponibles, marcadas, archivos)) {
    if (trial.includes(c.id)) salida[c.id] = { trialReel: true }
  }
  return salida
}

/**
 * Lo que el borrador guarda del trial reel. A diferencia del envío no mira `disponibles`: un
 * guardado que corre antes de que carguen las cuentas no debe perder el trial. `trial` solo
 * tiene cuentas de Instagram, porque solo esas tienen el botón.
 */
export function opcionesParaGuardar(
  marcadas: string[],
  trial: string[],
  archivos: Pick<Elegido, 'mediaType'>[],
): OpcionesApp {
  if (!esUnVideo(archivos)) return {}
  const salida: OpcionesApp = {}
  for (const id of trial) if (marcadas.includes(id)) salida[id] = { trialReel: true }
  return salida
}
