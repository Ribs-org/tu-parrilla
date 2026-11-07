import { NextResponse } from 'next/server'
import { cuerpoDe, error } from '@/lib/cocina/api'
import { cambiarElMaterial, sacarDeLaCamara } from '@/lib/cocina/del-dueno'
import { fraseParaElTelefono } from '@/lib/cocina/telefono'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/**
 * «Cambiar» un material de la cámara de frío desde el teléfono: `{ "nombre": "…", "uso": "intro" |
 * null }`, los dos, como la ventana del panel. Lo que ya se pidió con él no cambia. No pide la
 * cocina encendida. `400` con la frase si el nombre o el uso no valen, `404` si no está o no es suyo.
 */
export async function PATCH(request: Request, { params }: Params) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const r = await cambiarElMaterial(usuario.id, (await params).id, cuerpo.nombre, cuerpo.uso)
  if ('error' in r) return error(r.codigo, fraseParaElTelefono(r.error))
  return NextResponse.json({ ok: true })
}

/**
 * «Sacar de la cámara» desde el teléfono: lo borra del almacén y libera su espacio, si ninguna
 * comanda en marcha lo usa (`409` con la frase si alguna sí). No pide la cocina encendida: si el
 * admin la apagó, el dueño igual puede hacer espacio.
 */
export async function DELETE(request: Request, { params }: Params) {
  const usuario = await quienPreguntaDesdeElTelefono(request, false)
  if (usuario instanceof NextResponse) return usuario
  const r = await sacarDeLaCamara(usuario.id, (await params).id, new Date())
  if ('error' in r) return error(r.codigo, fraseParaElTelefono(r.error))
  return NextResponse.json({ ok: true })
}
