import { NextResponse } from 'next/server'
import { usuarioActual } from '@/lib/auth'
import { adelantoDePlanilla } from '@/lib/planilla/armar'
import { pedidoDesde } from '@/lib/planilla/pedido'

export const dynamic = 'force-dynamic'

/**
 * Lo que la ventana de «Llevar para la casa» dice antes de armar la planilla: el nombre del
 * archivo y qué hojas no caben enteras en el período elegido, para que la persona pueda acortarlo
 * antes de esperar.
 */
export async function GET(request: Request) {
  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const pedido = await pedidoDesde(new URL(request.url), usuario)
  return NextResponse.json(await adelantoDePlanilla(pedido), { headers: { 'Cache-Control': 'no-store' } })
}
