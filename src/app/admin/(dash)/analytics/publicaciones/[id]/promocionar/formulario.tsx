'use client'

import { useActionState, useState } from 'react'
import { Panel } from '@/components/charts/panel'
import { SelectorFecha } from '@/components/selector-fecha'
import { Button, Field, Input, Select, Submit } from '@/components/ui'
import { etiquetaDeFechas } from '@/lib/rango'
import { addDays } from '@/lib/schedule-week'
import {
  EDAD_MAXIMA,
  EDAD_MINIMA,
  EDAD_MINIMA_TOPE_ADVANTAGE,
  NOMBRE_OBJETIVO,
  OBJETIVOS,
  PAISES,
  fraseDelGasto,
  formatearMonto,
  leerMonto,
  nombreDePais,
  revisarPromocion,
  type CuentaParaPromocionar,
  type Objetivo,
  type Plan,
  type TipoPresupuesto,
} from '@/lib/social/promocionar'
import { promocionarAccion, type EstadoPromocionar } from './acciones'

const EDADES = Array.from({ length: EDAD_MAXIMA - EDAD_MINIMA + 1 }, (_, i) => EDAD_MINIMA + i)

/**
 * Dos pasos: los datos, y el resumen con lo máximo que se puede gastar. Solo el segundo envía, y
 * con el gasto máximo que el dueño está mirando: si el servidor calcula otro, no crea nada.
 */
export function FormularioPromocion({
  postId,
  network,
  cuentas,
  hoy,
  enlace,
}: {
  postId: string
  network: 'instagram' | 'facebook'
  cuentas: CuentaParaPromocionar[]
  hoy: string
  /** El link de Tu Parrilla de la publicación, para pedir visitas; null si no se puede. */
  enlace: string | null
}) {
  const [estado, action] = useActionState<EstadoPromocionar, FormData>(promocionarAccion, {})
  const usables = cuentas.filter((c) => !c.problema)
  const [cuenta, setCuenta] = useState(usables[0]?.id ?? cuentas[0]?.id ?? '')
  const [objetivo, setObjetivo] = useState<Objetivo>('alcance')
  const [tipo, setTipo] = useState<TipoPresupuesto>('total')
  const [monto, setMonto] = useState('')
  const [desde, setDesde] = useState(hoy)
  const [hasta, setHasta] = useState(addDays(hoy, 6))
  const [paises, setPaises] = useState<string[]>(['CL'])
  const [edadMin, setEdadMin] = useState(EDAD_MINIMA)
  const [edadMax, setEdadMax] = useState(EDAD_MAXIMA)
  const [advantage, setAdvantage] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [categorias, setCategorias] = useState(false)
  const [activar, setActivar] = useState(false)

  const elegida = cuentas.find((c) => c.id === cuenta)
  const conTrafico = network === 'instagram' && enlace !== null

  function revisar() {
    const r = revisarPromocion(
      {
        cuentaPublicitariaId: cuenta,
        objetivo,
        tipoPresupuesto: tipo,
        monto: leerMonto(monto),
        desde,
        hasta,
        paises,
        edadMin,
        edadMax: advantage ? null : edadMax,
        advantage,
        categorias: false,
        activar: false,
        gastoConfirmado: null,
      },
      { network, hoy, cuentas, conEnlace: enlace !== null },
      false,
    )
    if ('error' in r) {
      setError(r.error)
      setPlan(null)
    } else {
      setError(null)
      setPlan(r.plan)
      setCategorias(false)
      setActivar(false)
    }
  }

  if (plan) {
    const total = formatearMonto(plan.gastoMaximo, plan.cuenta.moneda)
    return (
      <form action={action}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="cuenta" value={plan.cuenta.id} />
        <input type="hidden" name="objetivo" value={plan.objetivo} />
        <input type="hidden" name="tipoPresupuesto" value={plan.tipoPresupuesto} />
        <input type="hidden" name="monto" value={monto} />
        <input type="hidden" name="desde" value={plan.desde} />
        <input type="hidden" name="hasta" value={plan.hasta} />
        {plan.paises.map((p) => (
          <input key={p} type="hidden" name="pais" value={p} />
        ))}
        <input type="hidden" name="edadMin" value={plan.edadMin} />
        {plan.edadMax !== null ? <input type="hidden" name="edadMax" value={plan.edadMax} /> : null}
        <input type="hidden" name="advantage" value={plan.advantage ? '1' : '0'} />
        <input type="hidden" name="gastoConfirmado" value={plan.gastoMaximo} />

        <Panel title="Revisa antes de crear" hint="Todavía no se creó nada. Nada se gasta hasta que confirmes.">
          <p className="rounded-lg border border-brasa/50 bg-acero-800 p-4 text-sm text-fg">{fraseDelGasto(plan)}</p>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-[0.85rem] sm:grid-cols-2">
            <Dato titulo="Cuenta publicitaria">{plan.cuenta.nombre ?? plan.cuenta.id}</Dato>
            <Dato titulo="Qué quieres conseguir">{NOMBRE_OBJETIVO[plan.objetivo]}</Dato>
            <Dato titulo="Presupuesto">
              {formatearMonto(plan.presupuesto, plan.cuenta.moneda)} {plan.tipoPresupuesto === 'diario' ? 'al día' : 'en total'}
            </Dato>
            <Dato titulo="Fechas">
              {etiquetaDeFechas({ desde: plan.desde, hasta: plan.hasta }, hoy)} ({plan.dias} {plan.dias === 1 ? 'día' : 'días'})
            </Dato>
            <Dato titulo="Países">{plan.paises.map(nombreDePais).join(', ')}</Dato>
            <Dato titulo="Edades">
              {plan.advantage
                ? `Desde ${plan.edadMin}, con público Advantage+`
                : `De ${plan.edadMin} a ${plan.edadMax}${plan.edadMax === EDAD_MAXIMA ? ' o más' : ''}`}
            </Dato>
            {plan.objetivo === 'trafico' && enlace ? <Dato titulo="Lleva a">{enlace}</Dato> : null}
          </dl>

          <label className="mt-5 flex items-start gap-2 text-[0.85rem]">
            <input
              type="checkbox"
              name="categorias"
              value="1"
              checked={categorias}
              onChange={(e) => setCategorias(e.target.checked)}
              className="mt-1"
            />
            <span>
              Confirmo que no es un anuncio de vivienda, empleo, crédito, ni de temas sociales, electorales o
              políticos.
            </span>
          </label>

          <fieldset className="mt-4 space-y-2 text-[0.85rem]">
            <legend className="mb-1 text-fg-muted">Cuando Meta la cree:</legend>
            <label className="flex items-start gap-2">
              <input type="radio" name="activar" value="0" checked={!activar} onChange={() => setActivar(false)} className="mt-1" />
              <span>Dejarla en pausa: no gasta nada hasta que la actives desde la pieza.</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" name="activar" value="1" checked={activar} onChange={() => setActivar(true)} className="mt-1" />
              <span>Activarla: empieza a circular en la fecha de inicio, cuando Meta la apruebe.</span>
            </label>
          </fieldset>

          {estado.error ? (
            <p role="alert" className="mt-4 text-sm text-negative">
              {estado.error}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Submit pendingLabel="Creando en Meta…" disabled={!categorias}>
              {activar ? `Crear y activar: hasta ${total}` : `Crear en pausa: hasta ${total}`}
            </Submit>
            <Button type="button" onClick={() => setPlan(null)}>
              Cambiar algo
            </Button>
          </div>
        </Panel>
      </form>
    )
  }

  return (
    <Panel title="Tu promoción" hint="Lo mismo que el botón «Promocionar» de la app, desde acá.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Cuenta publicitaria" hint={elegida ? `Se paga en ${elegida.moneda}.` : undefined}>
          <Select value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.nombre ?? c.id} · ${c.moneda}${c.problema ? ' (no se puede usar)' : ''}`}
              </option>
            ))}
          </Select>
        </Field>
        {elegida?.problema ? (
          <p role="alert" className="self-end text-[0.8rem] text-negative">
            {elegida.problema}
          </p>
        ) : (
          <span />
        )}

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">
            Qué quieres conseguir
          </legend>
          <div className="flex flex-col gap-2 text-[0.85rem]">
            {OBJETIVOS.filter((o) => o !== 'trafico' || conTrafico).map((o) => (
              <label key={o} className="flex items-center gap-2">
                <input type="radio" name="objetivoVista" checked={objetivo === o} onChange={() => setObjetivo(o)} />
                {NOMBRE_OBJETIVO[o]}
              </label>
            ))}
          </div>
          {conTrafico && objetivo === 'trafico' ? (
            <p className="mt-1 text-[0.72rem] text-fg-faint">Con un botón «Más información» que lleva a {enlace}.</p>
          ) : null}
        </fieldset>

        <Field label="Presupuesto">
          <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPresupuesto)}>
            <option value="total">Total, por toda la promoción</option>
            <option value="diario">Por día</option>
          </Select>
        </Field>
        <Field
          label={`Monto en ${elegida?.moneda ?? ''}`}
          hint={
            elegida?.minimoDiario
              ? `Meta pide al menos ${formatearMonto(elegida.minimoDiario, elegida.moneda)} por cada día.`
              : undefined
          }
        >
          <Input inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="5000" />
        </Field>

        <Field label="Empieza">
          <SelectorFecha modo="fecha" value={desde} onChange={setDesde} min={hoy} hoy={hoy} />
        </Field>
        <Field label="Termina">
          <SelectorFecha modo="fecha" value={hasta} onChange={setHasta} min={desde} hoy={hoy} />
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 font-titulo text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">
            Países
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.85rem]">
            {PAISES.map((p) => (
              <label key={p} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={paises.includes(p)}
                  onChange={(e) => setPaises(e.target.checked ? [...paises, p] : paises.filter((x) => x !== p))}
                />
                {nombreDePais(p)}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Edad mínima">
          <Select value={edadMin} onChange={(e) => setEdadMin(Number(e.target.value))}>
            {EDADES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Edad máxima" hint={advantage ? 'Con Advantage+, Meta decide hasta qué edad.' : undefined}>
          <Select value={edadMax} disabled={advantage} onChange={(e) => setEdadMax(Number(e.target.value))}>
            {EDADES.map((n) => (
              <option key={n} value={n}>
                {n === EDAD_MAXIMA ? `${n} o más` : n}
              </option>
            ))}
          </Select>
        </Field>

        <label className="flex items-start gap-2 text-[0.85rem] sm:col-span-2">
          <input type="checkbox" checked={advantage} onChange={(e) => setAdvantage(e.target.checked)} className="mt-1" />
          <span>
            Público Advantage+: que Meta busque a quién mostrarlo más allá de estas edades. La edad mínima puede ser
            como mucho {EDAD_MINIMA_TOPE_ADVANTAGE}.
          </span>
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-negative">
          {error}
        </p>
      ) : null}
      <div className="mt-5">
        <Button type="button" variant="primary" onClick={revisar}>
          Revisar
        </Button>
      </div>
    </Panel>
  )
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-fg-faint">{titulo}</dt>
      <dd className="mt-0.5 break-words text-fg">{children}</dd>
    </div>
  )
}
