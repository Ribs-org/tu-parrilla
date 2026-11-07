import type { Archivo } from './publicar'
import type { CuentaApp } from './tipos'

// Las historias en Publicar, sin pantalla: el selector «Post · Historia», lo que se avisa de
// cada archivo y lo que viaja al programar. Una historia es un solo archivo, sin texto, sin
// portada y sin palabra clave, y va solo a Instagram y Facebook; varios archivos son una
// secuencia que sale en orden, una historia por archivo. Las reglas las decide el servidor
// (`src/lib/social/publish/opciones.ts`, en el sitio); acá solo lo que se puede decir antes.

export type Modo = 'post' | 'historia'

/** Las redes que publican historias. */
export const REDES_HISTORIA: ReadonlySet<string> = new Set(['instagram', 'facebook'])

/**
 * Copia la frase del servidor (`HISTORIA_JPG`, en `src/lib/social/publish/opciones.ts`): la app
 * la dice antes, al elegir la foto, con las mismas palabras con que el servidor la rechazaría.
 * La cuida `src/lib/telefono-copias.test.ts`.
 */
export const HISTORIA_JPG = 'Instagram recibe la historia en foto solo en JPG.'

/** La historia dura 60 s como mucho: lo que pase, la red lo corta. */
export const MAX_SEGUNDOS_HISTORIA = 60

export const SE_VE_CON_BORDES = 'Se va a ver con bordes.'

/** El aviso de un video largo: lo corta la red a la que va, Instagram si va a las dos. */
export function seCortaEn60(aInstagram: boolean): string {
  return `${aInstagram ? 'Instagram' : 'Facebook'} corta en ${MAX_SEGUNDOS_HISTORIA} s: súbelo partido.`
}

export const SIN_CUENTAS_DE_HISTORIA =
  'Las historias salen en Instagram y Facebook, y no tienes ninguna de esas cuentas lista para publicar desde el teléfono.'

export const HISTORIA_SIN_TEXTO_AQUI =
  'Una historia no lleva texto. Lo que escribiste se guarda en el borrador y vuelve si cambias a Post.'

/** Ancho, alto y duración de lo que se eligió, como los da el selector; null si no se sabe. */
export type Medidas = { ancho: number; alto: number; duracionMs: number | null }

/**
 * Lo que el selector dice de un archivo. Un 0 es «no lo sé» (así lo documenta el selector), y
 * entonces no se avisa nada: mejor callar que avisar bordes que no hay.
 */
export function medidasDe(asset: { width?: number | null; height?: number | null; duration?: number | null }): Medidas | null {
  const ancho = asset.width ?? 0
  const alto = asset.height ?? 0
  if (ancho <= 0 || alto <= 0) return null
  return { ancho, alto, duracionMs: asset.duration && asset.duration > 0 ? asset.duration : null }
}

/** Las cuentas que una historia puede elegir: las de Instagram y Facebook. */
export function cuentasDeHistoria(disponibles: CuentaApp[]): CuentaApp[] {
  return disponibles.filter((c) => REDES_HISTORIA.has(c.red))
}

/**
 * Las cuentas marcadas que van, según el modo. En Historia, solo las de Instagram y Facebook: las
 * demás siguen marcadas en la pantalla —vuelven si se cambia a Post— pero no viajan. Sin la lista
 * de cuentas todavía, no va ninguna: no se sabe de qué red es cada una.
 */
export function cuentasQueVan(modo: Modo, marcadas: string[], disponibles: CuentaApp[]): string[] {
  if (modo === 'post') return marcadas
  const deHistoria = new Set(cuentasDeHistoria(disponibles).map((c) => c.id))
  return marcadas.filter((id) => deHistoria.has(id))
}

/** La extensión de un archivo, por su nombre o por su URL, en minúsculas. */
function extension(archivo: Pick<Archivo, 'nombre' | 'url' | 'local'>): string {
  if (archivo.local?.tipo === 'image/jpeg') return 'jpg'
  const fuente = archivo.local?.nombre || archivo.nombre || archivo.url || ''
  return fuente.split('?')[0]!.split('.').pop()?.toLowerCase() ?? ''
}

export type AvisoDeHistoria = { texto: string; bloquea: boolean }

/**
 * Lo que se avisa de una historia sobre el visor. Solo la foto que no es JPG hacia Instagram
 * bloquea —el servidor la rechazaría con la misma frase—; el video largo y la forma se avisan y
 * se puede seguir, como en el panel: el servidor no mide, y si Meta lo rechaza, lo dice al publicar.
 */
export function avisosDeHistoria(
  archivo: Pick<Archivo, 'mediaType' | 'nombre' | 'url' | 'local' | 'medidas'>,
  aInstagram: boolean,
  aFacebook: boolean,
): AvisoDeHistoria[] {
  const avisos: AvisoDeHistoria[] = []
  if (archivo.mediaType === 'image' && aInstagram) {
    const ext = extension(archivo)
    if (ext !== 'jpg' && ext !== 'jpeg') avisos.push({ texto: HISTORIA_JPG, bloquea: true })
  }
  const medidas = archivo.medidas ?? null
  if (
    archivo.mediaType === 'video' &&
    (aInstagram || aFacebook) &&
    medidas?.duracionMs != null &&
    medidas.duracionMs > MAX_SEGUNDOS_HISTORIA * 1000 + 500
  ) {
    avisos.push({ texto: seCortaEn60(aInstagram), bloquea: false })
  }
  // 9:16 con un margen: un 1080×1920 y un 720×1280 son lo mismo; un 4:5 o uno horizontal, no.
  if (medidas && Math.abs(medidas.ancho / medidas.alto - 9 / 16) > 0.05) {
    avisos.push({ texto: SE_VE_CON_BORDES, bloquea: false })
  }
  return avisos
}

/** «0:45», «1:20»: la duración de un video, para el visor. */
export function duracionLegible(ms: number): string {
  const segundos = Math.round(ms / 1000)
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

/** El botón principal: «Programar», «Programar historia» o «Programar 3 historias». */
export function etiquetaProgramar(modo: Modo, archivos: number): string {
  if (modo === 'post') return 'Programar'
  return archivos > 1 ? `Programar ${archivos} historias` : 'Programar historia'
}

/** «Publicar ahora», en historia también: el botón dice lo mismo, la ventana dice cuántas. */
export function detalleDeHistorias(archivos: number): string {
  return archivos > 1 ? `Salen ${archivos} historias, una detrás de otra, en este orden.` : 'Sale una historia.'
}

/** Lo que una historia necesita para poder programarse, además de lo que pide un post. */
export function puedeEnviarHistoria(archivos: number, cuentas: number, bloqueada: boolean): boolean {
  return archivos > 0 && cuentas > 0 && !bloqueada
}

/**
 * Las opciones de una historia: cada cuenta que va, `{ historia: true }`. Con varios archivos, la
 * misma: el servidor arma la secuencia (`secuencia: true` en el cuerpo) y le pone a cada historia
 * su lugar.
 */
export function opcionesDeHistoria(cuentas: string[]): Record<string, { historia: true }> {
  return Object.fromEntries(cuentas.map((id) => [id, { historia: true as const }]))
}

/** Mueve un archivo un lugar antes (-1) o después (+1); en una punta, la lista queda igual. */
export function moverArchivo<T extends { clave: string }>(lista: T[], clave: string, delta: -1 | 1): T[] {
  const i = lista.findIndex((a) => a.clave === clave)
  const j = i + delta
  if (i < 0 || j < 0 || j >= lista.length) return lista
  const copia = [...lista]
  ;[copia[i], copia[j]] = [copia[j]!, copia[i]!]
  return copia
}
