import Link from 'next/link'
import { Panel } from '@/components/charts/panel'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { DibujoDeInsumo } from '@/components/dibujos-insumo'
import { EscenaCocina } from '@/components/escena-cocina'
import type { EstadoComanda } from '@/db/schema'
import { TERMINALES } from '@/lib/cocina/estados'
import { NOMBRE_ESTADO } from '@/lib/cocina/nombres'
import { etaEnLaFila, type ComandaDelPanel, type EstadoDeLaCocina } from '@/lib/cocina/panel'
import { antesEnLaFila, estadoEnPalabras } from '@/lib/cocina/tarjeta'
import { cn } from '@/lib/utils'
import { MESON, nombreDe } from '@/lib/vocabulario'
import { BotonCancelarComanda } from './cancelar'

// «El chef de la casa», la parte de arriba de La Cocina: el chef de `marca-personal`, que edita
// los videos del dueño (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`). Con la cocina
// apagada, qué es y cómo se enciende; encendida, si la cocina está abierta y las comandas.

/** Desde que el chef despieza, la pieza lleva marcado por dónde se corta. */
const CORTADA: ReadonlySet<EstadoComanda> = new Set(['en_preparacion', 'en_el_horno', 'sirviendo', 'lista', 'servida'])
/** Lo que terminó sin cocinarse se ve apagado. */
const APAGADA: ReadonlySet<EstadoComanda> = new Set(['rechazada', 'fallida', 'cancelada'])

const QUE_ES =
  'El chef de la casa edita tus videos: le llevas un video largo, un podcast en videollamada o tus tomas sueltas, y te devuelve una tanda de clips y carruseles con sus textos, para que los programes en tus redes. Está en piloto, con pocas cuentas.'

export function ChefDeLaCasaApagado({ esAdmin }: { esAdmin: boolean }) {
  return (
    <Panel title="El chef de la casa" className="mb-8">
      <EscenaCocina encendida={false} className="mb-5" />
      <p className="max-w-2xl text-sm text-fg-muted">{QUE_ES}</p>
      <p className="mt-3 max-w-2xl text-sm text-fg-muted">
        {esAdmin ? (
          <>
            Se enciende por cuenta, en{' '}
            <Link href="/admin/usuarios" className="text-brasa underline-offset-2 hover:underline">
              {nombreDe('/admin/usuarios')}
            </Link>
            .
          </>
        ) : (
          'Si quieres probarla, pídesela a quien administra Tu Parrilla.'
        )}
      </p>
    </Panel>
  )
}

export function ChefDeLaCasa({
  cocina,
  comandas,
  enElMeson,
  zona,
  ahora,
}: {
  cocina: EstadoDeLaCocina
  comandas: ComandaDelPanel[]
  /** Cuántos creativos esperan en el mesón, de todas las comandas. */
  enElMeson: number
  zona: string
  ahora: Date
}) {
  const fechaHora = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: zona })
  return (
    <Panel
      title="El chef de la casa"
      hint="Le llevas el material crudo y te devuelve los creativos, listos para programar."
      className="mb-8"
    >
      {/* La escena dice lo mismo que la línea de abajo, sin palabras: el fuego arde si la cocina está abierta. */}
      <EscenaCocina encendida={cocina.abierta} className="mb-5" />
      <p className="flex items-start gap-2 text-sm">
        <span aria-hidden className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', cocina.abierta ? 'bg-positive' : 'bg-caution')} />
        {cocina.abierta ? 'La cocina está abierta.' : 'La cocina está cerrada por ahora: lo que pidas espera su turno.'}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-titulo text-sm font-semibold uppercase tracking-[0.08em]">Las comandas</h3>
        <span className="flex flex-wrap gap-2">
          {enElMeson > 0 ? (
            <Link
              href="/admin/ia/meson"
              className="rounded-lg border border-acero-700 px-3 py-1.5 text-sm text-fg-muted transition hover:bg-acero-800 hover:text-fg"
            >
              <DeNocheYDeDia noche={MESON.noche} dia={MESON.dia} /> ({enElMeson})
            </Link>
          ) : null}
          <Link
            href="/admin/ia/pedir"
            className="rounded-lg bg-brasa px-3 py-1.5 text-sm font-medium text-acero-950 transition hover:brightness-110"
          >
            Pedir una comanda
          </Link>
        </span>
      </div>
      {comandas.length === 0 ? (
        <p className="mt-2 text-sm text-fg-faint">Todavía no tienes comandas.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {comandas.map((c) => (
            <Tarjeta key={c.id} comanda={c} cocina={cocina} fechaHora={fechaHora} ahora={ahora} />
          ))}
        </ul>
      )}
    </Panel>
  )
}

function Tarjeta({
  comanda: c,
  cocina,
  fechaHora,
  ahora,
}: {
  comanda: ComandaDelPanel
  cocina: EstadoDeLaCocina
  fechaHora: Intl.DateTimeFormat
  ahora: Date
}) {
  const termino = TERMINALES.has(c.estado)
  // La hora del chef si ya la dio; mientras espera, la que sale de la fila y del último latido.
  const eta = termino ? null : (c.eta ?? (c.antes !== null ? etaEnLaFila(c.antes, cocina, ahora) : null))
  const malo = c.estado === 'rechazada' || c.estado === 'fallida'
  return (
    <li className={cn('flex gap-4 rounded-lg border p-4', malo ? 'border-negative/40' : 'border-acero-700')}>
      <DibujoDeInsumo
        tipo="principal"
        cortada={CORTADA.has(c.estado)}
        className={cn('h-12 w-12', APAGADA.has(c.estado) && 'opacity-40 grayscale')}
      />
      <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 truncate text-sm font-medium">{c.principal ?? 'Comanda sin plato principal'}</p>
        <span className="text-xs text-fg-faint">pedida {fechaHora.format(c.creadaEn)}</span>
      </div>
      <p className={cn('mt-1 text-sm', malo ? 'text-negative' : 'text-fg')}>
        <DeNocheYDeDia noche={estadoEnPalabras(c, 'noche')} dia={estadoEnPalabras(c, 'dia')} />
      </p>
      {c.antes !== null ? <p className="mt-0.5 text-xs text-fg-muted">{antesEnLaFila(c.antes)}</p> : null}
      {eta ? <p className="mt-0.5 text-xs text-fg-muted">Hora estimada: {fechaHora.format(eta)}</p> : null}
      {c.mensaje && !malo ? <p className="mt-2 text-sm text-fg-muted">El chef: «{c.mensaje}»</p> : null}
      {malo && c.motivo ? <p className="mt-2 text-sm text-fg-muted">{c.motivo}</p> : null}

      {c.eventos.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-fg-faint hover:text-fg">Lo que pasó</summary>
          <ol className="mt-2 space-y-1 text-xs text-fg-muted">
            {c.eventos.map((e, i) => (
              <li key={i}>
                <span className="text-fg-faint">{fechaHora.format(e.creadoEn)}</span> ·{' '}
                <DeNocheYDeDia noche={NOMBRE_ESTADO[e.estado].noche} dia={NOMBRE_ESTADO[e.estado].dia} />
                {e.mensaje ? ` — ${e.mensaje}` : ''}
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      {c.enElMeson > 0 ? (
        <Link
          href={`/admin/ia/meson?comanda=${c.id}`}
          className="mt-2 inline-block text-sm text-brasa underline-offset-2 hover:underline"
        >
          <DeNocheYDeDia noche="Ver en el mesón →" dia="Ver en la bandeja →" />
        </Link>
      ) : null}
      {c.cancelable ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <BotonCancelarComanda id={c.id} />
        </div>
      ) : null}
      </div>
    </li>
  )
}
