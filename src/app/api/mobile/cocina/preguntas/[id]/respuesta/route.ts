import { NextResponse } from 'next/server'
import { cuerpoDe, error } from '@/lib/cocina/api'
import { PREGUNTA_NO_ESPERA } from '@/lib/cocina/pregunta'
import { responderPregunta } from '@/lib/cocina/preguntar'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'

export const dynamic = 'force-dynamic'

/**
 * Contestarle al chef desde el teléfono: `{ "respuesta": "…" }`, una de las opciones o el texto
 * libre. La comanda vuelve a donde estaba y el chef lo lee en su próxima vuelta. No pide la cocina
 * encendida, como cancelar: si el admin la apagó entre medio, igual se puede contestar. `409` con
 * la frase si la pregunta ya no espera (se contestó, pasó su plazo, se canceló la comanda); `400`
 * si la respuesta no vale.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const { id } = await params
  const r = await responderPregunta(usuario.id, id, cuerpo.respuesta, new Date())
  if ('error' in r) return error(r.error === PREGUNTA_NO_ESPERA ? 409 : 400, r.error)
  return NextResponse.json({ ok: true })
}
