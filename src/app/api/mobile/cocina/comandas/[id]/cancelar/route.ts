import { NextResponse } from 'next/server'
import { error } from '@/lib/cocina/api'
import { cancelarLaComanda } from '@/lib/cocina/del-dueno'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'

export const dynamic = 'force-dynamic'

/**
 * «Cancelar la comanda» desde el teléfono: la misma regla del panel (`src/lib/cocina/del-dueno.ts`),
 * mientras no esté en el horno. No pide la cocina encendida: si el admin la apagó, igual se puede
 * cancelar. `404` si no es del dueño del token, `409` con la frase si ya está en el horno o terminó.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  const r = await cancelarLaComanda(usuario.id, (await params).id, new Date())
  if ('error' in r) return error(r.codigo, r.error)
  return NextResponse.json({ ok: true })
}
