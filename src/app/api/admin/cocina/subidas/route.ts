import { NextResponse } from 'next/server'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { responderAbrir } from '@/lib/cocina/subidas-http'

export const dynamic = 'force-dynamic'

/**
 * Abre una subida por partes a la cámara de frío desde el panel. Lo que valida y responde es lo
 * mismo que en la app del teléfono (`src/lib/cocina/subidas-http.ts`); los enlaces de cada parte
 * se piden después (`/partes`).
 */
export async function POST(request: Request) {
  const usuario = await quienPregunta(true)
  if (usuario instanceof NextResponse) return usuario
  return responderAbrir(usuario, request, 'admin/cocina/subidas')
}
