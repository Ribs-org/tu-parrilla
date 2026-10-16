import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contraste } from '../components/charts/color'
import { CHART } from '../components/charts/theme'
import { QUEMO } from './parrilla'

/*
 * El texto del panel, y sus copias. `.acerado` (globals.css) define el texto, el secundario,
 * el tenue y el rojo de «se quemó» del panel; los gráficos (`charts/theme.ts`) y la app del
 * teléfono (`COLORES` en `mobile/src/components/ui.tsx`) los repiten escritos a mano, porque
 * Recharts pide un hex y Metro no sale de `mobile/`. Una copia sin guardia se separa sola:
 * así fue como el tenue de la app quedó con dos nombres.
 */
const sinComentarios = (texto: string) => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const css = sinComentarios(readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8'))
const acerado = css.match(/\.acerado\s*\{([^}]*)\}/)?.[1] ?? ''
const delPanel = (variable: string) => acerado.match(new RegExp(`--${variable}:\\s*(#[0-9a-f]{6});`))?.[1]

const movil = sinComentarios(readFileSync(new URL('../../mobile/src/components/ui.tsx', import.meta.url), 'utf8'))
const deLaApp = (nombre: string) => movil.match(new RegExp(`\\b${nombre}: '(#[0-9a-f]{6})'`))?.[1]

const TEXTO = delPanel('color-fg')
const SECUNDARIO = delPanel('color-fg-muted')
const TENUE = delPanel('color-fg-faint')

// La chapa (`acero-900`) y el fondo (`acero-950`) del panel.
const CHAPA = '#1d2124'
const FONDO = '#16181a'

describe('el texto del panel', () => {
  it('.acerado define los tres textos', () => {
    expect(TEXTO).toBeDefined()
    expect(SECUNDARIO).toBeDefined()
    expect(TENUE).toBeDefined()
  })

  // WCAG pide 4,5:1 al texto chico, y el tenue es el de las fechas, los ids y el subtítulo de
  // cada entrada de Ajustes. Antes daba 3,25:1 sobre la chapa.
  it.each([
    ['el secundario', () => SECUNDARIO!],
    ['el tenue', () => TENUE!],
  ])('%s pasa 4,5:1 sobre la chapa y sobre el fondo', (_, color) => {
    expect(contraste(color(), CHAPA)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(color(), FONDO)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('las copias no se separaron del panel', () => {
  it('los gráficos', () => {
    expect(CHART.text).toBe(TEXTO)
    expect(CHART.secondary).toBe(SECUNDARIO)
    expect(CHART.muted).toBe(TENUE)
  })

  it('la app del teléfono', () => {
    expect(deLaApp('texto')).toBe(TEXTO)
    expect(deLaApp('suave')).toBe(SECUNDARIO)
    expect(deLaApp('tenue')).toBe(TENUE)
    expect(deLaApp('rojo')).toBe(QUEMO)
  })
})
