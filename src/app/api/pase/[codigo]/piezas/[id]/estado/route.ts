import { NextResponse } from 'next/server'
import { darVeredicto } from '@/lib/pase/pase'
import { abrirPase, cuerpoJson, rechazo } from '@/lib/pase/http'

export const dynamic = 'force-dynamic'

/** El veredicto de quien revisa: `{ estado, autor }`, con `estado` en_revision, aprobada, cambios o descartada. */
export async function PUT(request: Request, { params }: { params: Promise<{ codigo: string; id: string }> }) {
  const { codigo, id } = await params
  const entrada = await abrirPase(codigo, 'revisor')
  if (entrada instanceof NextResponse) return entrada
  const cuerpo = await cuerpoJson(request)
  if (cuerpo instanceof NextResponse) return cuerpo
  const c = (cuerpo ?? {}) as Record<string, unknown>
  const r = await darVeredicto(entrada.pase, id, c.estado, c.autor)
  if ('error' in r) return rechazo(r.error)
  return NextResponse.json({ ok: true, id: r.pieza.id, estado: r.pieza.estado })
}
