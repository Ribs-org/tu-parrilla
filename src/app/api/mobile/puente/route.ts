import { NextResponse } from 'next/server'
import { DEMASIADOS_INTENTOS } from '@/lib/ingreso'
import { demasiadosIntentos } from '@/lib/limite-ip'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { abrirPuente } from '@/lib/puente'

export const dynamic = 'force-dynamic'

/**
 * El puente al panel: una dirección de un solo uso, que vale dos minutos, para abrir Los Fierros
 * en el navegador del teléfono con la sesión ya abierta (`lib/puente.ts`). La llave va en el
 * fragmento (`#t=`), que el navegador no manda: no queda en los registros ni en un Referer.
 */
export async function POST(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  if (await demasiadosIntentos('puente', 20, 10 * 60_000)) {
    return NextResponse.json({ error: DEMASIADOS_INTENTOS }, { status: 429 })
  }
  return NextResponse.json({ ruta: `/ingresar/puente#t=${await abrirPuente(usuario.id)}` })
}
