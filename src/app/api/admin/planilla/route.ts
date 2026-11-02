import { NextResponse } from 'next/server'
import { usuarioActual } from '@/lib/auth'
import { armarPlanilla, nombreDelArchivo } from '@/lib/planilla/armar'
import { pedidoDesde } from '@/lib/planilla/pedido'

export const dynamic = 'force-dynamic'

/**
 * Los cinco minutos que da Vercel en el plan gratis. La planilla deja de empezar consultas
 * largas `MARGEN_S` antes, para que lo que alcanzó a leer salga entero y «Léeme» diga qué quedó
 * fuera, en vez de que la función muera a media hoja.
 */
export const maxDuration = 300
const MARGEN_S = 60

/**
 * «Llevar para la casa» (de día, «Para llevar»), en Los Números: la planilla de Excel con todo
 * lo del período, con los mismos filtros de la URL de la pantalla. La arma `armarPlanilla` y sale
 * por partes mientras se escribe: así no pesa en memoria y no la corta el tope de 4,5 MB que
 * Vercel pone a una respuesta que no se transmite.
 */
export async function GET(request: Request) {
  const usuario = await usuarioActual()
  // 401 y no un redirect: esto lo llama `fetch`, que no tiene adónde navegar.
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const pedido = await pedidoDesde(new URL(request.url), usuario)
  const partes = armarPlanilla({ ...pedido, terminarAntesDe: Date.now() + (maxDuration - MARGEN_S) * 1000 })

  const cuerpo = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await partes.next()
        if (done) controller.close()
        else controller.enqueue(value)
      } catch (fallo) {
        console.error('[planilla]', fallo)
        controller.error(fallo)
      }
    },
    async cancel() {
      await partes.return(undefined)
    },
  })

  return new Response(cuerpo, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombreDelArchivo(pedido.filters.periodo)}"`,
      'Cache-Control': 'no-store',
    },
  })
}
