import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { cancionDeLaCuenta } from '@/lib/musica-instagram'

export const dynamic = 'force-dynamic'

/**
 * Una canción por su id, con su muestra al día, para escuchar la de un borrador (que no guarda
 * la muestra: vence). `{ cancion }`, null si Instagram ya no la tiene.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const cuenta = new URL(request.url).searchParams.get('cuenta')
  const r = await cancionDeLaCuenta(usuario.id, cuenta, (await params).id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ cancion: r.cancion })
}
