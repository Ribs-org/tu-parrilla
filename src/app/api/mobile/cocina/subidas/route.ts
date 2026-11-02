import { NextResponse } from 'next/server'
import { responderAbrir } from '@/lib/cocina/subidas-http'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'

export const dynamic = 'force-dynamic'

/**
 * Abre una subida por partes a la cámara de frío desde el teléfono: lo que se grabó o se eligió de
 * la galería. Lo mismo que el panel (`src/lib/cocina/subidas-http.ts`): `{ nombre, tipo, bytes,
 * uso, duracionS, derechos: true }`, `409` con la frase si no cabe en la cuota, y `201` con
 * cuántas partes son y de qué tamaño.
 */
export async function POST(request: Request) {
  const usuario = await quienPreguntaDesdeElTelefono(request, true)
  if (usuario instanceof NextResponse) return usuario
  return responderAbrir(usuario, request, 'mobile/cocina/subidas')
}
