import { describe, expect, it } from 'vitest'
import { cronAutorizado } from './cron-auth'

describe('cronAutorizado', () => {
  it('pasa solo con el Bearer exacto', () => {
    expect(cronAutorizado('Bearer secreto-de-prueba', 'secreto-de-prueba')).toBe(true)
  })

  it('no pasa con otro secreto, del mismo largo o de otro', () => {
    expect(cronAutorizado('Bearer secreto-de-prueBa', 'secreto-de-prueba')).toBe(false)
    expect(cronAutorizado('Bearer corto', 'secreto-de-prueba')).toBe(false)
    expect(cronAutorizado('secreto-de-prueba', 'secreto-de-prueba')).toBe(false)
  })

  it('sin cabecera, o sin secreto configurado, no pasa nadie', () => {
    expect(cronAutorizado(null, 'secreto-de-prueba')).toBe(false)
    expect(cronAutorizado('Bearer ', undefined)).toBe(false)
    expect(cronAutorizado('Bearer undefined', undefined)).toBe(false)
    expect(cronAutorizado('Bearer ', '')).toBe(false)
  })
})
