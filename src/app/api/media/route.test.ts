import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CUERPO_ILEGIBLE, TIPO_NO_PUBLICABLE } from '@/lib/mobile-api'

vi.mock('server-only', () => ({}))

// Se doblan la llave y la firma: lo que se prueba acá es la puerta —sin dueño no se firma
// nada—, que la clave va en la carpeta del dueño de esa llave, y la forma de la respuesta.
// Qué clave sale de qué nombre lo prueba `media-api.test.ts`.
const dueno = vi.fn()
vi.mock('@/lib/llaves', () => ({
  duenoDeLaLlave: (...args: unknown[]) => dueno(...args),
}))
const firmar = vi.fn()
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  return { ...real, urlParaSubir: (...args: unknown[]) => firmar(...args) }
})

const { POST } = await import('./route')
const { CACHE_INMUTABLE, SIN_ALMACEN } = await import('@/lib/storage')

function peticion(cuerpo: unknown): Request {
  return new Request('https://ejemplo.cl/api/media', {
    method: 'POST',
    headers: { authorization: 'Bearer tp_llave', 'content-type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  })
}

beforeEach(() => {
  dueno.mockReset()
  dueno.mockResolvedValue('usuario-7')
  firmar.mockReset()
  firmar.mockImplementation(async (key: string) => ({
    subir: `https://r2.ej/firmado/${key}?X-Amz-Signature=abc`,
    publica: `https://media.ej.cl/${key}`,
  }))
})

describe('POST /api/media', () => {
  it('sin una llave válida es 401 y no firma nada', async () => {
    dueno.mockResolvedValueOnce(null)
    const r = await POST(peticion({ nombre: 'v.mp4', tipo: 'video/mp4', bytes: 10 }))
    expect(r.status).toBe(401)
    expect(await r.text()).toBe('No autorizado')
    expect(firmar).not.toHaveBeenCalled()
  })

  it('firma en la carpeta del dueño de la llave y dice qué mandar en el PUT', async () => {
    const r = await POST(peticion({ nombre: 'video-01.mp4', tipo: 'video/mp4', bytes: 41_937_210 }))
    expect(r.status).toBe(200)
    const cuerpo = await r.json()
    const [key, tipo] = firmar.mock.calls[0]!
    expect(key).toMatch(/^scheduled\/usuario-7\/[0-9a-f-]{36}-video-01\.mp4$/)
    expect(tipo).toBe('video/mp4')
    expect(cuerpo).toEqual({
      url: `https://media.ej.cl/${key}`,
      subir: `https://r2.ej/firmado/${key}?X-Amz-Signature=abc`,
      cabeceras: { 'Content-Type': 'video/mp4', 'Cache-Control': CACHE_INMUTABLE },
      mediaType: 'video',
      vence: expect.any(String),
    })
    expect(new Date(cuerpo.vence).getTime()).toBeGreaterThan(Date.now())
  })

  it('un tipo que no se publica es 400 con su frase', async () => {
    const r = await POST(peticion({ nombre: 'a.svg', tipo: 'image/svg+xml', bytes: 10 }))
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({ error: TIPO_NO_PUBLICABLE })
    expect(firmar).not.toHaveBeenCalled()
  })

  it('un cuerpo que no es un objeto JSON es 400', async () => {
    for (const malo of ['no es json', '[1]', 'null']) {
      const r = await POST(peticion(malo))
      expect(r.status).toBe(400)
      expect(await r.json()).toEqual({ error: CUERPO_ILEGIBLE })
    }
  })

  it('sin almacén configurado es 500 con la frase de siempre', async () => {
    firmar.mockRejectedValueOnce(new Error(SIN_ALMACEN))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = await POST(peticion({ nombre: 'v.mp4', tipo: 'video/mp4', bytes: 10 }))
    expect(r.status).toBe(500)
    expect(await r.json()).toEqual({ error: SIN_ALMACEN })
  })
})
