import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, users } from '@/db'
import { requireMobileUser } from '@/lib/mobile-guardia'

export const dynamic = 'force-dynamic'

export const ENCENDIDO_INVALIDO = '«encendido» tiene que ser true o false.'

/**
 * Los avisos de lo bueno de «Lo que trajo» (`src/lib/push/bueno.ts`), que se apagan aparte de los
 * demás: `GET` dice si están encendidos (`{ encendido }`); `PUT` (`{ "encendido": false }`) los
 * cambia desde Ajustes de la app. Es de la cuenta, no del teléfono: vale para todos sus teléfonos.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  return NextResponse.json({ encendido: usuario.pushBueno })
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
  const encendido = cuerpo && typeof cuerpo === 'object' ? (cuerpo as { encendido?: unknown }).encendido : undefined
  if (typeof encendido !== 'boolean') return NextResponse.json({ error: ENCENDIDO_INVALIDO }, { status: 400 })

  await getDb().update(users).set({ pushBueno: encendido }).where(eq(users.id, usuario.id))
  return NextResponse.json({ encendido })
}
