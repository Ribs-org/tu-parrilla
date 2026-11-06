'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { Ventana } from '@/components/ventana'
import { copiarAlPortapapeles } from '@/lib/copiar'

/**
 * Lo que se le explica a quien mandó un video a la bandeja de TikTok. La API de la bandeja
 * (`/post/publish/inbox/video/init/`, en `social/publish/tiktok.ts`) recibe solo el archivo: el
 * texto no viaja, y sin esto había que volver a escribirlo a mano en TikTok. Las fotos sí lo
 * llevan, y por eso a ellas no se les dice.
 */
export const BANDEJA_SIN_TEXTO =
  'TikTok no recibe el texto de un video que va a la bandeja: cópialo y pégalo al terminarlo en TikTok.'

/**
 * «Copiar el texto» de un post, para pegarlo en TikTok. Dice «Copiado» un momento cuando de
 * verdad se copió (`copiarAlPortapapeles`). Si el navegador no deja copiar —sin contexto seguro,
 * o con el permiso negado—, abre una ventana con el texto ya seleccionado para copiarlo a mano:
 * un botón que no hace nada y no lo dice es peor que no tenerlo.
 *
 * `className` viste el botón: subrayado al final de la píldora de la lista, con pinta de botón
 * en el editor. `pista` va en su globito: en la píldora no cabe la explicación entera.
 */
export function CopiarTexto({
  texto,
  className = 'ml-2 underline',
  pista,
}: {
  texto: string
  className?: string
  pista?: string
}) {
  const [copiado, setCopiado] = useState(false)
  const ventana = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)

  async function copiar() {
    if (await copiarAlPortapapeles(texto)) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
      return
    }
    ventana.current?.showModal()
    campo.current?.select()
  }

  return (
    <>
      <button type="button" className={className} data-globito={pista} onClick={() => void copiar()}>
        {copiado ? 'Copiado' : 'Copiar el texto'}
      </button>
      <Ventana ref={ventana} aria-label="Copiar el texto a mano" alVelo={() => ventana.current?.close()}>
        <div className="space-y-2 p-3">
          <p className="text-sm text-fg">No se pudo copiar solo. Ya está seleccionado: cópialo desde aquí.</p>
          <textarea
            ref={campo}
            readOnly
            value={texto}
            rows={6}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-md border border-velo/10 bg-acero-950/60 p-2 text-sm text-fg"
          />
          <div className="flex justify-end">
            <Button type="button" onClick={() => ventana.current?.close()}>
              Cerrar
            </Button>
          </div>
        </div>
      </Ventana>
    </>
  )
}
