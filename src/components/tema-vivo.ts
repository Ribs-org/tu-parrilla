'use client'

import { useSyncExternalStore } from 'react'
import { temaDe, type Tema } from '@/lib/tema'

// El modo que se ve ahora, para lo que el CSS no puede cambiar: un `aria-label`, un `title`, la
// pregunta de un `confirm`. Se lee del `data-tema` del contenedor del panel (`.acerado`) y se
// sigue cuando el botón del modo lo cambia (`boton-tema.tsx`), sin recargar.
//
// En el servidor y al hidratar es la noche: el HTML de un componente del cliente se arma sin saber
// en qué modo se va a ver. Por eso no sirve para texto a la vista —de día se vería la noche hasta
// hidratar—; ahí van las dos versiones con `DeNocheYDeDia` (`de-noche-y-de-dia.tsx`).

function suscribir(avisar: () => void): () => void {
  const observador = new MutationObserver(avisar)
  for (const contenedor of document.querySelectorAll('.acerado')) {
    observador.observe(contenedor, { attributes: true, attributeFilter: ['data-tema'] })
  }
  return () => observador.disconnect()
}

function leer(): Tema {
  return temaDe(document.querySelector('.acerado')?.getAttribute('data-tema'))
}

function enElServidor(): Tema {
  return 'noche'
}

export function useTema(): Tema {
  return useSyncExternalStore(suscribir, leer, enElServidor)
}
