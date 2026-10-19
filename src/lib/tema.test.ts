import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COLOR_DE_BARRA, otroTema, temaDe, temaDelCuerpo, temaDelEnlace } from './tema'

describe('temaDelEnlace (la portada con ?modo=)', () => {
  it('la dirección pide uno de los dos modos, o ninguno', () => {
    expect(temaDelEnlace('dia')).toBe('dia')
    expect(temaDelEnlace('noche')).toBe('noche')
    expect(temaDelEnlace(['dia', 'noche'])).toBe('dia')
    expect(temaDelEnlace(undefined)).toBeNull()
    expect(temaDelEnlace('DIA')).toBeNull()
    expect(temaDelEnlace('')).toBeNull()
  })
})

describe('temaDe', () => {
  it('sin cookie, o con cualquier otra cosa, la noche', () => {
    expect(temaDe(undefined)).toBe('noche')
    expect(temaDe(null)).toBe('noche')
    expect(temaDe('')).toBe('noche')
    expect(temaDe('DIA')).toBe('noche')
    expect(temaDe('noche')).toBe('noche')
  })

  it('el día, solo si la cookie lo dice', () => {
    expect(temaDe('dia')).toBe('dia')
  })

  it('el botón lleva al otro', () => {
    expect(otroTema('noche')).toBe('dia')
    expect(otroTema('dia')).toBe('noche')
  })
})

describe('temaDelCuerpo (PUT /api/mobile/tema)', () => {
  it('lee los dos modos', () => {
    expect(temaDelCuerpo({ tema: 'dia' })).toBe('dia')
    expect(temaDelCuerpo({ tema: 'noche' })).toBe('noche')
  })

  it('lo que no es un modo no cambia nada: no hay noche por descarte', () => {
    for (const cuerpo of [null, undefined, 'dia', {}, { tema: 'DIA' }, { tema: '' }, { tema: 1 }, { modo: 'dia' }]) {
      expect(temaDelCuerpo(cuerpo), JSON.stringify(cuerpo)).toBeNull()
    }
  })
})

describe('el color de la barra del navegador', () => {
  it('es el fondo del panel en cada modo', () => {
    const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
    expect(css).toContain(`--color-acero-950: ${COLOR_DE_BARRA.noche};`)
    const dia = css.match(/\.acerado\[data-tema='dia'\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(dia).toContain(`--color-acero-950: ${COLOR_DE_BARRA.dia};`)
  })
})
