import { NextResponse } from 'next/server'
import { quienPreguntaConLlave } from '@/lib/cocina/llave-api'
import { responderPartes } from '@/lib/cocina/subidas-http'

export const dynamic = 'force-dynamic'

/**
 * Un PUT firmado por cada parte pedida (`{ "partes": [1, 2, 3] }`, hasta 50 por pedido), con lo
 * que tiene que pesar. Se manda solo los bytes de la parte: sin cabeceras, porque ninguna va en la
 * firma.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaConLlave(request, true)
  if (usuario instanceof NextResponse) return usuario
  return responderPartes(usuario, request, (await params).id, 'bodega/subidas/[id]/partes')
}
