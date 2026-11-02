'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { DibujoDeMaterial } from '@/components/dibujos-material'
import { Button } from '@/components/ui'
import {
  ACEPTA,
  NOMBRE_USO,
  USOS_MATERIAL,
  claseDe,
  motivoParaNoSubir,
  noCabe,
  pesoEnPalabras,
  tipoDeArchivo,
  type ClaseMaterial,
  type UsoMaterial,
} from '@/lib/cocina/bodega'
import type { MaterialSubido } from '@/lib/cocina/subidas'
import { SubidaFallida, cancelarSubida, subirPorPartes } from '@/lib/subida-por-partes'
import { cn } from '@/lib/utils'
import { GUARDAR_EN_LA_CAMARA } from '@/lib/vocabulario'

// Guardar en la cámara de frío (de día, la nevera): la casilla de los derechos, para qué es, y el
// recuadro para elegir o soltar archivos, varios a la vez. Cada uno sube por partes apenas se elige,
// directo al almacén, con su dibujo, que se va llenando de color de abajo hacia arriba con lo que
// lleva. Al terminar, se lo pasa a quien lo usa (`alGuardar`), que lo pone en la cámara con la
// puerta y el vaho. Lo usan la cámara (`camara.tsx`) y «Pedir una comanda» (`pedir/formulario.tsx`).

type Ranura = {
  clave: string
  nombre: string
  bytes: number
  clase: ClaseMaterial
  uso: UsoMaterial | null
  estado: 'subiendo' | 'error'
  subidos: number
  error: string | null
  archivo: File | null
}

/** La duración que trae un video o un audio en sus metadatos, sin subirlo. Si el navegador no la puede leer (algunos HEVC), ninguna. */
function leerDuracion(archivo: File, clase: ClaseMaterial): Promise<number | null> {
  if (clase !== 'video' && clase !== 'audio') return Promise.resolve(null)
  return new Promise((resolver) => {
    const medio = document.createElement(clase === 'video' ? 'video' : 'audio')
    const url = URL.createObjectURL(archivo)
    const listo = (duracion: number | null) => {
      clearTimeout(reloj)
      URL.revokeObjectURL(url)
      resolver(duracion)
    }
    const reloj = setTimeout(() => listo(null), 8000)
    medio.preload = 'metadata'
    medio.onloadedmetadata = () => listo(Number.isFinite(medio.duration) ? medio.duration : null)
    medio.onerror = () => listo(null)
    medio.src = url
  })
}

export function GuardarEnLaCamara({
  libres,
  cuota,
  alGuardar,
  alCambiarSubiendo,
}: {
  /** Lo que queda libre en la cuota sin contar lo que sube desde acá. */
  libres: number
  cuota: number
  alGuardar: (material: MaterialSubido) => void
  /** Cuánto está subiendo desde acá, para que la cuota lo cuente mientras tanto. */
  alCambiarSubiendo?: (bytes: number) => void
}) {
  const id = useId()
  const [derechos, setDerechos] = useState(false)
  const [uso, setUso] = useState<UsoMaterial | null>(null)
  const [ranuras, setRanuras] = useState<Ranura[]>([])
  const [encima, setEncima] = useState(false)
  const controles = useRef(new Map<string, AbortController>())

  const subiendo = ranuras.filter((r) => r.estado === 'subiendo')
  const enCurso = subiendo.reduce((suma, r) => suma + r.bytes, 0)
  const llena = libres - enCurso <= 0

  useEffect(() => alCambiarSubiendo?.(enCurso), [enCurso, alCambiarSubiendo])

  // Cerrar la pestaña con algo subiendo lo corta: se retoma eligiendo el mismo archivo, pero mejor avisar.
  useEffect(() => {
    if (subiendo.length === 0) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [subiendo.length])

  function actualizar(clave: string, cambio: Partial<Ranura>) {
    setRanuras((lista) => lista.map((r) => (r.clave === clave ? { ...r, ...cambio } : r)))
  }

  async function subir(ranura: Ranura) {
    const archivo = ranura.archivo
    if (!archivo) return
    const control = new AbortController()
    controles.current.set(ranura.clave, control)
    actualizar(ranura.clave, { estado: 'subiendo', error: null })
    try {
      const duracionS = await leerDuracion(archivo, ranura.clase)
      const material = await subirPorPartes(
        archivo,
        { uso: ranura.uso, duracionS, derechos: true },
        { senal: control.signal, alAvanzar: ({ subidos }) => actualizar(ranura.clave, { subidos }) },
      )
      setRanuras((lista) => lista.filter((r) => r.clave !== ranura.clave))
      alGuardar(material)
    } catch (e) {
      if (control.signal.aborted) return
      actualizar(ranura.clave, { estado: 'error', error: e instanceof SubidaFallida ? e.message : 'No se pudo subir el archivo.' })
    } finally {
      controles.current.delete(ranura.clave)
    }
  }

  /** Lo que se dice antes de subir nada: el tipo, el peso y si cabe se leen del archivo, sin subirlo. */
  function elegir(archivos: FileList | File[]) {
    let ocupado = enCurso
    const nuevas: Ranura[] = []
    for (const archivo of Array.from(archivos)) {
      const tipoArchivo = tipoDeArchivo(archivo.name, archivo.type)
      const clase = claseDe(tipoArchivo)
      const motivo =
        motivoParaNoSubir(archivo.name, tipoArchivo, archivo.size) ??
        (archivo.size > libres - ocupado ? noCabe(archivo.name, archivo.size, libres - ocupado, cuota) : null)
      if (!motivo) ocupado += archivo.size
      nuevas.push({
        clave: crypto.randomUUID(),
        nombre: archivo.name,
        bytes: archivo.size,
        clase,
        uso,
        estado: motivo ? 'error' : 'subiendo',
        subidos: 0,
        error: motivo,
        archivo: motivo ? null : archivo,
      })
    }
    setRanuras((lista) => [...lista, ...nuevas])
    for (const r of nuevas) if (r.archivo) void subir(r)
  }

  /** Para la subida en curso (el almacén borra lo que llegó) o quita la que falló. */
  async function quitar(ranura: Ranura) {
    const control = controles.current.get(ranura.clave)
    if (control) {
      control.abort()
      if (ranura.archivo) await cancelarSubida(ranura.archivo)
    }
    setRanuras((lista) => lista.filter((r) => r.clave !== ranura.clave))
  }

  const deshabilitado = !derechos || llena
  return (
    <div className="space-y-4">
      <label className="flex max-w-2xl items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={derechos} onChange={(e) => setDerechos(e.target.checked)} />
        <span>Tengo los derechos de lo que guardo y el permiso de quienes aparecen.</span>
      </label>

      <fieldset>
        <legend className="mb-1.5 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">
          Para qué es (opcional)
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {[null, ...USOS_MATERIAL].map((u) => (
            <label
              key={u ?? 'ninguno'}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 text-[0.8rem] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brasa',
                uso === u ? 'border-brasa bg-brasa text-acero-950' : 'border-acero-700 text-fg-muted hover:border-acero-600 hover:text-fg',
              )}
            >
              <input type="radio" name={`${id}uso`} className="sr-only" checked={uso === u} onChange={() => setUso(u)} />
              {u ? NOMBRE_USO[u] : 'Sin uso'}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-[0.75rem] text-fg-faint">Le dice al chef para qué es: tu intro, tu música, tu logo. Se cambia después.</p>
      </fieldset>

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
          if (!deshabilitado && e.dataTransfer.files.length > 0) elegir(e.dataTransfer.files)
        }}
      >
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center">
          <DibujoDeMaterial clase="video" bytes={6 * 1024 ** 3} className="h-14 w-14" />
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="font-medium text-fg">
            <DeNocheYDeDia noche={GUARDAR_EN_LA_CAMARA.noche} dia={GUARDAR_EN_LA_CAMARA.dia} />
          </span>
          <span className="text-fg-muted">: elige uno o varios archivos, o arrástralos acá.</span>
          <span className="mt-0.5 block text-xs text-fg-faint">
            {!derechos
              ? 'Marca la casilla de arriba para elegir.'
              : llena
                ? 'No queda espacio: saca algo que ya no uses.'
                : `Videos hasta 20 GB, audios, imágenes y otros archivos. Te quedan ${pesoEnPalabras(Math.max(0, libres - enCurso))} libres.`}
          </span>
        </span>
        <input
          type="file"
          multiple
          accept={ACEPTA}
          disabled={deshabilitado}
          className="sr-only"
          onChange={(e) => {
            const archivos = e.target.files ? Array.from(e.target.files) : []
            e.target.value = ''
            if (archivos.length > 0) elegir(archivos)
          }}
        />
      </label>

      {ranuras.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ranuras.map((r) => (
            <li key={r.clave}>
              <EnCamino ranura={r} onQuitar={() => void quitar(r)} onReintentar={() => void subir(r)} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * Lo que está subiendo: su dibujo se llena de color de abajo hacia arriba con lo que lleva, como si
 * entrara de a poco al frío; abajo, la barra y cuánto va. Con error, su frase y qué hacer.
 */
function EnCamino({ ranura, onQuitar, onReintentar }: { ranura: Ranura; onQuitar: () => void; onReintentar: () => void }) {
  const avance = ranura.bytes > 0 ? Math.min(1, ranura.subidos / ranura.bytes) : 0
  return (
    <div className={cn('flex gap-3 rounded-lg border p-3', ranura.estado === 'error' ? 'border-negative/40' : 'border-acero-700')}>
      <span className="relative h-14 w-14 shrink-0">
        <span className="absolute inset-0 opacity-25 grayscale">
          <DibujoDeMaterial clase={ranura.clase} bytes={ranura.bytes} className="h-14 w-14" />
        </span>
        {ranura.estado === 'subiendo' ? (
          <span className="absolute inset-0 transition-[clip-path] duration-500" style={{ clipPath: `inset(${(1 - avance) * 100}% 0 0 0)` }}>
            <DibujoDeMaterial clase={ranura.clase} bytes={ranura.bytes} className="h-14 w-14" />
          </span>
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{ranura.nombre}</p>
        <p className="text-xs text-fg-faint">
          {ranura.uso ? `${NOMBRE_USO[ranura.uso]} · ` : ''}
          {pesoEnPalabras(ranura.bytes)}
        </p>
        {ranura.estado === 'subiendo' ? (
          <div className="mt-2">
            <div
              className="h-1.5 overflow-hidden rounded-full bg-acero-800"
              role="progressbar"
              aria-label={`Guardando ${ranura.nombre}`}
              aria-valuenow={Math.round(avance * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-brasa transition-[width]" style={{ width: `${avance * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-fg-muted">
              Guardando: {Math.floor(avance * 100)} % · {pesoEnPalabras(ranura.subidos)} de {pesoEnPalabras(ranura.bytes)}
            </p>
          </div>
        ) : null}
        {ranura.estado === 'error' && ranura.error ? (
          <p role="alert" className="mt-1 text-xs text-negative">
            {ranura.error}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          {ranura.estado === 'error' && ranura.archivo ? (
            <Button type="button" onClick={onReintentar}>
              Reintentar
            </Button>
          ) : null}
          <Button type="button" variant={ranura.estado === 'subiendo' ? 'ghost' : 'danger'} onClick={onQuitar}>
            {ranura.estado === 'subiendo' ? 'Cancelar' : 'Quitar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
