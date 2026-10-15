import { NextResponse } from 'next/server'
import { DEMASIADOS_INTENTOS, normalizarCorreo } from '@/lib/ingreso'
import { demasiadosIntentos } from '@/lib/limite-ip'
import { mintMobileToken } from '@/lib/mobile-token'
import { canjear } from '@/lib/usuarios'

export const dynamic = 'force-dynamic'

/**
 * El segundo paso del ingreso del teléfono: canjea el código que pidió `session/codigo` por
 * el token. Es el mismo canje que el de /ingresar, con sus mismos topes por código y por día;
 * el freno por IP es de mejor esfuerzo, como el de la web.
 */
export async function POST(request: Request) {
  if (await demasiadosIntentos('canjear-movil', 20, 10 * 60_000)) {
    return NextResponse.json({ error: DEMASIADOS_INTENTOS }, { status: 429 })
  }

  let body: { correo?: unknown; codigo?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }

  const correo = normalizarCorreo(typeof body.correo === 'string' ? body.correo : '')
  const codigo = typeof body.codigo === 'string' ? body.codigo.replace(/\D/g, '') : ''
  if (!correo || !codigo) return NextResponse.json({ error: 'Faltan el correo o el código.' }, { status: 400 })
  const resultado = await canjear(correo, codigo)
  if ('error' in resultado) return NextResponse.json({ error: resultado.error }, { status: 401 })
  return NextResponse.json({ token: await mintMobileToken({ sub: resultado.usuario.id, sv: resultado.usuario.sesionVersion }) })
}
