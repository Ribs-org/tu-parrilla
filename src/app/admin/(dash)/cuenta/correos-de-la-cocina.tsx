'use client'

import { useState, useTransition } from 'react'
import { guardarCorreosDeLaCocina } from '@/app/admin/cocina-actions'
import { Toggle } from '@/components/ui'

// Los correos de La Cocina, en Tu Cuenta: el interruptor guarda al tocarlo, sin botón, y vuelve a
// donde estaba si no se pudo. Apaga los correos de cada entrega y cada final de las comandas
// (`avisarDeLaComanda`); la pregunta del chef, que tiene plazo, y el aviso al teléfono siguen.

const NO_SE_GUARDO = 'No se pudo guardar. Inténtalo de nuevo.'

export function CorreosDeLaCocina({ encendidos }: { encendidos: boolean }) {
  const [valor, setValor] = useState(encendidos)
  const [estado, setEstado] = useState<'guardado' | 'error' | null>(null)
  const [guardando, empezar] = useTransition()

  function cambiar(nuevo: boolean) {
    const antes = valor
    setValor(nuevo)
    setEstado(null)
    empezar(async () => {
      try {
        await guardarCorreosDeLaCocina(nuevo)
        setEstado('guardado')
      } catch {
        setValor(antes)
        setEstado('error')
      }
    })
  }

  return (
    <div className="max-w-xl space-y-3">
      <Toggle
        label="Avisarme por correo cuando el chef entrega"
        hint="Cuando sale la primera tanda, cuando la comanda queda lista y si el chef no la puede cocinar o terminar."
        checked={valor}
        onChange={cambiar}
      />
      <p className="text-sm text-fg-muted">
        Apagado, igual te llega el correo cuando el chef te pregunta algo, porque la comanda espera tu respuesta, y el
        aviso al teléfono si tienes la app. La Cocina dice cómo va cada comanda igual.
      </p>
      <p className="min-h-5 text-sm" aria-live="polite">
        {guardando ? <span className="text-fg-muted">Guardando…</span> : null}
        {!guardando && estado === 'guardado' ? <span className="text-positive">Guardado.</span> : null}
        {!guardando && estado === 'error' ? (
          <span role="alert" className="text-negative">
            {NO_SE_GUARDO}
          </span>
        ) : null}
      </p>
    </div>
  )
}
