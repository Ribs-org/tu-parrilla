import { useEffect, useRef, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { RechazoApi, SesionCaducada, apiGet, apiPost } from '../lib/api'
import {
  MUSICA_SOLO_LOGIN_DE_FACEBOOK,
  SIN_MAS_CANCIONES,
  SIN_MUESTRA,
  admiteMusica,
  moverVolumen,
  musicaElegida,
  nombreDeCancion,
  type CancionInstagram,
  type MusicaInstagram,
  type SugerenciaMusica,
} from '../lib/musica'
import { SIN_SENAL } from '../lib/publicar'
import { crearReproductor, muestraSeAbreAfuera } from '../lib/reproductor'
import type { CuentaApp } from '../lib/tipos'
import { useSesion } from './sesion'
import { useColores } from './tema'
import { Boton, BotonTexto } from './ui'

type Respuesta = { sugerencia: SugerenciaMusica; busquedas: string[] } | { agotadas: true; busquedas: string[] }

/**
 * «Música de Instagram» en Publicar, por cuenta de Instagram marcada y con un solo video: lo que
 * está sonando, una búsqueda, la muestra para escuchar, «Sugiéreme una» con su «Otra» y los dos
 * volúmenes. Las mismas rutas que el panel por dentro (`/api/mobile/musica`), y la canción
 * elegida vive en Publicar, que la guarda en el borrador y la manda al programar.
 */
export function MusicaInstagramBloque({
  cuenta,
  elegida,
  onElegir,
  texto,
  deshabilitado,
}: {
  cuenta: CuentaApp
  elegida: MusicaInstagram | null
  onElegir: (musica: MusicaInstagram | null) => void
  /** El texto del post, para «Sugiéreme una». */
  texto: string
  deshabilitado?: boolean
}) {
  const colores = useColores()
  const { token, salir } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [canciones, setCanciones] = useState<CancionInstagram[] | null>(null)
  const [buscada, setBuscada] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sugerencia, setSugerencia] = useState<SugerenciaMusica | null>(null)
  const [sugiriendo, setSugiriendo] = useState(false)
  const [sinMas, setSinMas] = useState(false)
  const [sonando, setSonando] = useState<string | null>(null)
  const [muestras, setMuestras] = useState<Record<string, string | null>>({})
  // Lo ya mostrado, para que «Otra» no repita; las búsquedas que propuso el modelo, para no
  // pedirlas de nuevo con el mismo texto. Solo se leen al tocar, nunca al dibujar.
  const vistas = useRef<string[]>([])
  const busquedas = useRef<{ texto: string; lista: string[] } | null>(null)
  const reproductor = useRef<ReturnType<typeof crearReproductor> | null>(null)

  useEffect(() => () => reproductor.current?.parar(), [])

  const handle = cuenta.handle ?? 'sin nombre'
  if (!admiteMusica(cuenta)) {
    return (
      <View style={{ gap: 4 }}>
        <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '600' }}>Música de Instagram · {handle}</Text>
        <Text style={{ color: colores.tenue, fontSize: 11 }}>{MUSICA_SOLO_LOGIN_DE_FACEBOOK}</Text>
      </View>
    )
  }

  async function conRed<T>(pedido: () => Promise<T>): Promise<T | null> {
    if (!token) return null
    try {
      return await pedido()
    } catch (e) {
      if (e instanceof SesionCaducada) {
        await salir()
        return null
      }
      setError(e instanceof RechazoApi ? e.message : SIN_SENAL)
      return null
    }
  }

  function recordar(lista: CancionInstagram[]) {
    setMuestras((antes) => ({ ...antes, ...Object.fromEntries(lista.map((c) => [c.id, c.muestra])) }))
  }

  async function buscar(palabra: string | null) {
    setCargando(true)
    setError(null)
    const q = palabra ? `&q=${encodeURIComponent(palabra)}` : ''
    const r = await conRed(() =>
      apiGet<{ canciones: CancionInstagram[] }>(`/api/mobile/musica?cuenta=${encodeURIComponent(cuenta.id)}${q}`, token!),
    )
    setCargando(false)
    if (!r) return
    recordar(r.canciones)
    setCanciones(r.canciones)
    setBuscada(palabra)
  }

  function abrir() {
    setAbierto(true)
    if (canciones === null) void buscar(null)
  }

  async function sugerir(otra: boolean) {
    setSugiriendo(true)
    setError(null)
    setSinMas(false)
    if (otra && sugerencia) vistas.current = [...vistas.current, sugerencia.cancion.id]
    const conBusquedas = busquedas.current?.texto === texto ? busquedas.current.lista : null
    const r = await conRed(() =>
      apiPost<Respuesta>('/api/mobile/musica/sugerencia', token!, {
        cuenta: cuenta.id,
        texto,
        vistas: [...vistas.current, ...(elegida ? [elegida.audioId] : [])],
        busquedas: conBusquedas,
      }),
    )
    setSugiriendo(false)
    if (!r) return
    busquedas.current = { texto, lista: r.busquedas }
    if ('agotadas' in r) {
      setSugerencia(null)
      setSinMas(true)
      return
    }
    recordar([r.sugerencia.cancion])
    setSugerencia(r.sugerencia)
  }

  function elegir(c: CancionInstagram) {
    onElegir(musicaElegida(c, elegida?.volumenMusica, elegida?.volumenVideo))
    setSugerencia(null)
    setAbierto(false)
  }

  function parar() {
    reproductor.current?.parar()
    setSonando(null)
  }

  async function escuchar(id: string) {
    if (sonando === id) {
      parar()
      return
    }
    let url = muestras[id]
    if (url === undefined) {
      const r = await conRed(() =>
        apiGet<{ cancion: CancionInstagram | null }>(
          `/api/mobile/musica/${encodeURIComponent(id)}?cuenta=${encodeURIComponent(cuenta.id)}`,
          token!,
        ),
      )
      url = r?.cancion?.muestra ?? null
      const nueva = url
      setMuestras((antes) => ({ ...antes, [id]: nueva }))
    }
    if (!url) {
      setError(SIN_MUESTRA)
      return
    }
    reproductor.current ??= crearReproductor()
    try {
      const como = await reproductor.current.tocar(url, () => setSonando(null))
      setSonando(como === 'suena' ? id : null)
    } catch {
      setError(SIN_MUESTRA)
      setSonando(null)
    }
  }

  const pequeno = { color: colores.tenue, fontSize: 11 } as const

  function filaDeVolumen(etiqueta: string, valor: number, cambiar: (v: number) => void) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: colores.texto, fontSize: 13, flex: 1 }}>
          {etiqueta}: {valor} %
        </Text>
        <BotonTexto texto="−" onPress={() => cambiar(moverVolumen(valor, -1))} deshabilitado={deshabilitado || valor <= 1} />
        <BotonTexto texto="+" onPress={() => cambiar(moverVolumen(valor, 1))} deshabilitado={deshabilitado || valor >= 100} />
      </View>
    )
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '600' }}>Música de Instagram · {handle}</Text>
      <Text style={pequeno}>
        Una canción de la biblioteca de Instagram encima del sonido del video. Instagram no deja ver el reel con la canción
        antes de publicarlo: sale tal como lo dejes acá.
      </Text>

      {elegida ? (
        <View style={{ gap: 4, borderWidth: 1, borderColor: colores.tenue, borderRadius: 12, padding: 10 }}>
          <Text style={{ color: colores.texto, fontSize: 13 }}>Canción elegida: {nombreDeCancion(elegida)}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <BotonTexto
              texto={sonando === elegida.audioId ? 'Pausar' : 'Escuchar'}
              onPress={() => void escuchar(elegida.audioId)}
              deshabilitado={deshabilitado}
            />
            <BotonTexto
              texto="Quitar"
              peligro
              onPress={() => {
                if (sonando === elegida.audioId) parar()
                onElegir(null)
              }}
              deshabilitado={deshabilitado}
            />
          </View>
          {filaDeVolumen('Canción', elegida.volumenMusica, (v) => onElegir({ ...elegida, volumenMusica: v }))}
          {filaDeVolumen('Video', elegida.volumenVideo, (v) => onElegir({ ...elegida, volumenVideo: v }))}
          <Text style={pequeno}>Si en el video hablas, bájale a la canción para que no tape tu voz.</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Boton
          texto={sugiriendo && !sugerencia ? 'Buscando una…' : 'Sugiéreme una'}
          onPress={() => void sugerir(false)}
          deshabilitado={deshabilitado || sugiriendo}
        />
        {abierto ? null : (
          <Boton texto={elegida ? 'Cambiar canción' : 'Elegir canción'} onPress={abrir} deshabilitado={deshabilitado} />
        )}
      </View>

      {sugerencia ? (
        <View style={{ gap: 6, borderWidth: 1, borderColor: colores.brasa, borderRadius: 12, padding: 10 }}>
          <Text style={{ color: colores.texto, fontSize: 13, fontWeight: '600' }}>{nombreDeCancion(sugerencia.cancion)}</Text>
          <Text style={{ color: colores.suave, fontSize: 12 }}>{sugerencia.razon}</Text>
          <BotonTexto
            texto={sonando === sugerencia.cancion.id ? 'Pausar' : 'Escuchar'}
            onPress={() => void escuchar(sugerencia.cancion.id)}
            deshabilitado={deshabilitado || muestras[sugerencia.cancion.id] === null}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Boton texto="Usar esta" destacado onPress={() => elegir(sugerencia.cancion)} deshabilitado={deshabilitado} />
            <Boton
              texto={sugiriendo ? 'Buscando otra…' : 'Otra'}
              onPress={() => void sugerir(true)}
              deshabilitado={deshabilitado || sugiriendo}
            />
          </View>
        </View>
      ) : null}
      {sinMas ? <Text style={pequeno}>{SIN_MAS_CANCIONES}</Text> : null}

      {abierto ? (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Busca una canción o un artista"
              placeholderTextColor={colores.tenue}
              returnKeyType="search"
              onSubmitEditing={() => void buscar(busqueda.trim() || null)}
              accessibilityLabel="Buscar en la música de Instagram"
              style={{
                flex: 1,
                color: colores.texto,
                borderWidth: 1,
                borderColor: colores.tenue,
                borderRadius: 10,
                paddingHorizontal: 10,
                minHeight: 44,
              }}
            />
            <BotonTexto texto="Buscar" onPress={() => void buscar(busqueda.trim() || null)} deshabilitado={cargando} />
          </View>
          <Text style={{ ...pequeno, fontWeight: '600' }}>
            {buscada ? `Resultados para «${buscada}»` : 'Sonando ahora en Instagram'}
          </Text>
          {cargando ? <Text style={pequeno}>Cargando…</Text> : null}
          {!cargando && canciones && canciones.length === 0 ? (
            <Text style={pequeno}>
              {buscada ? `Instagram no encontró canciones con «${buscada}».` : 'Instagram no tiene canciones para mostrar ahora.'}
            </Text>
          ) : null}
          {!cargando && canciones
            ? canciones.map((c) => (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colores.texto, fontSize: 13 }} numberOfLines={1}>
                      {c.titulo}
                    </Text>
                    {c.artista ? (
                      <Text style={pequeno} numberOfLines={1}>
                        {c.artista}
                      </Text>
                    ) : null}
                  </View>
                  <BotonTexto
                    texto={sonando === c.id ? 'Pausar' : 'Escuchar'}
                    onPress={() => void escuchar(c.id)}
                    deshabilitado={deshabilitado || !c.muestra}
                  />
                  <BotonTexto
                    texto={elegida?.audioId === c.id ? 'Elegida' : 'Usar esta'}
                    onPress={() => elegir(c)}
                    deshabilitado={deshabilitado || elegida?.audioId === c.id}
                  />
                </View>
              ))
            : null}
          <BotonTexto texto="Cerrar la lista" onPress={() => setAbierto(false)} />
        </View>
      ) : null}

      {!muestraSeAbreAfuera() ? null : <Text style={pequeno}>En esta versión de la app, la muestra se abre fuera de ella.</Text>}
      {error ? <Text style={{ color: colores.ambar, fontSize: 11 }}>{error}</Text> : null}
    </View>
  )
}
