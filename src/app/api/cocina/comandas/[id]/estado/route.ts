import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { cambioDe, cocinaAutorizada, cuerpoDe, error, noAutorizado } from '@/lib/cocina/api'
import {
  COMANDA_NO_EXISTE,
  COMANDA_SIN_TOMAR,
  COMANDA_TERMINADA,
  MOTIVO_FALTA,
  cambiarEstado,
  transicionInvalida,
} from '@/lib/cocina/cocina'

export const dynamic = 'force-dynamic'

/**
 * Un cambio de estado de una comanda tomada, con su mensaje, su hora estimada y, al servir, sus
 * tandas («3 de 5»). La transición tiene que existir (`src/lib/cocina/estados.ts`).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const cambio = cambioDe(cuerpo)
  if ('error' in cambio) return error(400, cambio.error)
  const { id } = await params
  const r = await cambiarEstado(id, cambio, new Date())
  if ('falla' in r) {
    if (r.falla === 'transicion') return error(409, transicionInvalida(r.de, cambio.estado))
    if (r.falla === 'no-existe') return error(404, COMANDA_NO_EXISTE)
    if (r.falla === 'motivo') return error(400, MOTIVO_FALTA)
    return error(409, r.falla === 'sin-tomar' ? COMANDA_SIN_TOMAR : COMANDA_TERMINADA)
  }
  const c = r.comanda
  return NextResponse.json({
    ok: true,
    id: c.id,
    estado: c.estado,
    eta: c.eta?.toISOString() ?? null,
    tandas: { servidas: c.tandasServidas, total: c.tandasTotal },
  })
}
