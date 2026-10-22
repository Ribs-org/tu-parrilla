import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { SIN_ALMACEN } from '@/lib/storage'
import { cocinaAutorizada, cuerpoDe, error, noAutorizado } from '@/lib/cocina/api'
import { COMANDA_NO_EXISTE, COMANDA_SIN_TOMAR, COMANDA_TERMINADA, anunciarCreativo } from '@/lib/cocina/cocina'
import { leerCreativo } from '@/lib/cocina/creativo'

export const dynamic = 'force-dynamic'

/**
 * Anuncia un creativo de una comanda en curso: sus archivos, su pieza, su tanda, sus textos y su
 * estilo. Devuelve un PUT firmado por archivo, en la carpeta del dueño; después de subir, se cierra
 * con `POST /api/cocina/creativos/{id}/listo`. `201` si lo creó; `200` si esa `ref` ya existía.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const datos = leerCreativo(cuerpo)
  if ('error' in datos) return error(400, datos.error)
  const { id } = await params
  try {
    const r = await anunciarCreativo(id, datos, new Date())
    if ('falla' in r) {
      if (r.falla === 'no-existe') return error(404, COMANDA_NO_EXISTE)
      return error(409, r.falla === 'sin-tomar' ? COMANDA_SIN_TOMAR : COMANDA_TERMINADA)
    }
    const { nuevo, ...cuerpo } = r
    return NextResponse.json(cuerpo, { status: nuevo ? 201 : 200 })
  } catch (e) {
    console.error('api/cocina/creativos:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
