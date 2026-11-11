'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { celebrarHitoPropio } from '@/app/admin/lo-que-trajo-actions'
import { BOTON_CHICO, BOTON_CHICO_SECUNDARIO } from '@/components/boton'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Llamita } from '@/components/llamita'
import { useVeloQueCierra } from '@/components/velo'
import type { Tema } from '@/lib/tema'

// La celebración de un hito en La Parrilla del panel, la misma de la app del teléfono
// (`mobile/src/components/celebracion.tsx`): la pantalla se oscurece, cruza por abajo una fila de
// llamas —de día, las del soplete— y al centro queda la tarjeta con el corte, «Tu corte pasó las
// 1.000 vistas», el comienzo de su texto, «Seguir» y «Ver el corte». Si hay varios, uno detrás de
// otro. Con «reducir movimiento», la tarjeta sin las llamas (`globals.css`).
//
// Se celebra una vez por hito, en el primer lugar que lo muestre: el panel o el teléfono. Se anota
// en el servidor (`celebrarHitoPropio`) apenas se muestra, con la pestaña a la vista —una pestaña
// abierta detrás no celebra—. El navegador recuerda además los últimos que celebró: la página que
// devuelve el botón «Atrás» puede ser la de antes de anotarlo.

export type HitoACelebrar = {
  id: string
  titulo: Record<Tema, string>
  texto: string
  /** El corte dibujado, que arma el servidor. */
  corte: ReactNode
  /** El detalle del corte, en el panel lateral. */
  verHref: string
  ver: Record<Tema, string>
}

const CLAVE = 'hitos-celebrados'
const QUE_SE_GUARDAN = 50

function celebrados(): string[] {
  try {
    const guardado = JSON.parse(window.localStorage.getItem(CLAVE) ?? '[]')
    return Array.isArray(guardado) ? guardado.filter((g): g is string => typeof g === 'string') : []
  } catch {
    return []
  }
}

function anotar(id: string) {
  try {
    const lista = [...celebrados().filter((g) => g !== id), id].slice(-QUE_SE_GUARDAN)
    window.localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    // Sin almacenamiento, lo anotado en el servidor alcanza: la próxima página ya no lo trae.
  }
}

/** El comienzo del texto del corte, para reconocerlo: una línea y poco más. */
function comienzo(texto: string): string {
  const linea = texto.trim().split('\n')[0] ?? ''
  return linea.length > 90 ? `${linea.slice(0, 88).trimEnd()}…` : linea
}

export function CelebracionDeHitos({ hitos }: { hitos: HitoACelebrar[] }) {
  // Null hasta montar y ver la pestaña: lo que el navegador ya celebró se sabe recién ahí.
  const [cola, setCola] = useState<HitoACelebrar[] | null>(null)
  const dialogo = useRef<HTMLDialogElement>(null)
  const actual = cola?.[0] ?? null

  useEffect(() => {
    function empezar() {
      if (document.hidden) return
      document.removeEventListener('visibilitychange', empezar)
      const ya = new Set(celebrados())
      setCola(hitos.filter((h) => !ya.has(h.id)))
    }
    document.addEventListener('visibilitychange', empezar)
    empezar()
    return () => document.removeEventListener('visibilitychange', empezar)
  }, [hitos])

  // Cada hito que se muestra queda celebrado. Si no llega, la próxima vez vuelve a salir: mejor
  // eso que perderlo.
  useEffect(() => {
    if (!actual) return
    anotar(actual.id)
    celebrarHitoPropio(actual.id).catch(() => {})
    const d = dialogo.current
    if (d && !d.open) d.showModal()
  }, [actual])

  function seguir() {
    const resto = cola?.slice(1) ?? []
    if (resto.length === 0) dialogo.current?.close()
    setCola(resto)
  }

  const velo = useVeloQueCierra(seguir)

  if (!actual) return null
  return (
    <dialog
      ref={dialogo}
      aria-labelledby="hito-titulo"
      onCancel={(event) => {
        event.preventDefault()
        seguir()
      }}
      {...velo}
      // La pantalla entera es el diálogo, transparente: las llamas cruzan por abajo de todo y un
      // clic fuera de la tarjeta, en lo oscuro, sigue.
      className="ventana m-0 grid h-dvh max-h-none w-screen max-w-none place-items-center overflow-hidden bg-transparent p-4 text-fg backdrop:bg-acero-950/85"
    >
      <div key={actual.id} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[9%] overflow-hidden">
        <div className="llamas-que-cruzan flex w-max items-end gap-1">
          {[56, 86, 66, 104, 74, 94, 60, 82, 52, 90, 70, 98, 58, 78].map((alto, i) => (
            <Llamita key={i} className="llama" style={{ height: alto, animationDuration: `${0.5 + (i % 3) * 0.12}s` }} />
          ))}
        </div>
      </div>
      <div className="ventana-candente chapa relative w-full max-w-sm rounded-2xl p-6 text-center">
        <div className="flex justify-center">{actual.corte}</div>
        <h2 id="hito-titulo" className="mt-4 font-titulo text-xl font-semibold uppercase tracking-[0.03em]">
          <DeNocheYDeDia noche={actual.titulo.noche} dia={actual.titulo.dia} />
        </h2>
        {actual.texto.trim() ? <p className="mt-2 text-sm text-fg-muted">{comienzo(actual.texto)}</p> : null}
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={seguir} className={BOTON_CHICO_SECUNDARIO} autoFocus>
            Seguir
          </button>
          <Link href={actual.verHref} scroll={false} onClick={() => dialogo.current?.close()} className={BOTON_CHICO}>
            <DeNocheYDeDia noche={actual.ver.noche} dia={actual.ver.dia} />
          </Link>
        </div>
      </div>
    </dialog>
  )
}
