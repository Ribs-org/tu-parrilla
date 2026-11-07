import { NextResponse } from 'next/server'
import { contarPendientes, getCola, redesDeLaMesa, type EstadoCola } from '@/lib/comentarios-cola'
import { ESTADOS_DEL_TELEFONO, mesaParaElTelefono } from '@/lib/comentarios-movil'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { privadoActivo } from '@/lib/social/comentarios/privado'

export const dynamic = 'force-dynamic'

/**
 * La Mesa en el teléfono: la cola de comentarios del dueño del token, agrupada por publicación,
 * con los mismos filtros que el panel (`/admin/comments`). `?estado=pendientes|enviados|automaticas`
 * (por defecto `pendientes`; «Descartados» y «Todos» se quedan en el panel) y `?red=` con una de
 * las redes que devuelve `redes`; una red que no está se ignora, como en el panel. Responde
 * `MesaMovil` (`src/lib/comentarios-movil.ts`).
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const params = new URL(request.url).searchParams
  const pedido = params.get('estado') ?? ''
  const estado: EstadoCola = (ESTADOS_DEL_TELEFONO as readonly string[]).includes(pedido)
    ? (pedido as EstadoCola)
    : 'pendientes'
  const redes = redesDeLaMesa(usuario.id)
  const pedida = params.get('red') ?? ''
  const red = redes.includes(pedida) ? pedida : null
  const [filas, pendientes] = await Promise.all([
    getCola(usuario.id, { estado, red }),
    contarPendientes(usuario.id, red),
  ])
  return NextResponse.json(mesaParaElTelefono(filas, { estado, red }, redes, pendientes, privadoActivo(usuario.id)))
}
