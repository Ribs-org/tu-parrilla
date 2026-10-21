import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildVisitContext } from './tracking'

/** El hash del mismo visitante, con lo que haya hoy en el entorno. */
const hash = () =>
  buildVisitContext(new Headers({ 'x-real-ip': '203.0.113.7', 'user-agent': 'Mozilla/5.0' }), new URLSearchParams())
    .visitorHash

describe('la sal del hash de visitantes', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin FINGERPRINT_SALT sale de AUTH_SECRET: cambia con él, y no es la constante del repositorio', () => {
    vi.stubEnv('FINGERPRINT_SALT', '')
    vi.stubEnv('AUTH_SECRET', '')
    const conLaConstante = hash()
    vi.stubEnv('AUTH_SECRET', 'secreto-a')
    const conA = hash()
    vi.stubEnv('AUTH_SECRET', 'secreto-b')
    expect(conA).not.toBe(conLaConstante)
    expect(hash()).not.toBe(conA)
  })

  it('con FINGERPRINT_SALT manda ella, aunque cambie AUTH_SECRET', () => {
    vi.stubEnv('FINGERPRINT_SALT', 'sal-propia')
    vi.stubEnv('AUTH_SECRET', 'secreto-a')
    const conA = hash()
    vi.stubEnv('AUTH_SECRET', 'secreto-b')
    expect(hash()).toBe(conA)
  })
})
