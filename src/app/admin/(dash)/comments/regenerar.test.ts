import { describe, expect, it } from 'vitest'
import { NADA_QUE_REGENERAR, fraseRegenerado } from './regenerar'

describe('fraseRegenerado', () => {
  it('sin nada que rehacer lo dice', () => {
    expect(fraseRegenerado({ regenerados: 0, fallidos: 0, quedan: 0 })).toBe(NADA_QUE_REGENERAR)
  })

  it('cuenta los nuevos, en singular y en plural', () => {
    expect(fraseRegenerado({ regenerados: 1, fallidos: 0, quedan: 0 })).toBe('Un borrador nuevo.')
    expect(fraseRegenerado({ regenerados: 12, fallidos: 0, quedan: 0 })).toBe('12 borradores nuevos.')
  })

  it('suma los que fallaron y los que quedan para otra vuelta', () => {
    expect(fraseRegenerado({ regenerados: 38, fallidos: 2, quedan: 8 })).toBe(
      '38 borradores nuevos. 2 no se pudieron rehacer y quedaron como estaban. Quedan 8: aprieta «Regenerar todos» otra vez.',
    )
    expect(fraseRegenerado({ regenerados: 0, fallidos: 1, quedan: 0 })).toBe(
      '0 borradores nuevos. Uno no se pudo rehacer y quedó como estaba.',
    )
  })
})
