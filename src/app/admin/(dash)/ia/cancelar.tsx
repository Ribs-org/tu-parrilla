'use client'

import { useState, useTransition } from 'react'
import { cancelarComandaPropia } from '@/app/admin/cocina-actions'
import { useConfirmar } from '@/components/confirmar'
import { Button } from '@/components/ui'

/** «Cancelar la comanda», con su pregunta antes: el chef deja de prepararla y lo crudo se borra a los 14 días. */
export function BotonCancelarComanda({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const confirmar = useConfirmar()

  async function cancelar() {
    const seguir = await confirmar({
      titulo: '¿Cancelar esta comanda?',
      detalle: 'El chef deja de prepararla, y lo que subiste se borra en 14 días.',
      accion: 'Cancelar la comanda',
      // «Cancelar», aquí, haría lo contrario de lo que dice.
      cancelar: 'Volver',
      peligro: true,
    })
    if (!seguir) return
    start(async () => {
      const r = await cancelarComandaPropia(id)
      setError(r.error ?? null)
    })
  }

  return (
    <>
      <Button variant="danger" disabled={pending} onClick={() => void cancelar()}>
        {pending ? 'Cancelando…' : 'Cancelar la comanda'}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-negative">
          {error}
        </span>
      ) : null}
    </>
  )
}
