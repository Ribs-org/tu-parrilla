'use client'

import Link from 'next/link'
import { useActionState, useSyncExternalStore } from 'react'
import { useRevision } from '@/components/revision'
import { Submit } from '@/components/ui'
import { codigoDelFragmento } from '@/lib/enlace-de-entrada'
import { CODIGO_DEL_ENLACE, CODIGO_ENVIADO } from '@/lib/ingreso-frases'
import { revisarCodigo, revisarCorreo } from '@/lib/revisiones'
import { canjearCodigo, pedirCodigo, type FormState } from './acciones'

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

function escucharFragmento(avisar: () => void): () => void {
  window.addEventListener('hashchange', avisar)
  return () => window.removeEventListener('hashchange', avisar)
}

/**
 * El código que trae el enlace del correo (`#codigo=`, `enlace-de-entrada.ts`), o null. Solo lo
 * pone en el campo: entra quien aprieta «Entrar», no quien abre el enlace.
 */
function useCodigoDelEnlace(): string | null {
  return useSyncExternalStore(escucharFragmento, () => codigoDelFragmento(window.location.hash), () => null)
}

export function FormularioCodigo({ correo }: { correo: string }) {
  const [state, action] = useActionState<FormState, FormData>(canjearCodigo, {})
  const revision = useRevision(revisarCodigo)
  const delEnlace = useCodigoDelEnlace()
  const error = revision.error ?? state.error
  return (
    <form {...revision.formulario} action={action} className="mt-6 space-y-3">
      <p className="text-sm text-fg-muted">{delEnlace ? CODIGO_DEL_ENLACE : `${CODIGO_ENVIADO} Vale diez minutos.`}</p>
      <input type="hidden" name="correo" value={correo} />
      <label htmlFor="codigo" className="sr-only">Código</label>
      {/* La `key` lo vuelve a montar cuando aparece el código del enlace, que el servidor no ve. */}
      <input key={delEnlace ?? ''} id="codigo" name="codigo" defaultValue={delEnlace ?? ''} inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus placeholder="000000" className={`${CAMPO} tracking-[0.4em]`} />
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
