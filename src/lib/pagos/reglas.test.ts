import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  GRACIA_DIAS,
  cuerpoDeSuscripcion,
  estaViva,
  estadoDeMercadoPago,
  estadoDePagoEnPalabras,
  firmaValida,
  hastaConGracia,
  hastaDelPagado,
  temaDeAviso,
} from './reglas'

const SECRETO = 'secreto-del-webhook'
const AHORA = Date.UTC(2026, 10, 8, 12, 0, 0)
const TS = String(Math.floor(AHORA / 1000))

/** La firma como la arma Mercado Pago (y su SDK de Node): HMAC-SHA256 del manifiesto. */
function firmar(manifiesto: string, secreto = SECRETO): string {
  return createHmac('sha256', secreto).update(manifiesto).digest('hex')
}

describe('firmaValida', () => {
  const manifiesto = `id:2c9380847e9b451c;request-id:pedido-1;ts:${TS};`
  const encabezado = `ts=${TS},v1=${firmar(manifiesto)}`
  const base = { xSignature: encabezado, xRequestId: 'pedido-1', dataId: '2c9380847e9b451c', secreto: SECRETO, ahoraMs: AHORA }

  it('acepta la firma de Mercado Pago', () => {
    expect(firmaValida(base)).toBe(true)
    // Con espacios y en otro orden, igual.
    expect(firmaValida({ ...base, xSignature: ` v1=${firmar(manifiesto)} , ts=${TS}` })).toBe(true)
  })

  it('el id va en minúsculas, como lo firma Mercado Pago', () => {
    expect(firmaValida({ ...base, dataId: '2C9380847E9B451C' })).toBe(true)
  })

  it('rechaza otro secreto, otro id, otro pedido o un encabezado roto', () => {
    expect(firmaValida({ ...base, secreto: 'otro' })).toBe(false)
    expect(firmaValida({ ...base, dataId: '999' })).toBe(false)
    expect(firmaValida({ ...base, xRequestId: 'pedido-2' })).toBe(false)
    expect(firmaValida({ ...base, xSignature: null })).toBe(false)
    expect(firmaValida({ ...base, xSignature: 'v1=abc' })).toBe(false)
    expect(firmaValida({ ...base, xSignature: `ts=${TS}` })).toBe(false)
    expect(firmaValida({ ...base, xSignature: `ts=hoy,v1=${firmar(manifiesto)}` })).toBe(false)
    expect(firmaValida({ ...base, secreto: '' })).toBe(false)
  })

  it('sin id o sin pedido, el manifiesto se arma sin esa parte, como el SDK', () => {
    const sinNada = `ts:${TS};`
    expect(firmaValida({ ...base, dataId: null, xRequestId: null, xSignature: `ts=${TS},v1=${firmar(sinNada)}` })).toBe(true)
  })

  it('una marca en milisegundos también se entiende, y se firma tal como vino', () => {
    const ms = String(AHORA)
    const v1 = firmar(`id:123;request-id:req-1;ts:${ms};`)
    expect(
      firmaValida({ xSignature: `ts=${ms},v1=${v1}`, xRequestId: 'req-1', dataId: '123', secreto: SECRETO, ahoraMs: AHORA, toleranciaS: 900 }),
    ).toBe(true)
  })

  it('con tolerancia, una firma vieja no vale', () => {
    expect(firmaValida({ ...base, toleranciaS: 900 })).toBe(true)
    expect(firmaValida({ ...base, toleranciaS: 900, ahoraMs: AHORA + 901_000 })).toBe(false)
  })
})

describe('hastaDelPagado', () => {
  const DIA = 86_400_000
  const pedidaEn = new Date('2026-11-08T12:00:00Z')
  const fecha = (d: string) => new Date(`${d}T12:00:00Z`)
  const base = { conPrueba: false, diasDePrueba: 7, pedidaEn, proximoCobro: null, ultimoCobro: null }

  it('sin prueba y sin cobro todavía: unos días desde que se pidió, mientras llega el primer cobro', () => {
    expect(hastaDelPagado(base)!.getTime()).toBe(pedidaEn.getTime() + 3 * DIA)
  })

  it('con prueba: hasta el primer cobro más la gracia, sin pasar de los días de prueba', () => {
    const conPrueba = { ...base, conPrueba: true }
    expect(hastaDelPagado({ ...conPrueba, proximoCobro: fecha('2026-11-15') })).toEqual(new Date(fecha('2026-11-15').getTime() + 11 * DIA))
    // Una fecha de cobro corrida no estira la prueba.
    expect(hastaDelPagado({ ...conPrueba, proximoCobro: fecha('2027-01-15') })).toEqual(
      new Date(pedidaEn.getTime() + (7 + 1 + 11) * DIA),
    )
  })

  it('un cobro corre el plan hasta el próximo, y nada más que eso la fecha del próximo cobro', () => {
    const cobrado = { ...base, ultimoCobro: fecha('2026-12-08'), proximoCobro: fecha('2027-01-08') }
    expect(hastaDelPagado(cobrado)).toEqual(new Date(fecha('2027-01-08').getTime() + 11 * DIA))
    // Mientras Mercado Pago reintenta una cuota rechazada, el próximo cobro puede seguir avanzando:
    // sin un cobro nuevo, el plan no pasa de un mes y poco desde el último.
    const sinPagar = { ...cobrado, proximoCobro: fecha('2027-04-08') }
    expect(hastaDelPagado(sinPagar)).toEqual(new Date(fecha('2026-12-08').getTime() + (32 + 11) * DIA))
  })
})

describe('cuerpoDeSuscripcion', () => {
  const plan = { nombre: 'Maestro Parrillero', precioClp: 34990, diasDePrueba: 7 }
  const entrada = {
    plan,
    suscripcionId: 'f1c3b8d2-0000-4000-8000-000000000001',
    correoPagador: 'ana@ejemplo.cl',
    volverA: 'https://tu-parrilla.cl/admin/cuenta?plan=vuelta',
    conPrueba: true,
    ahora: new Date('2026-11-08T12:00:00.000Z'),
  }

  it('una suscripción mensual en pesos, con la prueba como fecha de inicio y la referencia a nuestra fila', () => {
    expect(cuerpoDeSuscripcion(entrada)).toEqual({
      reason: 'Tu Parrilla — Maestro Parrillero',
      external_reference: entrada.suscripcionId,
      payer_email: 'ana@ejemplo.cl',
      back_url: entrada.volverA,
      status: 'pending',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 34990,
        currency_id: 'CLP',
        // `start_date` solo vale con `end_date`; `free_trial` no está entre lo que se manda.
        start_date: '2026-11-15T12:00:00.000Z',
        end_date: '2036-11-15T00:00:00.000Z',
      },
    })
  })

  it('sin prueba si ya la usó, o si el plan no tiene días: se cobra al autorizar', () => {
    for (const sin of [cuerpoDeSuscripcion({ ...entrada, conPrueba: false }), cuerpoDeSuscripcion({ ...entrada, plan: { ...plan, diasDePrueba: 0 } })]) {
      expect(sin.auto_recurring).not.toHaveProperty('start_date')
      expect(sin.auto_recurring).not.toHaveProperty('end_date')
      expect(sin.auto_recurring).not.toHaveProperty('free_trial')
    }
  })
})

describe('los estados', () => {
  it('los de Mercado Pago en los nuestros; lo desconocido espera', () => {
    expect(estadoDeMercadoPago('authorized')).toBe('autorizada')
    expect(estadoDeMercadoPago('paused')).toBe('pausada')
    // La referencia escribe `canceled`; el SDK, `cancelled`.
    expect(estadoDeMercadoPago('canceled')).toBe('cancelada')
    expect(estadoDeMercadoPago('cancelled')).toBe('cancelada')
    expect(estadoDeMercadoPago('pending')).toBe('pendiente')
    expect(estadoDeMercadoPago(undefined)).toBe('pendiente')
    expect(estaViva('autorizada')).toBe(true)
    expect(estaViva('pausada')).toBe(true)
    expect(estaViva('cancelada')).toBe(false)
  })

  it('el pagado sigue la gracia después del próximo cobro: los 10 días de reintentos y uno más', () => {
    const proximo = new Date('2026-12-08T12:00:00Z')
    expect(GRACIA_DIAS).toBe(11)
    expect(hastaConGracia(proximo).getTime() - proximo.getTime()).toBe(GRACIA_DIAS * 86_400_000)
  })

  it('el tema del aviso, y el estado del pago en palabras', () => {
    expect(temaDeAviso('subscription_preapproval')).toBe('suscripcion')
    expect(temaDeAviso('subscription_authorized_payment')).toBe('cobro')
    expect(temaDeAviso('payment')).toBe('otro')
    expect(temaDeAviso(null)).toBe('otro')
    expect(estadoDePagoEnPalabras('approved')).toBe('aprobado')
    expect(estadoDePagoEnPalabras('rejected')).toBe('rechazado')
    expect(estadoDePagoEnPalabras('in_process')).toBe('pendiente')
    expect(estadoDePagoEnPalabras(null)).toBe('sin pago todavía')
  })
})
