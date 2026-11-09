import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { MercadoPagoFallo } from '@/lib/pagos/mercadopago'
import { firmaValida, temaDeAviso } from '@/lib/pagos/reglas'
import { registrarCobro, sincronizarSuscripcion } from '@/lib/pagos/suscripciones'

export const dynamic = 'force-dynamic'

/** Una firma más vieja que esto no vale: corta la repetición de un aviso capturado. */
const TOLERANCIA_S = 15 * 60

/**
 * El webhook de Mercado Pago, con el evento «Planes y suscripciones»: avisa que cambió una
 * suscripción (`subscription_preapproval`) o uno de sus cobros (`subscription_authorized_payment`).
 *
 * Es público y sin sesión, así que la única llave es la firma (`x-signature`, ver `firmaValida`). Del
 * aviso solo se cree el id: el estado se vuelve a leer en Mercado Pago, y de ahí sale lo que cambia el
 * plan de la persona. Un aviso de otro tema se contesta `200` y no se mira, y uno cuyo id Mercado Pago
 * no conoce —el de «Simular notificación», en su panel, es inventado— también: reintentarlo no lo
 * haría aparecer. Si leer o escribir falla, `500`, y Mercado Pago lo reintenta; la relectura diaria
 * cubre el caso de que nunca llegue.
 */
export async function POST(request: Request) {
  const secreto = env('MERCADOPAGO_WEBHOOK_SECRET')
  // Sin secreto la ruta queda cerrada: no hay con qué distinguir a Mercado Pago de cualquiera.
  if (!secreto) return new NextResponse(null, { status: 400 })

  const url = new URL(request.url)
  let cuerpo: { type?: unknown; data?: { id?: unknown } } = {}
  try {
    cuerpo = (await request.json()) as typeof cuerpo
  } catch {
    // Un aviso sin JSON puede traer todo en la URL; se sigue con ella.
  }
  const dataId = url.searchParams.get('data.id') ?? (typeof cuerpo.data?.id === 'string' ? cuerpo.data.id : null)
  const tipo = url.searchParams.get('type') ?? (typeof cuerpo.type === 'string' ? cuerpo.type : null)

  const valida = firmaValida({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataId,
    secreto,
    toleranciaS: TOLERANCIA_S,
  })
  if (!valida) return new NextResponse(null, { status: 401 })
  if (!dataId) return new NextResponse(null, { status: 200 })

  try {
    const tema = temaDeAviso(tipo)
    if (tema === 'suscripcion') await sincronizarSuscripcion(dataId)
    if (tema === 'cobro') await registrarCobro(dataId)
  } catch (error) {
    if (error instanceof MercadoPagoFallo && error.status === 404) {
      console.warn(`[pagos] webhook: Mercado Pago no conoce ${tipo ?? 'el aviso'} ${dataId.slice(0, 40)}`)
      return new NextResponse(null, { status: 200 })
    }
    console.error('[pagos] webhook:', String(error).slice(0, 300))
    return new NextResponse(null, { status: 500 })
  }
  return new NextResponse(null, { status: 200 })
}
