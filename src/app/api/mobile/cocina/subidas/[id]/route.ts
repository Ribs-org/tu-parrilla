import { NextResponse } from 'next/server'
import { responderAbortar, responderEstado } from '@/lib/cocina/subidas-http'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** Cómo va una subida del teléfono: qué partes llegaron, para retomarla sin repetirlas. */
export async function GET(request: Request, { params }: Params) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  return responderEstado(usuario, (await params).id, 'mobile/cocina/subidas/[id]')
}

/** La aborta: el almacén borra las partes que alcanzaron a llegar, y su lugar en la cuota se libera. */
export async function DELETE(request: Request, { params }: Params) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  return responderAbortar(usuario, (await params).id, 'mobile/cocina/subidas/[id] DELETE')
}
