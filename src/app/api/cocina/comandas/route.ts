import { NextResponse } from 'next/server'
import { cocinaAutorizada, error, ESTADO_DESCONOCIDO, noAutorizado } from '@/lib/cocina/api'
import { comandasParaElChef } from '@/lib/cocina/cocina'
import { esEstado } from '@/lib/cocina/estados'
import { vencerPreguntas } from '@/lib/cocina/preguntar'

export const dynamic = 'force-dynamic'

/**
 * Las comandas en un estado (`?estado=`, por defecto `recibida`: las que esperan), con su receta,
 * lo que se pidió, sus insumos y lo que el chef preguntó. Las que esperan vienen en el orden en
 * que conviene tomarlas. Antes de leer se cierran las preguntas con el plazo vencido: la comanda
 * vuelve a donde estaba, con la opción por defecto, y el chef se entera en esta misma lectura.
 */
export async function GET(request: Request) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const estado = new URL(request.url).searchParams.get('estado') ?? 'recibida'
  if (!esEstado(estado)) return error(400, ESTADO_DESCONOCIDO)
  await vencerPreguntas(new Date())
  return NextResponse.json({ comandas: await comandasParaElChef(estado) })
}
