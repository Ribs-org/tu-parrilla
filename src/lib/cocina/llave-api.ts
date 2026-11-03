import 'server-only'
import { NextResponse } from 'next/server'
import type { Usuario } from '@/db'
import { duenoDeLaLlave } from '@/lib/llaves'
import { buscarPorId } from '@/lib/usuarios'
import { COCINA_APAGADA } from './subidas'

// La puerta de la cámara de frío para la API (`/api/bodega…`): entra con una llave de «Tu propio
// chef», la misma de `POST /api/schedule/batch` y `POST /api/media`, y no con la cookie del panel
// (`panel-api.ts`) ni con el token del teléfono (`telefono-api.ts`). Es para que la IA del dueño
// deje en la cámara lo que hizo en su computador (#308). Todo va por el dueño de la llave: lo de
// otro no existe para quien pregunta.

/**
 * Quién pregunta, o la respuesta que hay que devolver: `401` `No autorizado` sin una llave que
 * sirva —como el resto de la API—, y `403` con la frase si la cocina no está encendida para su
 * cuenta y lo que pide la necesita (`conCocina`).
 */
export async function quienPreguntaConLlave(request: Request, conCocina: boolean): Promise<Usuario | NextResponse> {
  const ownerId = await duenoDeLaLlave(request)
  const usuario = ownerId ? await buscarPorId(ownerId) : null
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  if (conCocina && !usuario.cocinaDesde) return NextResponse.json({ error: COCINA_APAGADA }, { status: 403 })
  return usuario
}
