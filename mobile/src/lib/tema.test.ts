import { describe, expect, it } from 'vitest'
import { SE_QUEMO, otroTema, temaDe, temaDeLaRespuesta } from './tema'

describe('el modo de la app', () => {
  it('lo que no es el día es la noche, la de entrada', () => {
    expect(temaDe('dia')).toBe('dia')
    for (const otro of ['noche', 'DIA', '', null, undefined, 1]) expect(temaDe(otro)).toBe('noche')
  })

  it('el botón de Ajustes lleva al otro', () => {
    expect(otroTema('noche')).toBe('dia')
    expect(otroTema('dia')).toBe('noche')
  })

  it('de la cuenta, solo un modo que vino de verdad: un servidor de antes no cambia nada', () => {
    expect(temaDeLaRespuesta({ tema: 'dia' })).toBe('dia')
    expect(temaDeLaRespuesta({ tema: 'noche' })).toBe('noche')
    for (const cuerpo of [null, 'dia', {}, { tema: 'DIA' }, { error: 'No autorizado' }]) expect(temaDeLaRespuesta(cuerpo)).toBeNull()
  })

  it('de día, lo que falló se echó a perder', () => {
    expect(SE_QUEMO).toEqual({ noche: 'Se quemó', dia: 'Se echó a perder' })
  })
})
