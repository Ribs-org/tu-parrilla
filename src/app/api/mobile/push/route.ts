import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { registrarToken } from '@/lib/push/enviar'
import { registroDelCuerpo } from '@/lib/push/expo'

export const dynamic = 'force-dynamic'

/**
 * El teléfono enciende los avisos: registra su token de Expo a nombre de la cuenta del token de la
 * sesión (`{ "token": "ExponentPushToken[…]", "plataforma": "android" }`). Lo manda al encender los
 * avisos y cada vez que la app abre con ellos encendidos. Si el token estaba con otra cuenta —otra
 * persona entró en este teléfono—, pasa a esta. Responde `{ ok: true }`.
 */
export async function POST(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }
  const registro = registroDelCuerpo(cuerpo)
  if ('error' in registro) return NextResponse.json({ error: registro.error }, { status: 400 })

  await registrarToken(usuario, registro.token, registro.plataforma)
  return NextResponse.json({ ok: true })
}
