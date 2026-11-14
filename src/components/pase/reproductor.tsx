'use client'

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { Pause, Play, RectangleHorizontal } from 'lucide-react'
import type { ZonaDelCuadro } from '@/db/schema'
import { tiempoEnTexto, type ComentarioParaLaApi } from '@/lib/pase/reglas'
import { cn } from '@/lib/utils'

// El reproductor del Pase: el video (o la imagen) con su hora siempre a la vista, una línea de tiempo
// con la marca de cada crítica, y una capa encima donde se dibuja una zona del cuadro y se ven las
// zonas de las críticas. Lo que se está marcando —el momento, el tramo, la zona— vive en la pantalla
// (`el-pase.tsx`), que lo comparte con el formulario de la crítica. Va con `key` por pieza: otra pieza
// es otro reproductor, que empieza de cero.

/** Un cuadro, para avanzar de a uno: los shorts van a 30 por segundo, y a 25 o 60 se nota igual. */
const CUADRO_MS = 1000 / 30

export type Marca = { desdeMs: number | null; hastaMs: number | null; zona: ZonaDelCuadro | null }

export type ManejoDelReproductor = {
  tiempoMs: () => number
  ir: (ms: number) => void
  pausar: () => void
  alternar: () => void
  mover: (ms: number) => void
}

/** Las críticas que tocan el instante `ms`: las de un momento, medio segundo antes y después; las de un tramo, todo el tramo. */
function activasEn(comentarios: ComentarioParaLaApi[], ms: number): ComentarioParaLaApi[] {
  return comentarios.filter((c) => {
    if (c.desde === null || !c.zona) return false
    const desde = c.desde * 1000
    const hasta = c.hasta === null ? desde + 500 : c.hasta * 1000
    return ms >= desde - 500 && ms <= hasta
  })
}

function Zona({ zona, tono, etiqueta }: { zona: ZonaDelCuadro; tono: 'marca' | 'elegida' | 'activa'; etiqueta?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute rounded-[3px]',
        tono === 'marca' && 'border-2 border-dashed border-brasa bg-brasa/10',
        tono === 'elegida' && 'border-2 border-caution bg-caution/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]',
        tono === 'activa' && 'border border-caution/70',
      )}
      style={{ left: `${zona.x * 100}%`, top: `${zona.y * 100}%`, width: `${zona.ancho * 100}%`, height: `${zona.alto * 100}%` }}
    >
      {etiqueta ? (
        <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-acero-950/85 px-1.5 py-0.5 font-mono text-[0.65rem] text-fg">{etiqueta}</span>
      ) : null}
    </div>
  )
}

export function Reproductor({
  url,
  tipo,
  comentarios,
  marca,
  elegido,
  dibujando,
  onZona,
  onElegir,
  onTiempo,
  manejo,
  silenciado = false,
  inicioMs = 0,
}: {
  url: string
  tipo: 'video' | 'imagen'
  comentarios: ComentarioParaLaApi[]
  marca: Marca
  elegido: ComentarioParaLaApi | null
  dibujando: boolean
  onZona: (zona: ZonaDelCuadro) => void
  onElegir: (c: ComentarioParaLaApi) => void
  /** Cada vez que el video se pausa o se mueve: la pantalla lo usa para pegar la crítica a ese momento. */
  onTiempo?: (ms: number) => void
  manejo?: Ref<ManejoDelReproductor>
  silenciado?: boolean
  /** Dónde empieza: al comparar, la segunda versión arranca en el momento en que está la primera. */
  inicioMs?: number
}) {
  const video = useRef<HTMLVideoElement>(null)
  const capa = useRef<HTMLDivElement>(null)
  const [proporcion, setProporcion] = useState(9 / 16)
  const [ms, setMs] = useState(0)
  const [duracion, setDuracion] = useState(0)
  const [andando, setAndando] = useState(false)
  const [velocidad, setVelocidad] = useState(1)
  const [trazo, setTrazo] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)

  // La hora en vivo mientras corre: el `timeupdate` del navegador llega cuatro veces por segundo, y
  // la hora tiene que verse con décimas.
  useEffect(() => {
    if (!andando) return
    let cuadro = 0
    const seguir = () => {
      if (video.current) setMs(video.current.currentTime * 1000)
      cuadro = requestAnimationFrame(seguir)
    }
    cuadro = requestAnimationFrame(seguir)
    return () => cancelAnimationFrame(cuadro)
  }, [andando])

  const ir = useCallback(
    (destino: number) => {
      const v = video.current
      if (!v) return
      const limite = Number.isFinite(v.duration) ? v.duration * 1000 : destino
      const final = Math.max(0, Math.min(destino, limite))
      v.currentTime = final / 1000
      setMs(final)
      onTiempo?.(final)
    },
    [onTiempo],
  )

  const pausar = useCallback(() => {
    video.current?.pause()
  }, [])

  const alternar = useCallback(() => {
    const v = video.current
    if (!v) return
    if (v.paused) void v.play()
    else v.pause()
  }, [])

  useImperativeHandle(
    manejo,
    () => ({
      tiempoMs: () => (video.current ? video.current.currentTime * 1000 : 0),
      ir,
      pausar,
      alternar,
      mover: (delta: number) => ir((video.current?.currentTime ?? 0) * 1000 + delta),
    }),
    [ir, pausar, alternar],
  )

  useEffect(() => {
    if (video.current) video.current.playbackRate = velocidad
  }, [velocidad, url])

  function fraccionDe(evento: { clientX: number; clientY: number }) {
    const caja = capa.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (evento.clientX - caja.left) / caja.width)),
      y: Math.max(0, Math.min(1, (evento.clientY - caja.top) / caja.height)),
    }
  }

  const visibles = tipo === 'video' ? activasEn(comentarios, ms).filter((c) => c.id !== elegido?.id) : []
  const zonaDelTrazo =
    trazo && {
      x: Math.min(trazo.x0, trazo.x1),
      y: Math.min(trazo.y0, trazo.y1),
      ancho: Math.abs(trazo.x1 - trazo.x0),
      alto: Math.abs(trazo.y1 - trazo.y0),
    }

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto overflow-hidden rounded-xl bg-black"
        style={{ width: `min(100%, calc(68vh * ${proporcion}))`, aspectRatio: String(proporcion) }}
      >
        {tipo === 'video' ? (
          <video
            ref={video}
            key={url}
            src={url}
            className="absolute inset-0 h-full w-full"
            playsInline
            preload="metadata"
            muted={silenciado}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget
              if (v.videoWidth && v.videoHeight) setProporcion(v.videoWidth / v.videoHeight)
              setDuracion(v.duration * 1000)
              if (inicioMs > 0) {
                v.currentTime = inicioMs / 1000
                setMs(inicioMs)
              }
            }}
            onPlay={() => setAndando(true)}
            onPause={(e) => {
              setAndando(false)
              setMs(e.currentTarget.currentTime * 1000)
              onTiempo?.(e.currentTarget.currentTime * 1000)
            }}
            onSeeked={(e) => setMs(e.currentTarget.currentTime * 1000)}
            onEnded={() => setAndando(false)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- la imagen tal cual se subió, sin optimizar: es lo que se revisa
          <img
            key={url}
            src={url}
            alt=""
            className="absolute inset-0 h-full w-full"
            onLoad={(e) => {
              const i = e.currentTarget
              if (i.naturalWidth && i.naturalHeight) setProporcion(i.naturalWidth / i.naturalHeight)
            }}
          />
        )}

        {/* La capa de encima: con «Zona» se dibuja; si no, un toque pausa o sigue el video. */}
        <div
          ref={capa}
          className={cn('absolute inset-0 touch-none', dibujando ? 'cursor-crosshair' : tipo === 'video' && 'cursor-pointer')}
          onPointerDown={(e) => {
            if (!dibujando) return
            e.currentTarget.setPointerCapture(e.pointerId)
            const p = fraccionDe(e)
            setTrazo({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
          }}
          onPointerMove={(e) => {
            if (!dibujando || !trazo) return
            const p = fraccionDe(e)
            setTrazo({ ...trazo, x1: p.x, y1: p.y })
          }}
          onPointerUp={() => {
            if (dibujando && zonaDelTrazo && zonaDelTrazo.ancho > 0.01 && zonaDelTrazo.alto > 0.01) onZona(zonaDelTrazo)
            setTrazo(null)
          }}
          onClick={() => {
            if (!dibujando && tipo === 'video') alternar()
          }}
        >
          {visibles.map((c) => (
            <Zona key={c.id} zona={c.zona!} tono="activa" />
          ))}
          {elegido?.zona ? <Zona zona={elegido.zona} tono="elegida" etiqueta={elegido.cuando ?? undefined} /> : null}
          {marca.zona ? <Zona zona={marca.zona} tono="marca" /> : null}
          {zonaDelTrazo ? <Zona zona={zonaDelTrazo} tono="marca" /> : null}
        </div>

        {tipo === 'video' ? (
          <p className="pointer-events-none absolute left-2 top-2 rounded-md bg-acero-950/80 px-2 py-1 font-mono text-[0.95rem] tabular-nums text-fg">
            {tiempoEnTexto(ms)}
            <span className="text-fg-faint"> / {tiempoEnTexto(duracion)}</span>
          </p>
        ) : null}
        {dibujando ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto w-fit rounded-md bg-acero-950/85 px-2 py-1 text-[0.75rem] text-fg">
            Arrastra para marcar la zona
          </p>
        ) : null}
      </div>

      {tipo === 'video' ? (
        <>
          <LineaDeTiempo
            ms={ms}
            duracion={duracion}
            comentarios={comentarios}
            marca={marca}
            elegido={elegido}
            onIr={(destino) => {
              pausar()
              ir(destino)
            }}
            onElegir={onElegir}
          />
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <BotonDeControl titulo={andando ? 'Pausa (espacio)' : 'Reproducir (espacio)'} onClick={alternar} destacado>
              {andando ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            </BotonDeControl>
            <BotonDeControl titulo="Un segundo atrás (←)" onClick={() => ir(ms - 1000)}>
              −1 s
            </BotonDeControl>
            <BotonDeControl titulo="Un cuadro atrás (mayúscula y ←)" onClick={() => ir(ms - CUADRO_MS)}>
              ‹ cuadro
            </BotonDeControl>
            <BotonDeControl titulo="Un cuadro adelante (mayúscula y →)" onClick={() => ir(ms + CUADRO_MS)}>
              cuadro ›
            </BotonDeControl>
            <BotonDeControl titulo="Un segundo adelante (→)" onClick={() => ir(ms + 1000)}>
              +1 s
            </BotonDeControl>
            <BotonDeControl titulo="Velocidad" onClick={() => setVelocidad((v) => (v === 1 ? 0.5 : v === 0.5 ? 0.25 : 1))}>
              {velocidad === 1 ? '1×' : velocidad === 0.5 ? '½×' : '¼×'}
            </BotonDeControl>
          </div>
        </>
      ) : null}
    </div>
  )
}

function BotonDeControl({ titulo, onClick, destacado, children }: { titulo: string; onClick: () => void; destacado?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 font-mono text-[0.75rem] transition-colors',
        destacado ? 'bg-brasa text-acero-950 hover:brightness-110' : 'border border-acero-700 text-fg-muted hover:bg-acero-800 hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

/** La línea de tiempo: se toca o se arrastra para ir; cada crítica es un punto (un momento) o una barra (un tramo). */
function LineaDeTiempo({
  ms,
  duracion,
  comentarios,
  marca,
  elegido,
  onIr,
  onElegir,
}: {
  ms: number
  duracion: number
  comentarios: ComentarioParaLaApi[]
  marca: Marca
  elegido: ComentarioParaLaApi | null
  onIr: (ms: number) => void
  onElegir: (c: ComentarioParaLaApi) => void
}) {
  const pista = useRef<HTMLDivElement>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const pct = (t: number) => (duracion > 0 ? `${Math.max(0, Math.min(100, (t / duracion) * 100))}%` : '0%')
  const msDe = (clientX: number) => {
    const caja = pista.current!.getBoundingClientRect()
    return ((clientX - caja.left) / caja.width) * duracion
  }

  return (
    <div className="px-1">
      <div
        ref={pista}
        className="relative h-9 cursor-pointer touch-none select-none"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).dataset.marca) return
          e.currentTarget.setPointerCapture(e.pointerId)
          setArrastrando(true)
          onIr(msDe(e.clientX))
        }}
        onPointerMove={(e) => {
          if (arrastrando) onIr(msDe(e.clientX))
        }}
        onPointerUp={() => setArrastrando(false)}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-acero-700" />
        <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fg-muted/60" style={{ width: pct(ms) }} />
        {marca.desdeMs !== null && marca.hastaMs !== null ? (
          <div
            className="absolute top-1/2 h-3 -translate-y-1/2 rounded-sm border border-dashed border-brasa bg-brasa/25"
            style={{ left: pct(marca.desdeMs), width: `calc(${pct(marca.hastaMs)} - ${pct(marca.desdeMs)})` }}
          />
        ) : null}
        {comentarios
          .filter((c) => c.desde !== null)
          .map((c) => {
            const desde = c.desde! * 1000
            const esTramo = c.hasta !== null
            const abierto = c.estado === 'abierto'
            return (
              <button
                key={c.id}
                type="button"
                data-marca="1"
                title={`${c.cuando} · ${c.texto}`}
                aria-label={`Ir a la crítica de ${c.cuando}`}
                onClick={() => onElegir(c)}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-125',
                  esTramo ? 'h-2.5' : 'h-3.5 w-3.5 -translate-x-1/2',
                  abierto ? 'bg-brasa' : 'bg-positive/70',
                  elegido?.id === c.id && 'ring-2 ring-caution ring-offset-1 ring-offset-acero-950',
                )}
                style={esTramo ? { left: pct(desde), width: `max(6px, calc(${pct(c.hasta! * 1000)} - ${pct(desde)}))` } : { left: pct(desde) }}
              />
            )
          })}
        <div className="pointer-events-none absolute top-0 h-full w-0.5 -translate-x-1/2 bg-fg" style={{ left: pct(ms) }} />
      </div>
    </div>
  )
}

/** El ícono de la zona, para el botón que la dibuja. */
export const IconoZona = RectangleHorizontal
