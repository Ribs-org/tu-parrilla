import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE, resolverCuando } from '@/lib/mobile-api'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { DESTINO_NO_EXISTE, REPROGRAMAR_PASADO, reprogramarDestino } from '@/lib/social/publish/reprogramar'

export const dynamic = 'force-dynamic'

/**
 * «Reprogramar» desde «Se quemó» en el teléfono: `{ destino, cuando }`, el id del destino
 * quemado y la hora nueva como ISO (la app ya la resolvió en su reloj, como al programar).
 * La regla es la del panel (`reprogramarDestino`): el post entero pasa a esa hora y el
 * destino vuelve a la cola sin intentos.
 */
export async function POST(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  let body: { destino?: unknown; cuando?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
  if (typeof body.destino !== 'string' || !body.destino) {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }

  const now = new Date()
  const cuando = resolverCuando(false, typeof body.cuando === 'string' ? body.cuando : null, now)
  if (!cuando || cuando.getTime() <= now.getTime()) {
    return NextResponse.json({ error: REPROGRAMAR_PASADO }, { status: 400 })
  }

  if ((await reprogramarDestino(usuario.id, body.destino, cuando)) === 'no-existe') {
    return NextResponse.json({ error: DESTINO_NO_EXISTE }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
