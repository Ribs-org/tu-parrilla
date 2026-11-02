import { NextResponse } from 'next/server'
import { responderPartes } from '@/lib/cocina/subidas-http'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'

export const dynamic = 'force-dynamic'

/**
 * Un PUT firmado por cada parte pedida (`{ "partes": [1, 2, 3] }`), con lo que tiene que pesar. El
 * teléfono sube cada parte directo al almacén: ningún byte del video cruza el servidor.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaDesdeElTelefono(request, true)
  if (usuario instanceof NextResponse) return usuario
  return responderPartes(usuario, request, (await params).id, 'mobile/cocina/subidas/[id]/partes')
}
