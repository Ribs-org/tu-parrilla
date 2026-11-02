'use client'

import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { useVeloQueCierra } from './velo'

/**
 * La ventana del panel: un `<dialog>` que quien la usa abre con `showModal()` y cierra con
 * `close()`, por su `ref`. Es la que dibujan «Reprogramar», «Quitar», la ayuda de una conexión,
 * las preguntas (`confirmar.tsx`), el calendario (`selector-fecha.tsx`) y el color
 * (`selector-color.tsx`).
 *
 * Abierta con `showModal()` vive en la capa de arriba: el navegador la centra, no desborda a
 * 360 px, Esc la cierra, el foco no se escapa de adentro y el velo se traga los clics. Eso último
 * es el punto: con un `popover` el clic que descarta además activaba lo que hubiera debajo, y
 * debajo puede estar un «Eliminar». El velo atenuado promete modalidad; un diálogo modal la
 * cumple. Y sirve sobre otra ventana: el compositor pregunta desde adentro de su panel lateral, y
 * la última abierta queda encima.
 *
 * `alVelo` es qué pasa con un clic que empieza y termina en el velo (`useVeloQueCierra`). El
 * padding va en el hijo y no aquí para que no quede un anillo alrededor del contenido que sea del
 * diálogo: ahí un clic contaría como «clic en el velo» y cerraría.
 *
 * Las clases dicen el color, el borde, el fondo y el centrado porque la hoja del navegador
 * pintaría el diálogo con borde sólido y fondo blanco, y su `margin: auto` —el que lo centra— lo
 * pierde contra el `margin: 0` que Tailwind le pone a todo; de ahí el `m-auto`. El `display` en
 * cambio no se toca: el que la esconde cerrada sale de esa misma hoja, y una regla de autor lo
 * ganaría siempre.
 */
export function Ventana({
  alVelo,
  className,
  ...props
}: ComponentProps<'dialog'> & { alVelo: () => void }) {
  const velo = useVeloQueCierra(alVelo)
  return (
    <dialog
      {...props}
      {...velo}
      className={cn(
        'ventana m-auto max-h-[calc(100dvh-2rem)] w-[24rem] max-w-[calc(100vw-2rem)] rounded-xl border border-velo/10 bg-acero-900/95 text-fg shadow-xl backdrop-blur backdrop:bg-acero-950/80',
        className,
      )}
    />
  )
}
