import { NextResponse } from 'next/server'
import { cocinaAutorizada, error, ESTADO_DESCONOCIDO, noAutorizado } from '@/lib/cocina/api'
import { comandasParaElChef } from '@/lib/cocina/cocina'
import { esEstado } from '@/lib/cocina/estados'

export const dynamic = 'force-dynamic'

/**
 * Las comandas en un estado (`?estado=`, por defecto `recibida`: las que esperan), con su receta,
 * lo que se pidió y sus insumos. Las que esperan vienen en el orden en que conviene tomarlas.
 */
export async function GET(request: Request) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const estado = new URL(request.url).searchParams.get('estado') ?? 'recibida'
  if (!esEstado(estado)) return error(400, ESTADO_DESCONOCIDO)
  return NextResponse.json({ comandas: await comandasParaElChef(estado) })
}
