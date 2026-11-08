import { beforeAll, describe, expect, it } from 'vitest'
import {
  leerCuentaDeOAuthState,
  leerOAuthState,
  oauthStateMatches,
  signOAuthState,
  signOAuthStateDeCuenta,
} from './oauth-state'

beforeAll(() => {
  process.env.AUTH_SECRET = 'secreto-de-prueba-largo-para-hkdf'
})

describe('state de OAuth', () => {
  it('vale para su red y su dueño', async () => {
    const state = await signOAuthState('instagram', 'u1')
    expect(await oauthStateMatches(state, 'instagram', 'u1')).toBe(true)
  })

  it('no vale para otra red ni para otro dueño', async () => {
    const state = await signOAuthState('instagram', 'u1')
    expect(await oauthStateMatches(state, 'tiktok', 'u1')).toBe(false)
    // Lo que impide que alguien termine tu conexión a medias con su propia sesión.
    expect(await oauthStateMatches(state, 'instagram', 'u2')).toBe(false)
    expect(await oauthStateMatches('', 'instagram', 'u1')).toBe(false)
  })

  it('lleva firmado el login con que salió, y nada si no se le dio', async () => {
    expect(await leerOAuthState(await signOAuthState('instagram', 'u1', 'instagram'), 'instagram', 'u1')).toEqual({
      login: 'instagram',
    })
    expect(await leerOAuthState(await signOAuthState('instagram', 'u1'), 'instagram', 'u1')).toEqual({ login: null })
    expect(await leerOAuthState(await signOAuthState('instagram', 'u1', 'instagram'), 'instagram', 'u2')).toBeNull()
  })

  it('el de una cuenta lleva la cuenta firmada, y solo para su red y su dueño', async () => {
    const state = await signOAuthStateDeCuenta('tiktok-comentarios', 'u1', 'cuenta-1')
    expect(await leerCuentaDeOAuthState(state, 'tiktok-comentarios', 'u1')).toBe('cuenta-1')
    expect(await leerCuentaDeOAuthState(state, 'tiktok', 'u1')).toBeNull()
    expect(await leerCuentaDeOAuthState(state, 'tiktok-comentarios', 'u2')).toBeNull()
    // Un state de conectar no nombra ninguna cuenta.
    expect(await leerCuentaDeOAuthState(await signOAuthState('tiktok-comentarios', 'u1'), 'tiktok-comentarios', 'u1')).toBeNull()
  })
})
