import { NextResponse } from 'next/server'
import { DIAS_DE_AVISO } from '@/lib/cocina/barrido'
import { cuantosEnBorradores, mesonDelDueno } from '@/lib/cocina/meson'
import { mesonParaElTelefono } from '@/lib/cocina/meson-telefono'
import { quienPreguntaDesdeElTelefono } from '@/lib/cocina/telefono-api'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

/**
 * El mesón (de día, la bandeja) en el teléfono: lo que el chef entregó y espera que el dueño lo
 * programe o lo descarte, por comanda y por pieza, como la página del panel. Con `?comanda=<id>`,
 * solo lo de esa comanda; un id que no es uuid se ignora, como en el panel. Pide la cocina
 * encendida, como la página. Todo del dueño del token.
 */
export async function GET(request: Request) {
  const usuario = await quienPreguntaDesdeElTelefono(request, true)
  if (usuario instanceof NextResponse) return usuario
  const pedida = new URL(request.url).searchParams.get('comanda')
  const comanda = esUuid(pedida) ? pedida : undefined
  // En serie, como el resto de la cocina (`src/lib/cocina/panel.ts`).
  const meson = await mesonDelDueno(usuario.id, comanda)
  const enBorradores = await cuantosEnBorradores(usuario.id)
  return NextResponse.json(mesonParaElTelefono(meson, enBorradores, new Date(), usuario.zona, DIAS_DE_AVISO), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
