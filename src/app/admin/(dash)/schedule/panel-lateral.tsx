'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useVeloQueCierra } from '@/components/velo'

/**
 * El panel que se desliza desde la derecha sobre La Parrilla: ahí se compone, se eligen
 * borradores y se sube un CSV, sin perder de vista el calendario que queda atenuado detrás.
 *
 * Es un `<dialog>` abierto con `showModal()`, por las mismas razones que el de
 * «Reprogramar» (`reprogramar.tsx`): el navegador atrapa el foco adentro, Escape lo cierra y
 * el velo se traga los clics. Lo que cambia es quién cierra: el panel existe porque la URL
 * lo pide (`?componer=1`, `?borrador=…`, `?panel=…`), así que cerrarlo es navegar, y eso lo
 * decide `onCerrar`. Por eso Escape no cierra solo: el `cancel` se cancela y se avisa, y el
 * compositor alcanza a guardar el borrador antes de que la navegación lo desmonte.
 *
 * En un teléfono ocupa la pantalla entera; en un computador, una columna a la derecha.
 */
export function PanelLateral({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string
  onCerrar: () => void
  children: React.ReactNode
}) {
  const panel = useRef<HTMLDialogElement>(null)
  const velo = useVeloQueCierra(onCerrar)

  useEffect(() => {
    const dialogo = panel.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  return (
    <dialog
      ref={panel}
      aria-label={titulo}
      onCancel={(event) => {
        event.preventDefault()
        onCerrar()
      }}
      // Un clic que empieza y termina en el velo cierra; seleccionar un texto arrastrando y
      // soltar afuera, no (`useVeloQueCierra`).
      {...velo}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-xl border-l border-acero-700 bg-acero-900 p-0 text-fg shadow-2xl backdrop:bg-acero-950/70"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-acero-700 px-5 py-4">
          <h2 className="font-titulo text-[0.95rem] font-semibold uppercase tracking-[0.08em]">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="ml-auto rounded-lg p-1.5 text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden />
            <span className="sr-only">Cerrar</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  )
}
