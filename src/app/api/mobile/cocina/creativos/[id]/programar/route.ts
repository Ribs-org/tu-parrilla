import { NextResponse } from 'next/server'
import { error } from '@/lib/cocina/api'
import { CREATIVO_NO_ESTA, programarCreativo } from '@/lib/cocina/meson'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

/**
 * «Programar» un creativo del mesón desde el teléfono, como en el panel (`programarCreativoPropio`):
 * lo pasa a un borrador de La Parrilla con su texto, su título de YouTube y su media, y devuelve
 * `{ borradorId }` para que la app lo abra en Publicar, donde faltan las cuentas y la hora. La
 * portada y los atributos no van en el borrador: los pone el post al programarse
 * (`crearVariosProgramados`, con el `creativo_id` del borrador), desde el panel o desde el teléfono.
 * No pide la cocina encendida, como en el panel. `404` si ya no está en el mesón (dos toques no abren
 * dos borradores) o no es del dueño del token.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  const { id } = await params
  if (!esUuid(id)) return error(404, CREATIVO_NO_ESTA)
  const r = await programarCreativo(usuario.id, id, new Date())
  if ('falla' in r) return error(404, CREATIVO_NO_ESTA)
  return NextResponse.json({ borradorId: r.borradorId })
}
