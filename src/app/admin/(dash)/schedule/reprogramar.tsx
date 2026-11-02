'use client'

import { useId, useRef, useState, useTransition } from 'react'
import { rescheduleTarget } from '@/app/admin/actions'
import { Button, Input } from '@/components/ui'
import { Ventana } from '@/components/ventana'

/**
 * Le da hora nueva a un destino que se quemó: el botón, el campo, la llamada y su error,
 * todo en una pieza. Solo necesita saber de qué destino habla.
 *
 * `titulo` es opcional y solo se pinta: el panel nace centrado en la pantalla, lejos de la
 * fila que lo abrió, así que sin él no hay cómo saber de qué destino es la hora que se está
 * escribiendo cuando hay más de uno quemado.
 *
 * El formulario es una `Ventana` (`components/ventana.tsx`), centrada y no colgada del botón,
 * que en la píldora de la cola queda donde haya cortado la última línea del error.
 *
 * `className` viste el botón que abre la ventana: subrayado al final de la píldora de la lista,
 * y con pinta de botón junto al motivo en «Se quemó» y en el editor.
 */
export function Reprogramar({ targetId, titulo, className = 'ml-2 underline' }: { targetId: string; titulo?: string; className?: string }) {
  const panel = useRef<HTMLDialogElement>(null)
  const rotulo = useId()
  const [when, setWhen] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  /**
   * El formulario recién nacido. Se llama al abrir y al cerrar: al abrir porque lo que
   * llegó tarde —el error de un guardado que el usuario descartó— no puede quedar pintado
   * sobre un campo vacío, y al cerrar porque el diálogo no se desmonta y el evento de
   * apertura llega cuando el navegador ya pintó. Cuando ya está limpio no cuesta nada:
   * React corta el render por igualdad.
   */
  function limpiar() {
    setWhen('')
    setError(null)
  }

  function save() {
    start(async () => {
      setError(null)
      const result = await rescheduleTarget(targetId, when)
      if (result.error) setError(result.error)
      else panel.current?.close()
    })
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className={className}
        onClick={() => {
          limpiar()
          panel.current?.showModal()
        }}
      >
        Reprogramar
      </button>
      <Ventana
        ref={panel}
        // Modal sin nombre, el lector lo anuncia sin decir de qué destino es la hora.
        aria-labelledby={titulo ? rotulo : undefined}
        // `close` llega por cualquier salida, también por la Esc que maneja el navegador.
        onClose={limpiar}
        alVelo={() => panel.current?.close()}
        className="w-[20rem]"
      >
        <div className="p-3">
          {titulo ? <p id={rotulo} className="mb-2 text-xs text-fg-faint">{titulo}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="datetime-local"
              aria-label="Nueva fecha y hora"
              value={when}
              onChange={(event) => setWhen(event.target.value)}
              className="max-w-[16rem]"
            />
            <Button type="button" variant="primary" disabled={pending || when === ''} onClick={save}>
              Guardar
            </Button>
            <Button type="button" disabled={pending} onClick={() => panel.current?.close()}>
              Cancelar
            </Button>
            {error ? <p className="w-full text-sm text-negative">{error}</p> : null}
          </div>
        </div>
      </Ventana>
    </>
  )
}
