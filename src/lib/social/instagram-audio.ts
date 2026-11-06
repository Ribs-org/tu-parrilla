// La biblioteca de música de Instagram, por la Audio API de Meta (2026-06-01,
// developers.facebook.com/docs/instagram-platform/content-publishing/audio-api):
//
// - `GET /ig_audio?audio_type=music&user_id=<cuenta>` sin `search_query` da lo que está sonando
//   (trending); con `search_query`, busca por palabra.
// - `GET /<audio_id>?user_id=<cuenta>` da los datos de una canción, con un link de muestra nuevo.
//
// Solo con el login de Facebook (y el «unificado»): con el login de Instagram Meta no la tiene,
// así que siempre va a graph.facebook.com. Permisos `instagram_basic` e
// `instagram_content_publish`, los mismos con que ya se publica. La canción elegida se pega al
// reel en el publicador (`audio_configuration`, publish/instagram.ts).
//
// Este módulo es puro y la red se la pasan: lo usan `lib/musica-instagram.ts` (con la cuenta y
// su token) y sus tests, sin base ni entorno.

import { GRAPH_FACEBOOK } from './instagram-login'

/** Lo que se espera a Meta mientras una persona mira el bloque: más que esto, mejor decirlo. */
export const PLAZO_MUSICA_MS = 10_000

/** Una canción tal como la usan el panel y el teléfono. */
export type CancionInstagram = {
  /** El `audio_id` de Meta: lo que se guarda en las opciones y viaja al publicar. */
  id: string
  titulo: string
  artista: string | null
  duracionMs: number | null
  /** La carátula, si Meta la da. */
  portada: string | null
  /**
   * El link de la muestra (`download_url`): vence en día y medio y a veces no viene. No se
   * guarda en ningún lado; para escuchar una canción ya elegida se pide de nuevo con su id.
   */
  muestra: string | null
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>

export const MUSICA_NO_RESPONDE = 'Instagram no respondió con su música. Inténtalo de nuevo en un rato.'
export const MUSICA_SIN_PERMISO =
  'Instagram no dejó ver su música con esta cuenta. Reconéctala en Los Fierros y vuelve a intentarlo.'

/** Lo que dice el bloque de una cuenta con el login de Instagram, en el panel y en el teléfono. */
export const MUSICA_SOLO_LOGIN_DE_FACEBOOK =
  'La música de Instagram no está disponible en esta cuenta: se conectó con el login de Instagram, y Meta solo la da a las cuentas conectadas con Facebook.'
export const SIN_MUESTRA = 'Instagram no tiene una muestra de esa canción para escuchar.'

/**
 * Con qué volumen nace la canción recién elegida: a la mitad, para que no tape la voz de un
 * video en que se habla. El video, entero. Meta, si no se le dice nada, pone los dos al máximo;
 * el panel y el teléfono le dicen siempre.
 */
export const VOLUMEN_CANCION_INICIAL = 50
export const VOLUMEN_VIDEO_INICIAL = 100

/** Lo que se le pide a Meta como mucho: la lista no se pagina, y esto es lo que cabe en pantalla. */
export const MAX_CANCIONES = 30

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null
}

/**
 * Una canción de la respuesta de Meta, o null si no trae lo mínimo (id y título). Lee las dos
 * formas que la documentación usa: `cover_artwork_thumbnail_uri` en la búsqueda y `..._url` en
 * los datos de una, y `audio_id` o, por si acaso, `id`.
 */
export function leerCancion(crudo: unknown): CancionInstagram | null {
  if (typeof crudo !== 'object' || crudo === null) return null
  const c = crudo as Record<string, unknown>
  const id = texto(c.audio_id) ?? texto(c.id)
  const titulo = texto(c.title)
  if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id) || !titulo) return null
  // `audio_type` no se mira: se piden solo canciones (`audio_type=music`), y la documentación lo
  // da como texto en un lado y como entero en otro.
  const duracion = typeof c.duration_in_ms === 'number' && Number.isFinite(c.duration_in_ms) ? c.duration_in_ms : null
  const muestra = texto(c.download_url)
  return {
    id,
    titulo,
    artista: texto(c.display_artist),
    duracionMs: duracion,
    portada: texto(c.cover_artwork_thumbnail_uri) ?? texto(c.cover_artwork_thumbnail_url),
    muestra: muestra && /^https:\/\//.test(muestra) ? muestra : null,
  }
}

/** La lista de una respuesta de `/ig_audio`: `audio` según la documentación, `data` por si acaso. */
export function leerCanciones(cuerpo: unknown): CancionInstagram[] {
  if (typeof cuerpo !== 'object' || cuerpo === null) return []
  const c = cuerpo as Record<string, unknown>
  const lista = Array.isArray(c.audio) ? c.audio : Array.isArray(c.data) ? c.data : []
  const vistas = new Set<string>()
  const salida: CancionInstagram[] = []
  for (const crudo of lista) {
    const cancion = leerCancion(crudo)
    if (!cancion || vistas.has(cancion.id)) continue
    vistas.add(cancion.id)
    salida.push(cancion)
    if (salida.length >= MAX_CANCIONES) break
  }
  return salida
}

/** La cuenta con que se le pregunta a Meta: su id de Instagram y el token de quien la conectó. */
export type CuentaDeAudio = { igUserId: string; token: string }

/** La URL de la búsqueda; sin palabra, la de lo que está sonando. */
export function urlDeBusqueda(cuenta: CuentaDeAudio, busqueda: string | null): string {
  const params = new URLSearchParams({ audio_type: 'music', user_id: cuenta.igUserId })
  const palabra = busqueda?.trim()
  if (palabra) params.set('search_query', palabra.slice(0, 100))
  params.set('access_token', cuenta.token)
  return `${GRAPH_FACEBOOK}/ig_audio?${params.toString()}`
}

export function urlDeCancion(cuenta: CuentaDeAudio, audioId: string): string {
  const params = new URLSearchParams({ user_id: cuenta.igUserId, access_token: cuenta.token })
  return `${GRAPH_FACEBOOK}/${encodeURIComponent(audioId)}?${params.toString()}`
}

/** La frase de un rechazo de Meta: un 400/403 de permiso o token se arregla reconectando. */
function fraseDeRechazo(status: number): string {
  return status === 401 || status === 403 || status === 400 ? MUSICA_SIN_PERMISO : MUSICA_NO_RESPONDE
}

async function pedir(url: string, fetcher: Fetcher): Promise<{ cuerpo: unknown } | { error: string }> {
  let response: Response
  try {
    response = await fetcher(url, { signal: AbortSignal.timeout(PLAZO_MUSICA_MS) })
  } catch (error) {
    console.error('Instagram música:', String(error).slice(0, 300))
    return { error: MUSICA_NO_RESPONDE }
  }
  if (!response.ok) {
    // El cuerpo va al registro sin la URL, que lleva el token.
    console.error('Instagram música:', response.status, (await response.text().catch(() => '')).slice(0, 300))
    return { error: fraseDeRechazo(response.status) }
  }
  try {
    return { cuerpo: await response.json() }
  } catch {
    return { error: MUSICA_NO_RESPONDE }
  }
}

/** Lo que está sonando (sin palabra) o lo que encuentra una búsqueda. */
export async function buscarCanciones(
  cuenta: CuentaDeAudio,
  busqueda: string | null,
  fetcher: Fetcher = fetch,
): Promise<{ canciones: CancionInstagram[] } | { error: string }> {
  const r = await pedir(urlDeBusqueda(cuenta, busqueda), fetcher)
  if ('error' in r) return r
  return { canciones: leerCanciones(r.cuerpo) }
}

/** Los datos de una canción, con su muestra al día; null si Meta ya no la tiene. */
export async function cancionPorId(
  cuenta: CuentaDeAudio,
  audioId: string,
  fetcher: Fetcher = fetch,
): Promise<{ cancion: CancionInstagram | null } | { error: string }> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(audioId)) return { cancion: null }
  const r = await pedir(urlDeCancion(cuenta, audioId), fetcher)
  if ('error' in r) return r
  return { cancion: leerCancion(r.cuerpo) }
}

/**
 * Lo que está sonando cambia, pero no de un minuto a otro: se guarda diez minutos por cuenta en
 * la memoria de la instancia, para que abrir el bloque, sugerir y pedir «Otra» no le pregunten a
 * Meta lo mismo cada vez. Las búsquedas por palabra también, con su palabra en la llave. Es una
 * memoria de cortesía: en otra instancia no está y se pide de nuevo, sin otro costo.
 */
export const DURACION_MEMORIA_MS = 10 * 60_000
const MAX_EN_MEMORIA = 500

export class MemoriaDeCanciones {
  private readonly filas = new Map<string, { hasta: number; canciones: CancionInstagram[] }>()

  constructor(private readonly ahora: () => number = Date.now) {}

  leer(llave: string): CancionInstagram[] | null {
    const fila = this.filas.get(llave)
    if (!fila) return null
    if (fila.hasta <= this.ahora()) {
      this.filas.delete(llave)
      return null
    }
    return fila.canciones
  }

  guardar(llave: string, canciones: CancionInstagram[]): void {
    if (this.filas.size >= MAX_EN_MEMORIA) this.filas.delete(this.filas.keys().next().value!)
    this.filas.set(llave, { hasta: this.ahora() + DURACION_MEMORIA_MS, canciones })
  }
}

export function llaveDeMemoria(cuentaId: string, busqueda: string | null): string {
  return `${cuentaId}:${busqueda?.trim().toLowerCase() ?? ''}`
}
