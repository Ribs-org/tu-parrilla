import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => ({ Linking: { openURL: vi.fn() } }))
vi.mock('./config', () => ({ API_BASE: 'https://tu-parrilla.cl' }))

const { destinoDeLosFierros } = await import('./puente')

describe('destinoDeLosFierros', () => {
  it('con la ruta del puente, el puente: la sesión del panel ya abierta', () => {
    const ruta = `/ingresar/puente#t=${'a'.repeat(43)}`
    expect(destinoDeLosFierros(ruta)).toBe(`https://tu-parrilla.cl${ruta}`)
  })

  it('sin ella, o con otra cosa, Los Fierros a secas', () => {
    expect(destinoDeLosFierros(undefined)).toBe('https://tu-parrilla.cl/admin/accounts')
    expect(destinoDeLosFierros('https://otro.sitio/ingresar/puente#t=abc')).toBe('https://tu-parrilla.cl/admin/accounts')
    expect(destinoDeLosFierros('/admin/otra-cosa')).toBe('https://tu-parrilla.cl/admin/accounts')
  })
})
