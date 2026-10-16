'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * La caja que se desliza de lado con la semana adentro, corrida hasta hoy al abrir.
 *
 * En el teléfono caben dos días y medio, y la semana abría en el lunes: un viernes, hoy quedaba
 * fuera de la pantalla, a la derecha, y había que saber deslizar para encontrarlo. Ahora la
 * caja se corre hasta la columna marcada con `data-hoy`, dejando asomar el día de antes para
 * que se note que hay semana hacia atrás. Si la semana cabe entera, o si hoy no está en la
 * semana a la vista, no se mueve nada.
 *
 * Solo al montar: después, el dueño desliza a donde quiera y la caja no se lo discute.
 */
export function DesplazarAHoy({ children, className }: { children: ReactNode; className?: string }) {
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = caja.current
    const hoy = el?.querySelector<HTMLElement>('[data-hoy]')
    if (!el || !hoy || el.scrollWidth <= el.clientWidth) return
    // `offsetLeft` cuenta desde la caja, que es `relative`: es su `offsetParent`.
    el.scrollLeft = Math.max(0, hoy.offsetLeft - 32)
  }, [])
  return (
    <div ref={caja} className={className}>
      {children}
    </div>
  )
}
