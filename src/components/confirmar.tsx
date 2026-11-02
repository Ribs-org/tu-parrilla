'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './ui-boton'
import { Ventana } from './ventana'

/**
 * Lo que se pregunta antes de una acción. `accion` es el verbo del botón que sigue —«Eliminar»,
 * no «Aceptar»: quien lee solo el botón tiene que saber qué va a pasar—, y `peligro` lo pinta de
 * rojo cuando lo que hace no tiene vuelta. `cancelar` existe para cuando la acción misma se llama
 * «Cancelar» y el «Cancelar» de siempre diría lo contrario.
 */
export type Pregunta = {
  titulo: string
  detalle?: string
  accion: string
  cancelar?: string
  peligro?: boolean
}

type Confirmar = (pregunta: Pregunta) => Promise<boolean>

const Contexto = createContext<Confirmar | null>(null)

/**
 * `const confirmar = useConfirmar()` y `if (!(await confirmar({ … }))) return`, en vez del
 * `confirm()` del navegador, que dibuja el navegador con su letra, su idioma y su «Aceptar», y
 * no respeta el modo.
 *
 * Fuera del panel no hay ventana que abrir, y preguntar ahí es un error de programación: una
 * acción que se ejecutara sin preguntar sería peor que una excepción.
 */
export function useConfirmar(): Confirmar {
  const confirmar = useContext(Contexto)
  return confirmar ?? sinVentana
}

function sinVentana(): Promise<boolean> {
  throw new Error('useConfirmar necesita <Confirmaciones> arriba: está en el layout del panel.')
}

/**
 * La ventana de las preguntas, una para todo el panel. Vive en el layout, dentro de `.acerado`,
 * para que los colores del modo le lleguen; y afuera de cualquier otra ventana, que es lo que deja
 * preguntar desde el compositor sin que su panel la tape.
 *
 * El foco arranca en el botón que no hace daño: con `peligro`, en «Cancelar», para que un Enter
 * de más no borre nada; sin él, en la acción, que es lo que se vino a hacer. Esc, el velo y
 * «Cancelar» responden que no, y si algo pidiera otra pregunta con una abierta, la primera
 * también: una promesa sin responder dejaría colgada para siempre a quien la espera.
 */
export function Confirmaciones({ children }: { children: React.ReactNode }) {
  const ventana = useRef<HTMLDialogElement>(null)
  const primero = useRef<HTMLButtonElement>(null)
  const responder = useRef<((si: boolean) => void) | null>(null)
  const cierreNuestro = useRef(false)
  const [pregunta, setPregunta] = useState<Pregunta | null>(null)
  const idTitulo = useId()
  const idDetalle = useId()

  const confirmar = useCallback<Confirmar>(
    (nueva) =>
      new Promise((resolve) => {
        responder.current?.(false)
        responder.current = resolve
        setPregunta(nueva)
      }),
    [],
  )

  // Después de pintar el texto: `showModal` calcula el foco con lo que ya está en la página.
  useEffect(() => {
    if (!pregunta) return
    if (!ventana.current?.open) ventana.current?.showModal()
    primero.current?.focus()
  }, [pregunta])

  function terminar(si: boolean) {
    responder.current?.(si)
    responder.current = null
    setPregunta(null)
    if (ventana.current?.open) {
      cierreNuestro.current = true
      ventana.current.close()
    }
  }

  // `close` llega por cualquier salida, también por la Esc que maneja el navegador, y siempre
  // un momento después: el de un cierre nuestro no puede responderle a la pregunta siguiente.
  function alCerrar() {
    if (cierreNuestro.current) cierreNuestro.current = false
    else terminar(false)
  }

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      <Ventana
        ref={ventana}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={pregunta?.detalle ? idDetalle : undefined}
        alVelo={() => terminar(false)}
        onClose={alCerrar}
        className={cn('border-t-2', pregunta?.peligro ? 'border-t-negative' : 'ventana-candente border-t-brasa')}
      >
        {pregunta ? (
          <div className="space-y-3 p-4">
            <p id={idTitulo} className="font-titulo text-sm font-semibold uppercase tracking-[0.03em]">
              {pregunta.titulo}
            </p>
            {pregunta.detalle ? (
              <p id={idDetalle} className="text-sm text-fg-muted">
                {pregunta.detalle}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                ref={pregunta.peligro ? undefined : primero}
                type="button"
                variant={pregunta.peligro ? 'peligro' : 'primary'}
                onClick={() => terminar(true)}
              >
                {pregunta.accion}
              </Button>
              <Button ref={pregunta.peligro ? primero : undefined} type="button" onClick={() => terminar(false)}>
                {pregunta.cancelar ?? 'Cancelar'}
              </Button>
            </div>
          </div>
        ) : null}
      </Ventana>
    </Contexto.Provider>
  )
}
