import { NextResponse } from 'next/server'
import { leerResumen } from '@/lib/avisos/run'
import { opcionesDelResumen, resumenParaApi } from '@/lib/avisos/reglas'
import { duenoDeLaLlave } from '@/lib/llaves'
import { buscarPorId } from '@/lib/usuarios'
import { ZONA_POR_DEFECTO } from '@/lib/zona'

export const dynamic = 'force-dynamic'

/**
 * Lo mismo que el resumen del día que llega por correo, para un agente: lo que se quemó,
 * las cuentas que hay que reconectar y las que se están quedando sin parrilla. Sirve para
 * que quien programa por la API se entere sin abrir el panel ni el correo del dueño.
 */
export async function GET(request: Request) {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })
  const zone = (await buscarPorId(ownerId))?.zona ?? ZONA_POR_DEFECTO

  const url = new URL(request.url)
  const opciones = opcionesDelResumen(url.searchParams.get('dias'), url.searchParams.get('horas'))
  if ('error' in opciones) return NextResponse.json({ error: opciones.error }, { status: 400 })

  const ahora = new Date()
  const resumen = await leerResumen(ownerId, ahora, opciones)
  return NextResponse.json(resumenParaApi(resumen, zone, ahora, opciones))
}
