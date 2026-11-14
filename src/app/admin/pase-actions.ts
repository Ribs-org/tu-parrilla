'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { archivarPase, cambiarCodigos, crearPase } from '@/lib/pase/pase'

// El Pase desde el panel: crear un pase, cambiarle los enlaces y archivarlo. Mientras se decide el
// modelo de permisos, solo el admin (`docs/superpowers/specs/2026-11-13-el-pase-design.md`).

const NO_EXISTE = 'Ese pase ya no está.'

export async function crearPaseAccion(datos: FormData): Promise<{ error?: string; ok?: true }> {
  const admin = await requireAdmin()
  const r = await crearPase(admin.id, { titulo: datos.get('titulo'), instrucciones: datos.get('instrucciones') })
  if ('error' in r) return { error: r.error }
  revalidatePath('/admin/pase')
  return { ok: true }
}

export async function cambiarEnlacesAccion(id: string): Promise<{ error?: string; ok?: true }> {
  const admin = await requireAdmin()
  if (!(await cambiarCodigos(admin.id, id))) return { error: NO_EXISTE }
  revalidatePath('/admin/pase')
  return { ok: true }
}

export async function archivarPaseAccion(id: string, archivar: boolean): Promise<{ error?: string; ok?: true }> {
  const admin = await requireAdmin()
  if (!(await archivarPase(admin.id, id, archivar))) return { error: NO_EXISTE }
  revalidatePath('/admin/pase')
  return { ok: true }
}
