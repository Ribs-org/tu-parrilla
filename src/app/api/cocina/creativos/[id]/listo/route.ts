import { NextResponse } from 'next/server'
import { cocinaAutorizada, error, noAutorizado } from '@/lib/cocina/api'
import { COMANDA_TERMINADA, CREATIVO_NO_EXISTE, cerrarCreativo, faltaArchivo } from '@/lib/cocina/cocina'

export const dynamic = 'force-dynamic'

/**
 * Cierra un creativo después de subir sus archivos: si están todos y pesan lo anunciado, pasa al
 * mesón del dueño. Cerrarlo otra vez no hace nada.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const { id } = await params
  const r = await cerrarCreativo(id, new Date())
  if ('falla' in r) {
    if (r.falla === 'falta') return error(409, faltaArchivo(r.nombre))
    return r.falla === 'no-existe' ? error(404, CREATIVO_NO_EXISTE) : error(409, COMANDA_TERMINADA)
  }
  return NextResponse.json(r)
}
