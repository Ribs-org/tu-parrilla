import type { CuentaApp } from './tipos'

// El bloque de YouTube de Publicar, sin pantalla. Es el del compositor del panel
// (`src/app/admin/(dash)/schedule/youtube-opciones.tsx`): quién lo ve, «Hecho con IA» y
// «Agregar a una playlist». Los textos son los del panel letra por letra, y las visibilidades y
// sus nombres los de `src/lib/social/publish/opciones.ts`: los compara
// `src/lib/telefono-copias.test.ts`.

export type VisibilidadYoutube = 'public' | 'unlisted' | 'private'

export const VISIBILIDADES_YOUTUBE: readonly VisibilidadYoutube[] = ['public', 'unlisted', 'private']

export const ETIQUETA_VISIBILIDAD_YOUTUBE: Record<VisibilidadYoutube, string> = {
  public: 'Público',
  unlisted: 'No listado',
  private: 'Privado',
}

export const AYUDA_VISIBILIDAD_YOUTUBE: Record<VisibilidadYoutube, string> = {
  public: 'Lo ve cualquiera en YouTube.',
  unlisted: 'Solo quien tenga el link: no sale en tu canal ni en las búsquedas.',
  private: 'Solo tú, desde YouTube Studio.',
}

/** Lo que el bloque de una cuenta tiene elegido, con los nombres de `YoutubeInicial` (`src/lib/borrador.ts`). */
export type YoutubeElegido = {
  visibilidad: VisibilidadYoutube
  ia: boolean
  /** El id de la playlist, o vacío sin playlist. */
  playlist: string
}

/** Una playlist del canal, como la da `/api/mobile/youtube/playlists`. */
export type PlaylistYoutube = { id: string; titulo: string }

/** La misma del sitio (`src/lib/social/playlists-youtube.ts`). */
export const PLAYLISTS_NO_RESPONDE = 'YouTube no respondió con tus playlists. Inténtalo de nuevo en un rato.'

/** Los textos del bloque, los del panel. */
export const TEXTOS_YOUTUBE = {
  quienLoVe: 'Quién lo ve',
  ia: 'Hecho con IA',
  iaApagada:
    'Enciéndelo si el video muestra de forma realista una persona, un lugar o un hecho que se hizo o se cambió con IA: YouTube pide avisarlo.',
  iaEncendida: 'YouTube lo marcará como contenido alterado o sintético.',
  playlist: 'Agregar a una playlist',
  playlistApagada: 'Cuando el video salga, lo agregamos a una playlist de tu canal.',
  playlistPista:
    'Cuando el video salga, lo agregamos al final de esa playlist. Si YouTube no lo deja, el video sale igual y te lo decimos en la publicación.',
  sinPlaylists: 'Este canal todavía no tiene playlists. Crea una en YouTube y aprieta «Volver a cargar».',
  queYaNoEsta: 'La que elegiste antes (ya no aparece en el canal)',
  eligeUna: 'Elige una playlist',
  leyendo: 'Leyendo tus playlists…',
  volverACargar: 'Volver a cargar',
} as const

/** Cómo nace el bloque: lo que traía el borrador, o como siempre —público, sin IA, sin playlist—. */
export function youtubeInicial(guardado: Partial<YoutubeElegido> | undefined): YoutubeElegido {
  return {
    visibilidad: VISIBILIDADES_YOUTUBE.includes(guardado?.visibilidad as VisibilidadYoutube)
      ? (guardado!.visibilidad as VisibilidadYoutube)
      : 'public',
    ia: guardado?.ia === true,
    playlist: typeof guardado?.playlist === 'string' ? guardado.playlist : '',
  }
}

/** Las cuentas de YouTube marcadas y conectadas: un bloque por cada una, como en el panel. */
export function cuentasDeYoutube(disponibles: CuentaApp[], marcadas: string[]): CuentaApp[] {
  return disponibles.filter((c) => c.red === 'youtube' && c.conectada && marcadas.includes(c.id))
}

/**
 * Lo que viaja en `opciones` al programar y al guardar el borrador, con las tres claves que el
 * servidor acepta (`validarYoutube`): sin playlist, `null`. El servidor no guarda lo que es como
 * siempre.
 */
export function opcionesYoutube(e: YoutubeElegido): Record<string, unknown> {
  return { visibilidad: e.visibilidad, ia: e.ia, playlist: e.playlist || null }
}

/** Si la playlist elegida ya no está en la lista del canal (se borró en YouTube). */
export function playlistPerdida(e: YoutubeElegido, playlists: PlaylistYoutube[] | null): boolean {
  return e.playlist !== '' && playlists !== null && !playlists.some((p) => p.id === e.playlist)
}
