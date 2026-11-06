import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { marcarRespuestaLeida } from '@/lib/sugerencias/responder'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

/**
 * La persona abrió en el teléfono la respuesta del equipo: deja de estar sin leer, como en la
 * ventana del panel. Atada a su dueño: el id de otra persona no marca nada. Responde
 * `{ ok: true }` aunque ya estuviera leída.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const { id } = await params
  if (!esUuid(id)) return NextResponse.json({ error: 'No se encontró esa sugerencia.' }, { status: 404 })
  await marcarRespuestaLeida(usuario.id, id)
  return NextResponse.json({ ok: true })
}
