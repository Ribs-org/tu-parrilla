import { NextResponse } from 'next/server'
import { cuerpoDe, error } from '@/lib/cocina/api'
import { NO_SE_PIDIO, marcaDe, pedirComanda } from '@/lib/cocina/pedir'
import { fraseParaElTelefono, marcaParaElTelefono, pedidoDelTelefono } from '@/lib/cocina/telefono'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'

export const dynamic = 'force-dynamic'

/**
 * «Mandar al chef» desde el teléfono: cuelga una comanda con lo elegido de la cámara de frío. Con
 * las opciones del formulario del panel (desde el 2026-11-06): `{ "ref": "<uuid>", "principal":
 * "<id de un video>", "subtipo": "largo", "acompanamientos": [{ "id": "<id>", "rol": "imagen" }, …],
 * "formatos": ["clips"], "cantidad": "lo-que-de", "paraCuando": "AAAA-MM-DD" | null, "instruccion":
 * "…", "marca": { "nombre", "handle", "acento", "ctaTexto" } }`. Una app de antes manda solo `ref`,
 * `principal`, `acompanamientos` como ids e `instruccion`, y lo demás va como lo trae marcado el
 * panel (`src/lib/cocina/telefono.ts`). `201` con el id; mandarla otra vez con la misma `ref`
 * devuelve la misma, con `200`.
 */
export async function POST(request: Request) {
  const usuario = await quienPreguntaDesdeElTelefono(request, true)
  if (usuario instanceof NextResponse) return usuario
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const marca = marcaParaElTelefono(await marcaDe(usuario.id), usuario.nombre)
  const pedido = pedidoDelTelefono(cuerpo, marca)
  if ('error' in pedido) return error(400, pedido.error)
  const r = await pedirComanda(usuario, pedido, new Date())
  if ('falla' in r) return error(r.falla === 'apagada' ? 403 : 409, fraseParaElTelefono(NO_SE_PIDIO[r.falla]))
  return NextResponse.json({ id: r.id, repetida: r.repetida }, { status: r.repetida ? 200 : 201 })
}
