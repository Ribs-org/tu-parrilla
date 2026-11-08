import { and, desc, eq, gt, inArray, isNotNull, or } from 'drizzle-orm'
import { cobros, getDb, suscripciones, users, type ClavePlan } from '@/db'
import { normalizarCorreo } from '@/lib/forma-del-correo'
import { claveQueRige } from '@/lib/planes/plan'
import { leerPlanes, planDe } from '@/lib/planes/planes'
import { esUuid } from '@/lib/uuid'
import { mercadoPago, mercadoPagoConfigurado, MercadoPagoFallo, type SuscripcionMP } from './mercadopago'
import {
  CORREO_PAGADOR_ILEGIBLE,
  MERCADOPAGO_NO_RESPONDIO,
  PAGOS_CERRADOS,
  SIN_SUSCRIPCION,
  YA_PAGAS,
  YA_TIENES_EL_PAGADO,
  cuerpoDeSuscripcion,
  estadoDeMercadoPago,
  hastaConGracia,
} from './reglas'

// Las suscripciones al plan pagado contra la base y contra Mercado Pago: empezar una, dejarla al día
// con lo que dice Mercado Pago, anotar sus cobros, cancelarla y releerlas cada día. Lo que cambia el
// plan de la persona sale siempre de volver a leer a Mercado Pago, nunca del cuerpo de un webhook.

/** Un `init_point` sin usar sirve un día: después se pide otro. */
const ENLACE_VALE_MS = 86_400_000

/** La suscripción viva del dueño —la que cobra o está en pausa—, si tiene una. */
export async function suscripcionVivaDe(ownerId: string) {
  const [fila] = await getDb()
    .select()
    .from(suscripciones)
    .where(and(eq(suscripciones.ownerId, ownerId), inArray(suscripciones.estado, ['autorizada', 'pausada'])))
    .orderBy(desc(suscripciones.creadaEn))
    .limit(1)
  return fila ?? null
}

/**
 * «Pasar a Asador»: crea la suscripción en Mercado Pago y devuelve adónde mandar a la persona para
 * autorizarla. Un enlace pedido hace menos de un día, con el mismo correo y el mismo precio, se reusa:
 * apretar dos veces no deja dos suscripciones esperando.
 */
export async function empezarSuscripcion(
  ownerId: string,
  correoCrudo: string,
  volverA: string,
  ahora = new Date(),
): Promise<{ enlace: string } | { error: string }> {
  if (!mercadoPagoConfigurado()) return { error: PAGOS_CERRADOS }
  const correoPagador = normalizarCorreo(correoCrudo)
  if (!correoPagador) return { error: CORREO_PAGADOR_ILEGIBLE }

  const db = getDb()
  const { plan, persona } = await planDe(ownerId, ahora, db)
  if (plan.clave !== 'gratis') return { error: YA_TIENES_EL_PAGADO }
  if (await suscripcionVivaDe(ownerId)) return { error: YA_PAGAS }
  const { pagado } = await leerPlanes(db)

  const [esperando] = await db
    .select()
    .from(suscripciones)
    .where(
      and(
        eq(suscripciones.ownerId, ownerId),
        eq(suscripciones.estado, 'pendiente'),
        eq(suscripciones.correoPagador, correoPagador),
        eq(suscripciones.montoClp, pagado.precioClp),
        isNotNull(suscripciones.enlace),
        gt(suscripciones.creadaEn, new Date(ahora.getTime() - ENLACE_VALE_MS)),
      ),
    )
    .orderBy(desc(suscripciones.creadaEn))
    .limit(1)
  if (esperando?.enlace) return { enlace: esperando.enlace }

  const conPrueba = !persona.pruebaUsadaEn && pagado.diasDePrueba > 0
  const [fila] = await db
    .insert(suscripciones)
    .values({ ownerId, plan: 'pagado', montoClp: pagado.precioClp, correoPagador, conPrueba })
    .returning({ id: suscripciones.id })
  try {
    const creada = await mercadoPago.crearSuscripcion(
      cuerpoDeSuscripcion({ plan: pagado, suscripcionId: fila!.id, correoPagador, volverA, conPrueba }),
      fila!.id,
    )
    if (!creada.id || !creada.init_point) throw new MercadoPagoFallo(200, 'la suscripción vino sin id o sin init_point')
    await db
      .update(suscripciones)
      .set({ externoId: creada.id, enlace: creada.init_point, actualizadaEn: new Date() })
      .where(eq(suscripciones.id, fila!.id))
    return { enlace: creada.init_point }
  } catch (error) {
    console.error('[pagos] no se creó la suscripción:', String(error).slice(0, 300))
    await db.update(suscripciones).set({ estado: 'cancelada', canceladaEn: new Date() }).where(eq(suscripciones.id, fila!.id))
    return { error: MERCADOPAGO_NO_RESPONDIO }
  }
}

/**
 * Deja la fila al día con lo que Mercado Pago dice de la suscripción `externoId`, y el plan de la
 * persona con ella: autorizada, el pagado hasta el próximo cobro más la gracia. Pausada o cancelada,
 * el plan no se toca: queda lo pagado (o la prueba) y después vuelve solo al gratis.
 */
export async function sincronizarSuscripcion(externoId: string, ahora = new Date()): Promise<void> {
  const mp = await mercadoPago.leerSuscripcion(externoId)
  await aplicarSuscripcion(mp, ahora)
}

async function aplicarSuscripcion(mp: SuscripcionMP, ahora: Date): Promise<void> {
  const db = getDb()
  const referencia = mp.external_reference && esUuid(mp.external_reference) ? mp.external_reference : null
  // Sin ninguna de las dos no hay con qué buscarla: no nació acá.
  if (!referencia && !mp.id) return
  const [fila] = await db
    .select()
    .from(suscripciones)
    .where(
      or(
        referencia ? eq(suscripciones.id, referencia) : undefined,
        mp.id ? eq(suscripciones.externoId, mp.id) : undefined,
      ),
    )
    .limit(1)
  // Una suscripción que no nació acá (creada a mano en Mercado Pago) no es de nadie de Tu Parrilla.
  if (!fila) return

  const estado = estadoDeMercadoPago(mp.status)
  const proximoCobro = mp.next_payment_date ? new Date(mp.next_payment_date) : null
  await db
    .update(suscripciones)
    .set({
      estado,
      externoId: fila.externoId ?? mp.id ?? null,
      proximoCobro: proximoCobro && !Number.isNaN(proximoCobro.getTime()) ? proximoCobro : fila.proximoCobro,
      canceladaEn: estado === 'cancelada' ? (fila.canceladaEn ?? ahora) : null,
      actualizadaEn: ahora,
    })
    .where(eq(suscripciones.id, fila.id))

  if (estado !== 'autorizada' || !fila.ownerId || !proximoCobro || Number.isNaN(proximoCobro.getTime())) return
  await extenderPlan(fila.ownerId, fila.plan, hastaConGracia(proximoCobro), fila.conPrueba, ahora)
}

/**
 * El pagado hasta `hasta`, sin acortar nunca lo que ya tiene: una cortesía sin fecha, o una que llega
 * más lejos, se quedan como están.
 */
async function extenderPlan(ownerId: string, plan: ClavePlan, hasta: Date, conPrueba: boolean, ahora: Date): Promise<void> {
  const db = getDb()
  const { persona } = await planDe(ownerId, ahora, db)
  const rigePagado = claveQueRige(persona, ahora) !== 'gratis'
  const yaLlegaMasLejos = rigePagado && (persona.planHasta === null || persona.planHasta.getTime() >= hasta.getTime())
  await db
    .update(users)
    .set({
      ...(yaLlegaMasLejos ? {} : { plan, planHasta: hasta, planOrigen: 'suscripcion' as const }),
      ...(conPrueba && !persona.pruebaUsadaEn ? { pruebaUsadaEn: ahora } : {}),
      updatedAt: ahora,
    })
    .where(eq(users.id, ownerId))
}

/**
 * Un cobro de una suscripción: se anota tal como lo dice Mercado Pago y, si se aprobó, la suscripción
 * se vuelve a leer, que trae la fecha del cobro siguiente.
 */
export async function registrarCobro(cobroId: string, ahora = new Date()): Promise<void> {
  const mp = await mercadoPago.leerCobro(cobroId)
  if (!mp.preapproval_id) return
  const db = getDb()
  const [fila] = await db.select().from(suscripciones).where(eq(suscripciones.externoId, mp.preapproval_id)).limit(1)
  if (!fila) return
  const cobradoEn = new Date(mp.debit_date ?? mp.date_created ?? '')
  const valores = {
    ownerId: fila.ownerId,
    suscripcionId: fila.id,
    pagoId: mp.payment?.id === undefined ? null : String(mp.payment.id),
    montoClp: Math.round(mp.transaction_amount ?? fila.montoClp),
    estadoPago: mp.payment?.status ?? null,
    detalle: mp.payment?.status_detail ?? null,
    estadoCobro: mp.status ?? null,
    cobradoEn: Number.isNaN(cobradoEn.getTime()) ? null : cobradoEn,
    actualizadoEn: ahora,
  }
  await db
    .insert(cobros)
    .values({ externoId: String(mp.id ?? cobroId), ...valores })
    .onConflictDoUpdate({ target: cobros.externoId, set: valores })
  if (mp.payment?.status === 'approved') await sincronizarSuscripcion(mp.preapproval_id, ahora)
}

/** «Cancelar la suscripción», desde «Tu plan»: queda el pagado hasta el fin de lo que pagó. */
export async function cancelarSuscripcionDe(ownerId: string, ahora = new Date()): Promise<{ ok: true } | { error: string }> {
  const viva = await suscripcionVivaDe(ownerId)
  if (!viva?.externoId) return { error: SIN_SUSCRIPCION }
  try {
    await aplicarSuscripcion(await mercadoPago.cancelarSuscripcion(viva.externoId), ahora)
    return { ok: true }
  } catch (error) {
    console.error('[pagos] no se canceló la suscripción:', String(error).slice(0, 300))
    return { error: MERCADOPAGO_NO_RESPONDIO }
  }
}

/**
 * La vuelta desde Mercado Pago a Tu Cuenta: relee la última suscripción del dueño sin esperar el
 * webhook, para que «Tu plan» ya diga cómo quedó. Un tropiezo no rompe la página: el webhook y la
 * relectura diaria la ponen al día igual.
 */
export async function alVolverDeMercadoPago(ownerId: string, ahora = new Date()): Promise<void> {
  const [ultima] = await getDb()
    .select({ externoId: suscripciones.externoId })
    .from(suscripciones)
    .where(and(eq(suscripciones.ownerId, ownerId), isNotNull(suscripciones.externoId)))
    .orderBy(desc(suscripciones.creadaEn))
    .limit(1)
  if (!ultima?.externoId) return
  try {
    await sincronizarSuscripcion(ultima.externoId, ahora)
  } catch (error) {
    console.error('[pagos] la vuelta no pudo leer la suscripción:', String(error).slice(0, 300))
  }
}

/**
 * Cada día, en la sincronización: relee las suscripciones vivas y las que esperan autorización desde
 * hace menos de una semana. Un webhook perdido no deja a nadie con el plan equivocado más de un día.
 */
export async function releerSuscripciones(ahora = new Date()): Promise<{ leidas: number; fallidas: number }> {
  if (!mercadoPagoConfigurado()) return { leidas: 0, fallidas: 0 }
  const filas = await getDb()
    .select({ externoId: suscripciones.externoId })
    .from(suscripciones)
    .where(
      and(
        isNotNull(suscripciones.externoId),
        or(
          inArray(suscripciones.estado, ['autorizada', 'pausada']),
          and(eq(suscripciones.estado, 'pendiente'), gt(suscripciones.creadaEn, new Date(ahora.getTime() - 7 * 86_400_000))),
        ),
      ),
    )
  let leidas = 0
  let fallidas = 0
  for (const { externoId } of filas) {
    try {
      await sincronizarSuscripcion(externoId!, ahora)
      leidas += 1
    } catch (error) {
      fallidas += 1
      console.error('[pagos] relectura:', String(error).slice(0, 300))
    }
  }
  return { leidas, fallidas }
}

/** Lo que mira el admin en Los Maestros: los últimos cobros, con el correo de quien pagó. */
export async function cobrosRecientes(limite = 50) {
  return getDb()
    .select({
      id: cobros.id,
      correo: users.correo,
      montoClp: cobros.montoClp,
      estadoPago: cobros.estadoPago,
      detalle: cobros.detalle,
      cobradoEn: cobros.cobradoEn,
      creadoEn: cobros.creadoEn,
    })
    .from(cobros)
    .leftJoin(users, eq(users.id, cobros.ownerId))
    .orderBy(desc(cobros.creadoEn))
    .limit(limite)
}
