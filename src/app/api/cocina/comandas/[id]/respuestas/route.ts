import { NextResponse } from 'next/server'
import { cocinaAutorizada, error, noAutorizado } from '@/lib/cocina/api'
import { COMANDA_NO_EXISTE, comandaDelChef, preguntasDeComandas } from '@/lib/cocina/cocina'
import { vencerPreguntas } from '@/lib/cocina/preguntar'

export const dynamic = 'force-dynamic'

/**
 * Lo que el chef preguntó en una comanda y lo que le contestaron, de la más vieja a la más nueva,
 * con el estado en que quedó la comanda. Antes de leer se cierran las preguntas con el plazo
 * vencido (`vencerPreguntas`): una que pasó su plazo vuelve respondida con su opción por defecto, y
 * lo dice (`porPlazo: true`).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  await vencerPreguntas(new Date())
  const { id } = await params
  const comanda = await comandaDelChef(id)
  if (!comanda) return error(404, COMANDA_NO_EXISTE)
  const preguntas = (await preguntasDeComandas([comanda.id])).get(comanda.id) ?? []
  return NextResponse.json({ id: comanda.id, estado: comanda.estado, preguntas })
}
