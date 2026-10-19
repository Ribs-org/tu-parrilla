'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useId, useState, useTransition } from 'react'
import { Bot, CalendarDays } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { RANGES, type Periodo } from '@/lib/filters'
import { PRIMER_DIA, atajosDeFechas, etiquetaDeFechas, problemaDeFechas, type Fechas } from '@/lib/rango'
import { cn } from '@/lib/utils'

/**
 * Los filtros viven en la URL, así que cualquier vista de Los Números se puede compartir y el
 * botón Atrás hace lo que uno espera. Son piezas sueltas y no una sola barra porque no
 * filtran lo mismo: el período vale para todo el tablero, la cuenta solo para lo que pasó en
 * las redes, y la página y los bots solo para lo que pasó en tu página.
 */
function useFiltro() {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  /** Cambia varias claves de una vez; `null` borra la clave. */
  function cambiarVarias(cambios: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null) next.delete(clave)
      else next.set(clave, valor)
    }
    startTransition(() => router.push(`?${next.toString()}`, { scroll: false }))
  }

  function cambiar(clave: string, valor: string | null) {
    cambiarVarias({ [clave]: valor })
  }

  return { params, pending, cambiar, cambiarVarias }
}

/**
 * El período: «Hoy», «7 días», «30 días», «90 días», «Todo» y «Fechas», que abre el selector
 * de días. Al entrar, 30 días. Un atajo borra las fechas elegidas y unas fechas borran el
 * atajo: en la URL nunca conviven, y si conviven (una escrita a mano) mandan las fechas.
 * `periodo` viene del servidor (`parseFilters`), que es quien sabe qué entendió de la URL.
 */
export function RangoBar({ periodo }: { periodo: Periodo }) {
  const { pending, cambiarVarias } = useFiltro()
  const [abierto, setAbierto] = useState(false)
  const cerrar = useCallback(() => setAbierto(false), [])
  const panel = useId()
  const conFechas = periodo.rango === 'fechas'

  function verFechas(fechas: Fechas) {
    setAbierto(false)
    cambiarVarias({ range: null, desde: fechas.desde, hasta: fechas.hasta })
  }

  // Sin envoltorio propio: la barra y el selector son hijos directos de la fila de controles
  // de cada pantalla. Así, en una fila con selectores de cuenta, el selector abierto va al
  // final y en su propia línea (`order-last basis-full`), sin correr los demás; y en una
  // pantalla donde la barra va sola, queda simplemente debajo.
  return (
    <>
      <div
        role="group"
        aria-label="Período"
        className={cn(
          'chapa flex w-fit flex-wrap items-center gap-0.5 rounded-xl p-1 transition-opacity',
          pending && 'opacity-60',
        )}
      >
        {RANGES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              setAbierto(false)
              cambiarVarias({ range: option.key, desde: null, hasta: null })
            }}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors',
              periodo.rango === option.key ? 'bg-brasa text-acero-950' : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={panel}
          onClick={() => setAbierto((a) => !a)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors',
            conFechas ? 'bg-brasa text-acero-950' : 'text-fg-muted hover:text-fg',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {conFechas ? etiquetaDeFechas(periodo, periodo.hoy) : 'Fechas'}
        </button>
      </div>
      {abierto ? <SelectorDeFechas id={panel} periodo={periodo} onVer={verFechas} onCerrar={cerrar} /> : null}
    </>
  )
}

/**
 * Los dos días a mano y los accesos rápidos. Abre con el período que está puesto, sea un
 * atajo o unas fechas, para que cambiar una punta sea cambiar solo esa. Los accesos rápidos
 * se ven al tiro; las fechas escritas, con «Ver estas fechas». Escape cierra sin cambiar nada.
 */
function SelectorDeFechas({
  id,
  periodo,
  onVer,
  onCerrar,
}: {
  id: string
  periodo: Periodo
  onVer: (fechas: Fechas) => void
  onCerrar: () => void
}) {
  const [fechas, setFechas] = useState<Fechas>({ desde: periodo.desde, hasta: periodo.hasta })
  const problema = problemaDeFechas(fechas, periodo.hoy)

  useEffect(() => {
    function alApretar(event: KeyboardEvent) {
      if (event.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', alApretar)
    return () => window.removeEventListener('keydown', alApretar)
  }, [onCerrar])

  return (
    <div className="order-last mt-2 w-full basis-full">
      <div id={id} role="group" aria-label="Elegir fechas" className="chapa w-full space-y-3 rounded-xl p-3 sm:w-fit">
        <div className="flex flex-wrap items-end gap-3">
          <label htmlFor={`${id}-desde`} className="space-y-1 text-[0.75rem] text-fg-muted">
            <span className="block">Desde</span>
            <Input
              id={`${id}-desde`}
              type="date"
              value={fechas.desde}
              min={PRIMER_DIA}
              max={periodo.hoy}
              onChange={(event) => setFechas((f) => ({ ...f, desde: event.target.value }))}
              className="w-[10.5rem]"
            />
          </label>
          <label htmlFor={`${id}-hasta`} className="space-y-1 text-[0.75rem] text-fg-muted">
            <span className="block">Hasta</span>
            <Input
              id={`${id}-hasta`}
              type="date"
              value={fechas.hasta}
              min={PRIMER_DIA}
              max={periodo.hoy}
              onChange={(event) => setFechas((f) => ({ ...f, hasta: event.target.value }))}
              className="w-[10.5rem]"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {atajosDeFechas(periodo.hoy).map((atajo) => (
            <button
              key={atajo.etiqueta}
              type="button"
              onClick={() => onVer(atajo.fechas)}
              className="rounded-lg border border-acero-700 px-2.5 py-1 text-xs text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg"
            >
              {atajo.etiqueta}
            </button>
          ))}
        </div>
        {problema ? (
          <p role="alert" className="text-[0.75rem] text-negative">
            {problema}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" disabled={problema !== null} onClick={() => onVer(fechas)}>
            Ver estas fechas
          </Button>
          <Button type="button" onClick={onCerrar}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Un selector atado a una clave de la URL: la cuenta en las redes, la página en tu Vitrina,
 * el atributo que se compara. `todas` es la opción sin filtro, que borra la clave; sin ella,
 * siempre hay una elegida, y `porDefecto` dice cuál cuando la URL no trae ninguna. Una opción
 * con `grupo` va bajo ese título, después de las que no tienen.
 */
export function SelectorEnUrl({
  clave,
  todas,
  porDefecto,
  opciones,
  etiqueta,
}: {
  clave: string
  todas?: string
  porDefecto?: string
  opciones: Array<{ valor: string; texto: string; grupo?: string }>
  /** El nombre accesible del selector. */
  etiqueta: string
}) {
  const { params, pending, cambiar } = useFiltro()
  const actual = params.get(clave) ?? ''
  const sinElegir = todas === undefined ? (porDefecto ?? opciones[0]?.valor ?? '') : ''
  const grupos = [...new Set(opciones.flatMap((o) => (o.grupo === undefined ? [] : [o.grupo])))]
  const opcion = (o: { valor: string; texto: string }) => (
    <option key={o.valor} value={o.valor}>
      {o.texto}
    </option>
  )
  return (
    <select
      aria-label={etiqueta}
      value={opciones.some((o) => o.valor === actual) ? actual : sinElegir}
      onChange={(event) => cambiar(clave, event.target.value === '' ? null : event.target.value)}
      className={cn('chapa max-w-full rounded-xl px-3 py-2 text-xs text-fg-muted outline-none transition-opacity', pending && 'opacity-60')}
    >
      {todas === undefined ? null : <option value="">{todas}</option>}
      {opciones.filter((o) => o.grupo === undefined).map(opcion)}
      {grupos.map((grupo) => (
        <optgroup key={grupo} label={grupo}>
          {opciones.filter((o) => o.grupo === grupo).map(opcion)}
        </optgroup>
      ))}
    </select>
  )
}

/**
 * Un interruptor atado a una clave de la URL: prendido pone `clave=1`, apagado la borra. Al
 * entrar está apagado.
 */
export function InterruptorEnUrl({ clave, texto, titulo }: { clave: string; texto: string; titulo: string }) {
  const { params, pending, cambiar } = useFiltro()
  const prendido = params.get(clave) === '1'
  return (
    <button
      type="button"
      aria-pressed={prendido}
      onClick={() => cambiar(clave, prendido ? null : '1')}
      title={titulo}
      className={cn(
        'chapa rounded-xl px-3 py-2 text-xs transition-colors',
        prendido ? 'border-brasa text-brasa' : 'text-fg-muted hover:text-fg',
        pending && 'opacity-60',
      )}
    >
      {texto}
    </button>
  )
}

/** Incluir o no a los bots en las visitas. Apagado, se excluyen. */
export function BotonBots() {
  const { params, pending, cambiar } = useFiltro()
  const bots = params.get('bots') === '1'
  return (
    <button
      type="button"
      onClick={() => cambiar('bots', bots ? null : '1')}
      title="Los bots se excluyen salvo que actives esto"
      className={cn(
        'chapa flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs transition-colors',
        bots ? 'border-brasa text-brasa' : 'text-fg-muted hover:text-fg',
        pending && 'opacity-60',
      )}
    >
      <Bot className="h-3.5 w-3.5" aria-hidden />
      Bots
    </button>
  )
}
