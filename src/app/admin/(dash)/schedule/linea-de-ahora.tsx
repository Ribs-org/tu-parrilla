'use client'

import { Children, useSyncExternalStore, type ReactNode } from 'react'
import { hourLabel } from '@/lib/schedule-week'
import { horasDeLaReja, minutoDelDia, rotuloDeHora } from './horas'
import { dondeVaAhora } from './semana'

const MINUTO = 60_000

// Un reloj al minuto que todos los que lo miran comparten: cada uno se suscribe, y un solo
// intervalo por suscriptor le avisa cuando cambia el minuto.
function suscribir(aviso: () => void): () => void {
  const intervalo = setInterval(aviso, 15_000)
  return () => clearInterval(intervalo)
}

const minutoDeAhora = () => Math.floor(Date.now() / MINUTO) * MINUTO

/**
 * La hora de ahora, al minuto, y que se mueve sola. Al dibujarse en el servidor y al hidratar
 * es `desde`, la hora con que el servidor armó la página: así el primer dibujo del navegador es
 * el mismo, y apenas hidrata se corre a la de verdad.
 */
export function useAhora(desde: number): number {
  return useSyncExternalStore(suscribir, minutoDeAhora, () => desde)
}

/**
 * Las filas de hoy, con la línea de «ahora» metida entre lo que ya tuvo su hora y lo que viene.
 * La línea se corre sola cuando pasa la hora de una fila, sin recargar: la fila no cambia de
 * estado hasta que la página se vuelva a pedir, pero la línea ya dice que su hora pasó.
 */
export function FilasConAhora({
  horas,
  desde,
  zona,
  children,
}: {
  /** La hora de cada fila, en milisegundos, en el orden de las filas. */
  horas: readonly number[]
  desde: number
  zona: string
  children: ReactNode
}) {
  const ahora = useAhora(desde)
  const filas = Children.toArray(children)
  const donde = dondeVaAhora(horas, ahora)
  return (
    <>
      {filas.slice(0, donde)}
      <LineaDeAhora hora={hourLabel(new Date(ahora), zona)} />
      {filas.slice(donde)}
    </>
  )
}

/** La raya de la hora actual, con la hora escrita: la brasa, porque es lo que está pasando. */
export function LineaDeAhora({ hora, className }: { hora: string; className?: string }) {
  return (
    <div role="separator" aria-label={`Ahora, ${hora}`} className={`relative my-1.5 h-0 border-t-2 border-brasa ${className ?? ''}`}>
      <span className="absolute -top-[0.55rem] left-0 rounded-[3px] bg-brasa px-1 font-mono text-[0.58rem] leading-4 text-acero-950">
        ahora · {hora}
      </span>
    </div>
  )
}

type Reja = { desde: number; hasta: number }

/** Dónde cae «ahora» en una reja de horas, en píxeles desde arriba: pegado al borde si cae afuera. */
function alturaDeAhora(ahora: number, zona: string, rango: Reja, px: number): number {
  return (Math.min(Math.max(minutoDelDia(new Date(ahora), zona), rango.desde), rango.hasta) - rango.desde) * px
}

/**
 * Lo que «ahora» le hace a la columna de hoy en una reja de horas (`reja-de-horas.tsx`): raya lo
 * que ya pasó, de arriba a la hora de ahora, y pone ahí la línea. Las dos se corren solas. La
 * raya va debajo de los bloques y la línea encima, como en Google Calendar.
 */
export function CapaDeAhora({ desde, zona, rango, px }: { desde: number; zona: string; rango: Reja; px: number }) {
  const y = alturaDeAhora(useAhora(desde), zona, rango, px)
  return (
    <>
      <div aria-hidden className="pasado-rayado pointer-events-none absolute inset-x-0 top-0 z-[1]" style={{ height: y }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 z-[3] border-t-2 border-brasa" style={{ top: y }} />
    </>
  )
}

/**
 * El canal de las horas de la reja: «07:00», «08:00»… a la altura de su raya y, si la reja tiene
 * el día de hoy (`conAhora`), la hora de ahora escrita a la altura de la línea. Es del cliente por
 * eso último: la hora entera que la de ahora taparía a medias se esconde, y cuál es cambia con el
 * reloj.
 */
export function CanalDeHoras({
  desde,
  zona,
  rango,
  px,
  conAhora,
}: {
  desde: number
  zona: string
  rango: Reja
  px: number
  conAhora: boolean
}) {
  const ahora = useAhora(desde)
  const y = conAhora ? alturaDeAhora(ahora, zona, rango, px) : null
  return (
    <>
      {horasDeLaReja(rango).map((minuto) => {
        // La última raya es el borde de abajo: no lleva rótulo.
        if (minuto >= rango.hasta) return null
        const top = (minuto - rango.desde) * px + 3
        // El rótulo mide unos 10 px y la hora de ahora 16, centrada en su línea: a menos de 15 px
        // se pisarían.
        if (y !== null && Math.abs(top + 5 - y) < 15) return null
        return (
          <span key={minuto} className="absolute left-1.5 font-mono text-[0.6rem] leading-none text-fg-faint" style={{ top }}>
            {rotuloDeHora(minuto)}
          </span>
        )
      })}
      {y !== null ? (
        <span
          className="absolute right-1 z-[4] -translate-y-1/2 rounded-[3px] bg-brasa px-1 font-mono text-[0.58rem] leading-4 text-acero-950"
          style={{ top: y }}
        >
          {hourLabel(new Date(ahora), zona)}
        </span>
      ) : null}
    </>
  )
}
