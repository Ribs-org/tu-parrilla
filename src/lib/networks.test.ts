import { describe, expect, it } from 'vitest'
import { AVISO_META_EN_REVISION, avisosDe } from './networks'

describe('avisosDe', () => {
  it('cada red dice lo que exige, letra por letra', () => {
    expect(avisosDe('instagram', false)).toEqual([
      'Cuenta Business o Creator, enlazada a una página de Facebook. Una cuenta personal no puede conectar.',
    ])
    expect(avisosDe('facebook', false)).toEqual(['Una página, no un perfil personal.'])
    // Lo que sube Tu Parrilla a YouTube sale público aunque la auditoría de cuota no esté
    // aprobada (comprobado el 2026-10-09 y el 2026-10-16): no hay nada que advertir.
    expect(avisosDe('youtube', false)).toEqual([])
  })

  it('mientras Meta revisa la app, Instagram y Facebook llevan la segunda línea; las demás no', () => {
    expect(AVISO_META_EN_REVISION).toBe(
      'Mientras Meta revisa la app, solo pueden conectar las cuentas que invitamos como testers. Si Facebook dice que la función no está disponible, escríbenos.',
    )
    expect(avisosDe('instagram', true)).toHaveLength(2)
    expect(avisosDe('instagram', true)[1]).toBe(AVISO_META_EN_REVISION)
    expect(avisosDe('facebook', true)).toHaveLength(2)
    expect(avisosDe('youtube', true)).toHaveLength(0)
  })

  it('una red sin aviso fijo —threads, tiktok— no dice nada, revise o no revise Meta', () => {
    expect(avisosDe('threads', false)).toEqual([])
    expect(avisosDe('threads', true)).toEqual([])
    // Con la auditoría de Direct Post aprobada, TikTok publica en público: nada que advertir.
    expect(avisosDe('tiktok', false)).toEqual([])
    expect(avisosDe('tiktok', true)).toEqual([])
  })
})
