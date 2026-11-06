import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { leerPedidoDeSugerencia, sugerenciaParaLaCuenta } from '@/lib/musica-instagram'

export const dynamic = 'force-dynamic'

/**
 * «Sugiéreme una» y «Otra» en Publicar. Cuerpo: `{ cuenta, texto, vistas, busquedas }` —
 * `vistas`, los ids ya mostrados, que no se repiten; `busquedas`, las que devolvió la respuesta
 * anterior para el mismo texto, o null—. Responde `{ sugerencia: { cancion, razon, conModelo },
 * busquedas }`, o `{ agotadas: true, busquedas }` cuando no queda ninguna sin mostrar.
 */
export async function POST(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
  const cuenta = (body as { cuenta?: unknown } | null)?.cuenta
  const r = await sugerenciaParaLaCuenta(usuario.id, cuenta, leerPedidoDeSugerencia(body))
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
  return NextResponse.json(r)
}
