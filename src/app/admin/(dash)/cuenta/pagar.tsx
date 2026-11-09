'use client'

import { useState, useTransition } from 'react'
import { cancelarSuscripcionAccion, pasarAlPagadoAccion } from '@/app/admin/planes-actions'
import { useConfirmar } from '@/components/confirmar'
import { Button, Field, Input } from '@/components/ui'

// El cobro del plan pagado en «Tu plan»: pasar al pagado, que lleva a Mercado Pago, y cancelar la
// suscripción. Solo para quien tiene el cobro abierto (`PAGOS_ABIERTO_PARA`).

/**
 * «Pasar a <plan>»: pide el correo de la cuenta de Mercado Pago —Mercado Pago lo compara con la
 * cuenta con que se paga— y manda a su página para autorizar. Tu Parrilla no ve la tarjeta.
 */
export function PasarAlPagado({ correo, nombre, diasDePrueba }: { correo: string; nombre: string; diasDePrueba: number }) {
  const [valor, setValor] = useState(correo)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function pasar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const r = await pasarAlPagadoAccion(valor)
      if ('error' in r) return setError(r.error)
      window.location.assign(r.enlace)
    })
  }

  return (
    <form onSubmit={pasar} noValidate className="mt-3 space-y-3">
      <Field
        label="Correo de tu cuenta de Mercado Pago"
        hint="Mercado Pago lo compara con la cuenta con que pagas: si no es el mismo, no deja autorizar."
      >
        <Input
          value={valor}
          type="email"
          onChange={(e) => setValor(e.target.value)}
          aria-invalid={Boolean(error) || undefined}
          className="min-w-[16rem]"
        />
      </Field>
      <p className="text-[0.72rem] text-fg-faint">
        {diasDePrueba > 0
          ? `Los primeros ${diasDePrueba} días son de prueba: Mercado Pago guarda la tarjeta y hace el primer cobro al terminar. `
          : ''}
        Después cobra cada mes. Se cancela cuando quieras, desde aquí.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? 'Abriendo Mercado Pago…' : `Pasar a ${nombre}`}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-negative">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  )
}

/** «Cancelar la suscripción», con la pregunta antes: `hasta` es el último día del pagado, en palabras. */
export function CancelarSuscripcion({ nombre, hasta }: { nombre: string; hasta: string | null }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const confirmar = useConfirmar()

  async function cancelar() {
    const seguir = await confirmar({
      titulo: '¿Cancelar la suscripción?',
      detalle: hasta
        ? `No se te vuelve a cobrar. Sigues con el plan ${nombre} hasta el ${hasta}; después pasas al gratis.`
        : 'No se te vuelve a cobrar; después pasas al gratis.',
      accion: 'Cancelar la suscripción',
      peligro: true,
    })
    if (!seguir) return
    start(async () => {
      const r = await cancelarSuscripcionAccion()
      setError(r.error ?? null)
    })
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button variant="ghost" disabled={pending} onClick={() => void cancelar()}>
        {pending ? 'Cancelando…' : 'Cancelar la suscripción'}
      </Button>
      {error ? (
        <span role="alert" className="text-sm text-negative">
          {error}
        </span>
      ) : null}
    </div>
  )
}
