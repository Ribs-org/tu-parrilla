import 'server-only'
import { NextResponse } from 'next/server'
import { entrarConCodigo, type Pase } from './pase'
import { CUERPO_ILEGIBLE, PASE_NO_EXISTE, SOLO_EDITOR, SOLO_REVISOR, type RolDelPase } from './reglas'

// La puerta de `/api/pase/{código}`: el código abre su pase y dice qué rol tiene quien llama. Sin
// sesión ni llave: el código es la llave (el parche de permisos del diseño).

export type Entrada = { pase: Pase; rol: RolDelPase }

/** El pase del código, o la respuesta de error lista: 404 si no abre, 403 si el rol no es el que hace falta. */
export async function abrirPase(codigo: string, rolQueHaceFalta?: RolDelPase): Promise<Entrada | NextResponse> {
  const entrada = await entrarConCodigo(codigo)
  if (!entrada) return NextResponse.json({ error: PASE_NO_EXISTE }, { status: 404 })
  if (rolQueHaceFalta && entrada.rol !== rolQueHaceFalta) {
    return NextResponse.json({ error: rolQueHaceFalta === 'revisor' ? SOLO_REVISOR : SOLO_EDITOR }, { status: 403 })
  }
  return entrada
}

/** El cuerpo JSON, o la respuesta de error. */
export async function cuerpoJson(request: Request): Promise<unknown | NextResponse> {
  try {
    return await request.json()
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
}

/** Un rechazo con su frase: 404 si lo que falta es algo del pase, 400 si es el pedido. */
export function rechazo(error: string): NextResponse {
  return NextResponse.json({ error }, { status: /no está en este pase|no existe/.test(error) ? 404 : 400 })
}
