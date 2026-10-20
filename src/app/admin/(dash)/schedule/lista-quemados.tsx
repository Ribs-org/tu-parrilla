'use client'

import { Fragment, useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Icon } from '@/components/icon'
import { colorDeRed } from '@/lib/color-de-red'
import { networkLabel } from '@/lib/networks'
import { cn } from '@/lib/utils'
import { SE_QUEMO } from '@/lib/vocabulario'
import { PAGINA_QUEMADOS, plegada, quemadosVisibles, redesQuemadas } from './filtro-quemados'

/** Dónde se recuerda si el dueño dejó «Se quemó» abierto. Solo en este navegador. */
const CLAVE_ABIERTO = 'tp:se-quemo-abierto'

/**
 * La lista de «Se quemó», con lo que necesita del navegador: plegarla, el filtro por red
 * —todo parte encendido, y cada red se apaga con un clic— y el «Ver más» de a diez. Las
 * filas llegan ya dibujadas desde el servidor (`se-quemo.tsx`); acá solo se decide cuáles se
 * ven.
 *
 * Parte plegada, en una sola línea con cuántas hay y los primeros cortes quemados en chico
 * (`plegada`): lo quemado sigue avisando arriba del calendario, y se ve cuánto antes de leer
 * el número, pero no lo empuja hacia abajo. Si el dueño la abre, queda abierta la próxima
 * vez (en `localStorage`, que puede no estar: entonces vuelve a partir plegada).
 *
 * El filtro no va a la URL a propósito: es una mirada de un momento, y un enlace a La
 * Parrilla con redes apagadas escondería lo quemado justo a quien lo abre.
 */
export function ListaQuemados({
  filas,
}: {
  filas: Array<{ id: string; red: string; fila: ReactNode; corte: ReactNode }>
}) {
  const [abierto, setAbierto] = useState(false)
  const [apagadas, setApagadas] = useState<ReadonlySet<string>>(new Set())
  const [mostradas, setMostradas] = useState(PAGINA_QUEMADOS)
  const region = useId()
  const redes = redesQuemadas(filas)
  const { visibles, total, quedan } = quemadosVisibles(filas, apagadas, mostradas)
  const enChico = plegada(filas)

  useEffect(() => {
    // Después de montar y no en el estado inicial: el servidor no sabe lo que guardó este
    // navegador, y empezar distinto que él rompería la hidratación.
    let guardado: string | null = null
    try {
      guardado = window.localStorage.getItem(CLAVE_ABIERTO)
    } catch {
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leer `localStorage` solo se puede ya montado
    if (guardado === '1') setAbierto(true)
  }, [])

  function alternarAbierto() {
    const siguiente = !abierto
    setAbierto(siguiente)
    try {
      window.localStorage.setItem(CLAVE_ABIERTO, siguiente ? '1' : '0')
    } catch {
      // Sin almacenamiento, la sección se pliega igual; solo no se recuerda.
    }
  }

  function alternarRed(red: string) {
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={alternarAbierto}
          aria-expanded={abierto}
          aria-controls={region}
          className="group flex items-center gap-2 rounded font-titulo text-sm font-semibold uppercase tracking-[0.03em] text-negative"
        >
          {/* Las dos palabras, y el modo esconde una: así cambia con el botón, sin recargar. */}
          <span className="solo-noche">{SE_QUEMO.noche}</span>
          <span className="solo-dia">{SE_QUEMO.dia}</span>
          <span className="rounded-full bg-negative/15 px-2 py-px font-mono text-[0.72rem] font-normal tracking-normal">
            {filas.length}
          </span>
          {/* Plegada, los cortes quemados en chico: el número dice cuántos, esto los muestra. */}
          {abierto ? null : (
            <span className="mt-1 flex items-center gap-1" aria-hidden>
              {enChico.cortes.map((f) => (
                <Fragment key={f.id}>{f.corte}</Fragment>
              ))}
              {enChico.mas > 0 ? (
                <span className="font-mono text-[0.68rem] font-normal tracking-normal text-fg-muted">+{enChico.mas}</span>
              ) : null}
            </span>
          )}
          <span className="flex items-center gap-1 font-sans text-[0.75rem] font-normal normal-case tracking-normal text-fg-muted group-hover:text-fg">
            {abierto ? 'Ocultar' : 'Ver'}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', abierto && 'rotate-180')} aria-hidden />
          </span>
        </button>
        {/* Con una sola red no hay nada que separar. */}
        {abierto && redes.length > 1 ? (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por red">
            {redes.map(({ red, cuantas }) => {
              const encendida = !apagadas.has(red)
              return (
                <button
                  key={red}
                  type="button"
                  aria-pressed={encendida}
                  onClick={() => alternarRed(red)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] transition-colors',
                    encendida
                      ? 'border-negative/50 bg-negative/10 text-fg hover:bg-negative/20'
                      : 'border-dashed border-acero-700 text-fg-faint hover:text-fg-muted',
                  )}
                >
                  <Icon name={red} className={cn('h-3.5 w-3.5 shrink-0', colorDeRed(red))} />
                  {networkLabel(red)}
                  <span className="font-mono text-[0.68rem]">{cuantas}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      <div id={region} hidden={!abierto} className="mt-2">
        {total === 0 ? (
          <p className="py-2 text-[0.85rem] text-fg-muted">
            Apagaste todas las redes.{' '}
            <button
              type="button"
              onClick={() => setApagadas(new Set())}
              className="text-fg underline decoration-velo/20 underline-offset-4 hover:decoration-velo/50"
            >
              Encender todas
            </button>
          </p>
        ) : (
          <ul className="divide-y divide-velo/[0.06]">
            {visibles.map((f) => (
              <Fragment key={f.id}>{f.fila}</Fragment>
            ))}
          </ul>
        )}

        {quedan > 0 ? (
          <div className="mt-1 border-t border-velo/[0.06] pt-2 text-center">
            <button
              type="button"
              onClick={() => setMostradas(mostradas + PAGINA_QUEMADOS)}
              className="rounded px-2 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:text-fg"
            >
              Ver más (quedan {quedan})
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
