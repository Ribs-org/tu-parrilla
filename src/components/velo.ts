'use client'

import { useRef, type MouseEvent, type PointerEvent } from 'react'

/**
 * Lo que necesita un `<dialog>` para cerrarse con un clic en su velo, y solo con eso.
 *
 * El navegador le da al `click` el destino de donde se soltó el botón: seleccionar el texto de un
 * campo arrastrando hacia afuera y soltar sobre el velo era, para él, un clic en el velo, y el
 * panel se cerraba a mitad de escribir. Así que el clic cierra solo si también empezó en el velo.
 */
export function useVeloQueCierra(cerrar: () => void) {
  const empezoEnElVelo = useRef(false)
  return {
    onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
      empezoEnElVelo.current = event.target === event.currentTarget
    },
    onClick: (event: MouseEvent<HTMLDialogElement>) => {
      const cierra = empezoEnElVelo.current && event.target === event.currentTarget
      empezoEnElVelo.current = false
      if (cierra) cerrar()
    },
  }
}
