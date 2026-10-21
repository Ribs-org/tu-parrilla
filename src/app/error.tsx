'use client'

import { useEffect } from 'react'

/**
 * Lo que ve quien visita una página pública —la página de un creador, la portada, lo legal—
 * si algo se rompe al dibujarla. Sin esto, Next mostraba su pantalla en inglés. El panel tiene
 * la suya (`admin/(dash)/error.tsx`), con la salida a La Parrilla, y lo que se rompe en el
 * layout raíz cae en `global-error.tsx`.
 *
 * `retry` vuelve a pedir los datos además de dibujar de nuevo, que es justo lo que falló.
 */
export default function ErrorPublico({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">Algo se rompió</h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">No fue nada que hicieras. Vuelve a intentarlo en un momento.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-5 rounded-xl bg-brasa px-4 py-2 text-sm font-semibold text-acero-950"
      >
        Reintentar
      </button>
    </main>
  )
}
