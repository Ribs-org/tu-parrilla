import { env } from '@/lib/env'

// Lo que Tu Parrilla le pide a Mercado Pago: crear, leer y cancelar una suscripción, y leer uno de sus
// cobros. Con `fetch` y el token de la integración, como el resto de las APIs del repo; las rutas y
// los campos son los del SDK oficial de Node (`mercadopago` 3.6.1), porque la documentación no se deja
// leer desde un servidor. Ver `reglas.ts`.

const API = 'https://api.mercadopago.com'
const PLAZO_MS = 15_000

/** Lo que importa de una suscripción (`preapproval`). */
export type SuscripcionMP = {
  id?: string
  status?: string
  external_reference?: string
  init_point?: string
  payer_email?: string
  next_payment_date?: string
  auto_recurring?: { transaction_amount?: number; currency_id?: string; free_trial?: unknown }
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

/** Si hay credencial para hablar con Mercado Pago. Sin ella, «Pasar a Asador» no se ofrece. */
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
        // Un reintento del mismo pedido no crea dos suscripciones.
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

export const mercadoPago = {
  crearSuscripcion: (cuerpo: Record<string, unknown>, idempotencia: string) =>
    pedir<SuscripcionMP>('POST', '/preapproval', cuerpo, idempotencia),
  leerSuscripcion: (id: string) => pedir<SuscripcionMP>('GET', `/preapproval/${encodeURIComponent(id)}`),
  cancelarSuscripcion: (id: string) =>
    pedir<SuscripcionMP>('PUT', `/preapproval/${encodeURIComponent(id)}`, { status: 'cancelled' }),
  leerCobro: (id: string) => pedir<CobroMP>('GET', `/authorized_payments/${encodeURIComponent(id)}`),
}
