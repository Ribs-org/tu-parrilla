'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState, useSyncExternalStore, useTransition } from 'react'
import { useRevision } from '@/components/revision'
import { Button } from '@/components/ui-boton'
import { Submit } from '@/components/ui'
import { CODIGO_ENVIADO } from '@/lib/ingreso-frases'
import { revisarCodigo, revisarCorreo } from '@/lib/revisiones'
import { canjearCodigo, cruzar, mirar, pedirCodigo, type FormState } from './acciones'

const CAMPO =
  'w-full rounded-xl border border-acero-700 bg-acero-800 px-4 py-2.5 text-sm outline-none placeholder:text-fg-faint focus:border-brasa'

export function FormularioCorreo() {
  const [state, action] = useActionState<FormState, FormData>(pedirCodigo, {})
  const revision = useRevision(revisarCorreo)
  const error = revision.error ?? state.error
  return (
    <form {...revision.formulario} action={action} className="mt-6 space-y-3">
      <label htmlFor="correo" className="sr-only">Correo</label>
      <input id="correo" name="correo" type="email" autoFocus autoComplete="email" inputMode="email" placeholder="tu@correo.cl" className={CAMPO} />
      {error ? <p role="alert" className="text-sm text-negative">{error}</p> : null}
      <Submit
        pendingLabel="Enviando…"
        className="w-full px-4 py-2.5"
      >
        Mandarme un código
      </Submit>
    </form>
  )
}

export function FormularioCodigo({ correo }: { correo: string }) {
  const [state, action] = useActionState<FormState, FormData>(canjearCodigo, {})
  const revision = useRevision(revisarCodigo)
  const error = revision.error ?? state.error
  return (
    <form {...revision.formulario} action={action} className="mt-6 space-y-3">
      <p className="text-sm text-fg-muted">{CODIGO_ENVIADO} Vale diez minutos.</p>
      <input type="hidden" name="correo" value={correo} />
      <label htmlFor="codigo" className="sr-only">Código</label>
      <input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus placeholder="000000" className={`${CAMPO} tracking-[0.4em]`} />
      {error ? <p role="alert" className="text-sm text-negative">{error}</p> : null}
      <Submit
        pendingLabel="Entrando…"
        className="w-full px-4 py-2.5"
      >
        Entrar
      </Submit>
      <Link href="/ingresar" className="block text-center text-xs text-fg-faint hover:text-fg">Usar otro correo</Link>
    </form>
  )
}

function escucharFragmento(avisar: () => void): () => void {
  window.addEventListener('hashchange', avisar)
  return () => window.removeEventListener('hashchange', avisar)
}

/** La llave del puente (`#t=`), o null; `undefined` mientras dibuja el servidor, que no la ve. */
function useLlaveDelPuente(): string | null | undefined {
  return useSyncExternalStore(
    escucharFragmento,
    () => /^#(?:.*&)?t=([A-Za-z0-9_-]+)(?:&|$)/.exec(window.location.hash)?.[1] ?? null,
    () => undefined,
  )
}

/**
 * El puente de la app: lee la llave del fragmento, muestra con qué correo se va a entrar y entra al
 * apretar «Entrar». No cruza sola: un enlace de la cuenta de otro, abierto sin saberlo, dejaría a la
 * persona dentro de un panel ajeno (`lib/puente.ts`).
 */
export function CruzarPuente() {
  const llave = useLlaveDelPuente()
  const [correo, setCorreo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mirando, empezarAMirar] = useTransition()
  const [entrando, empezarAEntrar] = useTransition()
  useEffect(() => {
    if (!llave) return
    empezarAMirar(async () => {
      const resultado = await mirar(llave)
      if ('error' in resultado) setError(resultado.error)
      else setCorreo(resultado.correo)
    })
  }, [llave])

  function entrar() {
    if (!llave) return
    empezarAEntrar(async () => {
      const resultado = await cruzar(llave)
      if (resultado?.error) setError(resultado.error)
    })
  }

  const roto = llave === null ? 'Este enlace no trae su llave.' : error
  if (roto) {
    return (
      <div className="mt-6 space-y-3">
        <p role="alert" className="text-sm text-negative">{roto}</p>
        <p className="text-sm text-fg-muted">Vuelve a la app y ábrelo de nuevo, o entra con tu correo.</p>
        <Link href="/ingresar" className="block text-center text-xs text-fg-faint hover:text-fg">Entrar con tu correo</Link>
      </div>
    )
  }
  if (!correo || mirando) return <p className="mt-6 text-sm text-fg-muted">Abriendo…</p>
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm">
        Vas a entrar al panel como <strong className="font-semibold">{correo}</strong>.
      </p>
      <p className="text-sm text-fg-muted">Si no lo abriste tú desde la app de Tu Parrilla, cierra esta página.</p>
      <Button type="button" variant="primary" onClick={entrar} disabled={entrando} className="w-full px-4 py-2.5">
        {entrando ? 'Entrando…' : 'Entrar'}
      </Button>
    </div>
  )
}
