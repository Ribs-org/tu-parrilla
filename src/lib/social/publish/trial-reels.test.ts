import { describe, expect, it } from 'vitest'
import { loQueAprende } from './trial-reels'

const SIN = '@nueva no tiene trial reels: Instagram los da solo a cuentas con un mínimo de seguidores.'

describe('loQueAprende', () => {
  it('un rechazo de elegibilidad marca la cuenta sin trial reels, con la frase del rechazo', () => {
    expect(
      loQueAprende('instagram', { kind: 'failed', reason: SIN, definitivo: true, sinTrial: true }, { trialReel: true }),
    ).toEqual({ trialReels: 'no', motivo: SIN })
  })

  it('un trial reel que salió la marca con trial reels, aunque antes dijera que no', () => {
    expect(loQueAprende('instagram', { kind: 'published', externalId: '17' }, { trialReel: true })).toEqual({
      trialReels: 'si',
      motivo: null,
    })
  })

  it('lo demás no dice nada de la cuenta', () => {
    // Un reel normal que salió no prueba nada de los trial reels.
    expect(loQueAprende('instagram', { kind: 'published', externalId: '17' }, null)).toBeNull()
    // Un fallo cualquiera, tampoco, aunque fuera un trial reel.
    expect(
      loQueAprende('instagram', { kind: 'failed', reason: 'No se pudo hablar con la red. Se reintentará.' }, { trialReel: true }),
    ).toBeNull()
    // Un contenedor que se procesa todavía no salió.
    expect(loQueAprende('instagram', { kind: 'processing', containerId: 'c' }, { trialReel: true })).toBeNull()
    // Otra red no tiene trial reels.
    expect(loQueAprende('facebook', { kind: 'failed', reason: SIN, definitivo: true, sinTrial: true }, null)).toBeNull()
  })
})
