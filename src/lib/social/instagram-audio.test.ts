import { describe, expect, it, vi } from 'vitest'
import {
  DURACION_MEMORIA_MS,
  MAX_CANCIONES,
  MUSICA_NO_RESPONDE,
  MUSICA_SIN_PERMISO,
  MemoriaDeCanciones,
  buscarCanciones,
  cancionPorId,
  leerCancion,
  leerCanciones,
  llaveDeMemoria,
  urlDeBusqueda,
  urlDeCancion,
} from './instagram-audio'

// La forma de la respuesta de ejemplo de la documentación de la Audio API (2026-06-01): una
// con muestra y otra sin ella, con la carátula como `_uri` en la búsqueda.
const BUSQUEDA = {
  audio: [
    {
      audio_id: '587784541076604',
      cover_artwork_thumbnail_uri: 'https://scontent.example/cover.jpg',
      display_artist: 'Karol G',
      duration_in_ms: 180000,
      audio_type: 'music',
      title: 'Tusa',
      download_url: 'https://cdn.example/preview.mp3',
    },
    {
      audio_id: '112233',
      display_artist: 'Bad Bunny',
      duration_in_ms: 200000,
      audio_type: 'music',
      title: 'Tití Me Preguntó',
      is_ads_eligible: true,
      on_platform_audio_preview_link: 'https://www.instagram.com/reels/audio/112233',
    },
  ],
}

const cuenta = { igUserId: '17841400000000000', token: 'secreto' }

describe('leerCanciones', () => {
  it('lee la búsqueda de la documentación, con y sin muestra', () => {
    expect(leerCanciones(BUSQUEDA)).toEqual([
      {
        id: '587784541076604',
        titulo: 'Tusa',
        artista: 'Karol G',
        duracionMs: 180000,
        portada: 'https://scontent.example/cover.jpg',
        muestra: 'https://cdn.example/preview.mp3',
      },
      { id: '112233', titulo: 'Tití Me Preguntó', artista: 'Bad Bunny', duracionMs: 200000, portada: null, muestra: null },
    ])
  })

  it('descarta lo que no trae id o título, repetidos y muestras que no son https; acepta `data`', () => {
    expect(
      leerCanciones({
        data: [
          { title: 'sin id' },
          { audio_id: '1' },
          { audio_id: '2', title: 'Dos', download_url: 'http://inseguro/x.mp3' },
          { audio_id: '2', title: 'Dos otra vez' },
          { id: '3', title: 'Tres', cover_artwork_thumbnail_url: 'https://c/3.jpg' },
        ],
      }),
    ).toEqual([
      { id: '2', titulo: 'Dos', artista: null, duracionMs: null, portada: null, muestra: null },
      { id: '3', titulo: 'Tres', artista: null, duracionMs: null, portada: 'https://c/3.jpg', muestra: null },
    ])
    expect(leerCanciones(null)).toEqual([])
    expect(leerCanciones({ audio: 'nada' })).toEqual([])
  })

  it('no pasa del tope', () => {
    const muchas = { audio: Array.from({ length: 50 }, (_, i) => ({ audio_id: String(i + 1), title: `C${i}` })) }
    expect(leerCanciones(muchas)).toHaveLength(MAX_CANCIONES)
  })

  it('los datos de una canción: `_url` en la carátula', () => {
    expect(
      leerCancion({
        audio_id: '587784541076604',
        cover_artwork_thumbnail_url: 'https://c/x.jpg',
        display_artist: 'Karol G',
        title: 'Tusa',
        download_url: 'https://cdn/x.mp3',
      })?.portada,
    ).toBe('https://c/x.jpg')
  })
})

describe('las URL de la Audio API', () => {
  it('sin palabra pide lo que suena; con palabra, busca; siempre música y por graph.facebook.com', () => {
    const sonando = new URL(urlDeBusqueda(cuenta, null))
    expect(sonando.origin).toBe('https://graph.facebook.com')
    expect(sonando.pathname).toMatch(/\/ig_audio$/)
    expect(sonando.searchParams.get('audio_type')).toBe('music')
    expect(sonando.searchParams.get('user_id')).toBe(cuenta.igUserId)
    expect(sonando.searchParams.has('search_query')).toBe(false)
    expect(new URL(urlDeBusqueda(cuenta, '  lofi chill ')).searchParams.get('search_query')).toBe('lofi chill')
    expect(new URL(urlDeBusqueda(cuenta, '   ')).searchParams.has('search_query')).toBe(false)
  })

  it('una canción por su id', () => {
    const url = new URL(urlDeCancion(cuenta, '587784541076604'))
    expect(url.pathname).toMatch(/\/587784541076604$/)
    expect(url.searchParams.get('user_id')).toBe(cuenta.igUserId)
  })
})

describe('buscarCanciones y cancionPorId', () => {
  it('devuelve lo leído', async () => {
    const fetcher = vi.fn(async () => Response.json(BUSQUEDA))
    expect(await buscarCanciones(cuenta, null, fetcher)).toEqual({ canciones: leerCanciones(BUSQUEDA) })
  })

  it('un 400 o 403 es de permiso; un 500 o la red caída, que no respondió', async () => {
    expect(await buscarCanciones(cuenta, null, async () => new Response('{}', { status: 403 }))).toEqual({ error: MUSICA_SIN_PERMISO })
    expect(await buscarCanciones(cuenta, null, async () => new Response('{}', { status: 500 }))).toEqual({ error: MUSICA_NO_RESPONDE })
    expect(
      await buscarCanciones(cuenta, null, async () => {
        throw new Error('timeout')
      }),
    ).toEqual({ error: MUSICA_NO_RESPONDE })
  })

  it('una canción que Meta ya no da es null; un id sin forma ni se pregunta', async () => {
    expect(await cancionPorId(cuenta, '1', async () => Response.json({ error: 'x' }))).toEqual({ cancion: null })
    const fetcher = vi.fn(async () => Response.json({}))
    expect(await cancionPorId(cuenta, '../me', fetcher)).toEqual({ cancion: null })
    expect(fetcher).not.toHaveBeenCalled()
  })
})

describe('MemoriaDeCanciones', () => {
  it('guarda diez minutos por llave, y después lo olvida', () => {
    let ahora = 0
    const memoria = new MemoriaDeCanciones(() => ahora)
    const llave = llaveDeMemoria('cuenta-1', null)
    memoria.guardar(llave, leerCanciones(BUSQUEDA))
    expect(memoria.leer(llave)).toHaveLength(2)
    expect(memoria.leer(llaveDeMemoria('cuenta-2', null))).toBeNull()
    ahora = DURACION_MEMORIA_MS
    expect(memoria.leer(llave)).toBeNull()
  })

  it('la búsqueda es parte de la llave, sin mayúsculas ni espacios de más', () => {
    expect(llaveDeMemoria('c', ' Lofi ')).toBe(llaveDeMemoria('c', 'lofi'))
    expect(llaveDeMemoria('c', 'lofi')).not.toBe(llaveDeMemoria('c', null))
  })
})
