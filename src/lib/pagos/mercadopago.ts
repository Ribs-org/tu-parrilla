import { env } from '@/lib/env'

// Lo que Tu Parrilla le pide a Mercado Pago: crear, leer y cancelar una suscripción, y leer uno de sus
// cobros. Con `fetch` y el token de la integración, como el resto de las APIs del repo; las rutas y
// los campos, los de la referencia de `/preapproval` y `/authorized_payments` (ver `reglas.ts`).

const API = 'https://api.mercadopago.com'
/**
 * Corto a propósito: el webhook tiene que contestar en 22 segundos o Mercado Pago lo da por perdido y
 * lo reintenta, y un cobro hace hasta dos lecturas seguidas.
 */
const PLAZO_MS = 8_000

/** Lo que importa de una suscripción (`preapproval`). */
export type SuscripcionMP = {
  id?: string
  status?: string
  external_reference?: string
  init_point?: string
  payer_email?: string
  next_payment_date?: string
  auto_recurring?: { transaction_amount?: number; currency_id?: string; start_date?: string; free_trial?: unknown }
  /** El resumen de sus cobros: `last_charged_date` es el último que entró. */
  summarized?: { last_charged_date?: string | null; charged_quantity?: number | null; semaphore?: string | null }
}

/** Lo que importa de un cobro de una suscripción (`authorized_payments`). */
export type CobroMP = {
  id?: string | number
  preapproval_id?: string
  status?: string
  transaction_amount?: number
  currency_id?: string
  debit_date?: string
  date_created?: string
  payment?: { id?: string | number; status?: string; status_detail?: string }
}

/** Mercado Pago no contestó, o contestó un error: la frase del error va al log, nunca a la pantalla. */
export class MercadoPagoFallo extends Error {
  constructor(
    public status: number,
    detalle: string,
  ) {
    super(`Mercado Pago ${status}: ${detalle.slice(0, 300)}`)
    this.name = 'MercadoPagoFallo'
  }
}

/** Si hay credencial para hablar con Mercado Pago. Sin ella, «Pasar a Maestro Parrillero» no se ofrece. */
export function mercadoPagoConfigurado(): boolean {
  return Boolean(env('MERCADOPAGO_ACCESS_TOKEN'))
}

async function pedir<T>(metodo: 'GET' | 'POST' | 'PUT', ruta: string, cuerpo?: unknown, idempotencia?: string): Promise<T> {
  const token = env('MERCADOPAGO_ACCESS_TOKEN')
  if (!token) throw new MercadoPagoFallo(0, 'falta MERCADOPAGO_ACCESS_TOKEN')
  let respuesta: Response
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }),
        // El SDK lo manda en cada POST; la referencia de `/preapproval` no lo nombra. Si Mercado Pago lo
        // respeta, un reintento del mismo pedido no crea dos suscripciones; si no, no estorba.
        ...(idempotencia ? { 'X-Idempotency-Key': idempotencia } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(PLAZO_MS),
    })
  } catch (error) {
    throw new MercadoPagoFallo(0, String(error))
  }
  if (!respuesta.ok) throw new MercadoPagoFallo(respuesta.status, await respuesta.text())
  return (await respuesta.json()) as T
}

/**
 * Cancela con `canceled`, como la escribe la referencia de `PUT /preapproval/{id}`; si Mercado Pago
 * rechaza el pedido (400), con `cancelled`, como la escribe su SDK. Lo que no se cancela sigue
 * cobrando: no puede depender de una letra.
 */
async function cancelarSuscripcion(id: string): Promise<SuscripcionMP> {
  const ruta = `/preapproval/${encodeURIComponent(id)}`
  try {
    return await pedir<SuscripcionMP>('PUT', ruta, { status: 'canceled' })
  } catch (error) {
    if (!(error instanceof MercadoPagoFallo) || error.status !== 400) throw error
    console.warn('[pagos] «canceled» no sirvió, se prueba «cancelled»:', error.message)
    return pedir<SuscripcionMP>('PUT', ruta, { status: 'cancelled' })
  }
}

export const mercadoPago = {
  crearSuscripcion: (cuerpo: Record<string, unknown>, idempotencia: string) =>
    pedir<SuscripcionMP>('POST', '/preapproval', cuerpo, idempotencia),
  leerSuscripcion: (id: string) => pedir<SuscripcionMP>('GET', `/preapproval/${encodeURIComponent(id)}`),
  cancelarSuscripcion,
  leerCobro: (id: string) => pedir<CobroMP>('GET', `/authorized_payments/${encodeURIComponent(id)}`),
}
