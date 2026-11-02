'use client'

import { useState, useTransition } from 'react'
import { cancelarComandaPropia } from '@/app/admin/cocina-actions'
import { useConfirmar } from '@/components/confirmar'
import { useTema } from '@/components/tema-vivo'
import { Button } from '@/components/ui'

/** «Cancelar la comanda», con su pregunta antes: el chef deja de prepararla, y lo que llevaba sigue en la cámara de frío. */
export function BotonCancelarComanda({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const confirmar = useConfirmar()
  const tema = useTema()

  async function cancelar() {
    const seguir = await confirmar({
      titulo: '¿Cancelar esta comanda?',
      detalle: tema === 'dia' ? 'El chef deja de prepararla. Lo que llevaba sigue en tu nevera.' : 'El chef deja de prepararla. Lo que llevaba sigue en tu cámara de frío.',
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
