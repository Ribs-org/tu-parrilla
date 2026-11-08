import { createHmac, timingSafeEqual } from 'node:crypto'
import type { EstadoSuscripcion } from '@/db/schema'
import type { Plan } from '@/lib/planes/plan'

// El cobro del plan pagado con Mercado Pago, sin base ni red: la firma del webhook, el cuerpo de la
// suscripción, los estados y la gracia. El diseño está en
// `docs/superpowers/specs/2026-11-08-planes-design.md`, «El cobro con Mercado Pago»; lo que habla
// con Mercado Pago, en `mercadopago.ts`, y lo que escribe la base, en `suscripciones.ts`.
//
// La documentación de Mercado Pago no se deja leer desde un servidor (403): los nombres de los
// campos, las rutas y la firma salen del SDK oficial de Node (`mercadopago` 3.6.1, sus tipos de
// `preApproval` e `invoice` y su `WebhookSignatureValidator`).

/**
 * Los días que el pagado sigue después de la fecha del próximo cobro, mientras Mercado Pago reintenta
 * uno rechazado. Es una suposición —su documentación no se pudo leer—: si reintenta más días, se
 * alarga acá.
 */
export const GRACIA_DIAS = 5

/** Hasta cuándo rige el pagado de una suscripción al día: el próximo cobro más la gracia. */
export function hastaConGracia(proximoCobro: Date): Date {
  return new Date(proximoCobro.getTime() + GRACIA_DIAS * 86_400_000)
}

/** El estado de Mercado Pago (`pending`, `authorized`, `paused`, `cancelled`) en el nuestro. */
export function estadoDeMercadoPago(status: string | undefined): EstadoSuscripcion {
  if (status === 'authorized') return 'autorizada'
  if (status === 'paused') return 'pausada'
  if (status === 'cancelled') return 'cancelada'
  return 'pendiente'
}

/** Una suscripción viva: la que cobra, o la que está en pausa y puede volver. */
export function estaViva(estado: EstadoSuscripcion): boolean {
  return estado === 'autorizada' || estado === 'pausada'
}

/**
 * El cuerpo de `POST /preapproval`: una suscripción sin plan asociado, mensual, en pesos, con los días
 * de prueba del plan si la persona nunca los usó. `status: pending` es lo que devuelve un `init_point`
 * para que la persona la autorice en Mercado Pago; Tu Parrilla nunca ve una tarjeta.
 */
export function cuerpoDeSuscripcion(entrada: {
  plan: Pick<Plan, 'nombre' | 'precioClp' | 'diasDePrueba'>
  suscripcionId: string
  correoPagador: string
  volverA: string
  conPrueba: boolean
}): Record<string, unknown> {
  const { plan, conPrueba } = entrada
  return {
    reason: `Tu Parrilla — ${plan.nombre}`,
    external_reference: entrada.suscripcionId,
    payer_email: entrada.correoPagador,
    back_url: entrada.volverA,
    status: 'pending',
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: plan.precioClp,
      currency_id: 'CLP',
      ...(conPrueba && plan.diasDePrueba > 0 ? { free_trial: { frequency: plan.diasDePrueba, frequency_type: 'days' } } : {}),
    },
  }
}

/**
 * Si la notificación viene de Mercado Pago: `x-signature` trae `ts=<segundos>,v1=<hmac>`, y el hmac
 * es HMAC-SHA256, con el secreto de la integración, de `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * (sin la parte que falte). `data.id` va en minúsculas, como pide Mercado Pago para los ids
 * alfanuméricos. Con `toleranciaS`, una firma más vieja que eso no vale: corta la repetición de una
 * notificación capturada.
 */
export function firmaValida(entrada: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
  secreto: string
  ahoraMs?: number
  toleranciaS?: number
}): boolean {
  const { xSignature, xRequestId, secreto } = entrada
  if (!xSignature || !secreto) return false
  let ts: string | undefined
  let v1: string | undefined
  for (const parte of xSignature.split(',')) {
    const i = parte.indexOf('=')
    if (i === -1) continue
    const clave = parte.slice(0, i).trim().toLowerCase()
    const valor = parte.slice(i + 1).trim()
    if (clave === 'ts') ts = valor
    if (clave === 'v1') v1 = valor
  }
  if (!ts || !/^\d+$/.test(ts) || !v1) return false
  if (entrada.toleranciaS !== undefined) {
    const deriva = Math.abs((entrada.ahoraMs ?? Date.now()) - Number(ts) * 1000) / 1000
    if (deriva > entrada.toleranciaS) return false
  }
  const partes: string[] = []
  if (entrada.dataId) partes.push(`id:${entrada.dataId.toLowerCase()}`)
  if (xRequestId) partes.push(`request-id:${xRequestId}`)
  partes.push(`ts:${ts}`)
  const esperado = createHmac('sha256', secreto).update(`${partes.join(';')};`).digest('hex')
  const a = Buffer.from(esperado)
  const b = Buffer.from(v1.toLowerCase())
  return a.length === b.length && timingSafeEqual(a, b)
}

/** De qué habla una notificación: la suscripción, uno de sus cobros, u otra cosa que no se mira. */
export type TemaDeAviso = 'suscripcion' | 'cobro' | 'otro'

export function temaDeAviso(tipo: string | null | undefined): TemaDeAviso {
  if (tipo === 'subscription_preapproval') return 'suscripcion'
  if (tipo === 'subscription_authorized_payment') return 'cobro'
  return 'otro'
}

// --- Las frases --------------------------------------------------------------------------------

export const CORREO_PAGADOR_ILEGIBLE = 'Escribe el correo de tu cuenta de Mercado Pago.'
export const YA_PAGAS = 'Ya tienes una suscripción: no hace falta otra.'
export const YA_TIENES_EL_PAGADO = 'Ya tienes el plan pagado.'
export const PAGOS_CERRADOS = 'Pagar desde el panel todavía no está abierto.'
export const MERCADOPAGO_NO_RESPONDIO = 'Mercado Pago no respondió. Inténtalo de nuevo en un rato.'
export const SIN_SUSCRIPCION = 'No tienes una suscripción que cancelar.'

/** El estado de un pago en palabras, para la lista de cobros del admin. */
export function estadoDePagoEnPalabras(estado: string | null): string {
  if (estado === 'approved') return 'aprobado'
  if (estado === 'rejected') return 'rechazado'
  if (estado === 'pending' || estado === 'in_process' || estado === 'authorized') return 'pendiente'
  if (estado === 'refunded' || estado === 'charged_back') return 'devuelto'
  if (estado === 'cancelled') return 'anulado'
  return estado ?? 'sin pago todavía'
}
