import { describe, expect, it } from 'vitest'
import { CuentaDeOtro, fraseCuentaDeOtro, nombreDeCandidata, siQueriasOtra } from './conectar'

describe('fraseCuentaDeOtro', () => {
  it('nombra la cuenta', () => {
    expect(fraseCuentaDeOtro(['@vicente_edits2'])).toBe(
      '«@vicente_edits2» ya está conectada por otra persona en Tu Parrilla.',
    )
    expect(new CuentaDeOtro('@vicente_edits2').message).toBe(fraseCuentaDeOtro(['@vicente_edits2']))
  })

  it('con varias, las junta con «y»', () => {
    expect(fraseCuentaDeOtro(['@a', '@b', 'Tu Parrilla'])).toBe(
      '«@a», «@b» y «Tu Parrilla» ya están conectadas por otra persona en Tu Parrilla.',
    )
  })

  it('sin nombre, la frase de antes', () => {
    expect(fraseCuentaDeOtro([])).toBe('Esa cuenta ya está conectada por otra persona en Tu Parrilla.')
  })
})

describe('nombreDeCandidata', () => {
  it('el @usuario o la página, y si no hay, el id', () => {
    expect(nombreDeCandidata({ externalId: '1784', handle: '@vicente' })).toBe('@vicente')
    expect(nombreDeCandidata({ externalId: '1784', handle: null })).toBe('1784')
  })
})

describe('siQueriasOtra', () => {
  it('en Meta, la cuenta sale de la página que se elige en Facebook', () => {
    expect(siQueriasOtra('instagram')).toContain('en la ventana de Facebook, elige la página de esa cuenta')
    expect(siQueriasOtra('facebook')).toContain('en la ventana de Facebook')
  })

  it('en las demás, se entra con la otra cuenta', () => {
    expect(siQueriasOtra('tiktok')).toBe('Si querías conectar otra, vuelve a conectar entrando con esa cuenta.')
  })
})
