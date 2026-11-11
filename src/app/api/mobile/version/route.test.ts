import { describe, expect, it } from 'vitest'

// La versión de la app que pide el servidor: se lee sin token, y la mínima nunca queda por encima
// de la recomendada, que dejaría a la app pidiendo una actualización que la tienda no ofrece.

const { GET } = await import('./route')

/** Número por número, como la app (`mobile/src/lib/version.ts`): «1.10.0» va después de «1.2.0». */
const numeros = (v: string) => v.split('.').map(Number)
const noPasa = (minima: string, recomendada: string) => {
  const [a, b] = [numeros(minima), numeros(recomendada)]
  const i = a.findIndex((n, k) => n !== (b[k] ?? 0))
  return i === -1 || a[i]! < (b[i] ?? 0)
}

describe('GET /api/mobile/version', () => {
  it('contesta sin token, con la recomendada y la mínima por plataforma', async () => {
    const r = GET()
    expect(r.status).toBe(200)
    const cuerpo = (await r.json()) as Record<string, { recomendada: string; minima: string; tienda: string } | null>
    expect(cuerpo.android).toMatchObject({ tienda: expect.stringContaining('cl.tuparrilla.app') })
    expect(cuerpo.ios).toBeNull()
    for (const v of Object.values(cuerpo)) {
      if (v) expect(noPasa(v.minima, v.recomendada)).toBe(true)
    }
  })
})
