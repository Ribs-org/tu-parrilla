import { NextResponse } from 'next/server'
import { borrarComentario, cambiarComentario } from '@/lib/pase/pase'
import { abrirPase, cuerpoJson, rechazo } from '@/lib/pase/http'
import { COMENTARIO_NO_EXISTE } from '@/lib/pase/reglas'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ codigo: string; id: string }> }

/**
 * Cambiar una crítica. Quien revisa: `texto`, `etiqueta` o `estado: "abierto"` para reabrirla. Quien
 * edita: `respuesta` y `estado` (`"resuelto"` es «Hecho»).
 */
export async function PATCH(request: Request, { params }: Params) {
  const { codigo, id } = await params
  const entrada = await abrirPase(codigo)
  if (entrada instanceof NextResponse) return entrada
  const cuerpo = await cuerpoJson(request)
  if (cuerpo instanceof NextResponse) return cuerpo
  const r = await cambiarComentario(entrada.pase, entrada.rol, id, cuerpo)
  if ('error' in r) return rechazo(r.error)
  return NextResponse.json({ ok: true, id: r.comentario.id, estado: r.comentario.estado })
}

/** Quien revisa borra una crítica suya que no quería dejar. */
export async function DELETE(_request: Request, { params }: Params) {
  const { codigo, id } = await params
  const entrada = await abrirPase(codigo, 'revisor')
  if (entrada instanceof NextResponse) return entrada
  if (!(await borrarComentario(entrada.pase, id))) return NextResponse.json({ error: COMENTARIO_NO_EXISTE }, { status: 404 })
  return NextResponse.json({ ok: true, id })
}
