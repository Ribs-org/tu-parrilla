'use server'

import { revalidatePath } from 'next/cache'
import type { ClavePlan } from '@/db/schema'
import { requireAdmin } from '@/lib/auth'
import { FECHA_ILEGIBLE, FECHA_PASADA, leerPlan } from '@/lib/planes/plan'
import { darCortesia, guardarPlan, pasarAlGratis } from '@/lib/planes/planes'
import { fromZonedInput } from '@/lib/utils'
import { esUuid } from '@/lib/uuid'

// Los planes desde Los Maestros: editar cada plan, dar una cortesía y pasar a alguien al gratis.
// Solo el admin (`docs/superpowers/specs/2026-11-08-planes-design.md`, «El admin»).

const NO_ESTA = 'Esa persona ya no está en Los Maestros.'

/** Guarda lo que el admin escribió en la tarjeta de un plan. */
export async function guardarPlanAccion(clave: ClavePlan, datos: FormData): Promise<{ error?: string; ok?: true }> {
  await requireAdmin()
  if (clave !== 'gratis' && clave !== 'pagado') return { error: 'Ese plan no existe.' }
  const cambios = leerPlan(clave, Object.fromEntries(datos))
  if ('error' in cambios) return { error: cambios.error }
  await guardarPlan(clave, cambios)
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/cuenta')
  return { ok: true }
}

/**
 * El pagado sin pagar, hasta el final de `dia` (`2026-12-08`, en la zona del admin) o, vacío, sin
 * fecha.
 */
export async function darCortesiaAccion(userId: string, dia: string): Promise<{ error?: string }> {
  const { zona } = await requireAdmin()
  let hasta: Date | null = null
  if (dia.trim() !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia.trim())) return { error: FECHA_ILEGIBLE }
    hasta = fromZonedInput(`${dia.trim()}T23:59`, zona)
    if (!hasta) return { error: FECHA_ILEGIBLE }
    if (hasta.getTime() <= Date.now()) return { error: FECHA_PASADA }
  }
  if (!esUuid(userId) || !(await darCortesia(userId, hasta))) return { error: NO_ESTA }
  revalidatePath('/admin/usuarios')
  return {}
}

export async function pasarAlGratisAccion(userId: string): Promise<{ error?: string }> {
  await requireAdmin()
  if (!esUuid(userId) || !(await pasarAlGratis(userId))) return { error: NO_ESTA }
  revalidatePath('/admin/usuarios')
  return {}
}
