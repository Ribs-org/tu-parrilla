'use client'

import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { buscarMusicaAccion, cancionAccion, sugerirMusicaAccion } from '@/app/admin/musica-actions'
import { Button } from '@/components/ui'
import {
  MUSICA_SOLO_LOGIN_DE_FACEBOOK,
  SIN_MUESTRA,
  VOLUMEN_CANCION_INICIAL,
  VOLUMEN_VIDEO_INICIAL,
  type CancionInstagram,
} from '@/lib/social/instagram-audio'
import { SIN_MAS_CANCIONES } from '@/lib/social/musica-sugerencia'
import { nombreDeCancion, type MusicaInstagram } from '@/lib/social/publish/opciones'
import { cn } from '@/lib/utils'

/** La canción elegida como viaja en el campo oculto y en las opciones del destino. */
export function musicaElegida(c: CancionInstagram, volumenMusica = VOLUMEN_CANCION_INICIAL, volumenVideo = VOLUMEN_VIDEO_INICIAL): MusicaInstagram {
  return { audioId: c.id, titulo: c.titulo, artista: c.artista, volumenMusica, volumenVideo }
}

/**
 * «Música de Instagram», dentro del bloque de Instagram del compositor (que solo se monta con
 * un video solo, como reel). Lo que está sonando, una búsqueda, la muestra para escuchar
 * (`download_url`, en un `<audio>` del navegador), «Sugiéreme una» con su «Otra», y dos
 * volúmenes. La canción elegida viaja en un campo oculto (`instagramMusica:<id>`, en JSON): así
 * la guardan el borrador y el formulario sin que nadie más sepa de música.
 *
 * Con el login de Instagram el bloque no ofrece nada y dice por qué: Meta no tiene la Audio API
 * para ese login.
 */
export function MusicaInstagramBloque({
  cuentaId,
  loginDeInstagram,
  inicial,
  leerTexto,
}: {
  cuentaId: string
  loginDeInstagram: boolean
  inicial: MusicaInstagram | null
  /** El texto del post en este momento, para «Sugiéreme una». */
  leerTexto: () => string
}) {
  const [elegida, setElegida] = useState<MusicaInstagram | null>(inicial)
  const [abierto, setAbierto] = useState(false)
  const [canciones, setCanciones] = useState<CancionInstagram[] | null>(null)
  const [buscada, setBuscada] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sugerencia, setSugerencia] = useState<{ cancion: CancionInstagram; razon: string } | null>(null)
  const [sugiriendo, setSugiriendo] = useState(false)
  const [sinMas, setSinMas] = useState(false)
  // Lo ya mostrado en esta sesión, para que «Otra» no repita; y las búsquedas que propuso el
  // modelo, para no pedírselas de nuevo mientras el texto sea el mismo.
  const vistas = useRef<string[]>([])
  const busquedas = useRef<{ texto: string; lista: string[] } | null>(null)

  // Un solo reproductor para todo el bloque: tocar otra canción para la que suena.
  const audio = useRef<HTMLAudioElement | null>(null)
  const [sonando, setSonando] = useState<string | null>(null)
  // La muestra de cada canción vista, por id: la elegida de un borrador no la trae y se pide.
  const [muestras, setMuestras] = useState<Record<string, string | null>>({})

  useEffect(() => () => audio.current?.pause(), [])

  if (loginDeInstagram) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium">Música de Instagram</p>
        <p className="text-[0.78rem] text-fg-faint">{MUSICA_SOLO_LOGIN_DE_FACEBOOK}</p>
      </div>
    )
  }

  function recordar(lista: CancionInstagram[]) {
    setMuestras((antes) => ({ ...antes, ...Object.fromEntries(lista.map((c) => [c.id, c.muestra])) }))
  }

  async function buscar(palabra: string | null) {
    setCargando(true)
    setError(null)
    try {
      const r = await buscarMusicaAccion(cuentaId, palabra)
      if ('error' in r) {
        setError(r.error)
        return
      }
      recordar(r.canciones)
      setCanciones(r.canciones)
      setBuscada(palabra)
    } catch {
      setError('No se pudo traer la música de Instagram. Revisa tu conexión y vuelve a intentarlo.')
    } finally {
      setCargando(false)
    }
  }

  function abrir() {
    setAbierto(true)
    if (canciones === null) void buscar(null)
  }

  async function sugerir(otra: boolean) {
    setSugiriendo(true)
    setError(null)
    setSinMas(false)
    const texto = leerTexto()
    if (otra && sugerencia) vistas.current = [...vistas.current, sugerencia.cancion.id]
    const conBusquedas = busquedas.current?.texto === texto ? busquedas.current.lista : null
    try {
      const r = await sugerirMusicaAccion(cuentaId, {
        texto,
        vistas: [...vistas.current, ...(elegida ? [elegida.audioId] : [])],
        busquedas: conBusquedas,
      })
      if ('error' in r) {
        setError(r.error)
        return
      }
      busquedas.current = { texto, lista: r.busquedas }
      if ('agotadas' in r) {
        setSugerencia(null)
        setSinMas(true)
        return
      }
      recordar([r.sugerencia.cancion])
      setSugerencia({ cancion: r.sugerencia.cancion, razon: r.sugerencia.razon })
    } catch {
      setError('No se pudo pedir una sugerencia. Revisa tu conexión y vuelve a intentarlo.')
    } finally {
      setSugiriendo(false)
    }
  }

  function elegir(c: CancionInstagram) {
    setElegida(musicaElegida(c, elegida?.volumenMusica, elegida?.volumenVideo))
    setSugerencia(null)
    setAbierto(false)
  }

  function quitar() {
    if (sonando === elegida?.audioId) parar()
    setElegida(null)
  }

  function parar() {
    audio.current?.pause()
    setSonando(null)
  }

  async function escuchar(id: string) {
    if (sonando === id) {
      parar()
      return
    }
    let url = muestras[id]
    if (url === undefined) {
      const r = await cancionAccion(cuentaId, id).catch(() => ({ error: 'sin red' }))
      url = 'cancion' in r ? (r.cancion?.muestra ?? null) : null
      const nueva = url
      setMuestras((antes) => ({ ...antes, [id]: nueva }))
    }
    if (!url) {
      setError(SIN_MUESTRA)
      return
    }
    audio.current ??= new Audio()
    const reproductor = audio.current
    reproductor.onended = () => setSonando(null)
    reproductor.src = url
    try {
      await reproductor.play()
      setSonando(id)
    } catch {
      setError('El navegador no pudo tocar la muestra.')
      setSonando(null)
    }
  }

  // Funciones que dibujan y no componentes: un componente definido acá se remontaría en cada
  // render.
  function botonEscuchar(id: string, nombre: string) {
    const suena = sonando === id
    const sinMuestra = muestras[id] === null
    return (
      <button
        type="button"
        onClick={() => void escuchar(id)}
        disabled={sinMuestra}
        aria-label={suena ? `Pausar ${nombre}` : `Escuchar ${nombre}`}
        title={sinMuestra ? 'Sin muestra' : suena ? 'Pausar' : 'Escuchar'}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-acero-700 text-fg-muted hover:bg-acero-800 hover:text-fg disabled:opacity-40"
      >
        {suena ? <Pause size={14} /> : <Play size={14} />}
      </button>
    )
  }

  function fila(c: CancionInstagram) {
    const esLaElegida = elegida?.audioId === c.id
    return (
      <li key={c.id} className="flex items-center gap-2 py-1.5">
        {botonEscuchar(c.id, c.titulo)}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{c.titulo}</span>
          {c.artista ? <span className="block truncate text-[0.72rem] text-fg-faint">{c.artista}</span> : null}
        </span>
        <Button type="button" className={cn(esLaElegida && 'opacity-60')} disabled={esLaElegida} onClick={() => elegir(c)}>
          {esLaElegida ? 'Elegida' : 'Usar esta'}
        </Button>
      </li>
    )
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={`instagramMusica:${cuentaId}`} value={elegida ? JSON.stringify(elegida) : ''} />
      <div>
        <p className="text-sm font-medium">Música de Instagram</p>
        <p className="text-[0.72rem] text-fg-faint">
          Una canción de la biblioteca de Instagram encima del sonido del video. Instagram no deja ver el reel con la
          canción antes de publicarlo: sale tal como lo dejes acá.
        </p>
      </div>

      {elegida ? (
        <div className="space-y-3 rounded-lg border border-acero-700 p-3">
          <div className="flex items-center gap-2">
            {botonEscuchar(elegida.audioId, elegida.titulo)}
            <p className="min-w-0 flex-1 text-sm">
              Canción elegida: <span className="font-medium">{nombreDeCancion(elegida)}</span>
            </p>
            <Button type="button" variant="danger" onClick={quitar}>
              Quitar
            </Button>
          </div>
          <Volumen
            etiqueta="Volumen de la canción"
            valor={elegida.volumenMusica}
            onChange={(v) => setElegida({ ...elegida, volumenMusica: v })}
          />
          <Volumen
            etiqueta="Volumen del video"
            valor={elegida.volumenVideo}
            onChange={(v) => setElegida({ ...elegida, volumenVideo: v })}
          />
          <p className="text-[0.72rem] text-fg-faint">
            Si en el video hablas, bájale a la canción para que no tape tu voz.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void sugerir(false)} disabled={sugiriendo}>
          {sugiriendo && !sugerencia ? 'Buscando una…' : 'Sugiéreme una'}
        </Button>
        {abierto ? null : (
          <Button type="button" onClick={abrir}>
            {elegida ? 'Cambiar canción' : 'Elegir canción'}
          </Button>
        )}
      </div>

      {sugerencia ? (
        <div className="space-y-2 rounded-lg border border-brasa/40 p-3">
          <div className="flex items-center gap-2">
            {botonEscuchar(sugerencia.cancion.id, sugerencia.cancion.titulo)}
            <p className="min-w-0 flex-1 text-sm font-medium">{nombreDeCancion(sugerencia.cancion)}</p>
          </div>
          <p className="text-[0.78rem] text-fg-muted">{sugerencia.razon}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={() => elegir(sugerencia.cancion)}>
              Usar esta
            </Button>
            <Button type="button" onClick={() => void sugerir(true)} disabled={sugiriendo}>
              {sugiriendo ? 'Buscando otra…' : 'Otra'}
            </Button>
          </div>
        </div>
      ) : null}
      {sinMas ? <p className="text-[0.78rem] text-fg-faint">{SIN_MAS_CANCIONES}</p> : null}

      {abierto ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="search"
              aria-label="Buscar en la música de Instagram"
              placeholder="Busca una canción o un artista"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                // Dentro del formulario del post: Enter busca, no programa.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void buscar(busqueda.trim() || null)
                }
              }}
              className="min-w-0 flex-1 rounded-lg border border-acero-700 bg-transparent px-3 py-2 text-sm"
            />
            <Button type="button" onClick={() => void buscar(busqueda.trim() || null)} disabled={cargando}>
              Buscar
            </Button>
          </div>
          <p className="text-[0.72rem] font-medium uppercase tracking-wide text-fg-faint">
            {buscada ? `Resultados para «${buscada}»` : 'Sonando ahora en Instagram'}
          </p>
          {cargando ? <p className="text-[0.78rem] text-fg-faint">Cargando…</p> : null}
          {!cargando && canciones && canciones.length === 0 ? (
            <p className="text-[0.78rem] text-fg-faint">
              {buscada ? `Instagram no encontró canciones con «${buscada}».` : 'Instagram no tiene canciones para mostrar ahora.'}
            </p>
          ) : null}
          {!cargando && canciones && canciones.length > 0 ? (
            <ul className="max-h-72 divide-y divide-acero-800 overflow-y-auto">
              {canciones.map((c) => fila(c))}
            </ul>
          ) : null}
          <Button type="button" onClick={() => setAbierto(false)}>
            Cerrar la lista
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-[0.78rem] text-caution">{error}</p> : null}
    </div>
  )
}

/** Un volumen de 1 a 100, con su número a la vista. Sin `name`: viaja dentro del JSON. */
function Volumen({ etiqueta, valor, onChange }: { etiqueta: string; valor: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex justify-between text-[0.78rem]">
        <span>{etiqueta}</span>
        <span className="tabular-nums text-fg-muted">{valor} %</span>
      </span>
      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brasa"
      />
    </label>
  )
}
