'use client'

import { useEffect, useId, useRef } from 'react'
import { BOTON_CHICO, BOTON_CHICO_SECUNDARIO } from '@/components/boton'
import type { AyudaDeConexion } from '@/lib/social/ayuda-conexion'
import { useVeloQueCierra } from '@/components/velo'

/**
 * La frase con que volvió una conexión, arriba de Los Fierros. Cuando trae un arreglo conocido
 * (`ayudaDeConexion`), se abre sola una ventana con el porqué, los pasos y el botón para volver a
 * intentarlo, y la franja ofrece «Cómo arreglarlo» para abrirla otra vez: la franja sola, en gris,
 * se pasaba de largo, y quien aceptó todos los permisos de Meta no entendía por qué no había
 * cuenta.
 */
export function AvisoDeConexion({ mensaje, ayuda }: { mensaje: string; ayuda: AyudaDeConexion | null }) {
  const ventana = useRef<HTMLDialogElement>(null)
  const velo = useVeloQueCierra(() => ventana.current?.close())
  const titulo = useId()

  useEffect(() => {
    if (ayuda && !ventana.current?.open) ventana.current?.showModal()
  }, [ayuda])

  return (
    <>
      <p role="status" className="mb-4 rounded-xl bg-velo/[0.04] px-4 py-2 text-sm text-fg-muted">
        {mensaje}
        {ayuda ? (
          <>
            {' '}
            <button
              type="button"
              onClick={() => ventana.current?.showModal()}
              className="text-fg underline decoration-velo/30 underline-offset-4 transition-colors hover:decoration-velo/60"
            >
              Cómo arreglarlo
            </button>
          </>
        ) : null}
      </p>
      {ayuda ? (
        <dialog
          ref={ventana}
          aria-labelledby={titulo}
          {...velo}
          className="m-auto w-[28rem] max-w-[calc(100vw-2rem)] rounded-xl border border-velo/10 bg-acero-900/95 text-fg shadow-xl backdrop-blur backdrop:bg-acero-950/80"
        >
          <div className="space-y-3 p-4">
            <p id={titulo} className="font-titulo text-sm font-semibold uppercase tracking-[0.03em]">
              {ayuda.titulo}
            </p>
            <p className="text-sm text-fg-muted">{ayuda.porque}</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-fg-muted">
              {ayuda.pasos.map((paso) => (
                <li key={paso}>{paso}</li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Un enlace de verdad, no un `Link`: la conexión sale del sitio hacia Meta. */}
              <a href={ayuda.reintentar.href} className={BOTON_CHICO}>
                {ayuda.reintentar.texto}
              </a>
              <button type="button" onClick={() => ventana.current?.close()} className={BOTON_CHICO_SECUNDARIO}>
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </>
  )
}
