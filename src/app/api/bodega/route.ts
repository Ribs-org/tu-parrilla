import { NextResponse } from 'next/server'
import { quienPreguntaConLlave } from '@/lib/cocina/llave-api'
import { materialesDeLaCamara } from '@/lib/cocina/materiales'
import { usoDeLaCamara } from '@/lib/cocina/subidas'

export const dynamic = 'force-dynamic'

/**
 * Lo que hay en la cámara de frío del dueño de la llave, de lo más nuevo a lo más viejo, y cuánto
 * le cabe: lo que una IA lee antes de subir, para no repetir lo que ya guardó ni pasarse de la
 * cuota. Cada material con cuántas comandas en marcha lo usan. Con la cocina apagada, `403`.
 */
export async function GET(request: Request) {
  const usuario = await quienPreguntaConLlave(request, true)
  if (usuario instanceof NextResponse) return usuario
  // En serie, como el resto de la cocina (`src/lib/cocina/panel.ts`).
  const materiales = await materialesDeLaCamara(usuario.id)
  const camara = await usoDeLaCamara(usuario.id)
  return NextResponse.json({ camara, materiales }, { headers: { 'Cache-Control': 'no-store' } })
}
