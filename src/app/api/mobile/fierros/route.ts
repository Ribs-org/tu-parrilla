import { NextResponse } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { fierrosParaElTelefono } from '@/lib/mobile-api'
import { getCuentas } from '@/lib/posts'

export const dynamic = 'force-dynamic'

/**
 * Tus cuentas con la temperatura de su fierro, y el aviso del botón de Ajustes: lo que muestran
 * Ajustes y su botón en la app (`fierrosParaElTelefono`). `getCuentas` ata la consulta
 * al dueño, y de los tokens la respuesta dice solo si existen.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  return NextResponse.json(fierrosParaElTelefono(await getCuentas(usuario.id), new Date()))
}
