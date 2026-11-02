'use client'

import { useActionState, useState, useTransition } from 'react'
import { cerrarSesionesUsuario, encenderCocina, invitarUsuario, quitarUsuario, traspasarCuentaAccion, type FormState } from '@/app/admin/actions'
import { useConfirmar } from '@/components/confirmar'
import { useRevision } from '@/components/revision'
import { Button, Field, Input, Select, Submit } from '@/components/ui'
import { networkLabel } from '@/lib/networks'
import { revisarCorreo } from '@/lib/revisiones'
import type { CuentaTraspasable } from '@/lib/social/traspasar'

export function FormularioInvitar() {
  const [state, action] = useActionState<FormState, FormData>(invitarUsuario, {})
  const revision = useRevision(revisarCorreo)
  const error = revision.error ?? state.error
  return (
    <form {...revision.formulario} action={action} className="flex flex-wrap items-end gap-3">
      <Field label="Correo"><Input name="correo" type="email" className="min-w-[16rem]" /></Field>
      <Field label="Nombre (opcional)"><Input name="nombre" className="min-w-[12rem]" /></Field>
      <Submit pendingLabel="Invitando…">Invitar</Submit>
      {error ? <p role="alert" className="text-sm text-negative">{error}</p> : null}
      {state.aviso ? <p role="alert" className="text-sm text-negative">{state.aviso}</p> : null}
      {state.ok && !state.aviso ? <p className="text-sm text-positive">Invitado. Le llegó su primer código.</p> : null}
    </form>
  )
}

export function BotonQuitar({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const confirmar = useConfirmar()

  async function quitar() {
    if (!(await confirmar({ titulo: '¿Quitar la invitación?', accion: 'Quitar', peligro: true }))) return
    start(async () => {
      const r = await quitarUsuario(id)
      setError(r.error ?? null)
    })
  }

  return (
    <>
      <Button variant="ghost" disabled={pending} onClick={() => void quitar()}>
        Quitar
      </Button>
      {error ? <span role="alert" className="text-xs text-negative">{error}</span> : null}
    </>
  )
}

/** Encender o apagar La Cocina de alguien. Apagarla pregunta antes: el chef deja de ver sus comandas. */
export function BotonCocina({ id, correo, encendida }: { id: string; correo: string; encendida: boolean }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const confirmar = useConfirmar()

  async function cambiar() {
    if (encendida) {
      const seguir = await confirmar({
        titulo: `¿Apagar la cocina de ${correo}?`,
        detalle: 'El chef deja de ver sus comandas.',
        accion: 'Apagar la cocina',
      })
      if (!seguir) return
    }
    start(async () => {
      const r = await encenderCocina(id, !encendida)
      setError(r.error ?? null)
    })
  }

  return (
    <>
      <Button variant="ghost" disabled={pending} onClick={() => void cambiar()}>
        {pending ? (encendida ? 'Apagando…' : 'Encendiendo…') : encendida ? 'Apagar la cocina' : 'Encender la cocina'}
      </Button>
      {error ? <span role="alert" className="text-xs text-negative">{error}</span> : null}
    </>
  )
}

/** Lo que se lleva cada cuenta, para decidir sin ir a mirar: va en la lista y en la pregunta. */
function contenido(cuenta: CuentaTraspasable): string {
  const publicaciones = `${cuenta.publicaciones} ${cuenta.publicaciones === 1 ? 'publicación' : 'publicaciones'}`
  return cuenta.porSalir > 0 ? `${publicaciones}, ${cuenta.porSalir} por salir` : publicaciones
}

/** Pasa una cuenta a otra persona. Quien la tiene no aparece entre los destinos. */
export function FormularioTraspaso({
  cuentas,
  personas,
  fierros,
}: {
  cuentas: CuentaTraspasable[]
  personas: Array<{ id: string; correo: string }>
  fierros: string
}) {
  const [cuentaId, setCuentaId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [pending, start] = useTransition()
  const [resultado, setResultado] = useState<{ error?: string; listo?: string } | null>(null)
  const confirmar = useConfirmar()
  const cuenta = cuentas.find((c) => c.id === cuentaId)
  const destinos = personas.filter((p) => p.id !== cuenta?.duenoId)
  const destino = destinos.find((p) => p.id === destinoId)

  async function traspasar() {
    if (!cuenta || !destino) return
    const seguir = await confirmar({
      titulo: `¿Traspasar ${cuenta.nombre} de ${cuenta.dueno} a ${destino.correo}?`,
      detalle: `Se lleva ${contenido(cuenta)}, sus números y sus comentarios. Se puede devolver desde aquí.`,
      accion: 'Traspasar',
    })
    if (!seguir) return
    start(async () => {
      const r = await traspasarCuentaAccion(cuenta.id, destino.id)
      if ('error' in r) {
        setResultado({ error: r.error })
        return
      }
      setResultado({ listo: `${r.nombre} ya es de ${r.correo}. Falta que esa persona la reconecte en ${fierros}.` })
      setCuentaId('')
      setDestinoId('')
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">
        Se lleva sus publicaciones, sus números y sus comentarios. No se borra nada, en la red no cambia nada y se puede
        devolver. Lo programado que sale también a otras cuentas se queda con quien lo programó, y sale igual.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Cuenta">
          <Select
            value={cuentaId}
            onChange={(e) => {
              setCuentaId(e.target.value)
              setDestinoId('')
              setResultado(null)
            }}
            className="min-w-[16rem] max-w-full"
          >
            <option value="">Elige una cuenta</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {networkLabel(c.network)} · {c.nombre} · {c.dueno} · {contenido(c)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Pasa a">
          <Select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} disabled={!cuenta} className="min-w-[12rem] max-w-full">
            <option value="">Elige a quién</option>
            {destinos.map((p) => (
              <option key={p.id} value={p.id}>{p.correo}</option>
            ))}
          </Select>
        </Field>
        <Button type="button" disabled={pending || !cuenta || !destino} onClick={() => void traspasar()}>
          {pending ? 'Traspasando…' : 'Traspasar'}
        </Button>
      </div>
      {resultado?.error ? <p role="alert" className="text-sm text-negative">{resultado.error}</p> : null}
      {resultado?.listo ? <p className="text-sm text-positive">{resultado.listo}</p> : null}
    </div>
  )
}

export function BotonCerrarSesiones({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const confirmar = useConfirmar()

  async function cerrar() {
    const seguir = await confirmar({
      titulo: '¿Cerrar las sesiones de esta persona?',
      detalle: 'Tendrá que entrar de nuevo con un código.',
      accion: 'Cerrar sesiones',
    })
    if (!seguir) return
    start(async () => {
      const r = await cerrarSesionesUsuario(id)
      setError(r.error ?? null)
    })
  }

  return (
    <>
      <Button variant="ghost" disabled={pending} onClick={() => void cerrar()}>
        Cerrar sesiones
      </Button>
      {error ? <span role="alert" className="text-xs text-negative">{error}</span> : null}
    </>
  )
}
