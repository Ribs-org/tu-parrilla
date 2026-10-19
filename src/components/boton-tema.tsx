'use client'

import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { COLOR_DE_BARRA, TEMA_COOKIE, TEMA_DURA_SEGUNDOS, otroTema, type Tema } from '@/lib/tema'

/**
 * El botón del modo, en la barra del panel, junto a Ajustes. Muestra adónde lleva —el sol de
 * noche, la luna de día—, como un enlace a otro lugar y no como un interruptor del que hay que
 * adivinar el estado. Cambia en el momento, sin recargar:
 * - la cookie, que el servidor lee para pintar el primer cuadro de la próxima vez;
 * - el `data-tema` del contenedor del panel, que es lo que cambia los colores y el dibujo;
 * - el color de la barra del navegador del teléfono.
 */
export function BotonTema({ inicial }: { inicial: Tema }) {
  const [tema, setTema] = useState(inicial)
  const destino = otroTema(tema)
  const nombre = destino === 'dia' ? 'Modo día' : 'Modo noche'

  function cambiar() {
    document.cookie = `${TEMA_COOKIE}=${destino}; Max-Age=${TEMA_DURA_SEGUNDOS}; Path=/; SameSite=Lax`
    for (const contenedor of document.querySelectorAll('.acerado')) contenedor.setAttribute('data-tema', destino)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_DE_BARRA[destino])
    setTema(destino)
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      aria-label={nombre}
      title={nombre}
      className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
    >
      {destino === 'dia' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
      {/* En pantallas angostas, solo el ícono: la barra ya lleva las pestañas y Ajustes. */}
      <span className="hidden lg:inline">{nombre}</span>
    </button>
  )
}
