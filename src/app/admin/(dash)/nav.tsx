'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { IconoAjustes } from '@/components/icono-ajustes'
import { IconoMaestro } from '@/components/icono-maestro'
import { IconoLibro, LibroDeSugerencias } from '@/components/libro-de-sugerencias'
import { useTema } from '@/components/tema-vivo'
import { fraseDelAviso, type avisoDeFierros } from '@/lib/parrilla'
import { LIBRO, LIBRO_SUBTITULO, ajustes, nombreDe, nombreEn, pantallaDe, pestanas } from '@/lib/vocabulario'
import { cn } from '@/lib/utils'

/** Dónde vive el aviso de los fierros dentro del menú: la entrada de Los Fierros. */
const RUTA_FIERROS = '/admin/accounts'

/** La única pestaña con dibujo: La Cocina lleva a su maestro, parrillero de noche y de sushi de día. */
const RUTA_COCINA = '/admin/ia'

/**
 * Cuatro pestañas —la última, La Cocina, con su maestro dibujado— y el botón de Ajustes —un trinche
 * y un cuchillo, lado a lado; de día, dos palillos—. Lo que no pide
 * una acción todos los días —las cuentas, las páginas públicas, quién entra— va dentro de
 * Ajustes: sigue a un clic, pero ya no ocupa la barra. Los nombres y las rutas salen del
 * vocabulario, con el de día donde lo hay (La Barra, Los Cuchillos); acá no se escribe ninguno.
 *
 * El botón de Ajustes lleva un punto cuando algo adentro necesita al dueño: ámbar si un fierro se
 * enfría, rojo si se apagó (`avisoDeFierros`). Adentro, la entrada de Los Fierros lo dice en
 * palabras. Sin nada que avisar, no hay punto. Lleva también un punto, de brasa, si el equipo
 * respondió algo del libro de sugerencias que la persona no abrió; si hay los dos, manda el de
 * los fierros.
 *
 * Al final del menú, separado, el libro de sugerencias (de día, la caja): no es una pantalla
 * sino una ventana para escribirle al equipo que hace Tu Parrilla y leer lo que le respondió
 * (`libro-de-sugerencias.tsx`). Con respuestas sin leer, la entrada dice cuántas.
 *
 * En un teléfono las cuatro pestañas no caben: la fila se desliza de lado, con el borde derecho
 * desvanecido para que se note que sigue, y al llegar a una pestaña la fila se corre hasta
 * dejarla entera a la vista. Antes, en Los Números, la pestaña activa quedaba debajo del botón
 * de Ajustes y se leía «L».
 */
export function AdminNav({
  esAdmin,
  aviso = null,
  respuestas = 0,
}: {
  esAdmin?: boolean
  aviso?: ReturnType<typeof avisoDeFierros>
  /** Cuántas respuestas del equipo, en el libro de sugerencias, no abrió todavía. */
  respuestas?: number
}) {
  const pathname = usePathname()
  const actual = pantallaDe(pathname)
  const enAjustes = actual?.grupo === 'ajustes'
  // La frase del aviso va a la vista en los dos modos; la del lector de pantalla, en el que se ve.
  const tema = useTema()
  // El punto de los fierros manda sobre el de las respuestas: es el que pide algo con apuro.
  const colorAviso = aviso ? (aviso.nivel === 'apagado' ? 'bg-negative' : 'bg-caution') : 'bg-brasa'
  const conPunto = Boolean(aviso) || respuestas > 0
  const fraseRespuestas = respuestas === 1 ? '1 respuesta nueva' : `${respuestas} respuestas nuevas`
  const etiquetaAjustes = [
    aviso ? `en ${nombreDe(RUTA_FIERROS, tema)}, ${fraseDelAviso(aviso, tema)}` : null,
    respuestas > 0 ? `en ${LIBRO[tema].toLowerCase()}, ${fraseRespuestas}` : null,
  ].filter(Boolean)
  const [libroAbierto, setLibroAbierto] = useState(false)

  // La pestaña activa, entera a la vista: si queda cortada a la derecha, la fila se corre.
  const tira = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fila = tira.current
    const activa = fila?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!fila || !activa) return
    const sobra = activa.offsetLeft + activa.offsetWidth - (fila.scrollLeft + fila.clientWidth)
    if (sobra > 0) fila.scrollLeft += sobra + 16
  }, [pathname])

  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="Secciones del panel">
      <div
        ref={tira}
        className="flex items-center gap-1 overflow-x-auto pr-4 [mask-image:linear-gradient(to_right,black_calc(100%-1.25rem),transparent)] sm:pr-0 sm:[mask-image:none]"
      >
        {pestanas(Boolean(esAdmin)).map((p) => {
          const active = actual?.ruta === p.ruta
          return (
            <Link
              key={p.ruta}
              href={p.ruta}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                active ? 'bg-brasa text-acero-950' : 'text-fg-muted hover:text-fg',
              )}
            >
              {p.ruta === RUTA_COCINA ? <IconoMaestro className="h-4 w-4" /> : null}
              <DeNocheYDeDia noche={p.nombre} dia={nombreEn(p, 'dia')} />
            </Link>
          )
        })}
      </div>

      {/*
        Un `<details>`: sin estado, con teclado (Enter abre; Escape cierra, ver abajo). Se cierra
        al navegar porque se remonta con la ruta (`key={pathname}`), no porque la página cambie:
        `AdminNav` vive en el layout, y el layout no se remonta solo al navegar entre rutas
        hijas — el `open` es estado del DOM que React no toca por su cuenta. Una ruta de
        Ajustes activa marca el botón de Ajustes, no una pestaña — el usuario tiene que poder ver
        dónde está aunque el menú esté cerrado.
      */}
      <details
        key={pathname}
        className="relative ml-auto"
        // Escape no cierra un <details> por sí solo (comprobado en Chromium): es la única
        // tecla que el elemento no trae, y un menú que no se cierra con Escape es un menú
        // roto para el teclado. Sigue sin estado: se quita el atributo y ya. El foco vuelve
        // al `summary`: si estaba en un enlace del menú, ese enlace desaparece al cerrar y
        // el foco caería al `body` si no lo devolviéramos.
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          e.currentTarget.removeAttribute('open')
          e.currentTarget.querySelector('summary')?.focus()
        }}
      >
        <summary
          className={cn(
            'relative flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors [&::-webkit-details-marker]:hidden',
            enAjustes ? 'bg-brasa text-acero-950' : 'text-fg-muted hover:text-fg',
          )}
          aria-label={etiquetaAjustes.length ? `Ajustes: ${etiquetaAjustes.join('; ')}` : 'Ajustes'}
        >
          <IconoAjustes className="h-4 w-4" />
          <span className="hidden sm:inline">Ajustes</span>
          {conPunto ? (
            <span
              aria-hidden
              className={cn('absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-acero-950', colorAviso)}
            />
          ) : null}
        </summary>
        <ul className="chapa absolute right-0 z-40 mt-2 w-64 rounded-xl p-2">
          {ajustes(Boolean(esAdmin)).map((p) => {
            const active = actual?.ruta === p.ruta
            return (
              <li key={p.ruta}>
                <Link
                  href={p.ruta}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block rounded-lg px-3 py-2 transition-colors',
                    active ? 'bg-brasa text-acero-950' : 'hover:bg-velo/[0.06]',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="block text-sm">
                      <DeNocheYDeDia noche={p.nombre} dia={nombreEn(p, 'dia')} />
                    </span>
                    {aviso && p.ruta === RUTA_FIERROS ? (
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-1.5 py-px font-mono text-[0.62rem]',
                          active
                            ? 'border-acero-950/40 text-acero-950'
                            : aviso?.nivel === 'apagado'
                              ? 'border-negative/60 text-negative'
                              : 'border-caution/60 text-caution',
                        )}
                      >
                        <DeNocheYDeDia noche={fraseDelAviso(aviso)} dia={fraseDelAviso(aviso, 'dia')} />
                      </span>
                    ) : null}
                  </span>
                  <span className={cn('block text-[0.72rem]', active ? 'text-acero-950/80' : 'text-fg-faint')}>
                    {p.subtitulo}
                  </span>
                </Link>
              </li>
            )
          })}
          {/* El libro de sugerencias: discreto, al final y separado, porque no es una pantalla
              sino una ventana. Cierra el menú y abre la ventana, que vive fuera del menú para
              no desmontarse con él. */}
          <li className="mt-1 border-t border-acero-700 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.closest('details')?.removeAttribute('open')
                setLibroAbierto(true)
              }}
              className="block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-velo/[0.06]"
            >
              <span className="flex items-center gap-2 text-sm text-fg-muted">
                <IconoLibro className="h-3.5 w-3.5" />
                <DeNocheYDeDia noche={LIBRO.noche} dia={LIBRO.dia} />
                {respuestas > 0 ? (
                  <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-brasa/60 px-1.5 py-px font-mono text-[0.62rem] text-brasa">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brasa" />
                    {fraseRespuestas}
                  </span>
                ) : null}
              </span>
              <span className="block text-[0.72rem] text-fg-faint">{LIBRO_SUBTITULO}</span>
            </button>
          </li>
        </ul>
      </details>
      <LibroDeSugerencias abierto={libroAbierto} alCerrar={() => setLibroAbierto(false)} sinLeer={respuestas} />
    </nav>
  )
}
