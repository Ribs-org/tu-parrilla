import { NextResponse } from 'next/server'
import { pulsoDeLaCocina } from '@/lib/cocina/panel'
import { quienPregunta } from '@/lib/cocina/panel-api'

export const dynamic = 'force-dynamic'

/**
 * Si cambió algo de lo que muestra «El chef de la casa»: cuántas comandas siguen en marcha y una
 * firma que cambia con ellas. La pregunta La Cocina cada pocos segundos, con la pestaña a la vista
 * y mientras haya alguna en marcha (`ia/vigia.tsx`), y recién si la firma cambió pide la página
 * de nuevo. Con la cocina apagada, `403`: el panel deja de preguntar.
 */
export async function GET() {
  const usuario = await quienPregunta(true)
  if (usuario instanceof NextResponse) return usuario
  const pulso = await pulsoDeLaCocina(usuario.id, new Date())
  return NextResponse.json(pulso, { headers: { 'Cache-Control': 'no-store' } })
}
