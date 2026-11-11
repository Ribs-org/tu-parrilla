import { createHmac, timingSafeEqual } from 'node:crypto'
import type { EstadoSuscripcion } from '@/db/schema'
import type { Plan } from '@/lib/planes/plan'

// El cobro del plan pagado con Mercado Pago, sin base ni red: la firma del webhook, el cuerpo de la
// suscripción, los estados y la gracia. El diseño está en
// `docs/superpowers/specs/2026-11-08-planes-design.md`, «El cobro con Mercado Pago»; lo que habla
// con Mercado Pago, en `mercadopago.ts`, y lo que escribe la base, en `suscripciones.ts`.
//
// Contrastado el 2026-11-11 con la documentación de Mercado Pago para Chile, que se lee en texto
// agregándole `.md` a la dirección de cada página (la página HTML da 403 desde un servidor):
// la referencia de `/preapproval` y `/authorized_payments`, «Subscriptions with authorized payment»
// (los reintentos) y «Webhooks» (la firma). Lo que la documentación no dice salió del SDK oficial de
// Node (`mercadopago` 3.6.2). Lo que todavía no se vio funcionar está en
// `docs/mercadopago-paso-a-paso.md`, «Lo que la prueba tiene que mirar».

const DIA_MS = 86_400_000

/**
 * Los días que el pagado sigue después de la fecha del próximo cobro, mientras Mercado Pago reintenta
 * uno rechazado: lo reintenta hasta 4 veces dentro de una ventana de 10 días («Collection reattempt
 * logic»), y uno más por la diferencia de zona. Si en la ventana no entra, el plan cae solo al gratis;
 * Mercado Pago cancela la suscripción recién después de 3 cuotas rechazadas.
 */
export const GRACIA_DIAS = 11

/**
 * Sin prueba, Mercado Pago cobra la primera cuota «aproximadamente una hora» después de autorizar: el
 * pagado se da desde la autorización por estos días, para no hacer esperar a nadie. Si ese cobro no
 * entra en ese plazo, el plan vuelve al gratis hasta que entre.
 */
export const PRIMER_COBRO_DIAS = 2

/** Lo más lejos que lleva un cobro: un mes y un poco, por si el próximo cobro viniera corrido. */
const UN_COBRO_DIAS = 32

/** Un `init_point` sin usar sirve un día: después se pide otro (`empezarSuscripcion`). */
export const ENLACE_VALE_DIAS = 1

/** Los años de la suscripción con prueba: `start_date` pide un `end_date`, y no queremos que termine. */
const ANOS_DE_SUSCRIPCION = 10

const masDias = (fecha: Date, dias: number) => new Date(fecha.getTime() + dias * DIA_MS)
const valida = (fecha: Date | null | undefined): fecha is Date => !!fecha && !Number.isNaN(fecha.getTime())

/** Hasta cuándo rige el pagado si el próximo cobro es `proximoCobro`: esa fecha más la gracia. */
export function hastaConGracia(proximoCobro: Date): Date {
  return masDias(proximoCobro, GRACIA_DIAS)
}

/**
 * Hasta cuándo da el pagado una suscripción autorizada. Sale de lo que pasó —un cobro, la prueba o la
 * autorización recién hecha— y no de la fecha del próximo cobro sola: mientras Mercado Pago reintenta
 * una cuota rechazada esa fecha puede seguir avanzando, y la relectura de cada día alargaría el plan
 * de alguien que no paga. Por eso cada candidata tiene su tope:
 *
 * - **el último cobro** (`ultimoCobro`): hasta el próximo cobro, como mucho un mes y poco después de
 *   ese, más la gracia;
 * - **la prueba**, si la suscripción la traía: hasta que termina (el próximo cobro, como mucho los días
 *   de prueba desde que se pidió el enlace, más lo que vale el enlace), más la gracia, porque el
 *   primer cobro también se reintenta;
 * - **la autorización sin prueba**: unos días desde que se pidió, mientras llega el primer cobro.
 *
 * Gana la que llegue más lejos; `null` si ninguna. Las tres son fijas para una suscripción, así que
 * releerla cada día no corre la fecha: solo un cobro nuevo la corre.
 */
export function hastaDelPagado(e: {
  conPrueba: boolean
  diasDePrueba: number
  pedidaEn: Date
  proximoCobro: Date | null
  ultimoCobro: Date | null
}): Date | null {
  const candidatas: Date[] = []
  const proximo = valida(e.proximoCobro) ? e.proximoCobro : null
  if (valida(e.ultimoCobro)) {
    const tope = masDias(e.ultimoCobro, UN_COBRO_DIAS)
    const hasta = proximo && proximo > e.ultimoCobro && proximo < tope ? proximo : tope
    candidatas.push(hastaConGracia(hasta))
  }
  if (e.conPrueba && e.diasDePrueba > 0) {
    const finDeLaPrueba = masDias(e.pedidaEn, e.diasDePrueba + ENLACE_VALE_DIAS)
    candidatas.push(hastaConGracia(proximo && proximo < finDeLaPrueba ? proximo : finDeLaPrueba))
  } else {
    candidatas.push(masDias(e.pedidaEn, ENLACE_VALE_DIAS + PRIMER_COBRO_DIAS))
  }
  return candidatas.reduce<Date | null>((a, b) => (!a || b > a ? b : a), null)
}

/**
 * El estado de Mercado Pago (`pending`, `authorized`, `paused`, `canceled`) en el nuestro. La
 * referencia escribe `canceled`; el SDK y su especificación, `cancelled`: valen los dos.
 */
export function estadoDeMercadoPago(status: string | undefined): EstadoSuscripcion {
  if (status === 'authorized') return 'autorizada'
  if (status === 'paused') return 'pausada'
  if (status === 'canceled' || status === 'cancelled') return 'cancelada'
  return 'pendiente'
}

/** Una suscripción viva: la que cobra, o la que está en pausa y puede volver. */
export function estaViva(estado: EstadoSuscripcion): boolean {
  return estado === 'autorizada' || estado === 'pausada'
}

/**
 * El cuerpo de `POST /preapproval`: una suscripción sin plan asociado, mensual, en pesos (sin
 * decimales: el peso chileno no los acepta), con los días de prueba del plan si la persona nunca los
 * usó. `status: pending` es lo que devuelve un `init_point` para que la persona la autorice en
 * Mercado Pago; Tu Parrilla nunca ve una tarjeta.
 *
 * La prueba va como `start_date`, el día desde el que se cobra, y no como `free_trial`: en una
 * suscripción sin plan, la referencia de `POST /preapproval` no lista `free_trial` entre lo que se
 * manda (solo en lo que devuelve), y sí `start_date`, que «solo funciona junto con `end_date`».
 */
export function cuerpoDeSuscripcion(entrada: {
  plan: Pick<Plan, 'nombre' | 'precioClp' | 'diasDePrueba'>
  suscripcionId: string
  correoPagador: string
  volverA: string
  conPrueba: boolean
  ahora: Date
}): Record<string, unknown> {
  const { plan, conPrueba } = entrada
  const desde = conPrueba && plan.diasDePrueba > 0 ? masDias(entrada.ahora, plan.diasDePrueba) : null
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
      ...(desde
        ? {
            start_date: desde.toISOString(),
            end_date: new Date(Date.UTC(desde.getUTCFullYear() + ANOS_DE_SUSCRIPCION, desde.getUTCMonth(), desde.getUTCDate())).toISOString(),
          }
        : {}),
    },
  }
}

/**
 * Si la notificación viene de Mercado Pago: `x-signature` trae `ts=<marca>,v1=<hmac>`, y el hmac
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
    // El ejemplo de la documentación viene en segundos, y su texto dice milisegundos: una marca de
    // trece cifras o más se lee como milisegundos. La firma usa la marca tal como vino.
    const marcaMs = ts.length >= 13 ? Number(ts) : Number(ts) * 1000
    const deriva = Math.abs((entrada.ahoraMs ?? Date.now()) - marcaMs) / 1000
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
  if (estado === 'cancelled' || estado === 'canceled') return 'anulado'
  return estado ?? 'sin pago todavía'
}
