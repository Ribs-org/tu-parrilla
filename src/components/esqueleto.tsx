import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Las piezas de la carga del panel, para el `loading.tsx` de cada pantalla. La carga dibuja la
 * forma de la pantalla que viene —su título de verdad, sus columnas, sus filas— con un pulso
 * tibio (`.tibio`, en globals.css): la parrilla calentándose. Así se ve qué pantalla viene
 * antes de que llegue, y nada salta cuando llega. Hasta el 2026-10-16 había un solo esqueleto
 * gris con cuatro casillas de cifras, también en las pantallas que no tienen cifras.
 *
 * Sin texto, salvo el título: el esqueleto ocupa el lugar de lo que viene, y explicarlo sería
 * pedirle al ojo que lea algo que desaparece en un segundo. Para el lector de pantalla, lo que
 * carga va en `Cargando`, que dice «Cargando».
 *
 * Sin directiva a propósito: lo usan las cargas, que son de cliente, y los esqueletos de
 * `charts/`, que se dibujan en el servidor (ver la nota de `boton.ts` sobre el límite).
 */

/** El pulso de cada pieza, un poco después que el de la anterior: el calor corre. */
export function retraso(orden: number): CSSProperties {
  return { '--retraso': `${(orden % 10) * 0.16}s` } as CSSProperties
}

/** La zona que carga. El título va afuera: es el de verdad, y no está cargando. */
export function Cargando({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-label="Cargando" className={className}>
      {children}
    </div>
  )
}

/** Un bloque que se calienta: una parrilla, un panel, una tarjeta, un campo. */
export function Brasa({ orden = 0, className }: { orden?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('tibio brasa-tibia rounded-xl border border-acero-700', className)}
      style={retraso(orden)}
    />
  )
}

/** Un renglón que todavía no llegó: un nombre, una fecha, un enlace. */
export function Renglon({ orden = 0, className }: { orden?: number; className?: string }) {
  return <div aria-hidden className={cn('tibio h-3 rounded bg-white/[0.07]', className)} style={retraso(orden)} />
}

/**
 * El título de una pantalla que no se sabe de antemano —un post, un perfil—: los dos renglones
 * del `Encabezado`, con su alto, para que el de verdad no empuje nada al llegar.
 */
export function TituloEnCarga() {
  return (
    <div aria-hidden>
      <Renglon className="h-8 w-56 max-w-[70%]" />
      <Renglon orden={1} className="mt-1 h-[1.1rem] w-72 max-w-full" />
    </div>
  )
}
