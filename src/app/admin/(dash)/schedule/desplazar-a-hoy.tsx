'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * La caja que se desliza de lado con la semana adentro, corrida hasta hoy al abrir.
 *
 * En el teléfono caben dos días y medio, y la semana abría en el lunes: un viernes, hoy quedaba
 * fuera de la pantalla, a la derecha, y había que saber deslizar para encontrarlo. Ahora la
 * caja se corre hasta la columna marcada con `data-hoy`, dejando asomar el día de antes para
 * que se note que hay semana hacia atrás. Si se acaba de programar algo (`data-recien`), se
 * corre hasta ese corte: es el que hay que ver caer. Si la semana cabe entera, o si ninguno de
 * los dos está en la semana a la vista, no se mueve nada.
 *
 * Solo al montar: después, el dueño desliza a donde quiera y la caja no se lo discute.
 */
export function DesplazarAHoy({ children, className }: { children: ReactNode; className?: string }) {
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = caja.current
    const objetivo = el?.querySelector<HTMLElement>('[data-recien]') ?? el?.querySelector<HTMLElement>('[data-hoy]')
    if (!el || !objetivo || el.scrollWidth <= el.clientWidth) return
    // Por la diferencia de las cajas y no por `offsetLeft`: la tarjeta recién puesta vive dentro
    // de la parrilla de su día, que es `relative`, y su `offsetLeft` contaría desde ahí.
    const desde = objetivo.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft
    el.scrollLeft = Math.max(0, desde - 32)
  }, [])
  return (
    <div ref={caja} className={className}>
      {children}
    </div>
  )
}
