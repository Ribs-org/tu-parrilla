import type { TipoInsumo } from '@/db/schema'

// Lo que se le puede llevar a la cocina y cómo viaja, sin base y sin almacén: lo leen el servidor
// al abrir una subida y el navegador al elegir el archivo, para decir al tiro lo que no va a
// entrar (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «Validar al subir»).

/** Qué es el plato principal: un video largo, un podcast en videollamada o tomas sueltas. */
export const SUBTIPOS_PRINCIPAL = ['largo', 'podcast', 'tomas'] as const
export type SubtipoPrincipal = (typeof SUBTIPOS_PRINCIPAL)[number]

/**
 * 64 MB por parte. El almacén pide que todas las partes pesen lo mismo salvo la última, y que
 * pesen al menos 5 MB: con 64, un largo de 20 GB son 320 partes, y una que se corta se repite sin
 * perder mucho.
 */
export const TAMANO_PARTE = 64 * 1024 * 1024
/** El tope de un video: un largo crudo, el que el diseño recomienda por plan. */
export const MAX_BYTES_VIDEO = 20 * 1024 ** 3
/** El tope de una foto. */
export const MAX_BYTES_IMAGEN = 50 * 1024 ** 2
/** Cuántos enlaces de parte se firman por pedido: el navegador pide más a medida que sube. */
export const MAX_PARTES_POR_PEDIDO = 50
const MAX_NOMBRE = 200

// El chef corta con ffmpeg: recibe también lo que no se puede publicar tal cual, como el MKV que
// graba OBS. El tipo de archivo de cada uno y la extensión con que se guarda.
const VIDEOS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-matroska': 'mkv',
}
const IMAGENES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
const POR_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
}

export const SUBIDA_ILEGIBLE = 'No entendimos el archivo: falta su nombre, su tipo o su tamaño.'
export const INSUMO_DESCONOCIDO = 'Di qué es el archivo: el plato principal, otra cámara, la pantalla o imágenes.'
export const SUBTIPO_FALTA = 'Di qué es el plato principal: un video largo, un podcast en videollamada o tomas sueltas.'
export const DERECHOS_FALTAN = 'Marca que tienes los derechos de este material y el permiso de quienes aparecen.'

export function tipoNoAceptado(nombre: string, insumo: TipoInsumo): string {
  return insumo === 'imagen'
    ? `«${nombre}»: acá va una foto (JPG, PNG, WebP o HEIC) o un video (MP4, MOV, WebM o MKV).`
    : `«${nombre}»: acá va un video (MP4, MOV, WebM o MKV).`
}

export function muyGrande(nombre: string, tipoArchivo: string): string {
  return tipoArchivo.startsWith('image/')
    ? `«${nombre}» pesa más de 50 MB, el tope de una foto.`
    : `«${nombre}» pesa más de 20 GB, el tope de un video.`
}

/** El tipo de un archivo: el que dice el navegador o, si viene vacío (un .mov, un .mkv), el de su extensión. */
export function tipoDeArchivo(nombre: string, tipo: string): string {
  const limpio = tipo.trim().toLowerCase()
  if (limpio === 'image/jpg') return 'image/jpeg'
  if (limpio) return limpio
  return POR_EXTENSION[nombre.split('.').pop()?.toLowerCase() ?? ''] ?? ''
}

/** Lo que acepta cada insumo: un video, y en las imágenes o el b-roll, también una foto. */
export function aceptaTipo(insumo: TipoInsumo, tipoArchivo: string): boolean {
  return tipoArchivo in VIDEOS || (insumo === 'imagen' && tipoArchivo in IMAGENES)
}

export function maxBytesDe(tipoArchivo: string): number {
  return tipoArchivo.startsWith('image/') ? MAX_BYTES_IMAGEN : MAX_BYTES_VIDEO
}

export function extensionDe(tipoArchivo: string): string {
  return VIDEOS[tipoArchivo] ?? IMAGENES[tipoArchivo] ?? 'bin'
}

/**
 * El nombre de un archivo como va en su clave: sin extensión, sin tildes y sin lo que no sea letra,
 * número o guion. La clave lleva además un uuid, así que dos archivos que se llaman igual no chocan.
 */
export function baseDeNombre(nombre: string): string {
  return (
    nombre
      .replace(/\.[^.]+$/, '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'archivo'
  )
}

/** Cuántas partes tiene un archivo. */
export function cuantasPartes(bytes: number, tamano: number = TAMANO_PARTE): number {
  return Math.ceil(bytes / tamano)
}

/** Lo que tiene que pesar una parte (1..N): todas `tamano`, salvo la última, que lleva el resto. */
export function bytesDeParte(numero: number, bytes: number, tamano: number = TAMANO_PARTE): number {
  return Math.min(tamano, bytes - (numero - 1) * tamano)
}

/** Los bytes de una parte, como los corta `File.slice`: desde incluido, hasta excluido. */
export function rangoDeParte(numero: number, bytes: number, tamano: number = TAMANO_PARTE): { desde: number; hasta: number } {
  const desde = (numero - 1) * tamano
  return { desde, hasta: desde + bytesDeParte(numero, bytes, tamano) }
}

/**
 * Las partes que faltan, en orden. Una que llegó con otro peso cuenta como faltante: se vuelve a
 * subir con el mismo número, que la reemplaza.
 */
export function partesQueFaltan(
  bytes: number,
  tamano: number,
  llegaron: ReadonlyArray<{ numero: number; bytes: number }>,
): number[] {
  const bien = new Set(llegaron.filter((p) => p.bytes === bytesDeParte(p.numero, bytes, tamano)).map((p) => p.numero))
  const faltan: number[] = []
  for (let n = 1; n <= cuantasPartes(bytes, tamano); n++) if (!bien.has(n)) faltan.push(n)
  return faltan
}

export type SubidaPedida = {
  nombre: string
  tipoArchivo: string
  bytes: number
  tipo: TipoInsumo
  subtipo: SubtipoPrincipal | null
  duracionS: number | null
}

const TIPOS: readonly string[] = ['principal', 'camara', 'pantalla', 'imagen'] satisfies TipoInsumo[]

/** El cuerpo con que se abre una subida, validado, o la frase de por qué no. */
export function leerSubida(crudo: unknown): SubidaPedida | { error: string } {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) return { error: SUBIDA_ILEGIBLE }
  const c = crudo as Record<string, unknown>
  const nombre = typeof c.nombre === 'string' ? c.nombre.trim() : ''
  const bytes = c.bytes
  if (!nombre || nombre.length > MAX_NOMBRE || typeof bytes !== 'number' || !Number.isInteger(bytes) || bytes <= 0) {
    return { error: SUBIDA_ILEGIBLE }
  }
  if (typeof c.insumo !== 'string' || !TIPOS.includes(c.insumo)) return { error: INSUMO_DESCONOCIDO }
  const tipo = c.insumo as TipoInsumo

  let subtipo: SubtipoPrincipal | null = null
  if (tipo === 'principal') {
    if (typeof c.subtipo !== 'string' || !(SUBTIPOS_PRINCIPAL as readonly string[]).includes(c.subtipo)) {
      return { error: SUBTIPO_FALTA }
    }
    subtipo = c.subtipo as SubtipoPrincipal
  }
  if (c.derechos !== true) return { error: DERECHOS_FALTAN }

  const tipoArchivo = tipoDeArchivo(nombre, typeof c.tipo === 'string' ? c.tipo : '')
  if (!aceptaTipo(tipo, tipoArchivo)) return { error: tipoNoAceptado(nombre, tipo) }
  if (bytes > maxBytesDe(tipoArchivo)) return { error: muyGrande(nombre, tipoArchivo) }

  // La duración la lee el navegador de los metadatos, si puede (algunos HEVC no): es un dato, no
  // una condición, así que una que no se entiende se deja vacía en vez de rechazar el archivo.
  const duracionS = typeof c.duracionS === 'number' && Number.isFinite(c.duracionS) && c.duracionS >= 0 ? c.duracionS : null
  return { nombre, tipoArchivo, bytes, tipo, subtipo, duracionS }
}
