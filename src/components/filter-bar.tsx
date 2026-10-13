'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Bot } from 'lucide-react'
import { RANGES } from '@/lib/filters'
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

  function cambiar(clave: string, valor: string | null) {
    const next = new URLSearchParams(params.toString())
    if (valor === null) next.delete(clave)
    else next.set(clave, valor)
    startTransition(() => router.push(`?${next.toString()}`, { scroll: false }))
  }

  return { params, pending, cambiar }
}

/** El período: «Hoy», «7 días», «30 días», «90 días», «Todo». Al entrar, 30 días. */
export function RangoBar() {
  const { params, pending, cambiar } = useFiltro()
  const range = params.get('range') ?? '30d'
  return (
    <div
      role="group"
      aria-label="Período"
      className={cn('chapa flex w-fit items-center gap-0.5 rounded-xl p-1 transition-opacity', pending && 'opacity-60')}
    >
      {RANGES.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => cambiar('range', option.key)}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors',
            range === option.key ? 'bg-brasa text-acero-950' : 'text-fg-muted hover:text-fg',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Un selector atado a una clave de la URL: la cuenta en las redes, la página en tu Vitrina,
 * el atributo que se compara. `todas` es la opción sin filtro, que borra la clave; sin ella,
 * siempre hay una elegida, y `porDefecto` dice cuál cuando la URL no trae ninguna.
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
  opciones: Array<{ valor: string; texto: string }>
  /** El nombre accesible del selector. */
  etiqueta: string
}) {
  const { params, pending, cambiar } = useFiltro()
  const actual = params.get(clave) ?? ''
  const sinElegir = todas === undefined ? (porDefecto ?? opciones[0]?.valor ?? '') : ''
  return (
    <select
      aria-label={etiqueta}
      value={opciones.some((o) => o.valor === actual) ? actual : sinElegir}
      onChange={(event) => cambiar(clave, event.target.value === '' ? null : event.target.value)}
      className={cn('chapa rounded-xl px-3 py-2 text-xs text-fg-muted outline-none transition-opacity', pending && 'opacity-60')}
    >
      {todas === undefined ? null : <option value="">{todas}</option>}
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.texto}
        </option>
      ))}
    </select>
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
