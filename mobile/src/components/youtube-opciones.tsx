import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { RechazoApi, SesionCaducada, apiGet } from '../lib/api'
import type { CuentaApp } from '../lib/tipos'
import {
  AYUDA_VISIBILIDAD_YOUTUBE,
  ETIQUETA_VISIBILIDAD_YOUTUBE,
  PLAYLISTS_NO_RESPONDE,
  TEXTOS_YOUTUBE as T,
  VISIBILIDADES_YOUTUBE,
  playlistPerdida,
  type PlaylistYoutube,
  type YoutubeElegido,
} from '../lib/youtube'
import { useSesion } from './sesion'
import { useColores } from './tema'
import { Interruptor } from './tiktok-opciones'
import { BotonTexto, Chip } from './ui'

/**
 * El bloque de YouTube de una cuenta marcada en Publicar: quién lo ve, «Hecho con IA» y «Agregar a
 * una playlist». Es el del panel (`src/app/admin/(dash)/schedule/youtube-opciones.tsx`), con sus
 * textos; lo elegido vive en Publicar, que lo guarda en el borrador y lo manda al programar.
 *
 * Las playlists se le piden al sitio recién al encender «Agregar a una playlist», o al abrir un
 * borrador que tenía una: cada lista gasta cupo de la API de YouTube, que es uno solo para todos.
 */
export function YoutubeOpciones({
  cuenta,
  elegido,
  onCambiar,
  deshabilitado,
}: {
  cuenta: CuentaApp
  elegido: YoutubeElegido
  onCambiar: (e: YoutubeElegido) => void
  deshabilitado?: boolean
}) {
  const colores = useColores()
  const { token, salir } = useSesion()
  const [conPlaylist, setConPlaylist] = useState(elegido.playlist !== '')
  const [playlists, setPlaylists] = useState<PlaylistYoutube[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar(fresca: boolean) {
    if (!token) return
    setCargando(true)
    setError(null)
    try {
      const r = await apiGet<{ playlists: PlaylistYoutube[] }>(
        `/api/mobile/youtube/playlists?cuenta=${encodeURIComponent(cuenta.id)}${fresca ? '&fresca=1' : ''}`,
        token,
      )
      setPlaylists(r.playlists)
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return
      }
      setError(e instanceof RechazoApi ? e.message : PLAYLISTS_NO_RESPONDE)
    } finally {
      setCargando(false)
    }
  }

  // Un borrador que traía playlist abre con la lista pedida, para nombrarla.
  const conPlaylistInicial = elegido.playlist !== ''
  useEffect(() => {
    if (!conPlaylistInicial || !token) return
    let vivo = true
    apiGet<{ playlists: PlaylistYoutube[] }>(`/api/mobile/youtube/playlists?cuenta=${encodeURIComponent(cuenta.id)}`, token)
      .then((r) => {
        if (vivo) setPlaylists(r.playlists)
      })
      .catch((e: unknown) => {
        if (!vivo) return
        if (e instanceof SesionCaducada) void salir()
        else setError(e instanceof RechazoApi ? e.message : PLAYLISTS_NO_RESPONDE)
      })
    return () => {
      vivo = false
    }
    // Solo al abrir el bloque: después, lo pide el interruptor o «Volver a cargar».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuenta.id, token])

  function alternarPlaylist(encendido: boolean) {
    setConPlaylist(encendido)
    // Apagado no viaja ninguna playlist: el interruptor manda, como en el panel.
    if (!encendido) onCambiar({ ...elegido, playlist: '' })
    if (encendido && playlists === null && !cargando) void cargar(false)
  }

  const leyendo = cargando || (playlists === null && !error)
  const perdida = playlistPerdida(elegido, playlists)
  const pista = { color: colores.tenue, fontSize: 11 } as const

  return (
    <View style={{ gap: 12, borderRadius: 12, padding: 14, backgroundColor: colores.velo + '0A' }}>
      <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '600' }}>YouTube · {cuenta.handle ?? 'sin nombre'}</Text>

      <View style={{ gap: 6 }}>
        <Text style={{ color: colores.texto, fontSize: 12, fontWeight: '600' }}>{T.quienLoVe}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup">
          {VISIBILIDADES_YOUTUBE.map((v) => (
            <Chip
              key={v}
              texto={ETIQUETA_VISIBILIDAD_YOUTUBE[v]}
              activo={elegido.visibilidad === v}
              onPress={() => onCambiar({ ...elegido, visibilidad: v })}
              deshabilitado={deshabilitado}
            />
          ))}
        </View>
        <Text style={pista}>{AYUDA_VISIBILIDAD_YOUTUBE[elegido.visibilidad]}</Text>
      </View>

      <Interruptor
        texto={T.ia}
        pista={elegido.ia ? T.iaEncendida : T.iaApagada}
        valor={elegido.ia}
        onCambiar={(ia) => onCambiar({ ...elegido, ia })}
        deshabilitado={deshabilitado}
      />

      <View style={{ gap: 8 }}>
        <Interruptor
          texto={T.playlist}
          pista={conPlaylist ? T.playlistPista : T.playlistApagada}
          valor={conPlaylist}
          onCambiar={alternarPlaylist}
          deshabilitado={deshabilitado}
        />
        {conPlaylist ? (
          <View style={{ gap: 6, paddingLeft: 12 }}>
            {playlists === null ? (
              leyendo ? <Text style={pista}>{T.leyendo}</Text> : null
            ) : playlists.length === 0 && !perdida ? (
              <Text style={pista}>{T.sinPlaylists}</Text>
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="radiogroup">
                  {perdida ? <Chip texto={T.queYaNoEsta} activo onPress={() => {}} deshabilitado={deshabilitado} /> : null}
                  {playlists.map((p) => (
                    <Chip
                      key={p.id}
                      texto={p.titulo}
                      activo={elegido.playlist === p.id}
                      onPress={() => onCambiar({ ...elegido, playlist: p.id })}
                      deshabilitado={deshabilitado}
                    />
                  ))}
                </View>
                {elegido.playlist === '' ? <Text style={pista}>{T.eligeUna}</Text> : null}
              </>
            )}
            {error ? <Text style={{ color: colores.ambar, fontSize: 11 }}>{error}</Text> : null}
            {leyendo && playlists === null ? null : (
              <View style={{ alignSelf: 'flex-start' }}>
                <BotonTexto texto={T.volverACargar} onPress={() => void cargar(true)} deshabilitado={deshabilitado || cargando} />
              </View>
            )}
          </View>
        ) : null}
      </View>
    </View>
  )
}
