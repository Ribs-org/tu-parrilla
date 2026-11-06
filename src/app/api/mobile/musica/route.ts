import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { musicaDeLaCuenta } from '@/lib/musica-instagram'

export const dynamic = 'force-dynamic'

/**
 * «Música de Instagram» en Publicar: lo que está sonando (sin `q`) o lo que encuentra una
 * búsqueda, para la cuenta `cuenta`. La cuenta tiene que ser del dueño del token, de Instagram y
 * conectada con Facebook; si no, 400 con la frase. `{ canciones: [...] }`, cada una con su
 * `muestra` (el link de día y medio para escucharla) o null.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const url = new URL(request.url)
  const r = await musicaDeLaCuenta(usuario.id, url.searchParams.get('cuenta'), url.searchParams.get('q'))
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ canciones: r.canciones })
}
