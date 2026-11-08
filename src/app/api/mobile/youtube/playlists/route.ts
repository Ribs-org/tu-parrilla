import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { playlistsDeLaCuenta } from '@/lib/playlists-youtube'

export const dynamic = 'force-dynamic'

/**
 * «Agregar a una playlist» en Publicar: las playlists del canal `cuenta`, `{ playlists: [{ id,
 * titulo }] }`. La cuenta tiene que ser del dueño del token, de YouTube y conectada; si no, 400 con
 * la frase. Con `fresca=1` se salta la memoria de unos minutos («Volver a cargar»).
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const url = new URL(request.url)
  const r = await playlistsDeLaCuenta(usuario.id, url.searchParams.get('cuenta'), {
    fresca: url.searchParams.get('fresca') === '1',
  })
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ playlists: r.playlists })
}
