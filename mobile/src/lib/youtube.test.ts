import { describe, expect, it } from 'vitest'

import type { CuentaApp } from './tipos'
import { cuentasDeYoutube, opcionesYoutube, playlistPerdida, youtubeInicial } from './youtube'

describe('el bloque de YouTube', () => {
  it('nace como siempre: público, sin IA, sin playlist; un borrador trae lo suyo', () => {
    expect(youtubeInicial(undefined)).toEqual({ visibilidad: 'public', ia: false, playlist: '' })
    expect(youtubeInicial({ visibilidad: 'private', ia: true, playlist: 'PL1' })).toEqual({
      visibilidad: 'private',
      ia: true,
      playlist: 'PL1',
    })
    expect(youtubeInicial({ visibilidad: 'oculto' as never }).visibilidad).toBe('public')
  })

  it('un bloque por cada canal de YouTube marcado y conectado', () => {
    const cuentas: CuentaApp[] = [
      { id: 'yt-1', red: 'youtube', handle: 'Canal', conectada: true },
      { id: 'yt-2', red: 'youtube', handle: 'Otro', conectada: false },
      { id: 'ig-1', red: 'instagram', handle: '@c', conectada: true },
    ]
    expect(cuentasDeYoutube(cuentas, ['yt-1', 'yt-2', 'ig-1']).map((c) => c.id)).toEqual(['yt-1'])
  })

  it('viaja con las tres claves que acepta el sitio; sin playlist, null', () => {
    expect(opcionesYoutube({ visibilidad: 'public', ia: false, playlist: '' })).toEqual({
      visibilidad: 'public',
      ia: false,
      playlist: null,
    })
    expect(opcionesYoutube({ visibilidad: 'unlisted', ia: true, playlist: 'PL1' })).toEqual({
      visibilidad: 'unlisted',
      ia: true,
      playlist: 'PL1',
    })
  })

  it('una playlist elegida que ya no está en el canal se nota, pero solo con la lista ya leída', () => {
    const e = { visibilidad: 'public' as const, ia: false, playlist: 'PL1' }
    expect(playlistPerdida(e, null)).toBe(false)
    expect(playlistPerdida(e, [{ id: 'PL1', titulo: 'Una' }])).toBe(false)
    expect(playlistPerdida(e, [{ id: 'PL2', titulo: 'Dos' }])).toBe(true)
    expect(playlistPerdida({ ...e, playlist: '' }, [])).toBe(false)
  })
})
