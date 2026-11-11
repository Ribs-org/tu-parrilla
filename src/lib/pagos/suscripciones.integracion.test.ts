import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Las suscripciones contra una Postgres de verdad, con Mercado Pago doblado: empezar una deja la fila
// y el enlace (y lo reusa), autorizarla da el pagado hasta el próximo cobro más la gracia, un cobro
// aprobado se anota y corre la fecha, releerla sin un cobro nuevo no la corre, cancelar deja lo
// pagado, una cortesía sin fecha no se acorta, y nadie ve la suscripción de otro.

vi.mock('server-only', () => ({}))
vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN', 'TEST-token')

const mp = {
  crearSuscripcion: vi.fn(),
  leerSuscripcion: vi.fn(),
  cancelarSuscripcion: vi.fn(),
  leerCobro: vi.fn(),
}
vi.mock('./mercadopago', async (original) => ({
  ...(await original<typeof import('./mercadopago')>()),
  mercadoPago: mp,
}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const s = await import('./suscripciones')
const { planDe, darCortesia } = await import('@/lib/planes/planes')
const { GRACIA_DIAS } = await import('./reglas')

async function persona(): Promise<{ id: string; correo: string }> {
  const { users } = await esquema()
  const correo = `p-${crypto.randomUUID()}@ejemplo.cl`
  const [u] = await (await db()).insert(users).values({ correo }).returning()
  return { id: u!.id, correo }
}

const VOLVER = 'https://tu-parrilla.cl/admin/cuenta?plan=vuelta'
const AHORA = new Date('2026-11-08T12:00:00Z')
const PROXIMO = '2026-11-15T12:00:00.000-03:00'

/** Lo que Mercado Pago contesta de la suscripción que creó con este cuerpo. */
function comoLaCrea(id: string) {
  mp.crearSuscripcion.mockImplementationOnce(async (cuerpo: { external_reference: string }) => ({
    id,
    status: 'pending',
    external_reference: cuerpo.external_reference,
    init_point: `https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=${id}`,
  }))
}

describe.skipIf(!URL_PRUEBAS)('las suscripciones, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_suscripciones')
  }, 60_000)
  beforeEach(() => {
    for (const f of Object.values(mp)) f.mockReset()
  })

  it('empezar: la fila, el enlace y la prueba la primera vez; apretar de nuevo reusa el enlace', async () => {
    const ana = await persona()
    comoLaCrea('pre-ana')
    const r = await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)
    expect(r).toEqual({ enlace: 'https://www.mercadopago.cl/subscriptions/checkout?preapproval_id=pre-ana' })
    const [cuerpo] = mp.crearSuscripcion.mock.calls[0]!
    expect(cuerpo).toMatchObject({
      payer_email: ana.correo,
      back_url: VOLVER,
      auto_recurring: { transaction_amount: 34990, currency_id: 'CLP', start_date: '2026-11-15T12:00:00.000Z' },
    })
    expect((cuerpo as { auto_recurring: object }).auto_recurring).not.toHaveProperty('free_trial')

    expect(await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)).toEqual(r)
    expect(mp.crearSuscripcion).toHaveBeenCalledTimes(1)
  })

  it('un correo que no es correo no llega a Mercado Pago; si Mercado Pago no contesta, se dice', async () => {
    const ana = await persona()
    expect(await s.empezarSuscripcion(ana.id, 'no-es-correo', VOLVER, AHORA)).toEqual({
      error: 'Escribe el correo de tu cuenta de Mercado Pago.',
    })
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
    mp.crearSuscripcion.mockRejectedValueOnce(new Error('503'))
    expect(await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)).toEqual({
      error: 'Mercado Pago no respondió. Inténtalo de nuevo en un rato.',
    })
    silencio.mockRestore()
  })

  it('autorizada: el pagado hasta el próximo cobro más la gracia, y la prueba queda usada', async () => {
    const ana = await persona()
    comoLaCrea('pre-autorizada')
    await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)
    const referencia = (mp.crearSuscripcion.mock.calls[0]![0] as { external_reference: string }).external_reference
    mp.leerSuscripcion.mockResolvedValueOnce({
      id: 'pre-autorizada',
      status: 'authorized',
      external_reference: referencia,
      next_payment_date: PROXIMO,
    })
    await s.sincronizarSuscripcion('pre-autorizada', AHORA)

    const { plan, persona: escrita } = await planDe(ana.id, AHORA)
    expect(plan.clave).toBe('pagado')
    expect(escrita.planOrigen).toBe('suscripcion')
    expect(escrita.planHasta!.getTime()).toBe(new Date(PROXIMO).getTime() + GRACIA_DIAS * 86_400_000)
    expect(escrita.pruebaUsadaEn).not.toBeNull()
    expect((await s.suscripcionVivaDe(ana.id))?.estado).toBe('autorizada')
    // Con el pagado, no se ofrece otra.
    expect(await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)).toEqual({ error: 'Ya tienes el plan pagado.' })
  })

  it('un cobro aprobado se anota y corre la fecha; cancelar no le quita lo pagado', async () => {
    const { cobros } = await esquema()
    const ana = await persona()
    comoLaCrea('pre-cobrada')
    await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)
    const referencia = (mp.crearSuscripcion.mock.calls[0]![0] as { external_reference: string }).external_reference
    const autorizada = { id: 'pre-cobrada', status: 'authorized', external_reference: referencia }

    mp.leerCobro.mockResolvedValueOnce({
      id: 7001,
      preapproval_id: 'pre-cobrada',
      status: 'processed',
      transaction_amount: 34990,
      debit_date: '2026-11-15T12:00:00.000-03:00',
      payment: { id: 9001, status: 'approved', status_detail: 'accredited' },
    })
    mp.leerSuscripcion.mockResolvedValueOnce({ ...autorizada, next_payment_date: '2026-12-15T12:00:00.000-03:00' })
    await s.registrarCobro('7001', AHORA)

    const [cobro] = await (await db()).select().from(cobros).where(eq(cobros.externoId, '7001'))
    expect(cobro).toMatchObject({ ownerId: ana.id, montoClp: 34990, estadoPago: 'approved', pagoId: '9001' })
    const hasta = (await planDe(ana.id, AHORA)).persona.planHasta!
    expect(hasta.getTime()).toBe(new Date('2026-12-15T12:00:00.000-03:00').getTime() + GRACIA_DIAS * 86_400_000)

    mp.cancelarSuscripcion.mockResolvedValueOnce({ ...autorizada, status: 'cancelled' })
    expect(await s.cancelarSuscripcionDe(ana.id, AHORA)).toEqual({ ok: true })
    expect(await s.suscripcionVivaDe(ana.id)).toBeNull()
    const despues = await planDe(ana.id, AHORA)
    expect(despues.plan.clave).toBe('pagado')
    expect(despues.persona.planHasta!.getTime()).toBe(hasta.getTime())
    // Y pasada la fecha, el gratis, sin que nadie lo escriba.
    expect((await planDe(ana.id, new Date(hasta.getTime() + 1))).plan.clave).toBe('gratis')
  })

  it('releer cada día no alarga la prueba aunque el próximo cobro se corra', async () => {
    const ana = await persona()
    comoLaCrea('pre-sin-pagar')
    await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)
    const referencia = (mp.crearSuscripcion.mock.calls[0]![0] as { external_reference: string }).external_reference
    const autorizada = { id: 'pre-sin-pagar', status: 'authorized', external_reference: referencia }
    mp.leerSuscripcion.mockResolvedValueOnce({ ...autorizada, next_payment_date: PROXIMO })
    await s.sincronizarSuscripcion('pre-sin-pagar', AHORA)
    const primera = (await planDe(ana.id, AHORA)).persona.planHasta!

    // El primer cobro se rechaza y Mercado Pago lo reintenta: la fecha avanza, pero no entra nada.
    for (const dia of ['2026-11-25', '2026-12-05', '2026-12-15']) {
      mp.leerSuscripcion.mockResolvedValueOnce({ ...autorizada, next_payment_date: `${dia}T12:00:00.000-03:00` })
      await s.sincronizarSuscripcion('pre-sin-pagar', new Date(`${dia}T00:00:00Z`))
    }
    const despues = (await planDe(ana.id, AHORA)).persona.planHasta!
    // Lo más que da la prueba: sus 7 días, el día que vale el enlace y la gracia, desde que se pidió.
    expect(despues.getTime()).toBeLessThanOrEqual(AHORA.getTime() + (7 + 1 + GRACIA_DIAS) * 86_400_000)
    expect(despues.getTime() - primera.getTime()).toBeLessThanOrEqual(86_400_000)
  })

  it('sin prueba: unos días al autorizar, y el resumen de Mercado Pago cuenta como cobro; cancelar con «canceled»', async () => {
    const { users } = await esquema()
    const ana = await persona()
    await (await db()).update(users).set({ pruebaUsadaEn: new Date('2026-01-01T00:00:00Z') }).where(eq(users.id, ana.id))
    comoLaCrea('pre-sin-prueba')
    await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)
    const referencia = (mp.crearSuscripcion.mock.calls[0]![0] as { external_reference: string }).external_reference
    expect((mp.crearSuscripcion.mock.calls[0]![0] as { auto_recurring: object }).auto_recurring).not.toHaveProperty('start_date')
    const autorizada = { id: 'pre-sin-prueba', status: 'authorized', external_reference: referencia }

    mp.leerSuscripcion.mockResolvedValueOnce({ ...autorizada, next_payment_date: '2026-11-08T13:00:00.000Z' })
    await s.sincronizarSuscripcion('pre-sin-prueba', AHORA)
    expect((await planDe(ana.id, AHORA)).persona.planHasta!.getTime()).toBe(AHORA.getTime() + 3 * 86_400_000)

    // El aviso del cobro se perdió, pero la suscripción dice cuándo cobró la última vez.
    mp.leerSuscripcion.mockResolvedValueOnce({
      ...autorizada,
      next_payment_date: '2026-12-08T13:00:00.000Z',
      summarized: { last_charged_date: '2026-11-08T13:05:00.000Z', charged_quantity: 1, semaphore: 'green' },
    })
    await s.sincronizarSuscripcion('pre-sin-prueba', AHORA)
    expect((await planDe(ana.id, AHORA)).persona.planHasta!.getTime()).toBe(
      new Date('2026-12-08T13:00:00.000Z').getTime() + GRACIA_DIAS * 86_400_000,
    )

    mp.cancelarSuscripcion.mockResolvedValueOnce({ ...autorizada, status: 'canceled' })
    expect(await s.cancelarSuscripcionDe(ana.id, AHORA)).toEqual({ ok: true })
    expect(await s.suscripcionVivaDe(ana.id)).toBeNull()
  })

  it('una cortesía sin fecha no se acorta por una suscripción', async () => {
    const ana = await persona()
    comoLaCrea('pre-cortesia')
    await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)
    const referencia = (mp.crearSuscripcion.mock.calls[0]![0] as { external_reference: string }).external_reference
    await darCortesia(ana.id, null)
    mp.leerSuscripcion.mockResolvedValueOnce({
      id: 'pre-cortesia',
      status: 'authorized',
      external_reference: referencia,
      next_payment_date: PROXIMO,
    })
    await s.sincronizarSuscripcion('pre-cortesia', AHORA)
    expect((await planDe(ana.id, AHORA)).persona).toMatchObject({ plan: 'pagado', planHasta: null, planOrigen: 'cortesia' })
  })

  it('una suscripción ajena, o creada fuera de Tu Parrilla, no cambia a nadie', async () => {
    const [ana, bea] = [await persona(), await persona()]
    comoLaCrea('pre-de-ana')
    await s.empezarSuscripcion(ana.id, ana.correo, VOLVER, AHORA)
    const referencia = (mp.crearSuscripcion.mock.calls[0]![0] as { external_reference: string }).external_reference
    mp.leerSuscripcion.mockResolvedValueOnce({
      id: 'pre-de-ana',
      status: 'authorized',
      external_reference: referencia,
      next_payment_date: PROXIMO,
    })
    await s.sincronizarSuscripcion('pre-de-ana', AHORA)
    expect(await s.suscripcionVivaDe(bea.id)).toBeNull()
    expect((await planDe(bea.id, AHORA)).plan.clave).toBe('gratis')
    expect(await s.cancelarSuscripcionDe(bea.id, AHORA)).toEqual({ error: 'No tienes una suscripción que cancelar.' })

    mp.leerSuscripcion.mockResolvedValueOnce({ id: 'pre-de-afuera', status: 'authorized', next_payment_date: PROXIMO })
    await s.sincronizarSuscripcion('pre-de-afuera', AHORA)
    expect((await planDe(bea.id, AHORA)).plan.clave).toBe('gratis')
  })
})
