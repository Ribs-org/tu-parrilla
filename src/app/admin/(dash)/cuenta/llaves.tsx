'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { Check, Copy } from 'lucide-react'
import { generarLlaveApi, revocarLlaveApi, type LlaveState } from '@/app/admin/actions'
import { Button, Field, Input, Submit } from '@/components/ui'
import { POSITIVE } from '@/components/charts/theme'

/** Lo que dura un acuse de recibo antes de irse solo, como los «Copiado» del panel. */
const AVISO_MS = 2000

/**
 * Lo que se le pega al agente de una vez: dónde está la API, con qué llave entra, qué
 * leer para saber usarla y dónde está la wiki del panel para cuando la persona se pierda.
 * La guía para LLM es la compacta; la larga la cita.
 */
function instrucciones(base: string, llave: string): string {
  return [
    'API de Tu Parrilla',
    `Base: ${base}`,
    `Llave: ${llave}`,
    `Va en cada petición como el header «Authorization: Bearer ${llave}».`,
    `Antes de llamar, lee la guía: ${base}/docs/api-llm.md`,
    `Si la persona se pierde en su panel, la wiki de la interfaz: ${base}/docs/ui/index.md`,
  ].join('\n')
}

function BotonCopiar({ texto, children }: { texto: string; children: React.ReactNode }) {
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    if (!copiado) return
    const id = setTimeout(() => setCopiado(false), AVISO_MS)
    return () => clearTimeout(id)
  }, [copiado])

  return (
    <Button
      type="button"
      onClick={() => {
        // Sin contexto seguro (http que no es localhost) `navigator.clipboard` no existe; la
        // llave sigue a la vista para copiarla a mano.
        const clipboard = navigator.clipboard
        if (!clipboard) return
        clipboard
          .writeText(texto)
          .then(() => setCopiado(true))
          .catch(() => {})
      }}
    >
      {copiado ? (
        <Check className="h-3.5 w-3.5" style={{ color: POSITIVE }} aria-hidden />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden />
      )}
      {copiado ? 'Copiado' : children}
    </Button>
  )
}

/**
 * Generar, y la llave recién nacida debajo. La llave vive solo en el estado de este
 * formulario: al recargar la página desaparece, y en la tabla queda únicamente su hash.
 *
 * `maxNombre` llega de la página y no se importa de `lib/llaves-api`: ese módulo trae
 * `node:crypto`, que no entra en el bundle del navegador.
 */
export function FormularioLlave({ base, maxNombre }: { base: string; maxNombre: number }) {
  const [state, action] = useActionState<LlaveState, FormData>(generarLlaveApi, {})

  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <Field label="Nombre" hint="Para reconocerla en la lista: el del agente o el programa que la usa.">
          <Input name="nombre" required maxLength={maxNombre} placeholder="Editor de videos" className="min-w-[16rem]" />
        </Field>
        <Submit pendingLabel="Generando…">Generar llave</Submit>
      </form>
      {state.error ? (
        <p role="alert" className="text-sm text-negative">
          {state.error}
        </p>
      ) : null}
      {state.llave ? (
        <div className="rounded-lg border border-brasa/50 bg-acero-800 p-4">
          <p className="text-sm">
            Tu llave{state.nombre ? ` «${state.nombre}»` : ''}. <strong>Cópiala ahora:</strong> no se vuelve a
            mostrar. Si la pierdes, revócala y genera otra.
          </p>
          <code className="mt-3 block rounded-md bg-acero-950 px-3 py-2 font-mono text-[0.8rem] break-all select-all">
            {state.llave}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <BotonCopiar texto={instrucciones(base, state.llave)}>Copiar con instrucciones para tu agente</BotonCopiar>
            <BotonCopiar texto={state.llave}>Copiar solo la llave</BotonCopiar>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function BotonRevocar({ id, nombre }: { id: string; nombre: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!confirm(`¿Revocar «${nombre}»? Lo que la use deja de entrar en su próxima petición.`)) return
          start(async () => {
            const r = await revocarLlaveApi(id)
            setError(r.error ?? null)
          })
        }}
      >
        {pending ? 'Revocando…' : 'Revocar'}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-negative">
          {error}
        </span>
      ) : null}
    </>
  )
}
