import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PLAZO_MS, RechazoApi, SesionCaducada, apiGet, apiPost } from './api'

/** Un servidor que no contesta nunca: solo se suelta si se corta el pedido. */
const colgado = vi.fn(
  (_url: string, init?: RequestInit) =>
    new Promise<Response>((_resolver, rechazar) => {
      init?.signal?.addEventListener('abort', () => rechazar(new DOMException('cortado', 'AbortError')))
    }),
)

const responde = (estado: number, cuerpo: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(cuerpo), { status: estado }))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('el plazo de cada pedido', () => {
  it('un servidor que no contesta se corta al plazo y revienta como la red caída', async () => {
    vi.stubGlobal('fetch', colgado)
    let error: unknown = null
    void apiPost('/api/mobile/schedule', 'token', {}).catch((e: unknown) => {
      error = e
    })
    await vi.advanceTimersByTimeAsync(PLAZO_MS - 1)
    expect(error).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    expect(error).toBeInstanceOf(DOMException)
    // Ni sesión caducada ni frase del servidor: la pantalla lo cuenta como «sin señal».
    expect(error).not.toBeInstanceOf(SesionCaducada)
    expect(error).not.toBeInstanceOf(RechazoApi)
  })

  it('una respuesta a tiempo no deja el reloj corriendo', async () => {
    vi.stubGlobal('fetch', responde(200, { ok: 1 }))
    await expect(apiGet('/api/mobile/fierros', 'token')).resolves.toEqual({ ok: 1 })
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('lo que contesta el servidor', () => {
  it('un 401 es la sesión que dejó de valer', async () => {
    vi.stubGlobal('fetch', responde(401, {}))
    await expect(apiGet('/api/mobile/fierros', 'token')).rejects.toBeInstanceOf(SesionCaducada)
  })

  it('la frase del servidor sube tal cual', async () => {
    vi.stubGlobal('fetch', responde(404, { error: 'Ese borrador ya no existe.' }))
    await expect(apiGet('/api/mobile/borradores/x', 'token')).rejects.toEqual(new RechazoApi('Ese borrador ya no existe.'))
  })

  it('el token va en la cabecera', async () => {
    const fetch = responde(200, {})
    vi.stubGlobal('fetch', fetch)
    await apiGet('/api/mobile/fierros', 'abc')
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).toMatchObject({ Authorization: 'Bearer abc' })
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
