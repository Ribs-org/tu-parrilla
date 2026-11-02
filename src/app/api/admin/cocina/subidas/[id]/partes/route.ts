import { NextResponse } from 'next/server'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { responderPartes } from '@/lib/cocina/subidas-http'

export const dynamic = 'force-dynamic'

/**
 * Un PUT firmado por cada parte pedida (`{ "partes": [1, 2, 3] }`), con lo que tiene que pesar.
 * El navegador manda solo los bytes de la parte: sin cabeceras, porque ninguna va en la firma.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPregunta(true)
  if (usuario instanceof NextResponse) return usuario
  return responderPartes(usuario, request, (await params).id, 'admin/cocina/subidas/[id]/partes')
}
