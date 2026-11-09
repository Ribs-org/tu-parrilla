'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/** Lo que tarda en subir de cero a la cifra, en milisegundos. */
export const DURACION_MS = 1800

const MIL = new Intl.NumberFormat('es-CL')

/** Cuánto marca el contador a los `ms` de empezar: rápido al principio y frenando al llegar. */
export function valorA(hasta: number, ms: number, duracion = DURACION_MS): number {
  if (ms >= duracion) return hasta
  const t = Math.max(0, ms) / duracion
  return Math.round(hasta * (1 - (1 - t) ** 3))
}

/**
 * Una cifra que sube desde cero cuando entra a la pantalla.
 *
 * El servidor la manda ya en su valor: es lo que ve quien no corre JavaScript, el buscador y la
 * prueba de la portada. Al hidratar vuelve a cero sin que se note, porque está más abajo de lo
 * que se ve al entrar, y sube cuando aparece. Con «reducir movimiento» en el sistema, no se
 * mueve. El lector de pantalla lee la cifra final, no la cuenta.
 */
export function ContadorQueSube({ hasta, className }: { hasta: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [valor, setValor] = useState(hasta)

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cuadro = 0
    const subir = () => {
      const inicio = performance.now()
      const paso = (ahora: number) => {
        const ms = ahora - inicio
        setValor(valorA(hasta, ms))
        if (ms < DURACION_MS) cuadro = requestAnimationFrame(paso)
      }
      cuadro = requestAnimationFrame(paso)
    }
    setValor(0)
    const mirador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return
        mirador.disconnect()
        subir()
      },
      { threshold: 0.6 },
    )
    mirador.observe(el)
    return () => {
      mirador.disconnect()
      cancelAnimationFrame(cuadro)
    }
  }, [hasta])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <span aria-hidden>{MIL.format(valor)}</span>
      <span className="sr-only">{MIL.format(hasta)}</span>
    </span>
  )
}
