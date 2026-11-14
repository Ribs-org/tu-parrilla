import { NextResponse } from 'next/server'
import { comentar } from '@/lib/pase/pase'
import { abrirPase, cuerpoJson, rechazo } from '@/lib/pase/http'
import { comentarioNuevo } from '@/lib/pase/reglas'

export const dynamic = 'force-dynamic'

/**
 * Una crítica nueva, de quien revisa: `{ pieza, autor, texto, etiqueta?, desde?, hasta?, zona? }`.
 * `desde` y `hasta` en segundos; `zona` con `x`, `y`, `ancho` y `alto` entre 0 y 1.
 */
export async function POST(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const entrada = await abrirPase((await params).codigo, 'revisor')
  if (entrada instanceof NextResponse) return entrada
  const cuerpo = await cuerpoJson(request)
  if (cuerpo instanceof NextResponse) return cuerpo
  const valido = comentarioNuevo(cuerpo)
  if ('error' in valido) return rechazo(valido.error)
  const r = await comentar(entrada.pase, valido.comentario)
  if ('error' in r) return rechazo(r.error)
  return NextResponse.json({ ok: true, id: r.comentario.id }, { status: 201 })
}
