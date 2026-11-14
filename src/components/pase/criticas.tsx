'use client'

import { useState } from 'react'
import { Check, Clock, RotateCcw, Square, Trash2, X } from 'lucide-react'
import {
  ETIQUETAS,
  NOMBRE_DEL_ESTADO,
  cuandoEnTexto,
  nombreDeEtiqueta,
  tiempoEnTexto,
  type ComentarioParaLaApi,
  type PiezaParaLaApi,
  type RolDelPase,
} from '@/lib/pase/reglas'
import type { EstadoPiezaDelPase } from '@/db/schema'
import { cn } from '@/lib/utils'
import type { Marca } from './reproductor'

// El lado derecho del Pase: quien revisa escribe su crítica y da el veredicto; quien edita lee la
// crítica como una lista de tareas, la contesta y la marca hecha. Las dos ven la misma lista, en
// orden de tiempo, y tocar una lleva el video a su momento.

const CAMPO =
  'w-full rounded-lg border border-acero-700 bg-acero-800 px-3 py-2 text-sm outline-none transition-colors placeholder:text-fg-faint focus:border-brasa'

export type Accion = (metodo: 'POST' | 'PATCH' | 'PUT' | 'DELETE', ruta: string, cuerpo?: unknown) => Promise<string | null>

/** El formulario de quien revisa: lo que se marcó en el video, la etiqueta y el texto. */
export function NuevaCritica({
  pieza,
  marca,
  general,
  autor,
  onAutor,
  onGeneral,
  onLimpiarTramo,
  onLimpiarZona,
  onEnfocar,
  enviar,
}: {
  pieza: PiezaParaLaApi
  marca: Marca
  general: boolean
  autor: string
  onAutor: (autor: string) => void
  onGeneral: (general: boolean) => void
  onLimpiarTramo: () => void
  onLimpiarZona: () => void
  /** Al empezar a escribir: el video se pausa y la crítica se pega a ese momento. */
  onEnfocar: () => void
  enviar: (datos: { texto: string; etiqueta: string }) => Promise<string | null>
}) {
  const [texto, setTexto] = useState('')
  const [etiqueta, setEtiqueta] = useState('otro')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esVideo = pieza.tipo === 'video'
  const cuando = !esVideo || general ? null : cuandoEnTexto(marca.desdeMs, marca.hastaMs)

  async function dejar() {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    setError(null)
    const fallo = await enviar({ texto: texto.trim(), etiqueta })
    setEnviando(false)
    if (fallo) return setError(fallo)
    setTexto('')
    setEtiqueta('otro')
  }

  return (
    <section className="chapa space-y-3 rounded-xl p-4" aria-label="Tu crítica">
      <h2 className="font-titulo text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-fg-faint">Tu crítica</h2>
      {!autor ? (
        <label className="block space-y-1 text-[0.8rem] text-fg-muted">
          <span>Tu nombre, para que el editor sepa quién lo dijo</span>
          <input className={CAMPO} maxLength={60} placeholder="Por ejemplo, Vicente" onBlur={(e) => onAutor(e.target.value.trim())} />
        </label>
      ) : null}

      {/* Dónde va pegada: el momento (o el tramo) y la zona que se marcaron en el video. */}
      <div className="flex flex-wrap items-center gap-1.5 text-[0.75rem]">
        {esVideo && !general ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-brasa/60 bg-brasa/10 px-2 py-0.5 font-mono text-fg">
            <Clock className="h-3 w-3" aria-hidden />
            {cuando ?? tiempoEnTexto(0)}
            {marca.hastaMs !== null ? (
              <button type="button" onClick={onLimpiarTramo} aria-label="Quitar el tramo" className="text-fg-faint hover:text-fg">
                <X className="h-3 w-3" aria-hidden />
              </button>
            ) : null}
          </span>
        ) : null}
        {marca.zona ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-brasa/60 bg-brasa/10 px-2 py-0.5 text-fg">
            <Square className="h-3 w-3" aria-hidden />
            Zona marcada
            <button type="button" onClick={onLimpiarZona} aria-label="Quitar la zona" className="text-fg-faint hover:text-fg">
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ) : null}
        {esVideo ? (
          <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-fg-muted">
            <input type="checkbox" checked={general} onChange={(e) => onGeneral(e.target.checked)} className="accent-[var(--color-brasa)]" />
            De toda la pieza
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="De qué se trata">
        {ETIQUETAS.map((e) => (
          <button
            key={e.clave}
            type="button"
            role="radio"
            aria-checked={etiqueta === e.clave}
            onClick={() => setEtiqueta(e.clave)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors',
              etiqueta === e.clave ? 'border-brasa bg-brasa/15 text-fg' : 'border-acero-700 text-fg-muted hover:text-fg',
            )}
          >
            {e.nombre}
          </button>
        ))}
      </div>

      <textarea
        data-critica
        className={cn(CAMPO, 'min-h-24 resize-y')}
        maxLength={2000}
        value={texto}
        placeholder={esVideo ? '¿Qué está mal acá, y cómo lo arreglarías?' : '¿Qué está mal, y cómo lo arreglarías?'}
        onFocus={onEnfocar}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void dejar()
        }}
      />
      {error ? <p className="text-[0.8rem] text-negative">{error}</p> : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.7rem] text-fg-faint">
          {esVideo ? 'Atajos: espacio, ← →, I y O para el tramo, Z para la zona, C para escribir.' : 'Z para marcar una zona.'}
        </p>
        <button
          type="button"
          disabled={!texto.trim() || !autor || enviando}
          onClick={() => void dejar()}
          className="shrink-0 rounded-lg bg-brasa px-3.5 py-2 text-sm font-medium text-acero-950 transition-[filter] hover:brightness-110 disabled:opacity-50"
        >
          {enviando ? 'Dejando…' : 'Dejar crítica'}
        </button>
      </div>
    </section>
  )
}

/** El veredicto de la pieza, de un toque. */
export function Veredicto({ estado, onCambiar }: { estado: EstadoPiezaDelPase; onCambiar: (estado: EstadoPiezaDelPase) => void }) {
  const opciones: Array<{ estado: EstadoPiezaDelPase; clase: string }> = [
    { estado: 'aprobada', clase: 'border-positive/70 bg-positive/15' },
    { estado: 'cambios', clase: 'border-caution/70 bg-caution/15' },
    { estado: 'descartada', clase: 'border-negative/70 bg-negative/15' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Tu veredicto">
      <span className="mr-1 text-[0.75rem] text-fg-faint">Veredicto:</span>
      {opciones.map((o) => (
        <button
          key={o.estado}
          type="button"
          role="radio"
          aria-checked={estado === o.estado}
          onClick={() => onCambiar(estado === o.estado ? 'en_revision' : o.estado)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors',
            estado === o.estado ? `${o.clase} text-fg` : 'border-acero-700 text-fg-muted hover:text-fg',
          )}
        >
          {NOMBRE_DEL_ESTADO[o.estado]}
        </button>
      ))}
    </div>
  )
}

/**
 * La crítica de una pieza: lo abierto primero, en orden de tiempo. Para quien edita es una lista de
 * tareas: cada una se contesta y se marca hecha. Para quien revisa, se borra o se reabre.
 */
export function ListaDeCriticas({
  rol,
  comentarios,
  elegido,
  onElegir,
  accion,
  codigo,
}: {
  rol: RolDelPase
  comentarios: ComentarioParaLaApi[]
  elegido: ComentarioParaLaApi | null
  onElegir: (c: ComentarioParaLaApi) => void
  accion: Accion
  codigo: string
}) {
  const orden = [...comentarios].sort(
    (a, b) => (a.estado === b.estado ? 0 : a.estado === 'abierto' ? -1 : 1) || (a.desde ?? -1) - (b.desde ?? -1),
  )
  const abiertas = comentarios.filter((c) => c.estado === 'abierto').length

  return (
    <section className="space-y-2" aria-label="La crítica de esta pieza">
      <h2 className="flex items-baseline justify-between font-titulo text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-fg-faint">
        <span>{rol === 'editor' ? 'Lo que hay que arreglar' : 'La crítica de esta pieza'}</span>
        <span className="font-mono normal-case tracking-normal">
          {abiertas} abierta{abiertas === 1 ? '' : 's'} · {comentarios.length - abiertas} hecha{comentarios.length - abiertas === 1 ? '' : 's'}
        </span>
      </h2>
      {orden.length === 0 ? (
        <p className="rounded-xl border border-dashed border-acero-700 px-4 py-6 text-center text-[0.85rem] text-fg-faint">
          {rol === 'editor' ? 'Todavía nadie critica esta pieza.' : 'Pausa el video donde algo no va y escribe arriba.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {orden.map((c) => (
            <Critica key={c.id} c={c} rol={rol} elegida={elegido?.id === c.id} onElegir={() => onElegir(c)} accion={accion} codigo={codigo} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Critica({
  c,
  rol,
  elegida,
  onElegir,
  accion,
  codigo,
}: {
  c: ComentarioParaLaApi
  rol: RolDelPase
  elegida: boolean
  onElegir: () => void
  accion: Accion
  codigo: string
}) {
  const [respondiendo, setRespondiendo] = useState(false)
  const [respuesta, setRespuesta] = useState(c.respuesta ?? '')
  const [error, setError] = useState<string | null>(null)
  const hecha = c.estado === 'resuelto'
  const ruta = `/api/pase/${codigo}/comentarios/${c.id}`

  async function hacer(metodo: 'PATCH' | 'DELETE', cuerpo?: unknown) {
    setError(null)
    const fallo = await accion(metodo, ruta, cuerpo)
    if (fallo) setError(fallo)
    return !fallo
  }

  return (
    <li
      className={cn(
        'rounded-xl border p-3 transition-colors',
        elegida ? 'border-caution/70 bg-caution/5' : 'border-acero-700 bg-acero-900/60',
        hecha && !elegida && 'opacity-70',
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onElegir}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.75rem]',
            hecha ? 'bg-positive/15 text-positive' : 'bg-brasa/15 text-fg',
          )}
          title={c.cuando ? 'Ir a este momento' : 'Ver en la pieza'}
        >
          {c.cuando ? <Clock className="h-3 w-3" aria-hidden /> : null}
          {c.cuando ?? 'Toda la pieza'}
        </button>
        <span className="rounded-full border border-acero-700 px-2 py-0.5 text-[0.7rem] text-fg-muted">{nombreDeEtiqueta(c.etiqueta)}</span>
        {c.zona ? <span className="text-[0.7rem] text-fg-faint">con zona</span> : null}
        {hecha ? (
          <span className="ml-auto inline-flex items-center gap-1 text-[0.7rem] text-positive">
            <Check className="h-3 w-3" aria-hidden /> Hecha
          </span>
        ) : null}
      </div>
      <p className={cn('mt-2 whitespace-pre-wrap text-[0.9rem] leading-relaxed text-fg', hecha && 'line-through decoration-fg-faint')}>{c.texto}</p>
      <p className="mt-1 text-[0.7rem] text-fg-faint">{c.autor}</p>
      {c.respuesta && !respondiendo ? (
        <p className="mt-2 rounded-lg bg-acero-800 px-2.5 py-1.5 text-[0.8rem] text-fg-muted">
          <span className="text-fg-faint">El editor: </span>
          {c.respuesta}
        </p>
      ) : null}

      {rol === 'editor' && respondiendo ? (
        <div className="mt-2 space-y-2">
          <textarea className={cn(CAMPO, 'min-h-16')} value={respuesta} maxLength={2000} onChange={(e) => setRespuesta(e.target.value)} placeholder="Qué hiciste, o por qué no" />
          <div className="flex gap-1.5">
            <button
              type="button"
              className="rounded-lg bg-brasa px-3 py-1.5 text-[0.8rem] font-medium text-acero-950"
              onClick={async () => {
                if (await hacer('PATCH', { respuesta })) setRespondiendo(false)
              }}
            >
              Guardar respuesta
            </button>
            <button type="button" className="rounded-lg border border-acero-700 px-3 py-1.5 text-[0.8rem] text-fg-muted" onClick={() => setRespondiendo(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {rol === 'editor' && !hecha ? (
          <button type="button" onClick={() => void hacer('PATCH', { estado: 'resuelto' })} className="inline-flex items-center gap-1 rounded-lg bg-positive/20 px-2.5 py-1 text-[0.75rem] text-fg hover:bg-positive/30">
            <Check className="h-3.5 w-3.5" aria-hidden /> Hecho
          </button>
        ) : null}
        {rol === 'editor' && !respondiendo ? (
          <button type="button" onClick={() => setRespondiendo(true)} className="rounded-lg border border-acero-700 px-2.5 py-1 text-[0.75rem] text-fg-muted hover:text-fg">
            {c.respuesta ? 'Cambiar respuesta' : 'Responder'}
          </button>
        ) : null}
        {hecha ? (
          <button type="button" onClick={() => void hacer('PATCH', { estado: 'abierto' })} className="inline-flex items-center gap-1 rounded-lg border border-acero-700 px-2.5 py-1 text-[0.75rem] text-fg-muted hover:text-fg">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {rol === 'editor' ? 'No estaba hecha' : 'No quedó: reabrir'}
          </button>
        ) : null}
        {rol === 'revisor' ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Borrar esta crítica? No se puede deshacer.')) void hacer('DELETE')
            }}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.75rem] text-fg-faint hover:text-negative"
            aria-label="Borrar esta crítica"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-[0.75rem] text-negative">{error}</p> : null}
    </li>
  )
}
