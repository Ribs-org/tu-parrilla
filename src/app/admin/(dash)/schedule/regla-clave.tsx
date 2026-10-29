'use client'

import { Field, Input, Textarea } from '@/components/ui'
import { MAX_MENSAJE, MAX_PALABRA, MAX_RESPUESTA, RESPUESTA_PUBLICA_POR_DEFECTO } from '@/lib/social/comentarios/reglas'
import { nombreDe } from '@/lib/vocabulario'

/**
 * La regla de palabra clave de un post. Plegada por defecto en el compositor; abierta en
 * el editor cuando ya existe. Los tres campos llevan el nombre que `reglaDesdeFormulario`
 * lee. Palabra vacía = sin regla.
 */
export function ReglaClave({
  inicial,
}: {
  inicial?: { palabra: string; mensaje: string; respuestaPublica: string } | null
}) {
  return (
    <details open={Boolean(inicial)} className="rounded-xl bg-velo/[0.04] p-4">
      <summary className="cursor-pointer text-sm font-medium">Respuesta automática por palabra clave</summary>
      <div className="mt-4 space-y-4">
        <Field label="Palabra clave" hint="Una sola palabra. Quien la comente recibe la respuesta sin que hagas nada.">
          <Input name="reglaPalabra" maxLength={MAX_PALABRA} defaultValue={inicial?.palabra ?? ''} placeholder="GUIA" className="max-w-[16rem]" />
        </Field>
        <Field label="Mensaje" hint={`Pon el enlace aquí; si es de tu sitio se mide solo en ${nombreDe('/admin/analytics')}.`}>
          <Textarea name="reglaMensaje" rows={3} maxLength={MAX_MENSAJE} defaultValue={inicial?.mensaje ?? ''} placeholder="Acá tienes la guía: https://…" />
        </Field>
        <Field label="Respuesta pública" hint="La que se publica bajo el comentario cuando el mensaje sale por privado.">
          <Input name="reglaRespuesta" maxLength={MAX_RESPUESTA} defaultValue={inicial?.respuestaPublica ?? RESPUESTA_PUBLICA_POR_DEFECTO} />
        </Field>
        <p className="text-[0.72rem] text-fg-faint">
          Con el mensaje privado encendido para tu cuenta, en Instagram y Facebook se publica esta respuesta y el
          mensaje con el enlace va por privado, una vez a cada persona. Si no, en YouTube o pasados siete días, el
          mensaje con el enlace se publica como respuesta. En TikTok todavía no hay cola de comentarios.
        </p>
      </div>
    </details>
  )
}
