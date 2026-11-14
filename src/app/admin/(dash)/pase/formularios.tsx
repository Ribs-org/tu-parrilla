'use client'

import { useRef, useState, useTransition } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/ui'
import { archivarPaseAccion, cambiarEnlacesAccion, crearPaseAccion } from '../../pase-actions'

/** «Nuevo pase»: el título y lo que tiene que mirar quien revisa. */
export function FormularioNuevoPase() {
  const formulario = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, empezar] = useTransition()
  return (
    <form
      ref={formulario}
      className="chapa space-y-3 rounded-xl p-4"
      action={(datos) =>
        empezar(async () => {
          setError(null)
          const r = await crearPaseAccion(datos)
          if (r.error) setError(r.error)
          else formulario.current?.reset()
        })
      }
    >
      <h2 className="font-titulo text-sm font-semibold uppercase tracking-[0.12em]">Nuevo pase</h2>
      <label className="block space-y-1 text-[0.8rem] text-fg-muted">
        <span>Título</span>
        <Input name="titulo" required maxLength={120} placeholder="Por ejemplo, Shorts de la semana del 17" />
      </label>
      <label className="block space-y-1 text-[0.8rem] text-fg-muted">
        <span>Lo que tiene que mirar quien revisa (opcional)</span>
        <Textarea name="instrucciones" maxLength={4000} rows={3} placeholder="Por ejemplo: que se entienda sin sonido y que el gancho llegue antes del segundo 3." />
      </label>
      {error ? <p className="text-[0.8rem] text-negative">{error}</p> : null}
      <Button type="submit" variant="primary" disabled={pendiente}>
        {pendiente ? 'Creando…' : 'Crear el pase'}
      </Button>
    </form>
  )
}

/** Un enlace del pase, con su botón para copiarlo. */
export function CopiarEnlace({ etiqueta, enlace }: { etiqueta: string; enlace: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="w-20 shrink-0 text-[0.75rem] text-fg-faint">{etiqueta}</span>
      <code className="min-w-0 flex-1 truncate rounded-md bg-acero-800 px-2 py-1 font-mono text-[0.72rem] text-fg-muted">{enlace}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(enlace)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
          } catch {
            setCopiado(false)
          }
        }}
        className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] text-fg-muted hover:text-fg"
        aria-label={`Copiar el enlace para ${etiqueta.toLowerCase()}`}
      >
        {copiado ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

/** «Cambiar los enlaces» y «Archivar» (o «Desarchivar»). */
export function BotonesDelPase({ id, archivado }: { id: string; archivado: boolean }) {
  const [error, setError] = useState<string | null>(null)
  const [pendiente, empezar] = useTransition()
  const hacer = (accion: () => Promise<{ error?: string }>) =>
    empezar(async () => {
      setError(null)
      const r = await accion()
      if (r.error) setError(r.error)
    })
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!archivado ? (
        <Button
          variant="ghost"
          disabled={pendiente}
          onClick={() => {
            if (window.confirm('¿Cambiar los dos enlaces? Los de ahora dejan de abrir el pase para quien los tenga.')) {
              hacer(() => cambiarEnlacesAccion(id))
            }
          }}
        >
          Cambiar los enlaces
        </Button>
      ) : null}
      <Button variant="ghost" disabled={pendiente} onClick={() => hacer(() => archivarPaseAccion(id, !archivado))}>
        {archivado ? 'Desarchivar' : 'Archivar'}
      </Button>
      {error ? <p className="text-[0.8rem] text-negative">{error}</p> : null}
    </div>
  )
}
