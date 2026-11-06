import { describe, expect, it } from 'vitest'

import { copiaDeLaBandeja } from './bandeja'
import type { PostProgramado } from './tipos'

function post(cambios: Partial<PostProgramado> = {}): PostProgramado {
  return {
    id: 'p1',
    texto: 'Chimichurri en 30 segundos',
    cuando: '2026-11-06T19:00:00-03:00',
    formato: 'entrana',
    redes: [
      { id: 'd1', red: 'instagram', handle: 'vicente', estado: 'published', sello: 'servido' },
      { id: 'd2', red: 'tiktok', handle: 'vicente', estado: 'published', sello: 'bandeja' },
    ],
    ...cambios,
  }
}

describe('copiaDeLaBandeja', () => {
  it('un video en la bandeja de TikTok copia su texto y explica por qué', () => {
    expect(copiaDeLaBandeja(post())).toEqual({ texto: 'Chimichurri en 30 segundos', video: true })
  })

  it('las fotos llevan su texto a TikTok: se copia igual, sin la explicación', () => {
    expect(copiaDeLaBandeja(post({ formato: 'tira', huesos: 3 }))).toEqual({ texto: 'Chimichurri en 30 segundos', video: false })
    // Un servidor de antes no manda el formato: no se explica lo que no se sabe.
    expect(copiaDeLaBandeja(post({ formato: undefined }))?.video).toBe(false)
  })

  it('sin nada en la bandeja, o sin texto, no hay botón', () => {
    const terminado = post({
      redes: [{ id: 'd2', red: 'tiktok', handle: 'vicente', estado: 'published', sello: 'servido' }],
    })
    expect(copiaDeLaBandeja(terminado)).toBeNull()
    // Un servidor de antes no manda el sello: sin él no hay cómo saber que espera en la bandeja.
    expect(copiaDeLaBandeja(post({ redes: [{ id: 'd2', red: 'tiktok', handle: null, estado: 'published' }] }))).toBeNull()
    expect(copiaDeLaBandeja(post({ texto: '  ' }))).toBeNull()
  })
})
