import { NextResponse } from 'next/server'
import { quienPreguntaConLlave } from '@/lib/cocina/llave-api'
import { responderCerrar } from '@/lib/cocina/subidas-http'

export const dynamic = 'force-dynamic'

/**
 * La cierra con todas sus partes arriba, y nace el material en la cámara de frío: `201` con el
 * material, o `200` con el mismo si ya estaba cerrada. Si faltan partes, `409` dice cuántas.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaConLlave(request, true)
  if (usuario instanceof NextResponse) return usuario
  return responderCerrar(usuario, (await params).id, 'bodega/subidas/[id]/cerrar')
}
