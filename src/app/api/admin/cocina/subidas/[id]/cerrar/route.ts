import { NextResponse } from 'next/server'
import { SIN_ALMACEN } from '@/lib/storage'
import { error } from '@/lib/cocina/api'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { SUBIDA_MAL_CERRADA, SUBIDA_NO_EXISTE, cerrarSubida, faltanPartes } from '@/lib/cocina/subidas'

export const dynamic = 'force-dynamic'

/**
 * La cierra con todas sus partes arriba, y nace el insumo, todavía sin comanda: `201` con el
 * insumo, o `200` con el mismo si ya estaba cerrada. Si faltan partes, `409` dice cuántas.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPregunta(true)
  if (usuario instanceof NextResponse) return usuario
  const { id } = await params
  try {
    const r = await cerrarSubida(usuario, id, new Date())
    if ('falla' in r) {
      if (r.falla === 'faltan') return error(409, faltanPartes(r.faltan))
      return r.falla === 'mal-cerrada' ? error(409, SUBIDA_MAL_CERRADA) : error(404, SUBIDA_NO_EXISTE)
    }
    return NextResponse.json({ insumo: r.insumo }, { status: r.nuevo ? 201 : 200 })
  } catch (e) {
    console.error('admin/cocina/subidas/[id]/cerrar:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
