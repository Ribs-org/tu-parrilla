import { NextResponse } from 'next/server'
import { cuerpoDe, error } from '@/lib/cocina/api'
import { CREATIVO_NO_ESTA, descartarCreativo, leerDescarte } from '@/lib/cocina/meson'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

/**
 * «Descartar» un creativo del mesón desde el teléfono: `{ "motivo": "corte" | "letra" | "tema" |
 * "audio", "nota": "…" }`, lo mismo que el panel (`descartarCreativoPropio`). El motivo y la nota le
 * quedan al chef, los archivos se borran y, si era lo último de una comanda lista, la comanda queda
 * servida. No pide la cocina encendida, como en el panel. `400` con la frase si falta el motivo o la
 * nota es larga; `404` si ya no está en el mesón o no es del dueño del token.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const { id } = await params
  if (!esUuid(id)) return error(404, CREATIVO_NO_ESTA)
  const descarte = leerDescarte(cuerpo.motivo, cuerpo.nota)
  if ('error' in descarte) return error(400, descarte.error)
  const r = await descartarCreativo(usuario.id, id, descarte.motivo, descarte.nota, new Date())
  if ('falla' in r) return error(404, CREATIVO_NO_ESTA)
  return NextResponse.json({ ok: true })
}
