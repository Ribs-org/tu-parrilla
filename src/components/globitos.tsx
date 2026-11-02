'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { posicionDelGlobito } from '@/lib/globito'

/** Lo que espera el mouse quieto antes de explicar: menos, y el globito saltaría al cruzar la pantalla. */
const ESPERA_MS = 450

type Abierto = { ancla: HTMLElement; texto: string }

/**
 * Los globitos de ayuda de todo el sitio, en vez del `title` del navegador: ese recuadro lo
 * dibuja el navegador, amarillo o gris según el sistema, con su letra, y no se ve con el teclado.
 * Quien quiera uno pone `data-globito="…"` en el elemento; este componente, montado una vez en
 * el layout raíz, escucha a toda la página y dibuja uno solo.
 *
 * Con el mouse, aparece tras una pausa sobre el elemento; con el teclado, al llegar con Tab
 * (`:focus-visible`). Un toque en un teléfono no lo abre, como tampoco abría el `title`.
 * Mientras se ve, el elemento lo nombra en `aria-describedby`: lo que antes leía el lector de
 * pantalla en el `title`, ahora lo lee aquí.
 *
 * Es un `popover`: así queda en la capa de arriba, también sobre una ventana modal. Copia la
 * clase `acerado` y el modo del panel donde está el elemento, para tener sus colores de noche o
 * de día; afuera del panel, los de la noche.
 */
export function Globitos() {
  const globo = useRef<HTMLDivElement>(null)
  const id = useId()
  const [abierto, setAbierto] = useState<Abierto | null>(null)
  const [tema, setTema] = useState<string | null>(null)

  useEffect(() => {
    let espera: ReturnType<typeof setTimeout> | undefined
    let actual: HTMLElement | null = null

    function ancla(objetivo: EventTarget | null): HTMLElement | null {
      return objetivo instanceof Element ? objetivo.closest<HTMLElement>('[data-globito]') : null
    }

    function mostrar(elemento: HTMLElement) {
      const texto = elemento.dataset.globito
      if (!texto) return
      actual = elemento
      setTema(elemento.closest('.acerado')?.getAttribute('data-tema') ?? null)
      setAbierto({ ancla: elemento, texto })
    }

    function ocultar() {
      clearTimeout(espera)
      actual = null
      setAbierto(null)
    }

    function alPasar(event: PointerEvent) {
      if (event.pointerType !== 'mouse') return
      const elemento = ancla(event.target)
      if (elemento === actual) return
      ocultar()
      if (elemento) espera = setTimeout(() => mostrar(elemento), ESPERA_MS)
    }

    function alEnfocar(event: FocusEvent) {
      const elemento = ancla(event.target)
      if (elemento && elemento.matches(':focus-visible')) mostrar(elemento)
    }

    function alTeclear(event: KeyboardEvent) {
      if (event.key === 'Escape') ocultar()
    }

    document.addEventListener('pointerover', alPasar)
    document.addEventListener('pointerdown', ocultar)
    document.addEventListener('focusin', alEnfocar)
    document.addEventListener('focusout', ocultar)
    document.addEventListener('keydown', alTeclear)
    window.addEventListener('scroll', ocultar, true)
    return () => {
      clearTimeout(espera)
      document.removeEventListener('pointerover', alPasar)
      document.removeEventListener('pointerdown', ocultar)
      document.removeEventListener('focusin', alEnfocar)
      document.removeEventListener('focusout', ocultar)
      document.removeEventListener('keydown', alTeclear)
      window.removeEventListener('scroll', ocultar, true)
    }
  }, [])

  // Se mide ya pintado, con su texto, y se pone en su lugar antes de que se vea.
  useLayoutEffect(() => {
    const el = globo.current
    if (!el || !abierto) return
    const previo = abierto.ancla.getAttribute('aria-describedby')
    abierto.ancla.setAttribute('aria-describedby', previo ? `${previo} ${id}` : id)
    if (!el.matches(':popover-open')) el.showPopover?.()
    const caja = abierto.ancla.getBoundingClientRect()
    const { left, top } = posicionDelGlobito(caja, el.getBoundingClientRect(), {
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
    })
    el.style.left = `${left}px`
    el.style.top = `${top}px`
    return () => {
      if (previo) abierto.ancla.setAttribute('aria-describedby', previo)
      else abierto.ancla.removeAttribute('aria-describedby')
      if (el.matches(':popover-open')) el.hidePopover?.()
    }
  }, [abierto, id])

  return (
    <div
      ref={globo}
      id={id}
      role="tooltip"
      popover="manual"
      data-tema={tema ?? undefined}
      className="acerado globito pointer-events-none fixed inset-auto m-0 max-w-[18rem] whitespace-pre-line rounded-lg border border-acero-700 bg-acero-800 px-2.5 py-1.5 text-[0.75rem] leading-snug text-fg shadow-lg"
    >
      {abierto?.texto}
    </div>
  )
}
