import 'server-only'
import { NextResponse } from 'next/server'
import type { Usuario } from '@/db'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { COCINA_APAGADA } from './subidas'

// La puerta de La Cocina para la app del teléfono (`/api/mobile/cocina/…`): entra con el token de
// la sesión del teléfono, como el resto de `/api/mobile`, y no con la cookie del panel
// (`panel-api.ts`) ni con la credencial del chef. Todo lo que se hace adentro va por el usuario de
// ese token: lo de otro no existe para quien pregunta.

/**
 * Quién pregunta, o la respuesta que hay que devolver: `401` sin token válido —que la app lee como
 * sesión caducada—, y `403` con la frase si la cocina no está encendida para su cuenta y lo que
 * pide la necesita (`conCocina`).
 */
export async function quienPreguntaDesdeElTelefono(request: Request, conCocina: boolean): Promise<Usuario | NextResponse> {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  if (conCocina && !usuario.cocinaDesde) return NextResponse.json({ error: COCINA_APAGADA }, { status: 403 })
  return usuario
}
