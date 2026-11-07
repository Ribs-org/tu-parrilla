import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { borrarToken } from '@/lib/push/enviar'
import { TOKEN_INVALIDO, esTokenDeExpo } from '@/lib/push/expo'

export const dynamic = 'force-dynamic'

/**
 * El teléfono apaga los avisos o cierra la sesión: borra su token, solo si es de esta cuenta. El
 * token va en la ruta, codificado (`encodeURIComponent`). Responde `{ ok: true }` aunque ya no
 * estuviera: lo que se quería es que no quede.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const { token: crudo } = await params
  let token: string
  try {
    // Next ya entrega el segmento decodificado; decodificar otra vez no cambia un token de Expo, que no lleva «%».
    token = decodeURIComponent(crudo)
  } catch {
    return NextResponse.json({ error: TOKEN_INVALIDO }, { status: 400 })
  }
  if (!esTokenDeExpo(token)) return NextResponse.json({ error: TOKEN_INVALIDO }, { status: 400 })
  await borrarToken(usuario.id, token)
  return NextResponse.json({ ok: true })
}
