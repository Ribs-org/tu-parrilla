import { describe, expect, it, vi } from 'vitest'
import {
  CANAL_ANDROID,
  LOTE_EXPO,
  PLATAFORMA_INVALIDA,
  TOKEN_INVALIDO,
  URL_EXPO_PUSH,
  enLotes,
  esTokenDeExpo,
  leerTickets,
  mandarAExpo,
  mensajeExpo,
  registroDelCuerpo,
} from './expo'

const TOKEN = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
const aviso = { titulo: 'Se quemó: Instagram', cuerpo: '«hola» no salió.', tipo: 'quemado' as const, id: 'p-1' }

describe('el token de Expo', () => {
  it('acepta las dos formas que entrega Expo y nada más', () => {
    expect(esTokenDeExpo(TOKEN)).toBe(true)
    expect(esTokenDeExpo('ExpoPushToken[abcdefgh12345678]')).toBe(true)
    expect(esTokenDeExpo('ExponentPushToken[]')).toBe(false)
    expect(esTokenDeExpo('fcm:abcdef')).toBe(false)
    expect(esTokenDeExpo(`ExponentPushToken[${'a'.repeat(300)}]`)).toBe(false)
    expect(esTokenDeExpo(42)).toBe(false)
  })

  it('el cuerpo del registro pide el token y la plataforma, con sus frases', () => {
    expect(registroDelCuerpo({ token: TOKEN, plataforma: 'android' })).toEqual({ token: TOKEN, plataforma: 'android' })
    expect(registroDelCuerpo({ token: 'x', plataforma: 'android' })).toEqual({ error: TOKEN_INVALIDO })
    expect(registroDelCuerpo({ token: TOKEN, plataforma: 'web' })).toEqual({ error: PLATAFORMA_INVALIDA })
    expect(registroDelCuerpo(null)).toEqual({ error: TOKEN_INVALIDO })
  })
})

describe('el mensaje', () => {
  it('lleva el canal de Android de la app, el tipo y el id para abrir la pantalla', () => {
    expect(mensajeExpo(TOKEN, aviso)).toEqual({
      to: TOKEN,
      title: 'Se quemó: Instagram',
      body: '«hola» no salió.',
      data: { tipo: 'quemado', id: 'p-1' },
      sound: 'default',
      priority: 'high',
      channelId: CANAL_ANDROID,
    })
  })

  it('recorta un texto largo, sin pasarse de lo que el teléfono muestra', () => {
    const m = mensajeExpo(TOKEN, { ...aviso, cuerpo: 'palabra '.repeat(100) })
    expect(m.body.length).toBeLessThanOrEqual(240)
    expect(m.body.endsWith('…')).toBe(true)
  })

  it('parte en lotes de a 100, el tope de Expo', () => {
    expect(enLotes(Array.from({ length: 250 }, (_, i) => i)).map((l) => l.length)).toEqual([LOTE_EXPO, LOTE_EXPO, 50])
  })
})

describe('los tickets', () => {
  it('cuenta los aceptados y junta los tokens que el teléfono ya no usa', () => {
    const lote = [mensajeExpo('ExpoPushToken[aaaaaaaa]', aviso), mensajeExpo('ExpoPushToken[bbbbbbbb]', aviso), mensajeExpo('ExpoPushToken[cccccccc]', aviso)]
    const r = leerTickets(lote, {
      data: [
        { status: 'ok', id: '1' },
        { status: 'error', message: 'no', details: { error: 'DeviceNotRegistered' } },
        { status: 'error', message: 'grande', details: { error: 'MessageTooBig' } },
      ],
    })
    expect(r).toEqual({ aceptados: 1, vencidos: ['ExpoPushToken[bbbbbbbb]'], fallidos: 2 })
  })

  it('una respuesta sin tickets cuenta todo como fallido', () => {
    expect(leerTickets([mensajeExpo(TOKEN, aviso)], { errors: [{ code: 'X' }] })).toEqual({ aceptados: 0, vencidos: [], fallidos: 1 })
  })
})

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('mandarAExpo', () => {
  const esperar = async () => {}

  it('manda un pedido por lote, con la llave de acceso si la hay', async () => {
    const pedidos: Array<{ url: string; init: RequestInit }> = []
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      pedidos.push({ url, init })
      const lote = JSON.parse(String(init.body)) as unknown[]
      return respuesta(200, { data: lote.map(() => ({ status: 'ok', id: 'x' })) })
    })
    const mensajes = Array.from({ length: 150 }, () => mensajeExpo(TOKEN, aviso))
    const r = await mandarAExpo(mensajes, { fetch, esperar, accessToken: 'llave' })
    expect(r).toEqual({ aceptados: 150, vencidos: [], fallidos: 0 })
    expect(pedidos).toHaveLength(2)
    expect(pedidos[0]!.url).toBe(URL_EXPO_PUSH)
    expect((pedidos[0]!.init.headers as Record<string, string>).Authorization).toBe('Bearer llave')
  })

  it('sin llave no manda Authorization: la seguridad extra de Expo es opcional', async () => {
    const fetch = vi.fn(async () => respuesta(200, { data: [{ status: 'ok' }] }))
    await mandarAExpo([mensajeExpo(TOKEN, aviso)], { fetch, esperar })
    expect((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].headers).not.toHaveProperty('Authorization')
  })

  it('reintenta una vez un 5xx o un 429', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respuesta(503, { errors: [] }))
      .mockResolvedValueOnce(respuesta(200, { data: [{ status: 'ok' }] }))
    expect(await mandarAExpo([mensajeExpo(TOKEN, aviso)], { fetch, esperar })).toEqual({ aceptados: 1, vencidos: [], fallidos: 0 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('un 400 no se reintenta: es el mensaje mal armado', async () => {
    const fetch = vi.fn(async () => respuesta(400, { errors: [{ code: 'VALIDATION_ERROR' }] }))
    expect(await mandarAExpo([mensajeExpo(TOKEN, aviso)], { fetch, esperar })).toEqual({ aceptados: 0, vencidos: [], fallidos: 1 })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sin red no lanza: el lote cuenta como fallido', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    expect(await mandarAExpo([mensajeExpo(TOKEN, aviso)], { fetch, esperar })).toEqual({ aceptados: 0, vencidos: [], fallidos: 1 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
