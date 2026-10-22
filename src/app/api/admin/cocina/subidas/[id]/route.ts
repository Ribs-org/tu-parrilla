import { NextResponse } from 'next/server'
import { SIN_ALMACEN } from '@/lib/storage'
import { error } from '@/lib/cocina/api'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { SUBIDA_CERRADA, SUBIDA_NO_EXISTE, abortarSubida, estadoDeSubida } from '@/lib/cocina/subidas'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** Cómo va una subida: lo que pregunta el navegador al retomarla, para no repetir las partes que llegaron. */
export async function GET(_request: Request, { params }: Params) {
  const usuario = await quienPregunta(false)
  if (usuario instanceof NextResponse) return usuario
  const { id } = await params
  try {
    const r = await estadoDeSubida(usuario, id)
    if ('falla' in r) return error(404, SUBIDA_NO_EXISTE)
    return NextResponse.json(r)
  } catch (e) {
    console.error('admin/cocina/subidas/[id]:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}

/** La aborta: el almacén borra las partes que alcanzaron a llegar. */
export async function DELETE(_request: Request, { params }: Params) {
  const usuario = await quienPregunta(false)
  if (usuario instanceof NextResponse) return usuario
  const { id } = await params
  try {
    const r = await abortarSubida(usuario, id)
    if ('falla' in r) return r.falla === 'cerrada' ? error(409, SUBIDA_CERRADA) : error(404, SUBIDA_NO_EXISTE)
    return NextResponse.json(r)
  } catch (e) {
    console.error('admin/cocina/subidas/[id] DELETE:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
