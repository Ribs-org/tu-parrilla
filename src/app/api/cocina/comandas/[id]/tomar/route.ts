import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { cocinaAutorizada, cuerpoDe, error, noAutorizado, TRABAJADOR_FALTA, trabajadorDe } from '@/lib/cocina/api'
import { COMANDA_DE_OTRO, COMANDA_NO_EXISTE, COMANDA_TERMINADA, tomarComanda } from '@/lib/cocina/cocina'

export const dynamic = 'force-dynamic'

/** La toma: de `recibida` a `revisando`, para un trabajador. Repetirla el mismo trabajador no hace nada. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const trabajador = trabajadorDe(cuerpo)
  if (!trabajador) return error(400, TRABAJADOR_FALTA)
  const { id } = await params
  const r = await tomarComanda(id, trabajador, new Date())
  if ('falla' in r) {
    if (r.falla === 'no-existe') return error(404, COMANDA_NO_EXISTE)
    return error(409, r.falla === 'terminada' ? COMANDA_TERMINADA : COMANDA_DE_OTRO)
  }
  return NextResponse.json({ ok: true, id: r.comanda.id, estado: r.comanda.estado, tomadaPor: r.comanda.tomadaPor })
}
