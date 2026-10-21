import { afterEach, describe, expect, it, vi } from 'vitest'
import { copiarAlPortapapeles } from './copiar'

describe('copiarAlPortapapeles', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('dice que copió solo si la escritura terminó', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    expect(await copiarAlPortapapeles('hola')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hola')
  })

  it('sin portapapeles (http que no es localhost) no revienta: dice que no', async () => {
    vi.stubGlobal('navigator', {})
    expect(await copiarAlPortapapeles('hola')).toBe(false)
  })

  it('con el permiso negado tampoco', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: async () => Promise.reject(new Error('NotAllowedError')) } })
    expect(await copiarAlPortapapeles('hola')).toBe(false)
  })
})
