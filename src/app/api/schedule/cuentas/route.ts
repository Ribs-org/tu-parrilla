import { NextResponse } from 'next/server'
import { cuentasParaApi } from '@/lib/cuentas-api'
import { duenoDeLaLlave } from '@/lib/llaves'
import { getCuentas } from '@/lib/posts'
import { buscarPorId } from '@/lib/usuarios'
import { ZONA_POR_DEFECTO } from '@/lib/zona'

export const dynamic = 'force-dynamic'

/**
 * Las cuentas del dueño de la llave, con el id de Tu Parrilla y el de la red, y cómo está la
 * conexión de cada una. Antes un agente solo veía el id de una cuenta pasando por un post ya
 * programado (`GET /api/schedule/posts`), y una cuenta recién conectada no tenía ninguno: había
 * que pedirle al dueño que lo copiara de Los Fierros.
 */
export async function GET(request: Request) {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })
  const [dueno, cuentas] = await Promise.all([buscarPorId(ownerId), getCuentas(ownerId)])
  const zona = dueno?.zona ?? ZONA_POR_DEFECTO
  return NextResponse.json({ cuentas: cuentasParaApi(cuentas, zona, new Date()) })
}
