'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { COMANDA_AJENA, COMANDA_NO_CANCELABLE, cancelarComanda } from '@/lib/cocina/panel'
import { leerPedido } from '@/lib/cocina/pedido'
import { ACOMPANAMIENTO_NO_SIRVE, ARCHIVOS_CAMBIARON, PRINCIPAL_NO_SIRVE, pedirComanda } from '@/lib/cocina/pedir'
import { COCINA_APAGADA } from '@/lib/cocina/subidas'
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

const NO_SE_PIDIO = {
  apagada: COCINA_APAGADA,
  principal: PRINCIPAL_NO_SIRVE,
  acompanamiento: ACOMPANAMIENTO_NO_SIRVE,
  cambiaron: ARCHIVOS_CAMBIARON,
} as const

/**
 * Cuelga una comanda con lo que el formulario subió y pidió, y vuelve a La Cocina, donde aparece
 * arriba. Llega como objeto y no como `FormData`: los archivos ya subieron por partes, y lo que viaja
 * son sus ids. Mandarla dos veces no la duplica (`ref`).
 */
export async function pedirComandaPropia(datos: unknown): Promise<{ error?: string }> {
  const usuario = await requireUser()
  const pedido = leerPedido(datos)
  if ('error' in pedido) return { error: pedido.error }
  const r = await pedirComanda(usuario, pedido, new Date())
  if ('falla' in r) return { error: NO_SE_PIDIO[r.falla] }
  revalidatePath('/admin/ia')
  redirect('/admin/ia')
}
