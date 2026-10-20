'use client'

import { Children, useSyncExternalStore, type ReactNode } from 'react'
import { hourLabel } from '@/lib/schedule-week'
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
