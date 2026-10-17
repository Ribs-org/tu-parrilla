// La cola de archivos del compositor, sin pantalla: qué sube ahora, cuánto lleva el post entero
// y qué se dice mientras tanto. Puro: el compositor lo usa en el navegador, y acá se lo prueba.

import { formatoDe, type Formato } from '@/lib/parrilla'

/** Un archivo elegido que todavía no es media del post: espera, sube o no llegó. */
export type Subida = {
  /** La identidad de la fila mientras no tiene URL: dos archivos pueden llamarse igual. */
  clave: string
  nombre: string
  tipo: 'image' | 'video'
  estado: 'cola' | 'subiendo' | 'fallo'
  /** De 0 a 1: lo que lleva el PUT. En la cola, 0; en un fallo, hasta donde llegó. */
  progreso: number
  error: string | null
}

const EXTENSIONES_DE_VIDEO = new Set(['mp4', 'mov', 'm4v', 'webm'])

/**
 * Si un archivo es video, para dibujarlo antes de que llegue. El navegador a veces no sabe el
 * tipo de un .mov (`file.type` vacío): ahí manda la extensión. El tipo que vale para publicar
 * lo decide la ruta que firma; esto es solo para la silueta del corte mientras sube.
 */
export function tipoDe(file: { name: string; type: string }): 'image' | 'video' {
  if (file.type.startsWith('video/')) return 'video'
  if (file.type) return 'image'
  return EXTENSIONES_DE_VIDEO.has(file.name.split('.').pop()?.toLowerCase() ?? '') ? 'video' : 'image'
}

/**
 * La que sube ahora: la primera en la cola, si no hay otra subiendo y ninguna falló antes que
 * ella. De a una y en orden, como siempre (el carrusel depende del orden); y si una no llegó,
 * la cola se detiene ahí hasta que se reintente o se quite: seguir con las de atrás cambiaría
 * el orden del carrusel sin que nadie lo pidiera.
 */
export function siguienteEnCola(subidas: readonly Subida[]): Subida | null {
  for (const s of subidas) {
    if (s.estado === 'subiendo' || s.estado === 'fallo') return null
    if (s.estado === 'cola') return s
  }
  return null
}

/**
 * Cuánta carne tiene el corte del post: lo que ya llegó cuenta entero, lo que sube cuenta lo
 * que lleva y lo que espera, cero. Sin nada que subir, el corte está entero.
 */
export function llenadoDe(listas: number, subidas: readonly Subida[]): number {
  const total = listas + subidas.length
  if (total === 0) return 1
  return (listas + subidas.reduce((suma, s) => suma + s.progreso, 0)) / total
}

/**
 * La silueta con todo lo elegido, también lo que todavía sube: el corte toma su forma final
 * apenas se eligen los archivos y se va llenando de carne a medida que llegan.
 */
export function formatoConLoQueSube(
  media: ReadonlyArray<{ mediaType: string }>,
  subidas: readonly Subida[],
): { formato: Formato; huesos: number } {
  return formatoDe([...media, ...subidas.map((s) => ({ mediaType: s.tipo }))])
}

/** Qué se dice de los archivos mientras no están todos: cuántos llegaron, o cuál no llegó. */
export function fraseDeLlegada(listas: number, subidas: readonly Subida[]): string | null {
  const fallos = subidas.filter((s) => s.estado === 'fallo').length
  if (fallos > 0) {
    return fallos === 1
      ? 'Un archivo no llegó: reintenta o quítalo. Los que siguen esperan.'
      : `${fallos} archivos no llegaron: reintenta o quítalos.`
  }
  if (subidas.length === 0) return null
  return `Llegando: ${listas} de ${listas + subidas.length}.`
}
