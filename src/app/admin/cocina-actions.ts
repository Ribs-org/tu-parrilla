'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { COMANDA_AJENA, COMANDA_NO_CANCELABLE, cancelarComanda } from '@/lib/cocina/panel'
import { esUuid } from '@/lib/uuid'

// Lo que el dueño hace con sus comandas desde La Cocina. Aparte de `actions.ts`, que ya es largo:
// la cocina va a sumar pedir, responder y programar desde el mesón. El id del dueño sale siempre de
// la sesión, nunca de lo que llega.

/** Cancela una comanda propia que todavía no está en el horno. No pide la cocina encendida: si el admin la apagó, igual se puede cancelar. */
export async function cancelarComandaPropia(id: string): Promise<{ error?: string }> {
  const usuario = await requireUser()
  if (!esUuid(id)) return { error: COMANDA_AJENA }
  const r = await cancelarComanda(usuario.id, id, new Date())
  revalidatePath('/admin/ia')
  if ('falla' in r) return { error: r.falla === 'no-existe' ? COMANDA_AJENA : COMANDA_NO_CANCELABLE }
  return {}
}
