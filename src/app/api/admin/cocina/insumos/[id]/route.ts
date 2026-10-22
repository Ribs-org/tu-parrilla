import { NextResponse } from 'next/server'
import { SIN_ALMACEN } from '@/lib/storage'
import { error } from '@/lib/cocina/api'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { INSUMO_EN_COMANDA, INSUMO_SUELTO_NO_EXISTE, borrarInsumoSuelto } from '@/lib/cocina/subidas'

export const dynamic = 'force-dynamic'

/** Saca un archivo subido que todavía no es parte de ninguna comanda, y lo borra del almacén. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPregunta(false)
  if (usuario instanceof NextResponse) return usuario
  const { id } = await params
  try {
    const r = await borrarInsumoSuelto(usuario, id)
    if ('falla' in r) return r.falla === 'en-comanda' ? error(409, INSUMO_EN_COMANDA) : error(404, INSUMO_SUELTO_NO_EXISTE)
    return NextResponse.json(r)
  } catch (e) {
    console.error('admin/cocina/insumos/[id] DELETE:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
