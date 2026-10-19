'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '@/lib/utils'
import { PINTURA, SERIES } from './theme'

type Series = { key: string; name: string }

/** The dashboard's original pair, kept as the default so existing call sites are unchanged. */
const DEFAULT_SERIES: [Series, Series] = [
  { key: 'visits', name: 'Visitas' },
  { key: 'clicks', name: 'Clicks' },
]

type ChartPoint = { label: string; fullLabel: string } & Record<string, string | number>

type Props = {
  data: ChartPoint[]
  series?: [Series, Series]
  /**
   * Cada serie en su gráfico, uno debajo del otro, con la misma línea de tiempo. Para dos series
   * que no se comparan en la misma escala —views en miles contra visitas en decenas, alcance
   * contra visitas al perfil—: en un solo eje, la chica quedaba plana en cero y no se leía nada.
   */
  separadas?: boolean
}

/** Una serie con su color: el color es el de su lugar en el par, también en un gráfico aparte. */
type SerieDibujada = Series & { color: string }

function TooltipCard({
  active,
  payload,
  colores,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; dataKey?: string; payload?: ChartPoint }>
  colores: Record<string, string>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload

  return (
    <div className="rounded-xl border border-velo/10 bg-acero-900/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-fg-faint">
        {point?.fullLabel}
      </p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center gap-2 text-[0.8rem]">
            <span className="h-2 w-2 rounded-full" style={{ background: colores[entry.dataKey ?? ''] }} aria-hidden />
            <span className="text-fg-muted">{entry.name}</span>
            <span className="ml-auto font-mono tabular-nums text-fg">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Lo que mide el eje vertical: el ancho de la cifra más larga que va a dibujar, a 11 px. Antes
 * el eje tenía un ancho fijo con un margen negativo a la izquierda, y desde las cuatro cifras
 * se comía la primera: «2000» se leía «)00». Las cifras van abreviadas desde diez mil
 * (`formatNumber`), como en el resto del panel, así que nunca pasan de unas seis letras.
 */
function anchoDelEje(data: ChartPoint[], series: SerieDibujada[]): number {
  const maximo = Math.max(0, ...data.flatMap((p) => series.map((s) => Number(p[s.key]) || 0)))
  return Math.max(28, formatNumber(Math.ceil(maximo)).length * 7 + 10)
}

function Grafico({ data, series, alto, ejeY }: { data: ChartPoint[]; series: SerieDibujada[]; alto: number; ejeY: number }) {
  // Los degradados se nombran por gráfico: con varios en la página, un id repetido pintaba cada
  // relleno con el del primero que lo definió.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const colores = Object.fromEntries(series.map((s) => [s.key, s.color]))
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid stroke={PINTURA.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: PINTURA.axis }}
          tick={{ fill: PINTURA.muted, fontSize: 11 }}
          minTickGap={28}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={ejeY}
          allowDecimals={false}
          tickFormatter={(value: number) => formatNumber(value)}
          tick={{ fill: PINTURA.muted, fontSize: 11 }}
        />
        <Tooltip cursor={{ stroke: PINTURA.axis, strokeWidth: 1 }} content={<TooltipCard colores={colores} />} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#${id}-${s.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: PINTURA.surface }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

function Leyenda({ series }: { series: SerieDibujada[] }) {
  return (
    <ul className="mb-3 flex flex-wrap items-center gap-4 text-[0.78rem]">
      {series.map((entry) => (
        <li key={entry.key} className="flex items-center gap-1.5 text-fg-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} aria-hidden />
          {entry.name}
        </li>
      ))}
    </ul>
  )
}

export function TrafficChart({ data, series = DEFAULT_SERIES, separadas = false }: Props) {
  const empty = data.every((point) => !point[series[0].key] && !point[series[1].key])

  if (empty) {
    return (
      <div className="grid h-[260px] place-items-center text-sm text-fg-faint">
        Sin tráfico en este período.
      </div>
    )
  }

  const dibujadas: SerieDibujada[] = series.map((s, i) => ({ ...s, color: SERIES[i]! }))
  // Un solo ancho de eje para los dos, también separados: así las fechas de uno caen justo
  // debajo de las del otro, que es lo que hace comparables dos gráficos apilados.
  const ejeY = anchoDelEje(data, dibujadas)

  if (separadas) {
    return (
      <div className="grid gap-5">
        {dibujadas.map((s) => (
          <div key={s.key}>
            <Leyenda series={[s]} />
            <Grafico data={data} series={[s]} alto={150} ejeY={ejeY} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Leyenda series={dibujadas} />
      <Grafico data={data} series={dibujadas} alto={260} ejeY={ejeY} />
    </>
  )
}
