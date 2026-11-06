// «Música de Instagram» en Publicar, lo que no es pantalla: qué cuentas la ofrecen, la forma de
// la canción elegida (la misma que guarda el sitio, `MusicaInstagram` en
// `src/lib/social/publish/opciones.ts`) y los pasos de volumen.

import type { CuentaApp } from './tipos'

/** La canción elegida, como viaja en `opciones[cuenta].musica`. */
export type MusicaInstagram = {
  audioId: string
  titulo: string
  artista: string | null
  volumenMusica: number
  volumenVideo: number
}

/** Una canción de la biblioteca, como la da `/api/mobile/musica`. */
export type CancionInstagram = {
  id: string
  titulo: string
  artista: string | null
  duracionMs: number | null
  portada: string | null
  /** El link de la muestra para escucharla; vence en día y medio, y a veces no hay. */
  muestra: string | null
}

export type SugerenciaMusica = { cancion: CancionInstagram; razon: string; conModelo: boolean }

/** Como en el panel: la canción nace a la mitad para no tapar la voz; el video, entero. */
export const VOLUMEN_CANCION_INICIAL = 50
export const VOLUMEN_VIDEO_INICIAL = 100
/** Cuánto sube o baja cada toque de «−» y «+». */
export const PASO_VOLUMEN = 10

/** Las mismas del sitio (`src/lib/social/instagram-audio.ts`); las cuida `src/lib/telefono-copias.test.ts`. */
export const MUSICA_SOLO_LOGIN_DE_FACEBOOK =
  'La música de Instagram no está disponible en esta cuenta: se conectó con el login de Instagram, y Meta solo la da a las cuentas conectadas con Facebook.'
/** La misma del sitio (`SIN_MAS_CANCIONES`, `src/lib/social/musica-sugerencia.ts`). */
export const SIN_MAS_CANCIONES = 'Ya te mostré todas las que encontré para este post. Busca una por nombre.'
export const SIN_MUESTRA = 'Instagram no tiene una muestra de esa canción para escuchar.'

/** Un solo video, sin fotos: la única media con la que Meta le pone música a un reel. */
function esUnVideo(archivos: { mediaType: 'image' | 'video' }[]): boolean {
  return archivos.length === 1 && archivos[0]!.mediaType === 'video'
}

/**
 * Las cuentas de Instagram marcadas que llevan el bloque de música: con un solo video. Las de
 * login de Instagram también, para que el bloque diga por qué no hay música ahí. Derivado, como
 * el trial reel: sin video o con la cuenta desmarcada, desaparece solo.
 */
export function cuentasConMusica(
  disponibles: CuentaApp[],
  marcadas: string[],
  archivos: { mediaType: 'image' | 'video' }[],
): CuentaApp[] {
  if (!esUnVideo(archivos)) return []
  return disponibles.filter((c) => c.red === 'instagram' && marcadas.includes(c.id))
}

/** Si la cuenta puede llevar música: Meta no la da con el login de Instagram. */
export function admiteMusica(cuenta: Pick<CuentaApp, 'login'>): boolean {
  return cuenta.login !== 'instagram'
}

/**
 * Lo que viaja de la música: de las cuentas que la ofrecen y la admiten, las que tienen canción.
 * `disponibles` vacío (todavía cargando) no pierde nada: el borrador la guarda con las marcadas
 * y un video (`musicaParaGuardar`).
 */
export function musicaDelEnvio(
  disponibles: CuentaApp[],
  marcadas: string[],
  archivos: { mediaType: 'image' | 'video' }[],
  musica: Record<string, MusicaInstagram>,
): Record<string, MusicaInstagram> {
  const salida: Record<string, MusicaInstagram> = {}
  for (const c of cuentasConMusica(disponibles, marcadas, archivos)) {
    if (admiteMusica(c) && musica[c.id]) salida[c.id] = musica[c.id]!
  }
  return salida
}

export function musicaParaGuardar(
  marcadas: string[],
  archivos: { mediaType: 'image' | 'video' }[],
  musica: Record<string, MusicaInstagram>,
): Record<string, MusicaInstagram> {
  if (!esUnVideo(archivos)) return {}
  const salida: Record<string, MusicaInstagram> = {}
  for (const [id, m] of Object.entries(musica)) if (marcadas.includes(id)) salida[id] = m
  return salida
}

export function musicaElegida(
  c: CancionInstagram,
  volumenMusica = VOLUMEN_CANCION_INICIAL,
  volumenVideo = VOLUMEN_VIDEO_INICIAL,
): MusicaInstagram {
  return { audioId: c.id, titulo: c.titulo, artista: c.artista, volumenMusica, volumenVideo }
}

/** «Título» de Artista, como en el panel. */
export function nombreDeCancion(m: { titulo: string; artista: string | null }): string {
  return m.artista ? `«${m.titulo}» de ${m.artista}` : `«${m.titulo}»`
}

/** Un toque de «−» o «+»: de a 10, sin salirse de 1–100 (lo que acepta Meta). */
export function moverVolumen(actual: number, sentido: 1 | -1): number {
  const siguiente = sentido > 0 ? Math.floor(actual / PASO_VOLUMEN) * PASO_VOLUMEN + PASO_VOLUMEN : Math.ceil(actual / PASO_VOLUMEN) * PASO_VOLUMEN - PASO_VOLUMEN
  return Math.min(100, Math.max(1, siguiente))
}
