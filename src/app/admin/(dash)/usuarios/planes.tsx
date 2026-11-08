'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { darCortesiaAccion, guardarPlanAccion, pasarAlGratisAccion } from '@/app/admin/planes-actions'
import { SelectorFecha } from '@/components/selector-fecha'
import { Ventana } from '@/components/ventana'
import { Button, Field, GroupLabel, Input } from '@/components/ui'
import type { Plan } from '@/lib/planes/plan'

// Los planes en Los Maestros: la tarjeta de cada plan, con sus topes, y el botón «Plan» de cada
// persona, que da una cortesía o la pasa al gratis. Las reglas están en `src/lib/planes/plan.ts`.

const gigas = (bytes: number) => String(Math.round((bytes / 1024 ** 3) * 10) / 10)
const sinTope = (n: number | null) => (n === null ? '' : String(n))

/** Un plan, con todo lo que se le puede cambiar. En el gratis no hay precio ni prueba: no se cobra. */
export function TarjetaDePlan({ plan }: { plan: Plan }) {
  const [pending, start] = useTransition()
  const [resultado, setResultado] = useState<{ error?: string; ok?: true } | null>(null)
  const gratis = plan.clave === 'gratis'

  function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    start(async () => setResultado(await guardarPlanAccion(plan.clave, datos)))
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-3 rounded-xl bg-velo/[0.04] p-4">
      <p className="font-titulo text-sm font-semibold uppercase tracking-[0.05em]">
        {gratis ? 'El gratis' : 'El pagado'}
      </p>
      <div className="flex flex-wrap gap-3">
        <Field label="Nombre">
          <Input name="nombre" defaultValue={plan.nombre} className="w-40" />
        </Field>
        {gratis ? null : (
          <>
            <Field label="Precio al mes (CLP, con IVA)">
              <Input name="precioClp" defaultValue={String(plan.precioClp)} inputMode="numeric" className="w-32" />
            </Field>
            <Field label="Días de prueba">
              <Input name="diasDePrueba" defaultValue={String(plan.diasDePrueba)} inputMode="numeric" className="w-24" />
            </Field>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Field label="Cuentas conectadas" hint="Vacío, sin tope.">
          <Input name="cuentasMax" defaultValue={sinTope(plan.cuentasMax)} inputMode="numeric" className="w-28" />
        </Field>
        <Field label="Esperando en la parrilla" hint="Vacío, sin tope.">
          <Input name="enLaParrillaMax" defaultValue={sinTope(plan.enLaParrillaMax)} inputMode="numeric" className="w-28" />
        </Field>
        <Field label="Cámara de frío (GB)">
          <Input name="bodegaGb" defaultValue={gigas(plan.bodegaBytes)} inputMode="decimal" className="w-24" />
        </Field>
        <Field label="Tokens de IA al mes" hint="Vacío, sin tope.">
          <Input name="tokensMes" defaultValue={sinTope(plan.tokensMes)} inputMode="numeric" className="w-32" />
        </Field>
        <Field label="Prioridad" hint="Más alta, primero en las colas.">
          <Input name="prioridad" defaultValue={String(plan.prioridad)} inputMode="numeric" className="w-20" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
        {resultado?.error ? (
          <p role="alert" className="text-sm text-negative">
            {resultado.error}
          </p>
        ) : resultado?.ok ? (
          <p role="status" className="text-sm text-positive">
            Guardado.
          </p>
        ) : null}
      </div>
    </form>
  )
}

/**
 * «Plan» en la fila de una persona: una ventana para darle el pagado sin pagar —hasta un día, o sin
 * fecha— o para pasarla al gratis.
 */
export function BotonPlan({
  id,
  correo,
  rige,
  pagado,
  hoy,
}: {
  id: string
  correo: string
  /** El plan en palabras, como la fila. */
  rige: string
  /** El nombre del plan pagado. */
  pagado: string
  hoy: string
}) {
  const ventana = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()
  const [dia, setDia] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function abrir() {
    setDia('')
    setError(null)
    ventana.current?.showModal()
  }

  function hacer(accion: () => Promise<{ error?: string }>) {
    start(async () => {
      const r = await accion()
      if (r.error) return setError(r.error)
      ventana.current?.close()
    })
  }

  return (
    <>
      <Button variant="ghost" onClick={abrir}>
        Plan
      </Button>
      <Ventana ref={ventana} aria-labelledby={idTitulo} alVelo={() => ventana.current?.close()}>
        <div className="space-y-4 p-5">
          <h2 id={idTitulo} className="font-titulo text-base font-semibold uppercase tracking-[0.05em]">
            El plan de {correo}
          </h2>
          <p className="text-sm text-fg-muted">Ahora: {rige}.</p>
          {/* Un `div` y no un `Field`: el `<label>` de `Field` envuelve todo, y un clic en la pista
              volvería a abrir el calendario. */}
          <div>
            <GroupLabel>Cortesía hasta</GroupLabel>
            <SelectorFecha modo="fecha" value={dia} onChange={setDia} min={hoy} hoy={hoy} quitable aria-label="Cortesía hasta" />
            <span className="mt-1 block text-[0.72rem] text-fg-faint">
              Vacía, sin fecha. Le da el {pagado} sin pagar; al terminar, vuelve sola al gratis.
            </span>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={pending} onClick={() => hacer(() => darCortesiaAccion(id, dia))}>
              {pending ? 'Guardando…' : 'Dar cortesía'}
            </Button>
            <Button disabled={pending} onClick={() => hacer(() => pasarAlGratisAccion(id))}>
              Pasar al gratis
            </Button>
            <Button onClick={() => ventana.current?.close()}>Cancelar</Button>
          </div>
        </div>
      </Ventana>
    </>
  )
}
