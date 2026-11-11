import { cn } from '@/lib/utils'

/**
 * La llama de «Lo que trajo» en el panel: la de la racha, la de cada hito y las que cruzan la
 * celebración. De noche es fuego, naranja con el centro amarillo; de día, la llama azul del
 * soplete, como en la pieza de sushi y en la app del teléfono (`mobile/src/components/llama.tsx`).
 * Los colores salen de `.llamita` en `globals.css`, así que cambia con el modo sin dibujarla dos
 * veces. Es un dibujo y nada más: quien la usa dice en palabras lo que significa.
 *
 * El alto lo pone quien la usa; el ancho sale del lienzo, de 20 × 28.
 */
export function Llamita({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 28" className={cn('llamita inline-block h-4 w-auto shrink-0', className)} style={style} aria-hidden focusable="false">
      <path d="M10 1C13 7 18 11 18 18C18 23.5 14.4 27 10 27C5.6 27 2 23.5 2 18C2 11 7 7 10 1Z" fill="var(--llama-fuera)" />
      <path d="M10 11C12 14.5 14 16.5 14 20C14 23 12.2 25 10 25C7.8 25 6 23 6 20C6 16.5 8 14.5 10 11Z" fill="var(--llama-dentro)" />
    </svg>
  )
}
