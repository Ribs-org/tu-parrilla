import { NextResponse } from 'next/server'
import { quienPreguntaConLlave } from '@/lib/cocina/llave-api'
import { responderAbortar, responderEstado } from '@/lib/cocina/subidas-http'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** Cómo va una subida: cuáles partes llegaron, para retomarla sin repetirlas, y el material si ya se cerró. */
export async function GET(request: Request, { params }: Params) {
  const usuario = await quienPreguntaConLlave(request, false)
  if (usuario instanceof NextResponse) return usuario
  return responderEstado(usuario, (await params).id, 'bodega/subidas/[id]')
}

/** La aborta: el almacén borra las partes que alcanzaron a llegar, y su lugar en la cuota se libera. */
export async function DELETE(request: Request, { params }: Params) {
  const usuario = await quienPreguntaConLlave(request, false)
  if (usuario instanceof NextResponse) return usuario
  return responderAbortar(usuario, (await params).id, 'bodega/subidas/[id] DELETE')
}
