'use client'

import { RefreshCw } from 'lucide-react'
import { useActionState, useState, useTransition } from 'react'
import {
  guardarInstruccionesComentarios,
  regenerarBorradoresComentarios,
  type FormState,
} from '@/app/admin/actions'
import { Button, Field, Submit, Textarea } from '@/components/ui'
import { SE_CORTO_REGENERAR, SIN_CAMBIOS_GUARDADOS, fraseRegenerado } from './regenerar'

const INICIAL: FormState = {}

export function Instrucciones({ valor, tope }: { valor: string; tope: number }) {
  const [state, action] = useActionState(guardarInstruccionesComentarios, INICIAL)
  // Lo guardado es lo que usa el modelo: con el cuadro cambiado y sin guardar, regenerar
  // escribiría con las instrucciones de antes y parecería que el cambio no sirvió.
  const [guardado, setGuardado] = useState(valor)
  const [escrito, setEscrito] = useState(valor)
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null)
  const [regenerando, startTransition] = useTransition()
  // Cada guardado trae un `state` nuevo: recién ahí lo escrito pasa a ser lo guardado.
  const [visto, setVisto] = useState(state)
  if (state !== visto) {
    setVisto(state)
    if (state.ok) setGuardado(escrito)
  }
  const sinGuardar = escrito !== guardado

  function regenerar() {
    if (sinGuardar) {
      setAviso({ texto: SIN_CAMBIOS_GUARDADOS, error: true })
      return
    }
    if (!confirm('¿Volver a escribir los borradores pendientes con estas instrucciones? Lo que corregiste en un cuadro y no mandaste se reemplaza.')) return
    setAviso(null)
    startTransition(async () => {
      try {
        const r = await regenerarBorradoresComentarios()
        setAviso('error' in r ? { texto: r.error, error: true } : { texto: fraseRegenerado(r), error: false })
      } catch (fallo) {
        console.error('[La Mesa]', fallo)
        setAviso({ texto: SE_CORTO_REGENERAR, error: true })
      }
    })
  }

  return (
    <form action={action} className="space-y-3">
      <Field label="Cómo responde el modelo">
        <Textarea
          name="instrucciones"
          defaultValue={valor}
          rows={5}
          maxLength={tope}
          onChange={(e) => {
            setEscrito(e.target.value)
            setAviso(null)
          }}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Submit pendingLabel="Guardando…">Guardar</Submit>
        <Button type="button" variant="ghost" onClick={regenerar} disabled={regenerando} className="inline-flex items-center gap-2">
          <RefreshCw aria-hidden className={regenerando ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {regenerando ? 'Regenerando…' : 'Regenerar todos'}
        </Button>
        {state.ok && !sinGuardar && !aviso ? <span role="status" className="text-sm text-positive">Guardado.</span> : null}
        {state.error ? <span role="alert" className="text-sm text-negative">{state.error}</span> : null}
        {aviso ? (
          <span role={aviso.error ? 'alert' : 'status'} className={aviso.error ? 'text-sm text-negative' : 'text-sm text-positive'}>
            {aviso.texto}
          </span>
        ) : null}
      </div>
    </form>
  )
}
