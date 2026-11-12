import { NextResponse } from 'next/server'
import { duenoDeLaLlave } from '@/lib/llaves'
import { mesDelDueno } from '@/lib/planes/plan'
import { planParaApi } from '@/lib/planes/plan-api'
import { usoDelPlan } from '@/lib/planes/uso'

export const dynamic = 'force-dynamic'

/**
 * El plan del dueño de la llave, con cada tope y lo que lleva usado (`planParaApi`). Para saber,
 * antes de mandar una tanda, si cabe —`esperando.libres` contra las filas del lote—, y para
 * comprobar un cambio de plan sin programar nada. Antes el tope solo se descubría cuando el lote
 * rechazaba filas.
 */
export async function GET(request: Request) {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })
  const ahora = new Date()
  const uso = await usoDelPlan(ownerId, ahora)
  return NextResponse.json(planParaApi(uso, ahora, mesDelDueno(ahora, uso.persona.zona)))
}
