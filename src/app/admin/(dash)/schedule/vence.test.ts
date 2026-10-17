import { describe, expect, it } from 'vitest'
import { venceAntesDe } from './vence'

const ZONA = 'America/Santiago'
// El 20 de octubre de 2026 a las 17:00 UTC son las 14:00 en Santiago (UTC−3).
const facebook = { network: 'facebook', connected: true, expiresAt: '2026-10-20T17:00:00.000Z' }

describe('venceAntesDe', () => {
  it('avisa cuando el permiso vence antes de la hora elegida, con la hora local del vencimiento', () => {
    expect(venceAntesDe(facebook, '2026-10-22T09:00', ZONA)).toBe('2026-10-20T14:00')
  })

  it('también cuando vence justo a esa hora', () => {
    expect(venceAntesDe(facebook, '2026-10-20T14:00', ZONA)).toBe('2026-10-20T14:00')
  })

  it('no avisa si sale antes de que venza', () => {
    expect(venceAntesDe(facebook, '2026-10-20T13:59', ZONA)).toBeNull()
  })

  it('no avisa de redes que renuevan su credencial solas: su vencimiento es el de un token corto', () => {
    for (const network of ['tiktok', 'youtube', 'x']) {
      expect(venceAntesDe({ ...facebook, network }, '2026-10-30T09:00', ZONA)).toBeNull()
    }
  })

  it('sin hora elegida, sin vencimiento o desconectada, no hay de qué avisar', () => {
    expect(venceAntesDe(facebook, '', ZONA)).toBeNull()
    expect(venceAntesDe(facebook, '2026-10-2', ZONA)).toBeNull()
    expect(venceAntesDe({ ...facebook, expiresAt: null }, '2026-10-30T09:00', ZONA)).toBeNull()
    expect(venceAntesDe({ ...facebook, connected: false }, '2026-10-30T09:00', ZONA)).toBeNull()
  })
})
