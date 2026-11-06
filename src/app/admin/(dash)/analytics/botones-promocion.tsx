'use client'

import { useState, useTransition } from 'react'
import { useConfirmar } from '@/components/confirmar'
import { Button } from '@/components/ui'
import type { Accion } from '@/lib/social/promocionar'
import { cambiarPromocionAccion } from './publicaciones/[id]/promocionar/acciones'

const TEXTO: Record<Accion, { boton: string; enCurso: string }> = {
  pausar: { boton: 'Pausar', enCurso: 'Pausando…' },
  reanudar: { boton: 'Reanudar', enCurso: 'Reanudando…' },
  detener: { boton: 'Detener', enCurso: 'Deteniendo…' },
}

/** Los botones de una promoción. Reanudar y detener preguntan: uno vuelve a gastar, el otro no tiene vuelta. */
export function BotonesPromocion({ id, acciones, gastoMaximo }: { id: string; acciones: Accion[]; gastoMaximo: string }) {
  const [pendiente, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cual, setCual] = useState<Accion | null>(null)
  const confirmar = useConfirmar()

  async function hacer(accion: Accion) {
    if (accion === 'reanudar') {
      const si = await confirmar({
        titulo: '¿Reanudar la promoción?',
        detalle: `Vuelve a circular y a gastar, hasta ${gastoMaximo} en total.`,
        accion: 'Reanudar',
      })
      if (!si) return
    }
    if (accion === 'detener') {
      const si = await confirmar({
        titulo: '¿Detener la promoción?',
        detalle: 'Deja de circular para siempre: no se puede reanudar. Lo que ya logró sigue en «Lo pagado».',
        accion: 'Detener',
        peligro: true,
      })
      if (!si) return
    }
    setCual(accion)
    start(async () => {
      const r = await cambiarPromocionAccion(id, accion)
      setError(r.error ?? null)
    })
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      {acciones.map((a) => (
        <Button key={a} variant={a === 'detener' ? 'danger' : 'ghost'} disabled={pendiente} onClick={() => void hacer(a)}>
          {pendiente && cual === a ? TEXTO[a].enCurso : TEXTO[a].boton}
        </Button>
      ))}
      {error ? (
        <span role="alert" className="text-xs text-negative">
          {error}
        </span>
      ) : null}
    </span>
  )
}
