import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { SIN_ALMACEN } from '@/lib/storage'
import { cuerpoDe, error } from '@/lib/cocina/api'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { PARTES_ILEGIBLES, SUBIDA_CERRADA, SUBIDA_NO_EXISTE, firmarPartes } from '@/lib/cocina/subidas'

export const dynamic = 'force-dynamic'

/**
 * Un PUT firmado por cada parte pedida (`{ "partes": [1, 2, 3] }`), con lo que tiene que pesar.
 * El navegador manda solo los bytes de la parte: sin cabeceras, porque ninguna va en la firma.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await quienPregunta(true)
  if (usuario instanceof NextResponse) return usuario
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const { id } = await params
  try {
    const r = await firmarPartes(usuario, id, cuerpo.partes, new Date())
    if ('falla' in r) {
      if (r.falla === 'ilegibles') return error(400, PARTES_ILEGIBLES)
      return r.falla === 'cerrada' ? error(409, SUBIDA_CERRADA) : error(404, SUBIDA_NO_EXISTE)
    }
    return NextResponse.json(r)
  } catch (e) {
    console.error('admin/cocina/subidas/[id]/partes:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
