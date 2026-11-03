import { NextResponse } from 'next/server'
import { quienPreguntaConLlave } from '@/lib/cocina/llave-api'
import { responderAbrir } from '@/lib/cocina/subidas-http'

export const dynamic = 'force-dynamic'

/**
 * Abre una subida por partes a la cámara de frío con una llave de la API. Lo mismo que el panel y
 * el teléfono (`src/lib/cocina/subidas-http.ts`): `{ nombre, tipo, bytes, uso, duracionS,
 * derechos: true }`, `409` con la frase si no cabe en la cuota, y `201` con cuántas partes son y
 * de qué tamaño. La casilla de los derechos va en cada llamada, como en el panel: la marca quien
 * manda el archivo, no la llave.
 */
export async function POST(request: Request) {
  const usuario = await quienPreguntaConLlave(request, true)
  if (usuario instanceof NextResponse) return usuario
  return responderAbrir(usuario, request, 'bodega/subidas')
}
