'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { CARNE } from '@/lib/parrilla'
import type { MediaSubida } from '@/lib/subida-directa'
import { cn } from '@/lib/utils'
import type { Subida } from './subidas'

/**
 * Los archivos del compositor: la zona donde se sueltan (o se eligen) y una miniatura por
 * archivo, en el orden del carrusel. Reemplaza al «Elegir archivos · Ningún archivo
 * seleccionado» del navegador y a la lista de nombres de antes.
 *
 * Lo que todavía no llegó va apagado, con su barra del color de la carne cruda y cuánto lleva
 * («En cola», «45 %»); lo que no llegó, con borde rojo y «Reintentar». Es la mitad chica de lo
 * que dice el corte de «Así va a quedar», que se llena con lo mismo.
 *
 * `miniaturas` trae la imagen de cada archivo elegido en esta sesión (una URL `blob:` del
 * navegador), por clave mientras sube y por URL cuando ya es media; lo que vino de un borrador
 * guardado se ve desde su URL pública.
 */
export function TablaDeArchivos({
  media,
  subidas,
  miniaturas,
  onElegir,
  onQuitarMedia,
  onQuitarSubida,
  onReintentar,
}: {
  media: MediaSubida[]
  subidas: Subida[]
  miniaturas: Record<string, string>
  onElegir: (files: File[]) => void
  onQuitarMedia: (url: string) => void
  onQuitarSubida: (clave: string) => void
  onReintentar: (clave: string) => void
}) {
  const [encima, setEncima] = useState(false)
  const hayAlgo = media.length + subidas.length > 0

  return (
    <div>
      <p className="mb-1.5 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-fg-faint">Archivos</p>
      <label
        onDragOver={(event) => {
          event.preventDefault()
          setEncima(true)
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(event) => {
          event.preventDefault()
          setEncima(false)
          const files = Array.from(event.dataTransfer.files)
          if (files.length > 0) onElegir(files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brasa',
          hayAlgo ? 'px-3 py-2.5' : 'px-4 py-5',
          encima ? 'border-brasa bg-brasa/10' : 'border-acero-600 hover:border-fg-faint hover:bg-velo/[0.02]',
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? [])
            // Vaciado para que elegir el mismo archivo otra vez vuelva a disparar `onChange`.
            event.currentTarget.value = ''
            if (files.length > 0) onElegir(files)
          }}
        />
        <span className="text-sm text-fg">
          {hayAlgo ? 'Suelta más acá, o ' : 'Suelta fotos o un video acá, o '}
          <span className="text-brasa underline decoration-brasa/40 underline-offset-2">elígelos</span>
        </span>
        {hayAlgo ? null : (
          <span className="text-[0.72rem] text-fg-faint">Opcional. Suben apenas los sueltas y se guardan con el borrador.</span>
        )}
      </label>

      {hayAlgo ? (
        <ul className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {media.map((m, i) => (
            <Miniatura
              key={m.url}
              numero={i + 1}
              src={miniaturas[m.url] ?? m.url}
              tipo={m.mediaType}
              nombre={m.nombre}
              estado="lista"
              progreso={1}
              onQuitar={() => onQuitarMedia(m.url)}
            />
          ))}
          {subidas.map((s, i) => (
            <Miniatura
              key={s.clave}
              numero={media.length + i + 1}
              src={miniaturas[s.clave] ?? null}
              tipo={s.tipo}
              nombre={s.nombre}
              estado={s.estado}
              progreso={s.progreso}
              error={s.error}
              onQuitar={() => onQuitarSubida(s.clave)}
              onReintentar={() => onReintentar(s.clave)}
            />
          ))}
        </ul>
      ) : null}

      {subidas
        .filter((s) => s.estado === 'fallo' && s.error)
        .map((s) => (
          <p key={s.clave} className="mt-2 text-[0.78rem] text-negative">
            {s.nombre}: {s.error}
          </p>
        ))}
    </div>
  )
}

function Miniatura({
  numero,
  src,
  tipo,
  nombre,
  estado,
  progreso,
  error,
  onQuitar,
  onReintentar,
}: {
  numero: number
  src: string | null
  tipo: 'image' | 'video'
  nombre: string
  estado: 'lista' | Subida['estado']
  progreso: number
  error?: string | null
  onQuitar: () => void
  onReintentar?: () => void
}) {
  const llegando = estado === 'cola' || estado === 'subiendo'
  return (
    <li
      title={error ? `${nombre}: ${error}` : nombre}
      className={cn(
        'relative aspect-[4/5] overflow-hidden rounded-lg border bg-acero-950',
        estado === 'fallo' ? 'border-negative/70' : 'border-acero-700',
      )}
    >
      {src ? (
        tipo === 'video' ? (
          // `preload="metadata"` pinta el primer cuadro sin bajar el video entero.
          <video src={src} muted playsInline preload="metadata" className={cn('h-full w-full object-cover', llegando && 'opacity-50')} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- una URL `blob:` del navegador, que `next/image` no sabe servir
          <img src={src} alt="" className={cn('h-full w-full object-cover', llegando && 'opacity-50')} />
        )
      ) : (
        <span className="grid h-full place-items-center text-[0.65rem] text-fg-faint">{tipo === 'video' ? 'Video' : 'Foto'}</span>
      )}

      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 font-mono text-[0.6rem] text-white">
        {numero}
        {tipo === 'video' ? ' · ▶' : ''}
      </span>
      <button
        type="button"
        onClick={onQuitar}
        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white transition-colors hover:bg-black/85"
      >
        <X className="h-3 w-3" aria-hidden />
        <span className="sr-only">Quitar {nombre}</span>
      </button>

      {llegando ? (
        <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 pb-1 pt-0.5" aria-live="polite">
          <span className="block font-mono text-[0.6rem] text-white">
            {estado === 'cola' ? 'En cola' : `${Math.round(progreso * 100)} %`}
          </span>
          <span className="mt-0.5 block h-1 overflow-hidden rounded bg-velo/15">
            {/* La barra es carne cruda: es lo que se va sumando al corte del post. */}
            <span className="block h-full rounded" style={{ width: `${Math.round(progreso * 100)}%`, background: CARNE.cruda.medio }} />
          </span>
        </div>
      ) : null}

      {estado === 'fallo' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/65 p-1 text-center">
          <span className="text-[0.62rem] text-negative">No llegó</span>
          <button
            type="button"
            onClick={onReintentar}
            className="rounded border border-negative/60 px-1.5 py-0.5 text-[0.62rem] text-fg transition-colors hover:bg-negative/15"
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </li>
  )
}
