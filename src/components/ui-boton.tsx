import { BOTON_FORMA } from '@/components/boton'
import { cn } from '@/lib/utils'

// El botón del panel. Va solo, sin `'use client'`, porque lo usan los dos lados: las piezas de
// `ui.tsx`, que se dibujan en el servidor, y `Submit`, que vive en el navegador.

export function Button({
  variant = 'ghost',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  return (
    <button
      {...props}
      className={cn(
        BOTON_FORMA,
        'transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-brasa text-acero-950 hover:brightness-110',
        variant === 'ghost' && 'border border-acero-700 text-fg-muted hover:bg-acero-800 hover:text-fg',
        variant === 'danger' && 'border border-negative/40 text-negative hover:bg-negative/10',
        className,
      )}
    />
  )
}
