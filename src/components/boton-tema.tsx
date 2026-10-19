'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { COLOR_DE_BARRA, TEMA_COOKIE, TEMA_DURA_SEGUNDOS, otroTema, type Tema } from '@/lib/tema'

/** La copia del modo en este equipo: la lee la puerta, que se dibuja sin saber de quién es. */
function anotarEnElEquipo(tema: Tema) {
  document.cookie = `${TEMA_COOKIE}=${tema}; Max-Age=${TEMA_DURA_SEGUNDOS}; Path=/; SameSite=Lax`
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_DE_BARRA[tema])
}

/**
 * El botón del modo, en la barra del panel, junto a Ajustes. Muestra adónde lleva —el sol de
 * noche, la luna de día—, como un enlace a otro lugar y no como un interruptor del que hay que
 * adivinar el estado. Cambia en el momento, sin recargar:
 * - el `data-tema` del contenedor del panel, que es lo que cambia los colores y el dibujo;
 * - la cookie del equipo y el color de la barra del navegador del teléfono;
 * - la cuenta (`guardar`, la acción `guardarTema`), para que el teléfono y los otros equipos
 *   vayan con este. Sin `guardar`, el modo queda solo en el equipo.
 *
 * Con `guardar`, al cargar pone la cookie al día con la cuenta: si el modo se cambió en otro
 * lado, la puerta de este equipo lo sigue desde la próxima vez.
 */
export function BotonTema({ inicial, guardar }: { inicial: Tema; guardar?: (tema: Tema) => Promise<void> }) {
  const [tema, setTema] = useState(inicial)
  const destino = otroTema(tema)
  const nombre = destino === 'dia' ? 'Modo día' : 'Modo noche'
  const deLaCuenta = guardar !== undefined

  useEffect(() => {
    if (!deLaCuenta) return
    if (!document.cookie.split('; ').includes(`${TEMA_COOKIE}=${inicial}`)) anotarEnElEquipo(inicial)
  }, [deLaCuenta, inicial])

  function cambiar() {
    for (const contenedor of document.querySelectorAll('.acerado')) contenedor.setAttribute('data-tema', destino)
    anotarEnElEquipo(destino)
    setTema(destino)
    // Si no llega a la cuenta —sin conexión, por ejemplo—, el cambio dura hasta la próxima
    // carga, que vuelve al modo de la cuenta.
    guardar?.(destino).catch(() => {})
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
