'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useRef } from 'react'

// La tarjeta que se actualiza sola: mientras el dueño tenga comandas en marcha y la pestaña esté
// a la vista, pregunta cada pocos segundos si algo cambió (`/api/admin/cocina/pulso`, una consulta
// chica que devuelve una firma) y recién si cambió vuelve a pedir la página (`router.refresh`),
// que trae las tarjetas nuevas sin perder lo abierto ni el scroll. Con la pestaña oculta no
// pregunta, y al volver mira de inmediato. Sin nada en marcha no hace nada: lo que queda (lista,
// servida) lo mueve el dueño, y su propia acción ya recarga.

/** La primera espera, y la de después de cada cambio. */
const PRIMERA_ESPERA = 4_000
/** Sin cambios, cada pregunta espera un poco más que la anterior, hasta esto. */
const ESPERA_MAXIMA = 15_000

export function VigiaDeLaCocina({ vivas, firma }: { vivas: number; firma: string }) {
  const router = useRouter()
  const conocida = useRef(firma)

  // La página nueva trae su firma: es la que hay que comparar desde ahora.
  useEffect(() => {
    conocida.current = firma
  }, [firma])

  useEffect(() => {
    if (vivas === 0) return
    let reloj: ReturnType<typeof setTimeout> | undefined
    let espera = PRIMERA_ESPERA
    let sigue = true

    async function mirar() {
      try {
        const respuesta = await fetch('/api/admin/cocina/pulso', { cache: 'no-store' })
        // Sin sesión o con la cocina apagada: no hay nada más que mirar.
        if (respuesta.status === 401 || respuesta.status === 403) {
          sigue = false
          return
        }
        if (!respuesta.ok) throw new Error(String(respuesta.status))
        const pulso = (await respuesta.json()) as { firma?: unknown }
        if (typeof pulso.firma === 'string' && pulso.firma !== conocida.current) {
          conocida.current = pulso.firma
          espera = PRIMERA_ESPERA
          startTransition(() => router.refresh())
        } else {
          espera = Math.min(Math.round(espera * 1.3), ESPERA_MAXIMA)
        }
      } catch {
        // Sin red o con el servidor caído: se insiste, pero más despacio.
        espera = ESPERA_MAXIMA
      }
    }

    function programar() {
      clearTimeout(reloj)
      if (!sigue || document.hidden) return
      reloj = setTimeout(async () => {
        await mirar()
        programar()
      }, espera)
    }

    function alCambiarLaVista() {
      if (document.hidden) {
        clearTimeout(reloj)
        return
      }
      espera = PRIMERA_ESPERA
      void mirar().then(programar)
    }

    document.addEventListener('visibilitychange', alCambiarLaVista)
    programar()
    return () => {
      sigue = false
      clearTimeout(reloj)
      document.removeEventListener('visibilitychange', alCambiarLaVista)
    }
  }, [vivas, router])

  if (vivas === 0) return null
  return (
    <span className="flex items-center gap-1.5 text-xs text-fg-faint">
      <span aria-hidden className="en-vivo h-1.5 w-1.5 rounded-full bg-brasa" />
      Se actualiza sola
    </span>
  )
}
