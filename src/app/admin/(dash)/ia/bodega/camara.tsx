'use client'

import { useCallback, useId, useRef, useState, useTransition } from 'react'
import { editarMaterialPropio, sacarMaterialPropio } from '@/app/admin/cocina-actions'
import { Panel } from '@/components/charts/panel'
import { useConfirmar } from '@/components/confirmar'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { CuotaDeLaCamara, DibujoDeMaterial } from '@/components/dibujos-material'
import { LibroDeSugerencias } from '@/components/libro-de-sugerencias'
import { useTema } from '@/components/tema-vivo'
import { Button, Field, Input } from '@/components/ui'
import { Ventana } from '@/components/ventana'
import {
  CLASES,
  NOMBRE_USO,
  USOS_MATERIAL,
  estadoDeLaCuota,
  ganchosOcupados,
  nombreDePeso,
  pesoEnPalabras,
  type ClaseMaterial,
  type UsoMaterial,
} from '@/lib/cocina/bodega'
import type { MaterialDeLaCamara } from '@/lib/cocina/materiales'
import type { MaterialSubido } from '@/lib/cocina/subidas'
import { cn } from '@/lib/utils'
import { CAMARA, CAMARA_LLENA, CAMARA_LLENANDOSE, CAMARA_VACIA, GUARDAR_EN_LA_CAMARA, SACAR_DE_LA_CAMARA } from '@/lib/vocabulario'
import { GuardarEnLaCamara } from './guardar'

// La cámara de frío (de día, la nevera): la cuota dibujada, guardar, y lo que hay adentro, cada cosa
// con su dibujo según lo que es y lo que pesa (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`).
// Lo que acaba de guardarse entra con la puerta y el vaho.

export const NOMBRE_CLASE: Record<ClaseMaterial, { uno: string; varios: string }> = {
  video: { uno: 'Video', varios: 'Videos' },
  audio: { uno: 'Audio', varios: 'Audios' },
  imagen: { uno: 'Imagen', varios: 'Imágenes' },
  otro: { uno: 'Otro archivo', varios: 'Otros' },
}

/** La duración en palabras: «38 s», «12 min», «1 h 05 min». */
export function duracionEnPalabras(segundos: number | null): string | null {
  if (!segundos || segundos <= 0) return null
  if (segundos < 60) return `${Math.round(segundos)} s`
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`
}

/** El nombre de su tamaño, en el modo que se ve, y el peso: «media res · 6,2 GB». */
export function PesoDeMaterial({ clase, bytes }: { clase: ClaseMaterial; bytes: number }) {
  const nombre = nombreDePeso(clase, bytes)
  return (
    <>
      <DeNocheYDeDia noche={nombre.noche} dia={nombre.dia} /> · {pesoEnPalabras(bytes)}
    </>
  )
}

/** Los filtros por lo que es, con cuántos hay de cada uno; sin nada de una clase, no aparece. */
export function FiltroDeClase({
  materiales,
  valor,
  onCambiar,
}: {
  materiales: ReadonlyArray<{ clase: ClaseMaterial }>
  valor: ClaseMaterial | null
  onCambiar: (clase: ClaseMaterial | null) => void
}) {
  const presentes = CLASES.filter((c) => materiales.some((m) => m.clase === c))
  if (presentes.length < 2) return null
  const boton = (clase: ClaseMaterial | null, texto: string, n: number) => (
    <button
      key={clase ?? 'todo'}
      type="button"
      aria-pressed={valor === clase}
      onClick={() => onCambiar(clase)}
      className={cn(
        'rounded-full border px-3 py-1 text-[0.8rem] transition-colors',
        valor === clase ? 'border-brasa bg-brasa text-acero-950' : 'border-acero-700 text-fg-muted hover:border-acero-600 hover:text-fg',
      )}
    >
      {texto} <span className="font-mono text-[0.7rem] opacity-75">{n}</span>
    </button>
  )
  return (
    <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Qué mostrar">
      {boton(null, 'Todo', materiales.length)}
      {presentes.map((c) => boton(c, NOMBRE_CLASE[c].varios, materiales.filter((m) => m.clase === c).length))}
    </div>
  )
}

export function LaCamara({
  materiales: iniciales,
  subiendo: subiendoEnOtraParte,
  cuota,
  puedeGuardar,
}: {
  materiales: MaterialDeLaCamara[]
  /** Lo que estaba subiendo al abrir la página, desde otra pestaña: ya ocupa su lugar. */
  subiendo: number
  cuota: number
  /** Con la cocina apagada se ve y se saca, pero no se guarda. */
  puedeGuardar: boolean
}) {
  const tema = useTema()
  const [materiales, setMateriales] = useState(iniciales)
  const [recientes, setRecientes] = useState<ReadonlySet<string>>(new Set())
  const [subiendoAca, setSubiendoAca] = useState(0)
  const [filtro, setFiltro] = useState<ClaseMaterial | null>(null)
  const [editando, setEditando] = useState<MaterialDeLaCamara | null>(null)
  const [libro, setLibro] = useState(false)

  const guardados = materiales.reduce((suma, m) => suma + m.bytes, 0)
  const ocupados = guardados + subiendoEnOtraParte + subiendoAca
  const estado = estadoDeLaCuota(ocupados, cuota)
  const visibles = filtro ? materiales.filter((m) => m.clase === filtro) : materiales

  const alGuardar = useCallback((m: MaterialSubido) => {
    setMateriales((lista) => [{ ...m, enMarcha: 0 }, ...lista])
    setRecientes((r) => new Set(r).add(m.id))
  }, [])

  return (
    <div className="space-y-6">
      <Panel title="Cuánto cabe">
        <CuotaDeLaCamara ocupados={ganchosOcupados(ocupados, cuota)} estado={estado} className="max-w-xl" />
        <p className="mt-3 text-sm">
          <span className="font-medium">{pesoEnPalabras(guardados)}</span> de {pesoEnPalabras(cuota)}
          {subiendoEnOtraParte + subiendoAca > 0 ? (
            <span className="text-fg-muted"> · {pesoEnPalabras(subiendoEnOtraParte + subiendoAca)} subiendo, que ya cuentan</span>
          ) : null}
        </p>
        {estado !== 'holgada' ? (
          <p role="status" className={cn('mt-1 text-sm', estado === 'llena' ? 'text-negative' : 'text-caution')}>
            {estado === 'llena' ? (
              <DeNocheYDeDia noche={`${CAMARA_LLENA.noche}: saca lo que ya no uses para guardar más.`} dia={`${CAMARA_LLENA.dia}: saca lo que ya no uses para guardar más.`} />
            ) : (
              <DeNocheYDeDia
                noche={`${CAMARA_LLENANDOSE.noche}: te quedan ${pesoEnPalabras(Math.max(0, cuota - ocupados))}.`}
                dia={`${CAMARA_LLENANDOSE.dia}: te quedan ${pesoEnPalabras(Math.max(0, cuota - ocupados))}.`}
              />
            )}
          </p>
        ) : null}
        <button type="button" onClick={() => setLibro(true)} className="mt-3 text-sm text-brasa underline-offset-2 hover:underline">
          ¿Necesitas más espacio?
        </button>
        <LibroDeSugerencias
          abierto={libro}
          alCerrar={() => setLibro(false)}
          inicial={{
            tipo: 'idea',
            texto: `Necesito más espacio en ${tema === 'dia' ? 'la nevera' : 'la cámara de frío'}: tengo ${pesoEnPalabras(guardados)} de ${pesoEnPalabras(cuota)}. Lo usaría para `,
          }}
        />
      </Panel>

      {puedeGuardar ? (
        <Panel title={<DeNocheYDeDia noche={GUARDAR_EN_LA_CAMARA.noche} dia={GUARDAR_EN_LA_CAMARA.dia} />} hint="Sin pedir comanda: queda guardado, y de acá lo eliges cuando pidas una.">
          <GuardarEnLaCamara
            libres={cuota - guardados - subiendoEnOtraParte}
            cuota={cuota}
            alGuardar={alGuardar}
            alCambiarSubiendo={setSubiendoAca}
          />
        </Panel>
      ) : null}

      <Panel
        title={
          <>
            Lo que hay adentro {materiales.length > 0 ? <span className="font-mono text-xs text-fg-faint">({materiales.length})</span> : null}
          </>
        }
      >
        {materiales.length === 0 ? (
          <p className="text-sm text-fg-faint">
            <DeNocheYDeDia noche={CAMARA_VACIA.noche} dia={CAMARA_VACIA.dia} /> Lo que guardes queda acá, y no vence.
          </p>
        ) : (
          <>
            <FiltroDeClase materiales={materiales} valor={filtro} onCambiar={setFiltro} />
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((m) => (
                <TarjetaDeMaterial
                  key={m.id}
                  material={m}
                  recien={recientes.has(m.id)}
                  onEditar={() => setEditando(m)}
                  onSacado={() => setMateriales((lista) => lista.filter((x) => x.id !== m.id))}
                />
              ))}
            </ul>
          </>
        )}
      </Panel>

      <EditarMaterial
        material={editando}
        alCerrar={() => setEditando(null)}
        alGuardar={(cambio) => setMateriales((lista) => lista.map((x) => (x.id === cambio.id ? { ...x, ...cambio } : x)))}
      />
      <span className="sr-only" aria-live="polite">
        {recientes.size > 0 ? `${tema === 'dia' ? CAMARA.dia : CAMARA.noche}: entró ${materiales.find((m) => recientes.has(m.id))?.nombre ?? ''}` : ''}
      </span>
    </div>
  )
}

function TarjetaDeMaterial({
  material: m,
  recien,
  onEditar,
  onSacado,
}: {
  material: MaterialDeLaCamara
  recien: boolean
  onEditar: () => void
  onSacado: () => void
}) {
  const confirmar = useConfirmar()
  const tema = useTema()
  const [sacando, sacar] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const duracion = duracionEnPalabras(m.duracionS)
  const lugar = tema === 'dia' ? 'la nevera' : 'la cámara'

  async function pedirSacar() {
    const si = await confirmar({
      titulo: `¿Sacar «${m.nombre}» de ${lugar}?`,
      detalle: 'Se borra, y no se puede deshacer. Las comandas que ya lo usaron no cambian.',
      accion: tema === 'dia' ? SACAR_DE_LA_CAMARA.dia : SACAR_DE_LA_CAMARA.noche,
      peligro: true,
    })
    if (!si) return
    setError(null)
    sacar(async () => {
      const r = await sacarMaterialPropio(m.id)
      if (r.error) setError(r.error)
      else onSacado()
    })
  }

  return (
    <li className={cn('rounded-lg border border-acero-700 bg-acero-900 p-3', recien && 'camara-recien')}>
      {recien ? (
        <>
          <span className="vaho" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="puerta-de-la-camara" aria-hidden />
        </>
      ) : null}
      <div className="flex gap-3">
        <DibujoDeMaterial clase={m.clase} bytes={m.bytes} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" data-globito={m.nombre}>
            {m.nombre}
          </p>
          <p className="text-xs text-fg-muted">
            <PesoDeMaterial clase={m.clase} bytes={m.bytes} />
            {duracion ? ` · ${duracion}` : ''}
          </p>
          <p className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-acero-700 px-2 py-px text-[0.7rem] text-fg-muted">
              {m.uso ? NOMBRE_USO[m.uso] : NOMBRE_CLASE[m.clase].uno}
            </span>
            {m.enMarcha > 0 ? (
              <span className="rounded-full border border-brasa/50 px-2 py-px text-[0.7rem] text-brasa">
                {m.enMarcha === 1 ? 'En una comanda en marcha' : `En ${m.enMarcha} comandas en marcha`}
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onEditar}>
          Cambiar
        </Button>
        <Button type="button" variant="danger" disabled={sacando || m.enMarcha > 0} onClick={() => void pedirSacar()}>
          {sacando ? 'Sacando…' : <DeNocheYDeDia noche={SACAR_DE_LA_CAMARA.noche} dia={SACAR_DE_LA_CAMARA.dia} />}
        </Button>
      </div>
      {m.enMarcha > 0 ? <p className="mt-1.5 text-[0.72rem] text-fg-faint">Se puede sacar cuando la comanda termine.</p> : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-negative">
          {error}
        </p>
      ) : null}
    </li>
  )
}

/** La ventana de «Cambiar»: el nombre y para qué es. Lo que ya se pidió con él no cambia. */
function EditarMaterial({
  material,
  alCerrar,
  alGuardar,
}: {
  material: MaterialDeLaCamara | null
  alCerrar: () => void
  alGuardar: (cambio: { id: string; nombre: string; uso: UsoMaterial | null }) => void
}) {
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const [abiertoPara, setAbiertoPara] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [uso, setUso] = useState<UsoMaterial | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, guardar] = useTransition()

  // Al abrirse para un material: sus valores, y la ventana a la vista. Sin efecto: el cambio de
  // material se ve durante el render, como pide React para el estado que depende de una prop.
  if (material && abiertoPara !== material.id) {
    setAbiertoPara(material.id)
    setNombre(material.nombre)
    setUso(material.uso)
    setError(null)
  }
  if (!material && abiertoPara !== null) setAbiertoPara(null)

  const refVentana = useCallback(
    (nodo: HTMLDialogElement | null) => {
      ventana.current = nodo
      if (nodo && material && !nodo.open) nodo.showModal()
      if (nodo && !material && nodo.open) nodo.close()
    },
    [material],
  )

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!material) return
    guardar(async () => {
      const r = await editarMaterialPropio(material.id, nombre, uso)
      if (r.error) return setError(r.error)
      alGuardar({ id: material.id, nombre: nombre.trim(), uso })
      alCerrar()
    })
  }

  return (
    <Ventana ref={refVentana} aria-labelledby={idTitulo} alVelo={alCerrar} onClose={alCerrar} className="w-[26rem]">
      {material ? (
        <form onSubmit={enviar} noValidate className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <DibujoDeMaterial clase={material.clase} bytes={material.bytes} className="h-12 w-12" />
            <h2 id={idTitulo} className="font-titulo text-base font-semibold uppercase tracking-[0.05em]">
              Cambiar
            </h2>
          </div>
          <Field label="El nombre">
            <Input value={nombre} maxLength={200} onChange={(e) => setNombre(e.target.value)} aria-invalid={Boolean(error) || undefined} />
          </Field>
          <fieldset>
            <legend className="mb-1.5 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Para qué es</legend>
            <div className="flex flex-wrap gap-1.5">
              {[null, ...USOS_MATERIAL].map((u) => (
                <label
                  key={u ?? 'ninguno'}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1 text-[0.8rem] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brasa',
                    uso === u ? 'border-brasa bg-brasa text-acero-950' : 'border-acero-700 text-fg-muted hover:border-acero-600 hover:text-fg',
                  )}
                >
                  <input type="radio" name={`${idTitulo}uso`} className="sr-only" checked={uso === u} onChange={() => setUso(u)} />
                  {u ? NOMBRE_USO[u] : 'Sin uso'}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-[0.75rem] text-fg-faint">Las comandas que ya lo usaron siguen con el nombre y el uso que tenía.</p>
          {error ? (
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button type="button" onClick={alCerrar}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </Ventana>
  )
}
