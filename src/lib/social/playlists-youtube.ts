// Las playlists del canal de YouTube, para «Agregar a una playlist» del compositor y del
// teléfono, por la YouTube Data API v3:
//
// - `GET /youtube/v3/playlists?part=snippet&mine=true` da las playlists del canal conectado.
//   Cuesta 1 unidad de cupo por página de 50.
// - `POST /youtube/v3/playlistItems?part=snippet` agrega un video a una de ellas. Cuesta 50
//   unidades, y se llama una sola vez por destino, cuando el video ya salió (`youtube.ts`).
//
// Las dos van con el permiso `youtube.force-ssl`, que la app ya tiene: nada de esto pide un
// permiso nuevo (la pantalla de consentimiento está verificada, y cambiarla pediría otra
// verificación). Los títulos no se guardan en la base: viven unos minutos en la memoria de este
// módulo, para no gastar cupo cada vez que se abre el bloque, y se vuelven a pedir después
// (`politica-youtube.ts`: los datos de la API no se guardan sin refrescar). Lo único que se guarda
// es el id de la playlist elegida, en las opciones del destino, porque sin él no se puede agregar.
//
// Este módulo es puro y la red se la pasan: lo usan `lib/playlists-youtube.ts` (con la cuenta y su
// token), el publicador y los tests, sin base ni entorno.

/** Lo que se espera a YouTube mientras una persona mira el bloque. */
export const PLAZO_PLAYLISTS_MS = 10_000

/** Una playlist tal como la muestran el panel y el teléfono. */
export type PlaylistYoutube = { id: string; titulo: string }

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>

export const PLAYLISTS_NO_RESPONDE = 'YouTube no respondió con tus playlists. Inténtalo de nuevo en un rato.'
export const PLAYLISTS_SIN_PERMISO =
  'YouTube no dejó ver las playlists de este canal. Reconéctalo en Los Fierros y vuelve a intentarlo.'

/**
 * Lo que queda anotado en el destino cuando el video salió pero no entró a la playlist. Es un
 * aviso, no un fallo: el video ya está en el canal, y reintentar lo subiría otra vez.
 */
export const PLAYLIST_NO_AGREGADO =
  'Salió en YouTube, pero YouTube no lo agregó a la playlist que elegiste. Agrégalo tú desde YouTube Studio.'
export const PLAYLIST_YA_NO_EXISTE =
  'Salió en YouTube, pero la playlist que elegiste ya no está en el canal. Si quieres, agrégalo a otra desde YouTube Studio.'

/** Páginas de 50 que se piden como mucho: 200 playlists, 4 unidades. Un canal con más es raro. */
const MAX_PAGINAS = 4

const BASE = 'https://www.googleapis.com/youtube/v3'

/** Las playlists de una respuesta de `playlists.list`, sin las que no traen id o título. */
export function playlistsDeRespuesta(payload: unknown): PlaylistYoutube[] {
  const items = (payload as { items?: unknown } | null)?.items
  if (!Array.isArray(items)) return []
  return items.flatMap((item) => {
    const i = item as { id?: unknown; snippet?: { title?: unknown } }
    const titulo = typeof i.snippet?.title === 'string' ? i.snippet.title.trim() : ''
    return typeof i.id === 'string' && i.id && titulo ? [{ id: i.id, titulo }] : []
  })
}

/**
 * Las playlists del canal del token, en el orden en que YouTube las da. Un 401 o un 403 es la
 * cuenta (sin permiso, o el permiso vencido): se dice que la reconecte. Lo demás, que YouTube no
 * respondió.
 */
export async function listarPlaylists(
  token: string,
  fetcher: Fetcher = fetch,
): Promise<{ playlists: PlaylistYoutube[] } | { error: string }> {
  const playlists: PlaylistYoutube[] = []
  let pagina: string | null = null
  try {
    for (let i = 0; i < MAX_PAGINAS; i++) {
      const url = new URL(`${BASE}/playlists`)
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('mine', 'true')
      url.searchParams.set('maxResults', '50')
      if (pagina) url.searchParams.set('pageToken', pagina)
      const response = await fetcher(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(PLAZO_PLAYLISTS_MS),
      })
      if (!response.ok) {
        console.error('YouTube playlists:', response.status, (await response.text()).slice(0, 300))
        return { error: response.status === 401 || response.status === 403 ? PLAYLISTS_SIN_PERMISO : PLAYLISTS_NO_RESPONDE }
      }
      const payload = (await response.json()) as { nextPageToken?: unknown }
      playlists.push(...playlistsDeRespuesta(payload))
      pagina = typeof payload.nextPageToken === 'string' && payload.nextPageToken ? payload.nextPageToken : null
      if (!pagina) break
    }
  } catch (error) {
    console.error('YouTube playlists:', String(error).slice(0, 300))
    return { error: PLAYLISTS_NO_RESPONDE }
  }
  return { playlists }
}

/** El cuerpo de `playlistItems.insert`: el video al final de la playlist. */
export function cuerpoDePlaylistItem(playlistId: string, videoId: string) {
  return { snippet: { playlistId, resourceId: { kind: 'youtube#video', videoId } } }
}

/**
 * Agrega el video a la playlist. Null si entró; si no, el aviso que queda en el destino. Nunca
 * lanza: lo llama el publicador con el video ya publicado, y un tropiezo acá no puede convertir
 * en fallo algo que salió.
 */
export async function agregarAPlaylist(
  token: string,
  playlistId: string,
  videoId: string,
  plazoMs: number,
  fetcher: Fetcher = fetch,
): Promise<string | null> {
  try {
    const response = await fetcher(`${BASE}/playlistItems?part=snippet`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpoDePlaylistItem(playlistId, videoId)),
      signal: AbortSignal.timeout(plazoMs),
    })
    if (response.ok) return null
    console.error('YouTube playlistItems:', response.status, (await response.text()).slice(0, 300))
    return response.status === 404 ? PLAYLIST_YA_NO_EXISTE : PLAYLIST_NO_AGREGADO
  } catch (error) {
    console.error('YouTube playlistItems:', String(error).slice(0, 300))
    return PLAYLIST_NO_AGREGADO
  }
}

/** Cuánto vive en memoria la lista de una cuenta: unos minutos, lo que dura armar un post. */
export const DURACION_MEMORIA_PLAYLISTS_MS = 5 * 60_000
const MAX_EN_MEMORIA = 200

/**
 * La memoria corta de las playlists de cada cuenta, por instancia de la función. No es la base: se
 * pierde con la instancia, y lo que tiene vence a los cinco minutos.
 */
export class MemoriaDePlaylists {
  private readonly filas = new Map<string, { hasta: number; playlists: PlaylistYoutube[] }>()

  constructor(private readonly ahora: () => number = Date.now) {}

  leer(cuentaId: string): PlaylistYoutube[] | null {
    const fila = this.filas.get(cuentaId)
    if (!fila) return null
    if (fila.hasta <= this.ahora()) {
      this.filas.delete(cuentaId)
      return null
    }
    return fila.playlists
  }

  guardar(cuentaId: string, playlists: PlaylistYoutube[]): void {
    if (this.filas.size >= MAX_EN_MEMORIA) this.filas.delete(this.filas.keys().next().value!)
    this.filas.set(cuentaId, { hasta: this.ahora() + DURACION_MEMORIA_PLAYLISTS_MS, playlists })
  }

  /** «Volver a cargar»: la próxima lectura le pregunta a YouTube. */
  olvidar(cuentaId: string): void {
    this.filas.delete(cuentaId)
  }
}
