import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { COMENTARIO_AUSENTE } from '@/lib/social/comentarios/comentarista'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/**
 * «Descartar» desde el teléfono, como en el panel (`descartarComentario`): no se publica nada y el
 * comentario pasa a «Descartados». Uno que ya salió, ya se descartó o no es del dueño no cambia, y
 * la respuesta es la misma: `{ ok: true }`.
 */
export async function POST(request: Request, { params }: Params) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const { id } = await params
  if (!esUuid(id)) return NextResponse.json({ error: COMENTARIO_AUSENTE }, { status: 404 })
  const { descartarComentario } = await import('@/lib/social/comentarios/responder')
  await descartarComentario(usuario.id, id)
  return NextResponse.json({ ok: true })
}
