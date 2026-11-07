import { NextResponse } from 'next/server'
import { codigoDeLaMesa } from '@/lib/comentarios-movil'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { COMENTARIO_AUSENTE } from '@/lib/social/comentarios/comentarista'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/**
 * «Escribir otro borrador» (o «Reintentar borrador») desde el teléfono, como la flecha del panel
 * (`redactarUno`): la IA vuelve a escribir el borrador con las instrucciones guardadas y queda en
 * la fila. `{ ok: true }` —la app vuelve a leer la cola para verlo—, o `502` con «No se pudo
 * redactar la respuesta.». La respuesta automática fallida no tiene este botón en ninguna parte.
 */
export async function POST(request: Request, { params }: Params) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const { id } = await params
  if (!esUuid(id)) return NextResponse.json({ error: COMENTARIO_AUSENTE }, { status: 404 })
  const { redactarUno } = await import('@/lib/social/comentarios/redaccion')
  const r = await redactarUno(usuario.id, id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: codigoDeLaMesa(r.error) })
  return NextResponse.json({ ok: true })
}
