import { NextResponse } from 'next/server'
import { codigoDeLaMesa } from '@/lib/comentarios-movil'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { COMENTARIO_AUSENTE } from '@/lib/social/comentarios/comentarista'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/**
 * «Enviar» desde el teléfono: `{ "texto": "…" }`. Lo mismo que el botón del panel
 * (`responderComentario`): se publica en la red como respuesta al comentario, a nombre de la
 * cuenta conectada, con el largo de esa red; dos toques dan un solo envío. `{ ok: true }`, o la
 * frase del panel con su código (`codigoDeLaMesa`). Un comentario de otro dueño no existe.
 */
export async function POST(request: Request, { params }: Params) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const { id } = await params
  if (!esUuid(id)) return NextResponse.json({ error: COMENTARIO_AUSENTE }, { status: 404 })
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
  const texto = (cuerpo as { texto?: unknown } | null)?.texto
  if (typeof texto !== 'string') return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  // Diferido, como en el panel: carga los conectores de cada red solo cuando alguien manda.
  const { responderComentario } = await import('@/lib/social/comentarios/responder')
  const r = await responderComentario(usuario.id, id, texto)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: codigoDeLaMesa(r.error) })
  return NextResponse.json({ ok: true })
}
