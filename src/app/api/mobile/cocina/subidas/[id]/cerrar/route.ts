import { NextResponse } from 'next/server'
import { responderCerrar } from '@/lib/cocina/subidas-http'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'

export const dynamic = 'force-dynamic'

/**
 * La cierra con todas sus partes arriba, y nace el material en la cámara de frío: `201` con el
 * material, o `200` con el mismo si ya estaba cerrada. Si faltan partes, `409` dice cuántas.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaDesdeElTelefono(request, true)
  if (usuario instanceof NextResponse) return usuario
  return responderCerrar(usuario, (await params).id, 'mobile/cocina/subidas/[id]/cerrar')
}
