import { describe, expect, it } from 'vitest'
import { fraseDeVuelta, pidioAgregar, soloSeRenovo } from './vuelta'

describe('pidioAgregar', () => {
  it('lee la marca de «Agregar cuenta →», solo para su red', () => {
    expect(pidioAgregar('agregar_cuenta=tiktok', 'tiktok')).toBe(true)
    expect(pidioAgregar('sesion=abc; agregar_cuenta=instagram; otra=1', 'instagram')).toBe(true)
    expect(pidioAgregar('agregar_cuenta=tiktok', 'instagram')).toBe(false)
    expect(pidioAgregar('sesion=abc', 'tiktok')).toBe(false)
    expect(pidioAgregar(null, 'tiktok')).toBe(false)
  })
})

describe('la frase de la vuelta', () => {
  it('si «Agregar cuenta →» solo renovó la de antes, lo dice, letra por letra', () => {
    expect(soloSeRenovo('tiktok')).toBe('TikTok entró con la cuenta que ya estaba conectada: se renovó y no se agregó otra.')
    expect(fraseDeVuelta('instagram', 'renovada', true)).toBe(
      'Instagram entró con la cuenta que ya estaba conectada: se renovó y no se agregó otra.',
    )
  })

  it('una cuenta nueva, o un «Reconectar», vuelven con «conectado» como siempre', () => {
    expect(fraseDeVuelta('tiktok', 'nueva', true)).toBe('TikTok conectado.')
    expect(fraseDeVuelta('tiktok', 'renovada', false)).toBe('TikTok conectado.')
    expect(fraseDeVuelta('youtube', 'nueva', false)).toBe('YouTube conectado.')
  })
})
