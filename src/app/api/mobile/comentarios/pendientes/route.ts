import { NextResponse } from 'next/server'
import { contarPendientes } from '@/lib/comentarios-cola'
import { requireMobileUser } from '@/lib/mobile-guardia'

export const dynamic = 'force-dynamic'

/**
 * Cuántos comentarios esperan respuesta, en todas las redes: el número del acceso a La Mesa en La
 * Parrilla del teléfono. `{ pendientes }`. Aparte de `GET /api/mobile/comentarios` para no traer
 * la cola entera cada vez que se abre La Parrilla.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  return NextResponse.json({ pendientes: await contarPendientes(usuario.id, null) })
}
