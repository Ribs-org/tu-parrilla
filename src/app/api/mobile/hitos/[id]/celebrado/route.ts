import { NextResponse } from 'next/server'
import { HITO_NO_ESTA, celebrar } from '@/lib/hitos'
import { requireMobileUser } from '@/lib/mobile-guardia'

export const dynamic = 'force-dynamic'

/**
 * La app mostró la celebración de un hito: queda celebrado, junto con los más bajos del mismo corte
 * que esperaban (`src/lib/hitos.ts`), y no se vuelve a celebrar. Contesta `{ celebrado: true }`, o
 * 404 si el hito no es del dueño o no existe.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  if (!(await celebrar(usuario.id, (await params).id, new Date()))) {
    return NextResponse.json({ error: HITO_NO_ESTA }, { status: 404 })
  }
  return NextResponse.json({ celebrado: true })
}
