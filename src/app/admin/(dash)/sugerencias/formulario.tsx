'use client'

import { useId, useState, useTransition } from 'react'
import { responderSugerenciaAccion } from '@/app/admin/sugerencias-actions'
import { Button, Textarea } from '@/components/ui'
import { MAX_RESPUESTA, RESPUESTA_VACIA } from '@/lib/sugerencias/respuestas'

/**
 * La respuesta a una sugerencia, en Las Sugerencias: el campo con lo que ya se respondió, si hay
 * algo, y el botón que la guarda. `estado` es la línea de abajo: cuándo se respondió, quién, y si
 * la persona ya la leyó.
 */
export function FormularioRespuesta({ id, respuesta, estado }: { id: string; respuesta: string | null; estado: string | null }) {
  const [texto, setTexto] = useState(respuesta ?? '')
  const [pendiente, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const idCampo = useId()

  function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!texto.trim()) {
      setError(RESPUESTA_VACIA)
      return
    }
    setError(null)
    setAviso(null)
    start(async () => {
      try {
        const r = await responderSugerenciaAccion(id, texto)
        setError(r.error ?? null)
        setAviso(r.aviso ?? null)
      } catch {
        setError('No se pudo guardar: revisa tu conexión y vuelve a intentarlo.')
      }
    })
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-2 rounded-lg border-l-2 border-brasa/60 pl-3">
      <label htmlFor={idCampo} className="block text-[0.72rem] font-medium uppercase tracking-[0.08em] text-fg-faint">
        {respuesta ? 'La respuesta del equipo' : 'Responder'}
      </label>
      <Textarea
        id={idCampo}
        rows={respuesta ? 3 : 2}
        maxLength={MAX_RESPUESTA}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          if (error) setError(null)
        }}
        placeholder="Lo que le quieres decir. Lo lee en el libro y le llega por correo."
        aria-invalid={error === RESPUESTA_VACIA || undefined}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={respuesta ? 'ghost' : 'primary'} disabled={pendiente}>
          {pendiente ? 'Guardando…' : respuesta ? 'Cambiar la respuesta' : 'Responder'}
        </Button>
        {estado ? <span className="text-xs text-fg-faint">{estado}</span> : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}
      {aviso && !error ? (
        <p role="status" className="text-sm text-positive">
          {aviso}
        </p>
      ) : null}
    </form>
  )
}
