import { NextResponse } from 'next/server'
import type { Usuario } from '@/db'
import { usuarioActual } from '@/lib/auth'
import { COCINA_APAGADA } from './subidas'

// Lo que comparten las rutas de La Cocina que llama el panel desde el navegador
// (`/api/admin/cocina/…`): entran con la cookie de la sesión, como `/api/admin/upload-url`, y no
// con la credencial del chef. Responden JSON, también al fallar: las llama `fetch`, que no tiene
// adónde ir con un redirect.

/**
 * Quién pregunta, o la respuesta que hay que devolver: `401` sin sesión, y `403` si la cocina no
 * está encendida para su cuenta y lo que pide la necesita (`conCocina`). Sacar lo que uno mismo
 * subió no la necesita: si el admin la apagó entre medio, el usuario igual puede limpiar.
 */
export async function quienPregunta(conCocina: boolean): Promise<Usuario | NextResponse> {
  const usuario = await usuarioActual()
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (conCocina && !usuario.cocinaDesde) return NextResponse.json({ error: COCINA_APAGADA }, { status: 403 })
  return usuario
}
