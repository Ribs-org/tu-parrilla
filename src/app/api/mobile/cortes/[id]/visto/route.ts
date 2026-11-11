import { NextResponse } from 'next/server'
import { CORTE_NO_ESTA, marcarVisto } from '@/lib/lo-que-trajo'
import { requireMobileUser } from '@/lib/mobile-guardia'

export const dynamic = 'force-dynamic'

/**
 * El dueño miró el corte: queda la marca (`cortes_vistos`) y su circulito vuelve a cero. Devuelve
 * `{ numero }`, el del ícono que queda. 404 si el corte no es suyo o no salió.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const numero = await marcarVisto(usuario.id, (await params).id, new Date())
  if (numero === null) return NextResponse.json({ error: CORTE_NO_ESTA }, { status: 404 })
  return NextResponse.json({ numero })
}
