'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '@/lib/utils'
import { PINTURA, SERIES } from './theme'

type Punto = { dia: number; a: number | null; b: number | null }

type Serie = { key: 'a' | 'b'; name: string; color: string }

function Tarjeta({
  active,
  payload,
  series,
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string; value?: number; payload?: Punto }>
  series: readonly Serie[]
}) {
  if (!active || !payload?.length) return null
  const punto = payload[0]?.payload
  return (
    <div className="rounded-xl border border-velo/10 bg-acero-900/95 px-3 py-2 shadow-xl backdrop-blur">
      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-fg-faint">
        {punto?.dia === 1 ? '1 día después de publicar' : `${punto?.dia} días después de publicar`}
      </p>
      <ul className="mt-1.5 space-y-1">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[0.8rem]">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="text-fg-muted">{s.key.toUpperCase()}</span>
            <span className="ml-auto font-mono tabular-nums text-fg">
              {punto?.[s.key] === null || punto?.[s.key] === undefined ? '—' : formatNumber(punto[s.key]!)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Las views de dos publicaciones por días cumplidos desde que salieron, en un mismo eje: así
 * se comparan a la misma edad aunque hayan salido en semanas distintas. Un día sin lectura no
 * corta la línea (`connectNulls`), porque lo de más de 10 días se lee cada vez más espaciado.
 * La raya marca la edad de «a los 7 días». A y B llevan los dos primeros colores de la paleta,
 * los mismos de sus fichas.
 */
export function CurvaChart({ puntos, nombres, marca }: { puntos: Punto[]; nombres: { a: string; b: string }; marca: number }) {
  const series: readonly Serie[] = [
    { key: 'a', name: nombres.a, color: SERIES[0] },
    { key: 'b', name: nombres.b, color: SERIES[1] },
  ]
  // El ancho del eje, como en `traffic-chart`: el de la cifra más larga, para que no se coma la primera.
  const maximo = Math.max(0, ...puntos.flatMap((p) => [p.a ?? 0, p.b ?? 0]))
  const ejeY = Math.max(28, formatNumber(Math.ceil(maximo)).length * 7 + 10)
  return (
    <div>
      <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.78rem]">
        {series.map((s) => (
          <li key={s.key} className="flex min-w-0 max-w-full items-center gap-1.5 text-fg-muted">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="shrink-0 font-mono text-fg">{s.key.toUpperCase()}</span>
            <span className="truncate">{s.name}</span>
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={puntos} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={PINTURA.grid} vertical={false} />
          <XAxis
            dataKey="dia"
            type="number"
            domain={[0, 'dataMax']}
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: PINTURA.axis }}
            tick={{ fill: PINTURA.muted, fontSize: 11 }}
            tickFormatter={(dia: number) => `día ${dia}`}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={ejeY}
            allowDecimals={false}
            tickFormatter={(valor: number) => formatNumber(valor)}
            tick={{ fill: PINTURA.muted, fontSize: 11 }}
          />
          <ReferenceLine
            x={marca}
            stroke={PINTURA.muted}
            strokeDasharray="3 3"
            label={{ value: `${marca} días`, fill: PINTURA.muted, fontSize: 11, position: 'insideTopRight' }}
          />
          <Tooltip cursor={{ stroke: PINTURA.axis, strokeWidth: 1 }} content={<Tarjeta series={series} />} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 2, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 2, stroke: PINTURA.surface }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
