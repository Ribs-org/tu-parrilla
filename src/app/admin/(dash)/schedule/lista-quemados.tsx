'use client'

import { Fragment, useState, type ReactNode } from 'react'
import { Icon } from '@/components/icon'
import { networkLabel } from '@/lib/networks'
import { cn } from '@/lib/utils'
import { PAGINA_QUEMADOS, quemadosVisibles, redesQuemadas } from './filtro-quemados'

/**
 * La lista de «Se quemó», con lo que necesita del navegador: el filtro por red —todo parte
 * encendido, y cada red se apaga con un clic— y el «Ver más» de a quince. Las filas llegan ya
 * dibujadas desde el servidor (`se-quemo.tsx`); acá solo se decide cuáles se ven.
 *
 * El estado no va a la URL a propósito: es una mirada de un momento, y un enlace a La Parrilla
 * con redes apagadas escondería lo quemado justo a quien lo abre.
 */
export function ListaQuemados({ filas }: { filas: Array<{ id: string; red: string; fila: ReactNode }> }) {
  const [apagadas, setApagadas] = useState<ReadonlySet<string>>(new Set())
  const [mostradas, setMostradas] = useState(PAGINA_QUEMADOS)
  const redes = redesQuemadas(filas)
  const { visibles, total, quedan } = quemadosVisibles(filas, apagadas, mostradas)

  function alternar(red: string) {
    const siguiente = new Set(apagadas)
    if (siguiente.has(red)) siguiente.delete(red)
    else siguiente.add(red)
    setApagadas(siguiente)
    // Cambiar el filtro vuelve a la primera tanda: lo que se suma con «Ver más» es de la
    // vista anterior.
    setMostradas(PAGINA_QUEMADOS)
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="flex items-center gap-2 font-titulo text-sm font-semibold uppercase tracking-[0.03em] text-negative">
          Se quemó
          <span className="rounded-full bg-negative/15 px-2 py-px font-mono text-[0.72rem] font-normal tracking-normal">
            {total}
          </span>
        </h2>
        {/* Con una sola red no hay nada que separar. */}
        {redes.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por red">
            {redes.map(({ red, cuantas }) => {
              const encendida = !apagadas.has(red)
              return (
                <button
                  key={red}
                  type="button"
                  aria-pressed={encendida}
                  onClick={() => alternar(red)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors',
                    encendida
                      ? 'border-negative/50 bg-negative/10 text-fg hover:bg-negative/20'
                      : 'border-dashed border-acero-700 text-fg-faint hover:text-fg-muted',
                  )}
                >
                  <Icon name={red} className="h-3.5 w-3.5 shrink-0" />
                  {networkLabel(red)}
                  <span className="font-mono text-[0.68rem]">{cuantas}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="py-2 text-[0.85rem] text-fg-muted">
          Apagaste todas las redes.{' '}
          <button
            type="button"
            onClick={() => setApagadas(new Set())}
            className="text-fg underline decoration-white/20 underline-offset-4 hover:decoration-white/50"
          >
            Encender todas
          </button>
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {visibles.map((f) => (
            <Fragment key={f.id}>{f.fila}</Fragment>
          ))}
        </ul>
      )}

      {quedan > 0 ? (
        <div className="mt-2 border-t border-white/[0.06] pt-2 text-center">
          <button
            type="button"
            onClick={() => setMostradas(mostradas + PAGINA_QUEMADOS)}
            className="rounded px-2 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:text-fg"
          >
            Ver más (quedan {quedan})
          </button>
        </div>
      ) : null}
    </>
  )
}
