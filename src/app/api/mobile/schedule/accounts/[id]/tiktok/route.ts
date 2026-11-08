import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { creadorDeCuenta } from '@/lib/social/publish/tiktok-cuenta'

export const dynamic = 'force-dynamic'

/**
 * Lo que el bloque de TikTok de Publicar muestra al abrirse, la misma consulta que hace el
 * compositor del panel (`creadorDeCuenta`, que lee `creator_info`): `{ creador }` con el nombre,
 * el avatar, las privacidades que la cuenta puede elegir hoy, las interacciones bloqueadas y el
 * largo máximo de un video. Solo una cuenta de TikTok del dueño del token. Si no se pudo leer,
 * `400` con la frase del panel («No pude leer tu cuenta de TikTok.», «Reconecta TikTok para
 * autorizar la publicación.», «Conecta TikTok en Los Fierros antes de programar.»): el bloque la
 * muestra y ofrece las cuatro privacidades, como el panel, porque el publicador vuelve a
 * consultar antes de subir.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const r = await creadorDeCuenta(usuario.id, (await params).id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json({ creador: r.creador })
}
