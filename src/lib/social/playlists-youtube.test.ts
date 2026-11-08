import { describe, expect, it, vi } from 'vitest'
import {
  DURACION_MEMORIA_PLAYLISTS_MS,
  MemoriaDePlaylists,
  PLAYLISTS_NO_RESPONDE,
  PLAYLISTS_SIN_PERMISO,
  PLAYLIST_NO_AGREGADO,
  PLAYLIST_YA_NO_EXISTE,
  agregarAPlaylist,
  listarPlaylists,
  playlistsDeRespuesta,
} from './playlists-youtube'

describe('playlistsDeRespuesta', () => {
  it('saca id y título, y deja fuera lo que no los trae', () => {
    expect(
      playlistsDeRespuesta({
        items: [
          { id: 'PL1', snippet: { title: ' Recetas ' } },
          { id: 'PL2', snippet: { title: '' } },
          { snippet: { title: 'Sin id' } },
          { id: 'PL3', snippet: { title: 'Viajes', description: 'no se usa' } },
        ],
      }),
    ).toEqual([
      { id: 'PL1', titulo: 'Recetas' },
      { id: 'PL3', titulo: 'Viajes' },
    ])
    expect(playlistsDeRespuesta(null)).toEqual([])
    expect(playlistsDeRespuesta({ items: 'no' })).toEqual([])
  })
})

describe('listarPlaylists', () => {
  it('pide las del canal propio y sigue las páginas', async () => {
    const urls: string[] = []
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      urls.push(url)
      expect(init?.headers).toEqual({ Authorization: 'Bearer tok' })
      return url.includes('pageToken=')
        ? Response.json({ items: [{ id: 'PL2', snippet: { title: 'Dos' } }] })
        : Response.json({ items: [{ id: 'PL1', snippet: { title: 'Una' } }], nextPageToken: 'p2' })
    })
    expect(await listarPlaylists('tok', fetcher)).toEqual({
      playlists: [
        { id: 'PL1', titulo: 'Una' },
        { id: 'PL2', titulo: 'Dos' },
      ],
    })
    expect(urls).toHaveLength(2)
    expect(urls[0]).toContain('mine=true')
    expect(urls[0]).toContain('part=snippet')
    expect(urls[1]).toContain('pageToken=p2')
    expect(fetcher.mock.calls[0]![1]).toMatchObject({ headers: { Authorization: 'Bearer tok' } })
  })

  it('no pide más de cuatro páginas: el cupo es uno solo para todos', async () => {
    const fetcher = vi.fn(async () => Response.json({ items: [], nextPageToken: 'otra' }))
    await listarPlaylists('tok', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(4)
  })

  it('un 401 o 403 pide reconectar; lo demás, que YouTube no respondió', async () => {
    expect(await listarPlaylists('tok', async () => new Response('', { status: 403 }))).toEqual({
      error: PLAYLISTS_SIN_PERMISO,
    })
    expect(await listarPlaylists('tok', async () => new Response('', { status: 500 }))).toEqual({
      error: PLAYLISTS_NO_RESPONDE,
    })
    expect(
      await listarPlaylists('tok', async () => {
        throw new Error('red')
      }),
    ).toEqual({ error: PLAYLISTS_NO_RESPONDE })
  })
})

describe('agregarAPlaylist', () => {
  it('null si entró; nunca lanza', async () => {
    expect(await agregarAPlaylist('t', 'PL1', 'v1', 1000, async () => Response.json({ id: 'x' }))).toBeNull()
    expect(await agregarAPlaylist('t', 'PL1', 'v1', 1000, async () => new Response('', { status: 404 }))).toBe(
      PLAYLIST_YA_NO_EXISTE,
    )
    expect(await agregarAPlaylist('t', 'PL1', 'v1', 1000, async () => new Response('', { status: 400 }))).toBe(
      PLAYLIST_NO_AGREGADO,
    )
    await expect(
      agregarAPlaylist('t', 'PL1', 'v1', 1000, async () => {
        throw new Error('red')
      }),
    ).resolves.toBe(PLAYLIST_NO_AGREGADO)
  })

  it('los dos avisos dicen que el video salió', () => {
    expect(PLAYLIST_NO_AGREGADO.startsWith('Salió en YouTube')).toBe(true)
    expect(PLAYLIST_YA_NO_EXISTE.startsWith('Salió en YouTube')).toBe(true)
  })
})

describe('MemoriaDePlaylists', () => {
  it('guarda unos minutos por cuenta, y olvidar la vacía', () => {
    let ahora = 0
    const memoria = new MemoriaDePlaylists(() => ahora)
    memoria.guardar('c1', [{ id: 'PL1', titulo: 'Una' }])
    expect(memoria.leer('c1')).toEqual([{ id: 'PL1', titulo: 'Una' }])
    expect(memoria.leer('c2')).toBeNull()
    ahora = DURACION_MEMORIA_PLAYLISTS_MS
    expect(memoria.leer('c1')).toBeNull()
    memoria.guardar('c1', [])
    memoria.olvidar('c1')
    expect(memoria.leer('c1')).toBeNull()
  })
})
