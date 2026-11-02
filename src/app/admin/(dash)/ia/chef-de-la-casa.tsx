import Link from 'next/link'
import { Panel } from '@/components/charts/panel'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { EscenaCocina } from '@/components/escena-cocina'
import { EstacionDeLaComanda } from '@/components/estacion-comanda'
import { TERMINALES } from '@/lib/cocina/estados'
import { NOMBRE_ESTADO } from '@/lib/cocina/nombres'
import { etaEnLaFila, type ComandaDelPanel, type EstadoDeLaCocina, type PulsoDeLaCocina } from '@/lib/cocina/panel'
import { pesoEnPalabras } from '@/lib/cocina/bodega'
import type { UsoDeLaCamara } from '@/lib/cocina/subidas'
import { antesEnLaFila, estadoEnPalabras, tramoDelRecorrido } from '@/lib/cocina/tarjeta'
import { cn } from '@/lib/utils'
import { CAMARA, MESON, nombreDe } from '@/lib/vocabulario'
import { BotonCancelarComanda } from './cancelar'
import { VigiaDeLaCocina } from './vigia'

// «El chef de la casa», la parte de arriba de La Cocina: el chef de `marca-personal`, que edita
// los videos del dueño (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`). Con la cocina
// apagada, qué es y cómo se enciende; encendida, si la cocina está abierta y las comandas. Mientras
// alguna está en marcha, las tarjetas se actualizan solas (`vigia.tsx`) y su estación se mueve
// (`estacion-comanda.tsx`).

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
  camara,
  pulso,
  zona,
  ahora,
}: {
  cocina: EstadoDeLaCocina
  comandas: ComandaDelPanel[]
  /** Con qué firma salió esta página: la vigía la compara para saber si quedó vieja. */
  pulso: PulsoDeLaCocina
  /** Cuántos creativos esperan en el mesón, de todas las comandas. */
  enElMeson: number
  /** Lo que hay en la cámara de frío y cuánto le cabe. */
  camara: UsoDeLaCamara
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
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-titulo text-sm font-semibold uppercase tracking-[0.08em]">Las comandas</h3>
          <VigiaDeLaCocina vivas={pulso.vivas} firma={pulso.firma} />
        </span>
        <span className="flex flex-wrap gap-2">
          <Link
            href="/admin/ia/bodega"
            className="flex items-center gap-1.5 rounded-lg border border-acero-700 px-3 py-1.5 text-sm text-fg-muted transition hover:bg-acero-800 hover:text-fg"
          >
            <IconoCamara className="h-4 w-4" />
            <DeNocheYDeDia noche={CAMARA.noche} dia={CAMARA.dia} />
            <span className="font-mono text-[0.7rem] text-fg-faint">
              {camara.cuantos > 0 ? `${pesoEnPalabras(camara.guardados)} de ${pesoEnPalabras(camara.cuota)}` : 'vacía'}
            </span>
          </Link>
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
    <li className={cn('flex gap-3 rounded-lg border p-3 sm:gap-4 sm:p-4', malo ? 'border-negative/40' : 'border-acero-700')}>
      <EstacionDeLaComanda estado={c.estado} tandasServidas={c.tandasServidas} className="h-auto w-[4.5rem] self-start sm:w-28" />
      <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 truncate text-sm font-medium">{c.principal ?? 'Comanda sin plato principal'}</p>
        <span className="text-xs text-fg-faint">pedida {fechaHora.format(c.creadaEn)}</span>
      </div>
      {/* Cambia sola mientras está en marcha: el lector de pantalla lo dice cuando cambia. */}
      <p className={cn('mt-1 text-sm', malo ? 'text-negative' : 'text-fg')} aria-live="polite">
        <DeNocheYDeDia noche={estadoEnPalabras(c, 'noche')} dia={estadoEnPalabras(c, 'dia')} />
      </p>
      <Recorrido comanda={c} />
      {c.antes !== null ? <p className="mt-1.5 text-xs text-fg-muted">{antesEnLaFila(c.antes)}</p> : null}
      {eta ? <p className="mt-0.5 text-xs text-fg-muted">Hora estimada: {fechaHora.format(eta)}</p> : null}
      {c.mensaje && !malo ? <p className="mt-2 text-sm text-fg-muted">El chef: «{c.mensaje}»</p> : null}
      {malo && c.motivo ? <p className="mt-2 text-sm text-fg-muted">{c.motivo}</p> : null}
      {c.instruccion ? (
        <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-xs text-fg-faint">
          Tu instrucción al chef: «{c.instruccion}»
        </p>
      ) : null}

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

/**
 * El recorrido de una comanda, en cinco tramos: colgada, el chef mira, el desposte, al fuego y el
 * mesón. Lo hecho en brasa; el tramo de ahora, con una luz que lo cruza; al servir, el último se
 * llena con las tandas que llegaron. Dice lo mismo que el estado en palabras, de un vistazo: por
 * eso no se lee en voz alta. Una comanda que terminó mal no lo lleva.
 */
function Recorrido({ comanda: c }: { comanda: ComandaDelPanel }) {
  const tramo = tramoDelRecorrido(c.estado)
  if (tramo === null) return null
  const llenado = c.estado === 'sirviendo' && c.tandasTotal ? Math.min(1, c.tandasServidas / c.tandasTotal) : null
  return (
    <div aria-hidden className="mt-2 flex max-w-xs gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-acero-700">
          {i < tramo ? <span className="absolute inset-0 bg-brasa" /> : null}
          {i === tramo ? (
            <span className="tramo-vivo absolute inset-y-0 left-0" style={{ width: `${llenado === null ? 100 : Math.max(12, llenado * 100)}%` }} />
          ) : null}
        </span>
      ))}
    </div>
  )
}

/**
 * El ícono del botón de la cámara de frío: de noche, la puerta de la cámara con su manilla y el
 * termómetro; de día, la nevera de vidrio con un pescado adentro. Chico, en el color del texto.
 */
function IconoCamara({ className }: { className?: string }) {
  return (
    <>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cn('solo-noche shrink-0', className)} aria-hidden>
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <path d="M16 10V14" strokeLinecap="round" strokeWidth="2.2" />
        <path d="M8 7V12" strokeLinecap="round" />
        <circle cx="8" cy="14" r="1.6" fill="currentColor" stroke="none" />
      </svg>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cn('solo-dia shrink-0', className)} aria-hidden>
        <rect x="3" y="6" width="18" height="13" rx="1.5" />
        <path d="M3 15H21" />
        <path d="M7 12.5C9 10.5 13 10.5 15 12L17.5 10.5V14L15 12.6C13 14 9 14 7 12.5Z" fill="currentColor" stroke="none" />
      </svg>
    </>
  )
}
