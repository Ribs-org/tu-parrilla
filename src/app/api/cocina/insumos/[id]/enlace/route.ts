import { NextResponse } from 'next/server'
import { SIN_ALMACEN } from '@/lib/storage'
import { cocinaAutorizada, error, noAutorizado } from '@/lib/cocina/api'
import { COMANDA_SIN_TOMAR, COMANDA_TERMINADA, INSUMO_NO_EXISTE, enlaceDeInsumo } from '@/lib/cocina/cocina'

export const dynamic = 'force-dynamic'

/** Un enlace firmado para bajar un insumo de una comanda tomada. Vence en una hora: se pide cuando se va a bajar. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const { id } = await params
  try {
    const r = await enlaceDeInsumo(id, new Date())
    if ('falla' in r) {
      if (r.falla === 'no-existe') return error(404, INSUMO_NO_EXISTE)
      return error(409, r.falla === 'sin-tomar' ? COMANDA_SIN_TOMAR : COMANDA_TERMINADA)
    }
    return NextResponse.json(r)
  } catch (e) {
    console.error('api/cocina/insumos/enlace:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
