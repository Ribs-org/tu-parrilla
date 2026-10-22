import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { cocinaAutorizada, cuerpoDe, error, noAutorizado, TRABAJADOR_FALTA, trabajadorDe } from '@/lib/cocina/api'
import { latir } from '@/lib/cocina/cocina'

export const dynamic = 'force-dynamic'

/**
 * El chef dice que está vivo, con lo que cuenta de sí (`datos`: cuántos trabajos tiene, cuánto
 * tarda una comanda en promedio, su versión). Si pasan diez minutos sin latido, el panel dice que
 * la cocina está cerrada por ahora.
 */
export async function POST(request: Request) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const trabajador = trabajadorDe(cuerpo)
  if (!trabajador) return error(400, TRABAJADOR_FALTA)
  const datos = cuerpo.datos
  if (datos !== undefined && datos !== null && (typeof datos !== 'object' || Array.isArray(datos) || JSON.stringify(datos).length > 2000)) {
    return error(400, CUERPO_ILEGIBLE)
  }
  const ahora = new Date()
  await latir(trabajador, (datos as Record<string, unknown> | undefined) ?? null, ahora)
  return NextResponse.json({ ok: true, en: ahora.toISOString() })
}
