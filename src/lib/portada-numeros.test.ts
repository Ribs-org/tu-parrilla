import { beforeEach, describe, expect, it, vi } from 'vitest'

// Lo que hace `numerosDeLaPortada` alrededor de la suma: esconderse cuando no hay nada que contar y
// no tumbar la portada si la base falla. La suma misma, en `portada-numeros.integracion.test.ts`.

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))

const execute = vi.fn()
vi.mock('@/db', () => ({ getDb: () => ({ execute }), postMetrics: {}, socialAccounts: {}, socialPosts: {} }))

const { numerosDeLaPortada } = await import('./portada-numeros')

describe('numerosDeLaPortada', () => {
  beforeEach(() => {
    execute.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('devuelve las cifras, leídas del texto que manda la base', async () => {
    execute.mockResolvedValue([{ vistas: '4000000300', me_gusta: '35' }])
    await expect(numerosDeLaPortada()).resolves.toEqual({ vistas: 4_000_000_300, meGusta: 35 })
  })

  it('sin nada que contar, no muestra un cero', async () => {
    execute.mockResolvedValue([{ vistas: '0', me_gusta: '0' }])
    await expect(numerosDeLaPortada()).resolves.toBeNull()
  })

  it('si la base falla, la portada sigue sin contador', async () => {
    execute.mockRejectedValue(new Error('la base no contesta'))
    await expect(numerosDeLaPortada()).resolves.toBeNull()
  })
})
