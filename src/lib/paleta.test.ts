import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contraste } from '../components/charts/color'
import { CHART, NEGATIVE, ORDINAL, POSITIVE, SEQUENTIAL } from '../components/charts/theme'
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

// El modo día redefine las mismas variables en su propio bloque (`.acerado[data-tema='dia']`).
const dia = css.match(/\.acerado\[data-tema='dia'\]\s*\{([^}]*)\}/)?.[1] ?? ''
const delDia = (variable: string) => dia.match(new RegExp(`--${variable}:\\s*(#[0-9a-f]{6});`))?.[1]

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

describe('el panel, de día', () => {
  const CHAPA_DIA = delDia('color-acero-900')
  const FONDO_DIA = delDia('color-acero-950')

  it('el bloque del día define la chapa y el fondo', () => {
    expect(CHAPA_DIA).toBeDefined()
    expect(FONDO_DIA).toBeDefined()
  })

  // Todo lo que de día es texto: los tres textos, lo accionable, y lo que sale bien, mal o pide
  // atención. Sobre la chapa y sobre el fondo, como de noche.
  it.each(['color-fg', 'color-fg-muted', 'color-fg-faint', 'color-brasa', 'color-positive', 'color-negative', 'color-caution'])(
    '%s pasa 4,5:1 sobre la chapa y sobre el fondo',
    (variable) => {
      const color = delDia(variable)
      expect(color, variable).toBeDefined()
      expect(contraste(color!, CHAPA_DIA!)).toBeGreaterThanOrEqual(4.5)
      expect(contraste(color!, FONDO_DIA!)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it('el texto de un botón lleno —el fondo del panel sobre la brasa— pasa 4,5:1', () => {
    expect(contraste(FONDO_DIA!, delDia('color-brasa')!)).toBeGreaterThanOrEqual(4.5)
  })

  it('el halo de lo quemado es el mismo de la noche, y como dibujo pasa 3:1 sobre la chapa', () => {
    expect(contraste(QUEMO, CHAPA_DIA!)).toBeGreaterThanOrEqual(3)
  })
})

describe('los gráficos, de noche y de día', () => {
  it('las variables de la noche son los hexes de theme.ts', () => {
    expect(delPanel('chart-surface')).toBe(CHART.surface)
    expect(delPanel('chart-grid')).toBe(CHART.grid)
    expect(delPanel('chart-axis')).toBe(CHART.axis)
    expect(delPanel('chart-muted')).toBe(CHART.muted)
    expect(delPanel('chart-text')).toBe(CHART.text)
    expect(delPanel('chart-secondary')).toBe(CHART.secondary)
    expect(delPanel('chart-sube')).toBe(POSITIVE)
    expect(delPanel('chart-baja')).toBe(NEGATIVE)
    SEQUENTIAL.forEach((color, i) => expect(delPanel(`chart-secuencia-${i}`), `secuencia ${i}`).toBe(color))
    ORDINAL.forEach((color, i) => expect(delPanel(`chart-escalon-${i}`), `escalón ${i}`).toBe(color))
  })

  it('de día, los textos de los gráficos son los del panel, sobre su chapa', () => {
    expect(delDia('chart-surface')).toBe(delDia('color-acero-900'))
    expect(delDia('chart-text')).toBe(delDia('color-fg'))
    expect(delDia('chart-secondary')).toBe(delDia('color-fg-muted'))
    expect(delDia('chart-muted')).toBe(delDia('color-fg-faint'))
  })

  it('de día, lo que sube y lo que baja pasan 4,5:1 sobre la chapa: van como texto', () => {
    expect(contraste(delDia('chart-sube')!, delDia('chart-surface')!)).toBeGreaterThanOrEqual(4.5)
    expect(contraste(delDia('chart-baja')!, delDia('chart-surface')!)).toBeGreaterThanOrEqual(4.5)
  })

  it('de día, la secuencia va de la chapa al azul hondo: lo que casi no tiene se pierde igual', () => {
    const luces = SEQUENTIAL.map((_, i) => contraste(delDia(`chart-secuencia-${i}`)!, '#000000'))
    for (let i = 1; i < luces.length; i++) expect(luces[i], `secuencia ${i}`).toBeLessThan(luces[i - 1]!)
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
