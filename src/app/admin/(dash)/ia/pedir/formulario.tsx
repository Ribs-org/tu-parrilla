'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { pedirComandaPropia } from '@/app/admin/cocina-actions'
import { Panel } from '@/components/charts/panel'
import { DibujoDeInsumo } from '@/components/dibujos-insumo'
import { Button, Field, Input, Textarea } from '@/components/ui'
import type { TipoInsumo } from '@/db/schema'
import { SUBTIPOS_PRINCIPAL, aceptaTipo, maxBytesDe, muyGrande, tipoDeArchivo, tipoNoAceptado, type SubtipoPrincipal } from '@/lib/cocina/insumos'
import {
  CANTIDADES,
  FORMATOS,
  MAX_ACOMPANAMIENTOS,
  MAX_NOTAS,
  NOMBRE_CANTIDAD,
  NOMBRE_FORMATO,
  minutosDe,
  type CantidadPedida,
  type FormatoPedido,
  type MarcaBasica,
} from '@/lib/cocina/pedido'
import type { InsumoSubido } from '@/lib/cocina/subidas'
import { SubidaFallida, cancelarSubida, subirPorPartes } from '@/lib/subida-por-partes'
import { cn } from '@/lib/utils'

// El formulario de una comanda (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «La comanda
// nueva»): cada archivo empieza a subir apenas se elige, por partes y directo al almacén, con su
// dibujo y su barra; lo que ya se subió y no se pidió vuelve a ofrecerse, y elegir otra vez el mismo
// archivo retoma una subida cortada. Colgar la comanda manda solo los ids.

const NOMBRE_SUBTIPO: Record<SubtipoPrincipal, string> = {
  largo: 'Un video largo',
  podcast: 'Un podcast en videollamada',
  tomas: 'Tomas sueltas',
}
const AYUDA_SUBTIPO: Record<SubtipoPrincipal, string> = {
  largo: 'Una persona a cámara: una charla, una clase, un video editado o crudo.',
  podcast: 'Una videollamada con varias caras en mosaico.',
  tomas: 'Varias respuestas cortas de una persona.',
}
type TipoAcompanamiento = Exclude<TipoInsumo, 'principal'>
const NOMBRE_ACOMPANAMIENTO: Record<TipoAcompanamiento, string> = {
  camara: 'Otra cámara',
  pantalla: 'La pantalla',
  imagen: 'Imágenes o b-roll',
}
const AYUDA_ACOMPANAMIENTO: Record<TipoAcompanamiento, string> = {
  camara: 'Otro ángulo del mismo momento: el chef lo sincroniza con el principal por el audio.',
  pantalla: 'La pantalla grabada mientras hablas: también se sincroniza por el audio.',
  imagen: 'Fotos o clips sin voz que el chef puede intercalar.',
}
const VIDEOS = 'video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv,.m4v'
const FOTOS = 'image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic'

export type Ranura = {
  clave: string
  tipo: TipoInsumo
  nombre: string
  bytes: number
  estado: 'subiendo' | 'subido' | 'error'
  subidos: number
  insumo: InsumoSubido | null
  error: string | null
  archivo: File | null
  subtipo: SubtipoPrincipal | null
}

const NUMERO = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

/** El peso en palabras: «4,0 GB», «350,2 MB». */
export function tamano(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${NUMERO.format(bytes / 1024 ** 3)} GB`
  return `${NUMERO.format(Math.max(bytes, 1) / 1024 ** 2)} MB`
}

/** La duración que trae el video en sus metadatos, sin subirlo. Si el navegador no lo puede leer (algunos HEVC), ninguna. */
function leerDuracion(archivo: File): Promise<number | null> {
  if (!tipoDeArchivo(archivo.name, archivo.type).startsWith('video/')) return Promise.resolve(null)
  return new Promise((resolver) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(archivo)
    const listo = (duracion: number | null) => {
      clearTimeout(reloj)
      URL.revokeObjectURL(url)
      resolver(duracion)
    }
    const reloj = setTimeout(() => listo(null), 8000)
    video.preload = 'metadata'
    video.onloadedmetadata = () => listo(Number.isFinite(video.duration) ? video.duration : null)
    video.onerror = () => listo(null)
    video.src = url
  })
}

function deUnSuelto(i: InsumoSubido): Ranura {
  return {
    clave: i.id,
    tipo: i.tipo as TipoInsumo,
    nombre: i.nombre,
    bytes: i.bytes,
    estado: 'subido',
    subidos: i.bytes,
    insumo: i,
    error: null,
    archivo: null,
    subtipo: (i.subtipo as SubtipoPrincipal | null) ?? null,
  }
}

export function FormularioComanda({
  marca: marcaInicial,
  sueltos: sueltosIniciales,
  antes,
  eta,
  cocinaAbierta,
  zona,
}: {
  marca: MarcaBasica
  sueltos: InsumoSubido[]
  antes: number
  eta: string | null
  cocinaAbierta: boolean
  zona: string
}) {
  // La `ref` nace con el formulario: mandarlo dos veces cuelga una sola comanda.
  const [ref] = useState(() => crypto.randomUUID())
  const [derechos, setDerechos] = useState(false)
  const [subtipo, setSubtipo] = useState<SubtipoPrincipal>('largo')
  const [principal, setPrincipal] = useState<Ranura | null>(null)
  const [acompanamientos, setAcompanamientos] = useState<Ranura[]>([])
  const [tipoNuevo, setTipoNuevo] = useState<TipoAcompanamiento>('camara')
  const [sueltos, setSueltos] = useState(sueltosIniciales)
  const [formatos, setFormatos] = useState<FormatoPedido[]>(['clips'])
  const [cantidad, setCantidad] = useState<CantidadPedida>('lo-que-de')
  const [notas, setNotas] = useState('')
  const [paraCuando, setParaCuando] = useState('')
  const [marca, setMarca] = useState<MarcaBasica>(marcaInicial)
  const [error, setError] = useState<string | null>(null)
  const [enviando, enviar] = useTransition()
  const controles = useRef(new Map<string, AbortController>())

  const subiendo = [principal, ...acompanamientos].some((r) => r?.estado === 'subiendo')
  // Cerrar la pestaña con algo subiendo lo corta: se retoma eligiendo el mismo archivo, pero mejor avisar.
  useEffect(() => {
    if (!subiendo) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [subiendo])

  function actualizar(clave: string, cambio: Partial<Ranura>) {
    setPrincipal((r) => (r?.clave === clave ? { ...r, ...cambio } : r))
    setAcompanamientos((lista) => lista.map((r) => (r.clave === clave ? { ...r, ...cambio } : r)))
  }

  async function subir(ranura: Ranura) {
    const archivo = ranura.archivo
    if (!archivo) return
    const control = new AbortController()
    controles.current.set(ranura.clave, control)
    actualizar(ranura.clave, { estado: 'subiendo', error: null })
    try {
      const duracionS = await leerDuracion(archivo)
      const insumo = await subirPorPartes(
        archivo,
        { insumo: ranura.tipo, subtipo: ranura.tipo === 'principal' ? ranura.subtipo : null, duracionS, derechos: true },
        { senal: control.signal, alAvanzar: ({ subidos }) => actualizar(ranura.clave, { subidos }) },
      )
      actualizar(ranura.clave, { estado: 'subido', subidos: archivo.size, insumo })
    } catch (e) {
      if (control.signal.aborted) return
      actualizar(ranura.clave, { estado: 'error', error: e instanceof SubidaFallida ? e.message : 'No se pudo subir el archivo.' })
    } finally {
      controles.current.delete(ranura.clave)
    }
  }

  /** Lo que se dice antes de subir nada: el tipo y el peso se leen del archivo, sin subirlo. */
  function nueva(archivo: File, tipo: TipoInsumo): Ranura {
    const tipoArchivo = tipoDeArchivo(archivo.name, archivo.type)
    const motivo = !aceptaTipo(tipo, tipoArchivo)
      ? tipoNoAceptado(archivo.name, tipo)
      : archivo.size > maxBytesDe(tipoArchivo)
        ? muyGrande(archivo.name, tipoArchivo)
        : null
    return {
      clave: crypto.randomUUID(),
      tipo,
      nombre: archivo.name,
      bytes: archivo.size,
      estado: motivo ? 'error' : 'subiendo',
      subidos: 0,
      insumo: null,
      error: motivo,
      archivo: motivo ? null : archivo,
      subtipo: tipo === 'principal' ? subtipo : null,
    }
  }

  function elegirPrincipal(archivo: File) {
    const ranura = nueva(archivo, 'principal')
    setPrincipal(ranura)
    if (ranura.archivo) void subir(ranura)
  }

  function agregarAcompanamiento(archivo: File) {
    const ranura = nueva(archivo, tipoNuevo)
    setAcompanamientos((lista) => [...lista, ranura])
    if (ranura.archivo) void subir(ranura)
  }

  /** Para la subida en curso (el almacén borra lo que llegó) o saca lo ya subido, y vacía la ranura. */
  async function sacar(ranura: Ranura) {
    const control = controles.current.get(ranura.clave)
    if (control) {
      control.abort()
      if (ranura.archivo) await cancelarSubida(ranura.archivo, ranura.tipo)
    } else if (ranura.insumo) {
      await fetch(`/api/admin/cocina/insumos/${ranura.insumo.id}`, { method: 'DELETE' }).catch(() => null)
    }
    setPrincipal((r) => (r?.clave === ranura.clave ? null : r))
    setAcompanamientos((lista) => lista.filter((r) => r.clave !== ranura.clave))
  }

  function usarSuelto(i: InsumoSubido) {
    setSueltos((lista) => lista.filter((s) => s.id !== i.id))
    if (i.tipo === 'principal') {
      if (principal?.insumo) setSueltos((lista) => [principal.insumo!, ...lista])
      setPrincipal(deUnSuelto(i))
    } else {
      setAcompanamientos((lista) => [...lista, deUnSuelto(i)])
    }
  }

  async function sacarSuelto(i: InsumoSubido) {
    if (!confirm(`¿Sacar «${i.nombre}»? Se borra de la cocina.`)) return
    await fetch(`/api/admin/cocina/insumos/${i.id}`, { method: 'DELETE' }).catch(() => null)
    setSueltos((lista) => lista.filter((s) => s.id !== i.id))
  }

  const listo = principal?.estado === 'subido' && principal.insumo
  const minutos = minutosDe(principal?.insumo?.duracionS ?? null)
  const fechaHora = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: zona })
  const falta = !derechos
    ? 'Marca la casilla de los derechos.'
    : !principal
      ? 'Sube el plato principal.'
      : subiendo
        ? 'Espera a que termine de subir.'
        : !listo
          ? 'El plato principal no subió: reintenta o elige otro.'
          : formatos.length === 0
            ? 'Elige qué quieres que salga.'
            : null

  function colgar() {
    setError(null)
    enviar(async () => {
      const r = await pedirComandaPropia({
        ref,
        principal: principal?.insumo?.id,
        acompanamientos: acompanamientos.flatMap((a) => (a.estado === 'subido' && a.insumo ? [a.insumo.id] : [])),
        formatos,
        cantidad,
        notas,
        paraCuando,
        marca,
      })
      if (r?.error) setError(r.error)
    })
  }

  return (
    <div className="space-y-6">
      <Panel title="1. El plato principal" hint="El video que el chef va a cocinar. Empieza a subir apenas lo eliges.">
        <label className="mb-4 flex max-w-2xl items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={derechos} onChange={(e) => setDerechos(e.target.checked)} />
          <span>Tengo los derechos de todo lo que subo acá y el permiso de quienes aparecen.</span>
        </label>

        <fieldset className="mb-4" disabled={Boolean(principal)}>
          <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Qué es</legend>
          <div className="space-y-1.5">
            {SUBTIPOS_PRINCIPAL.map((s) => (
              <label key={s} className="flex items-start gap-2 text-sm">
                <input type="radio" name="subtipo" className="mt-1" checked={subtipo === s} onChange={() => setSubtipo(s)} />
                <span>
                  {NOMBRE_SUBTIPO[s]} <span className="text-xs text-fg-faint">{AYUDA_SUBTIPO[s]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {principal ? (
          <FilaDeArchivo ranura={principal} onSacar={() => void sacar(principal)} onReintentar={() => void subir(principal)} />
        ) : (
          <ElegirArchivo
            tipo="principal"
            accept={VIDEOS}
            deshabilitado={!derechos}
            texto="Elegir el video"
            ayuda={derechos ? 'MP4, MOV, WebM o MKV, hasta 20 GB.' : 'Marca la casilla de arriba para elegir el archivo.'}
            onElegir={elegirPrincipal}
          />
        )}
      </Panel>

      {sueltos.length > 0 ? (
        <Panel title="Ya subiste" hint="Lo que subiste y no pediste. Se borra solo a los tres días.">
          <ul className="divide-y divide-velo/[0.06]">
            {sueltos.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <DibujoDeInsumo tipo={i.tipo as TipoInsumo} className="h-10 w-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{i.nombre}</span>
                  <span className="block text-xs text-fg-faint">
                    {i.tipo === 'principal' ? 'Plato principal' : NOMBRE_ACOMPANAMIENTO[i.tipo as TipoAcompanamiento]} · {tamano(i.bytes)}
                  </span>
                </span>
                <span className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => usarSuelto(i)}
                  // Un plato principal subiendo no se reemplaza: primero se cancela o se espera.
                  disabled={i.tipo === 'principal' ? principal?.estado === 'subiendo' : acompanamientos.length >= MAX_ACOMPANAMIENTOS}
                >
                  Usar
                </Button>
                <Button type="button" variant="danger" onClick={() => void sacarSuelto(i)}>
                  Sacar
                </Button>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="2. Los acompañamientos" hint="Opcional: otra cámara, la pantalla, fotos o b-roll.">
        {acompanamientos.length > 0 ? (
          <ul className="mb-4 space-y-3">
            {acompanamientos.map((a) => (
              <li key={a.clave}>
                <FilaDeArchivo ranura={a} onSacar={() => void sacar(a)} onReintentar={() => void subir(a)} />
              </li>
            ))}
          </ul>
        ) : null}
        {acompanamientos.length < MAX_ACOMPANAMIENTOS ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {(Object.keys(NOMBRE_ACOMPANAMIENTO) as TipoAcompanamiento[]).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="acompanamiento" checked={tipoNuevo === t} onChange={() => setTipoNuevo(t)} />
                  {NOMBRE_ACOMPANAMIENTO[t]}
                </label>
              ))}
            </div>
            <p className="text-xs text-fg-faint">{AYUDA_ACOMPANAMIENTO[tipoNuevo]}</p>
            <ElegirArchivo
              tipo={tipoNuevo}
              accept={tipoNuevo === 'imagen' ? `${VIDEOS},${FOTOS}` : VIDEOS}
              deshabilitado={!derechos}
              texto="Agregar un archivo"
              ayuda={derechos ? undefined : 'Marca la casilla de los derechos, arriba, para agregar archivos.'}
              onElegir={agregarAcompanamiento}
            />
          </div>
        ) : (
          <p className="text-sm text-fg-faint">Una comanda lleva hasta {MAX_ACOMPANAMIENTOS} acompañamientos.</p>
        )}
      </Panel>

      <Panel title="3. Qué quieres que salga">
        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Los formatos</legend>
            <div className="space-y-1.5">
              {FORMATOS.map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formatos.includes(f)}
                    onChange={(e) => setFormatos((lista) => (e.target.checked ? FORMATOS.filter((x) => x === f || lista.includes(x)) : lista.filter((x) => x !== f)))}
                  />
                  {NOMBRE_FORMATO[f]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Cuántos, más o menos</legend>
            <div className="space-y-1.5">
              {CANTIDADES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="cantidad" checked={cantidad === c} onChange={() => setCantidad(c)} />
                  {NOMBRE_CANTIDAD[c]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <p className="mt-4 text-sm text-fg-muted">Los estilos los elige el chef, con lo que mejor le vaya al material.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <Field label="Qué destacar o qué evitar (opcional)" hint="Por ejemplo: «la parte de ventas», «no uses la anécdota del final».">
            <Textarea rows={3} maxLength={MAX_NOTAS} value={notas} onChange={(e) => setNotas(e.target.value)} />
          </Field>
          <Field label="Para cuándo (opcional)" hint="Informativo: la hora real la estima el chef.">
            <Input type="date" value={paraCuando} onChange={(e) => setParaCuando(e.target.value)} />
          </Field>
        </div>
      </Panel>

      <Panel title="Tu marca" hint="Lo que el chef usa para vestir lo que cocina. Se guarda para las comandas que vengan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="El nombre">
            <Input value={marca.nombre} maxLength={80} onChange={(e) => setMarca({ ...marca, nombre: e.target.value })} />
          </Field>
          <Field label="El @ (opcional)">
            <Input value={marca.handle ?? ''} maxLength={60} placeholder="@tumarca" onChange={(e) => setMarca({ ...marca, handle: e.target.value })} />
          </Field>
          <Field label="El color de acento (opcional)" hint="El de los titulares. Sin él, el chef usa el del estilo.">
            <span className="flex items-center gap-2">
              <input
                type="color"
                aria-label="El color de acento"
                className="h-9 w-12 cursor-pointer rounded border border-acero-700 bg-transparent"
                value={marca.acento ?? '#3D7BFF'}
                onChange={(e) => setMarca({ ...marca, acento: e.target.value.toUpperCase() })}
              />
              <span className="font-mono text-xs text-fg-faint">{marca.acento ?? 'el del estilo'}</span>
              {marca.acento ? (
                <Button type="button" variant="ghost" onClick={() => setMarca({ ...marca, acento: null })}>
                  Usar el del estilo
                </Button>
              ) : null}
            </span>
          </Field>
          <Field label="El llamado final (opcional)" hint="El texto del cierre: «Sígueme para más», «Agenda tu clase».">
            <Input value={marca.ctaTexto ?? ''} maxLength={120} onChange={(e) => setMarca({ ...marca, ctaTexto: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <Panel title="4. Confirmar">
        <ul className="max-w-2xl space-y-1 text-sm text-fg-muted">
          <li>
            Plato principal:{' '}
            {principal ? `${principal.nombre} (${NOMBRE_SUBTIPO[principal.subtipo ?? 'largo']})` : 'todavía no'}
            {minutos > 0 ? ` · ${minutos} min` : ''}
          </li>
          {acompanamientos.length > 0 ? <li>Acompañamientos: {acompanamientos.map((a) => a.nombre).join(', ')}</li> : null}
          <li>
            Qué sale: {formatos.map((f) => NOMBRE_FORMATO[f]).join(' y ') || 'nada todavía'} · {NOMBRE_CANTIDAD[cantidad]}
          </li>
          <li>Los estilos: los elige el chef</li>
          <li>
            Tu marca: {marca.nombre || 'sin nombre'}
            {marca.handle ? ` · ${marca.handle}` : ''}
            {marca.ctaTexto ? ` · «${marca.ctaTexto}»` : ''}
          </li>
        </ul>
        <div className="mt-4 max-w-2xl space-y-1 text-sm">
          <p>{antes === 0 ? 'Es la próxima en la fila.' : antes === 1 ? 'Hay 1 comanda antes que la tuya.' : `Hay ${antes} comandas antes que la tuya.`}</p>
          {eta ? <p>Hora estimada: {fechaHora.format(new Date(eta))}</p> : null}
          {!cocinaAbierta ? <p className="text-fg-muted">La cocina está cerrada por ahora: tu comanda espera su turno.</p> : null}
          {minutos > 0 ? (
            <p className="text-fg-muted">Consume {minutos} minutos de tu cupo, los del plato principal. Por ahora el cupo no tiene tope.</p>
          ) : null}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" variant="primary" disabled={Boolean(falta) || enviando} onClick={colgar}>
            {enviando ? 'Colgando…' : 'Colgar la comanda'}
          </Button>
          {falta ? <span className="text-xs text-fg-faint">{falta}</span> : null}
          {error ? (
            <span role="alert" className="text-sm text-negative">
              {error}
            </span>
          ) : null}
        </div>
      </Panel>
    </div>
  )
}

function ElegirArchivo({
  tipo,
  accept,
  deshabilitado,
  texto,
  ayuda,
  onElegir,
}: {
  tipo: TipoInsumo
  accept: string
  deshabilitado: boolean
  texto: string
  ayuda?: string
  onElegir: (archivo: File) => void
}) {
  const [encima, setEncima] = useState(false)
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-wrap items-center gap-4 rounded-lg border border-dashed p-4 transition-colors',
        encima ? 'border-brasa bg-acero-800' : 'border-acero-700',
        deshabilitado && 'cursor-not-allowed opacity-60',
      )}
      onDragOver={(e) => {
        if (deshabilitado) return
        e.preventDefault()
        setEncima(true)
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => {
        e.preventDefault()
        setEncima(false)
        const archivo = e.dataTransfer.files[0]
        if (archivo && !deshabilitado) onElegir(archivo)
      }}
    >
      <DibujoDeInsumo tipo={tipo} className="h-14 w-14" />
      <span className="min-w-0 flex-1 text-sm">
        <span className="font-medium text-fg">{texto}</span>
        <span className="text-fg-muted">, o arrástralo acá.</span>
        {ayuda ? <span className="mt-0.5 block text-xs text-fg-faint">{ayuda}</span> : null}
      </span>
      <input
        type="file"
        accept={accept}
        disabled={deshabilitado}
        className="sr-only"
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          e.target.value = ''
          if (archivo) onElegir(archivo)
        }}
      />
    </label>
  )
}

/** Un archivo de la comanda: su dibujo, su nombre y su peso, y cómo va: subiendo con su barra, subido o con su error. */
export function FilaDeArchivo({ ranura, onSacar, onReintentar }: { ranura: Ranura; onSacar: () => void; onReintentar: () => void }) {
  const avance = ranura.bytes > 0 ? Math.min(1, ranura.subidos / ranura.bytes) : 0
  const etiqueta = ranura.tipo === 'principal' ? NOMBRE_SUBTIPO[ranura.subtipo ?? 'largo'] : NOMBRE_ACOMPANAMIENTO[ranura.tipo as TipoAcompanamiento]
  return (
    <div className={cn('flex flex-wrap items-center gap-4 rounded-lg border p-4', ranura.estado === 'error' ? 'border-negative/40' : 'border-acero-700')}>
      <DibujoDeInsumo tipo={ranura.tipo} className="h-14 w-14" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{ranura.nombre}</p>
        <p className="text-xs text-fg-faint">
          {etiqueta} · {tamano(ranura.bytes)}
        </p>
        {ranura.estado === 'subiendo' ? (
          <div className="mt-2">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-acero-800"
              role="progressbar"
              aria-label={`Subiendo ${ranura.nombre}`}
              aria-valuenow={Math.round(avance * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-brasa transition-[width]" style={{ width: `${avance * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-fg-muted">
              Subiendo: {Math.floor(avance * 100)} % · {tamano(ranura.subidos)} de {tamano(ranura.bytes)}
            </p>
          </div>
        ) : null}
        {ranura.estado === 'subido' ? <p className="mt-1 text-xs text-positive">Subido.</p> : null}
        {ranura.estado === 'error' && ranura.error ? (
          <p role="alert" className="mt-1 text-xs text-negative">
            {ranura.error}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {ranura.estado === 'error' && ranura.archivo ? (
          <Button type="button" variant="ghost" onClick={onReintentar}>
            Reintentar
          </Button>
        ) : null}
        <Button type="button" variant={ranura.estado === 'subiendo' ? 'ghost' : 'danger'} onClick={onSacar}>
          {ranura.estado === 'subiendo' ? 'Cancelar' : 'Sacar'}
        </Button>
      </div>
    </div>
  )
}
