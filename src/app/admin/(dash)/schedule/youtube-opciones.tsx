'use client'

import { useEffect, useState } from 'react'
import { playlistsAccion } from '@/app/admin/playlists-actions'
import { Button, Field, GroupLabel, Select, Toggle } from '@/components/ui'
import type { YoutubeInicial } from '@/lib/borrador'
import type { CuentaDestino } from '@/lib/social/cuentas'
import {
  AYUDA_VISIBILIDAD_YOUTUBE,
  ETIQUETA_VISIBILIDAD_YOUTUBE,
  IA_YOUTUBE_APAGADO,
  IA_YOUTUBE_ENCENDIDO,
  VISIBILIDADES_YOUTUBE,
  type VisibilidadYoutube,
} from '@/lib/social/publish/opciones'
import { PLAYLISTS_NO_RESPONDE, type PlaylistYoutube } from '@/lib/social/playlists-youtube'

/** Lo que dice «Agregar a una playlist» debajo, encendido. */
export const AYUDA_PLAYLIST =
  'Cuando el video salga, lo agregamos al final de esa playlist. Si YouTube no lo deja, el video sale igual y te lo decimos en la publicación.'
export const SIN_PLAYLISTS = 'Este canal todavía no tiene playlists. Crea una en YouTube y aprieta «Volver a cargar».'
export const PLAYLIST_QUE_YA_NO_ESTA = 'La que elegiste antes (ya no aparece en el canal)'

/**
 * Lo que YouTube deja elegir por destino: quién lo ve, si es contenido hecho o alterado con IA, y
 * una playlist del canal. Los campos llevan el id de la cuenta como sufijo, como los de TikTok:
 * puede haber dos bloques en el mismo formulario. `inicial` es lo que tenía un borrador.
 *
 * Las playlists se le piden a YouTube recién al encender «Agregar a una playlist» (o al abrir un
 * borrador que tenía una): cada lista gasta cupo de la API, que es uno solo para todos.
 */
export function YoutubeOpciones({ cuenta, inicial }: { cuenta: CuentaDestino; inicial?: YoutubeInicial | null }) {
  const [visibilidad, setVisibilidad] = useState<VisibilidadYoutube>(inicial?.visibilidad ?? 'public')
  const [ia, setIa] = useState(inicial?.ia ?? false)
  const [conPlaylist, setConPlaylist] = useState(Boolean(inicial?.playlist))
  const [playlist, setPlaylist] = useState(inicial?.playlist ?? '')
  const [playlists, setPlaylists] = useState<PlaylistYoutube[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar(fresca: boolean) {
    setCargando(true)
    setError(null)
    try {
      const r = await playlistsAccion(cuenta.id, fresca)
      if ('error' in r) setError(r.error)
      else setPlaylists(r.playlists)
    } catch {
      setError(PLAYLISTS_NO_RESPONDE)
    } finally {
      setCargando(false)
    }
  }

  // Un borrador que traía playlist abre con la lista pedida, para nombrarla.
  const conPlaylistInicial = Boolean(inicial?.playlist)
  useEffect(() => {
    if (!conPlaylistInicial) return
    let vivo = true
    playlistsAccion(cuenta.id)
      .then((r) => {
        if (!vivo) return
        if ('error' in r) setError(r.error)
        else setPlaylists(r.playlists)
      })
      .catch(() => {
        if (vivo) setError(PLAYLISTS_NO_RESPONDE)
      })
    return () => {
      vivo = false
    }
  }, [cuenta.id, conPlaylistInicial])

  function alternarPlaylist(encendido: boolean) {
    setConPlaylist(encendido)
    if (encendido && playlists === null && !cargando) void cargar(false)
  }

  const leyendo = cargando || (playlists === null && !error)
  const perdida = playlist !== '' && playlists !== null && !playlists.some((p) => p.id === playlist)

  return (
    <div className="space-y-4 rounded-xl bg-velo/[0.04] p-4">
      <GroupLabel>YouTube · {cuenta.handle ?? 'sin nombre'}</GroupLabel>

      <Field label="Quién lo ve" hint={AYUDA_VISIBILIDAD_YOUTUBE[visibilidad]}>
        <Select
          name={`youtubeVisibilidad:${cuenta.id}`}
          value={visibilidad}
          onChange={(e) => setVisibilidad(e.target.value as VisibilidadYoutube)}
          className="max-w-[16rem]"
        >
          {VISIBILIDADES_YOUTUBE.map((v) => (
            <option key={v} value={v}>
              {ETIQUETA_VISIBILIDAD_YOUTUBE[v]}
            </option>
          ))}
        </Select>
      </Field>

      <Toggle
        name={`youtubeIA:${cuenta.id}`}
        label="Hecho con IA"
        hint={ia ? IA_YOUTUBE_ENCENDIDO : IA_YOUTUBE_APAGADO}
        checked={ia}
        onChange={setIa}
      />

      <div className="space-y-2">
        <Toggle
          label="Agregar a una playlist"
          hint={conPlaylist ? AYUDA_PLAYLIST : 'Cuando el video salga, lo agregamos a una playlist de tu canal.'}
          checked={conPlaylist}
          onChange={alternarPlaylist}
        />
        <input type="hidden" name={`youtubePlaylist:${cuenta.id}`} value={conPlaylist ? playlist : ''} />
        {conPlaylist ? (
          <div className="ml-12 space-y-2">
            {playlists === null ? (
              leyendo ? <p className="text-[0.78rem] text-fg-faint">Leyendo tus playlists…</p> : null
            ) : playlists.length === 0 && !perdida ? (
              <p className="text-[0.78rem] text-fg-faint">{SIN_PLAYLISTS}</p>
            ) : (
              <Select
                aria-label="Playlist"
                value={playlist}
                onChange={(e) => setPlaylist(e.target.value)}
                className="max-w-[20rem]"
              >
                <option value="" disabled>
                  Elige una playlist
                </option>
                {perdida ? <option value={playlist}>{PLAYLIST_QUE_YA_NO_ESTA}</option> : null}
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
                  </option>
                ))}
              </Select>
            )}
            {error ? <p className="text-[0.78rem] text-caution">{error}</p> : null}
            {leyendo && playlists === null ? null : (
              <Button type="button" onClick={() => void cargar(true)} disabled={cargando}>
                {cargando ? 'Cargando…' : 'Volver a cargar'}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
