'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { mirarCortePropio } from '@/app/admin/lo-que-trajo-actions'
import { PanelLateral } from './panel-lateral'

/**
 * El panel lateral de «Lo que trajo» de un corte (`detalle-del-corte.tsx`, que lo llena en el
 * servidor). Abrirlo es mirarlo: con la pestaña a la vista, deja la marca (`mirarCortePropio`) y el
 * circulito del corte vuelve a cero, en el panel y en el teléfono. No vuelve a dibujar nada: lo
 * nuevo sigue a la vista hasta cerrar, y al cerrar —que es navegar— la fila llega ya al día.
 * `postId` nulo, el corte que no está: no hay nada que marcar.
 */
export function PanelDelCorte({ cerrarHref, postId, children }: { cerrarHref: string; postId: string | null; children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (!postId) return
    function mirar() {
      if (document.hidden) return
      document.removeEventListener('visibilitychange', mirar)
      // Si no llega, el circulito sigue hasta la próxima vez: no es un error que mostrar.
      mirarCortePropio(postId).catch(() => {})
    }
    document.addEventListener('visibilitychange', mirar)
    mirar()
    return () => document.removeEventListener('visibilitychange', mirar)
  }, [postId])

  return (
    <PanelLateral titulo="Lo que trajo" onCerrar={() => router.replace(cerrarHref, { scroll: false })}>
      {children}
    </PanelLateral>
  )
}
