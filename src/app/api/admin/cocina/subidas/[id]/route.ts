import { NextResponse } from 'next/server'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { responderAbortar, responderEstado } from '@/lib/cocina/subidas-http'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** Cómo va una subida: lo que pregunta el navegador al retomarla, para no repetir las partes que llegaron. */
export async function GET(_request: Request, { params }: Params) {
  const usuario = await quienPregunta(false)
  if (usuario instanceof NextResponse) return usuario
  return responderEstado(usuario, (await params).id, 'admin/cocina/subidas/[id]')
}

/** La aborta: el almacén borra las partes que alcanzaron a llegar. */
export async function DELETE(_request: Request, { params }: Params) {
  const usuario = await quienPregunta(false)
  if (usuario instanceof NextResponse) return usuario
  return responderAbortar(usuario, (await params).id, 'admin/cocina/subidas/[id] DELETE')
}
