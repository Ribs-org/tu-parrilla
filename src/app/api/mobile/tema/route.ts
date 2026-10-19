import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, users } from '@/db'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { TEMA_INVALIDO, temaDelCuerpo } from '@/lib/tema'

export const dynamic = 'force-dynamic'

/**
 * El modo de la cuenta, para la app del teléfono: la noche o el día con sushi. Es el mismo que
 * cambia el botón de la barra del panel, así que el teléfono y el panel van juntos. `GET` lo
 * lee; `PUT` (`{ "tema": "dia" }`) lo cambia desde Ajustes. Solo toca la fila del dueño del
 * token, como `guardarTema` en el panel.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  return NextResponse.json({ tema: usuario.tema })
}

export async function PUT(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }
  const tema = temaDelCuerpo(cuerpo)
  if (!tema) return NextResponse.json({ error: TEMA_INVALIDO }, { status: 400 })

  await getDb().update(users).set({ tema }).where(eq(users.id, usuario.id))
  return NextResponse.json({ tema })
}
