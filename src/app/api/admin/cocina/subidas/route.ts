import { NextResponse } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { SIN_ALMACEN } from '@/lib/storage'
import { cuerpoDe, error } from '@/lib/cocina/api'
import { leerSubida } from '@/lib/cocina/bodega'
import { quienPregunta } from '@/lib/cocina/panel-api'
import { COCINA_APAGADA, abrirSubida } from '@/lib/cocina/subidas'

export const dynamic = 'force-dynamic'

/**
 * Abre una subida por partes a la cámara de frío: un video, un audio, una imagen u otro archivo, con
 * su uso si lo tiene y la casilla de los derechos marcada. Si no cabe en la cuota —contando lo que
 * ya está subiendo—, `409` con cuánto pesa y cuánto queda. Devuelve cuántas partes son y de qué
 * tamaño; los enlaces de cada una se piden después (`/partes`).
 */
export async function POST(request: Request) {
  const usuario = await quienPregunta(true)
  if (usuario instanceof NextResponse) return usuario
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const pedido = leerSubida(cuerpo)
  if ('error' in pedido) return error(400, pedido.error)
  try {
    const r = await abrirSubida(usuario, pedido, new Date())
    if ('falla' in r) return r.falla === 'no-cabe' ? error(409, r.frase) : error(403, COCINA_APAGADA)
    return NextResponse.json(r, { status: 201 })
  } catch (e) {
    console.error('admin/cocina/subidas:', String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
