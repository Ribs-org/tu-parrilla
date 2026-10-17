import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { retraso } from '@/components/esqueleto'
import { NEGATIVE, POSITIVE } from './theme'

type Props = {
  label: string
  value: string
  /**
   * Percentage change against the previous period of equal length. `null` es «se quiso
   * comparar y no se pudo»: el período anterior no tuvo nada (ver `delta`, abajo).
   */
  delta?: number | null
  hint?: string
}

/** Lo que dice una cifra que se compara cuando el período anterior no tuvo nada. */
export const SIN_ANTERIOR = 'Nada en el período anterior para comparar'

export function StatTile({ label, value, delta, hint }: Props) {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta)
  const flat = hasDelta && Math.abs(delta) < 0.5
  const up = hasDelta && delta > 0
  const Arrow = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight
  const color = flat ? undefined : up ? POSITIVE : NEGATIVE

  return (
    <div className="chapa rounded-xl p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-fg-faint">{label}</p>
      <p className="mt-2 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-fg">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-[0.75rem]">
        {hasDelta ? (
          <>
            <Arrow className="h-3.5 w-3.5" style={{ color }} aria-hidden />
            <span style={{ color }} className="font-mono tabular-nums">
              {flat ? '0%' : `${delta > 0 ? '+' : ''}${delta.toFixed(0)}%`}
            </span>
            <span className="text-fg-faint">vs. período anterior</span>
          </>
        ) : (
          // Un «—» suelto debajo de la cifra no decía qué faltaba: cuando lo que falta es el
          // período anterior, se dice.
          <span className="text-fg-faint">{hint ?? (delta === null ? SIN_ANTERIOR : '—')}</span>
        )}
      </div>
    </div>
  )
}

/**
 * El hueco de un `StatTile`: las tres líneas de la cifra, sin la cifra, con el pulso tibio
 * de toda carga del panel (`src/components/esqueleto.tsx`). La cifra, en brasa.
 */
export function StatTileSkeleton({ orden = 0 }: { orden?: number }) {
  return (
    <div className="chapa tibio rounded-xl p-4" style={retraso(orden)} aria-hidden>
      <div className="h-4 w-20 rounded bg-white/[0.06]" />
      <div className="brasa-tibia mt-2 h-7 w-24 rounded" />
      <div className="mt-2 h-4 w-28 rounded bg-white/[0.035]" />
    </div>
  )
}

/** Percentage change, guarding the divide-by-zero that a first period always hits. */
export function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}
