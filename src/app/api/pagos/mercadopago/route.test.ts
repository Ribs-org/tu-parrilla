import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// El webhook de Mercado Pago: la firma es la única llave, del aviso solo se cree el id, y cada tema
// va a lo suyo. Lo que hace con el id (`sincronizarSuscripcion`, `registrarCobro`) tiene su propia
// prueba contra la base.

const sincronizarSuscripcion = vi.fn(async () => {})
const registrarCobro = vi.fn(async () => {})
vi.mock('@/lib/pagos/suscripciones', () => ({ sincronizarSuscripcion, registrarCobro }))

const { POST } = await import('./route')

const SECRETO = 'secreto-del-webhook'

function aviso(tipo: string, id: string, opciones: { secreto?: string; ts?: number } = {}) {
  const ts = String(Math.floor((opciones.ts ?? Date.now()) / 1000))
  const firma = createHmac('sha256', opciones.secreto ?? SECRETO)
    .update(`id:${id.toLowerCase()};request-id:pedido-1;ts:${ts};`)
    .digest('hex')
  return new Request(`https://tu-parrilla.cl/api/pagos/mercadopago?data.id=${id}&type=${tipo}`, {
    method: 'POST',
    headers: { 'x-signature': `ts=${ts},v1=${firma}`, 'x-request-id': 'pedido-1', 'content-type': 'application/json' },
    body: JSON.stringify({ type: tipo, action: 'updated', data: { id } }),
  })
}

describe('POST /api/pagos/mercadopago', () => {
  beforeEach(() => vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', SECRETO))
  afterEach(() => {
    vi.unstubAllEnvs()
    sincronizarSuscripcion.mockClear()
    registrarCobro.mockClear()
  })

  it('sin secreto configurado, la ruta queda cerrada', async () => {
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', '')
    expect((await POST(aviso('subscription_preapproval', 'abc'))).status).toBe(400)
    expect(sincronizarSuscripcion).not.toHaveBeenCalled()
  })

  it('una firma que no es de Mercado Pago no toca nada', async () => {
    expect((await POST(aviso('subscription_preapproval', 'abc', { secreto: 'otro' }))).status).toBe(401)
    // Ni una vieja, aunque esté bien firmada.
    expect((await POST(aviso('subscription_preapproval', 'abc', { ts: Date.now() - 60 * 60_000 }))).status).toBe(401)
    expect(sincronizarSuscripcion).not.toHaveBeenCalled()
  })

  it('una suscripción se vuelve a leer por su id; un cobro, igual', async () => {
    expect((await POST(aviso('subscription_preapproval', '2c9380847e9b451c'))).status).toBe(200)
    expect(sincronizarSuscripcion).toHaveBeenCalledWith('2c9380847e9b451c')
    expect((await POST(aviso('subscription_authorized_payment', '7012345678'))).status).toBe(200)
    expect(registrarCobro).toHaveBeenCalledWith('7012345678')
  })

  it('otro tema se contesta y no se mira', async () => {
    expect((await POST(aviso('payment', '123'))).status).toBe(200)
    expect(sincronizarSuscripcion).not.toHaveBeenCalled()
    expect(registrarCobro).not.toHaveBeenCalled()
  })

  it('si leer o escribir falla, 500: Mercado Pago lo reintenta', async () => {
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
    sincronizarSuscripcion.mockRejectedValueOnce(new Error('la base no contesta'))
    expect((await POST(aviso('subscription_preapproval', 'abc'))).status).toBe(500)
    silencio.mockRestore()
  })
})
