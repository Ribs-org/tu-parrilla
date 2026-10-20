import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contraste } from '../components/charts/color'
import { CHART, NEGATIVE, ORDINAL, POSITIVE, SEQUENTIAL } from '../components/charts/theme'
import { QUEMO } from './parrilla'

/*
 * El texto del panel, y sus copias. `.acerado` (globals.css) define el texto, el secundario,
 * el tenue y el rojo de «se quemó» del panel; los gráficos (`charts/theme.ts`) y la app del
 * teléfono (`COLORES_NOCHE` y `COLORES_DIA` en `mobile/src/components/colores.ts`) los repiten escritos a mano, porque
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

const movil = sinComentarios(readFileSync(new URL('../../mobile/src/components/colores.ts', import.meta.url), 'utf8'))
const paletaDeLaApp = (modo: 'COLORES_NOCHE' | 'COLORES_DIA') => movil.match(new RegExp(`export const ${modo}: Colores = \\{([^}]*)\\}`))?.[1] ?? ''
const deLaApp = (nombre: string, modo: 'COLORES_NOCHE' | 'COLORES_DIA' = 'COLORES_NOCHE') =>
  paletaDeLaApp(modo).match(new RegExp(`\\b${nombre}: '(#[0-9a-f]{6})'`))?.[1]

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

describe('el color de cada red', () => {
  // Las de noche viven en `@theme`, junto a los demás colores: son las mismas adentro y afuera
  // del panel. Las de día, en el bloque del día, como todo lo demás.
  const tema = css.match(/@theme\s*\{([^}]*)\}/)?.[1] ?? ''
  const deNoche = (variable: string) => tema.match(new RegExp(`--${variable}:\\s*(#[0-9a-f]{6});`))?.[1]
  const REDES = ['instagram', 'tiktok', 'youtube', 'facebook']

  /** `color` sobre `fondo` a `alfa`: el tinte de una píldora (`bg-negative/15`) ya pintado. */
  const tinte = (color: string, alfa: number, fondo: string) => {
    const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
    return `#${[0, 1, 2]
      .map((i) => Math.round(canal(color, i) * alfa + canal(fondo, i) * (1 - alfa)).toString(16).padStart(2, '0'))
      .join('')}`
  }

  // Un ícono, una franja o un tramo de la mezcla de redes es un dibujo, y WCAG le pide 3:1 contra
  // lo que lo rodea: la chapa, el fondo, un bloque (`acero-800`) y las píldoras de lo que se
  // quemó y de lo que salió, que llevan un tinte. Contra el tinte de lo quemado es donde el rojo
  // de YouTube y el de Instagram quedan más justos.
  it.each(REDES)('%s pasa 3:1 de noche sobre todo lo que lo rodea', (red) => {
    const color = deNoche(`color-marca-${red}`)
    expect(color, red).toBeDefined()
    const chapa = delPanel('color-acero-900') ?? deNoche('color-acero-900')!
    const negativo = delPanel('color-negative')!
    const positivo = delPanel('color-positive') ?? deNoche('color-positive')!
    for (const fondo of [chapa, FONDO, deNoche('color-acero-800')!, tinte(negativo, 0.15, chapa), tinte(positivo, 0.15, chapa)]) {
      expect(contraste(color!, fondo), `${red} sobre ${fondo}`).toBeGreaterThanOrEqual(3)
    }
  })

  it.each(REDES)('%s pasa 3:1 de día sobre todo lo que lo rodea', (red) => {
    const color = delDia(`color-marca-${red}`)
    expect(color, red).toBeDefined()
    const chapa = delDia('color-acero-900')!
    for (const fondo of [
      chapa,
      delDia('color-acero-950')!,
      delDia('color-acero-800')!,
      tinte(delDia('color-negative')!, 0.15, chapa),
      tinte(delDia('color-positive')!, 0.15, chapa),
    ]) {
      expect(contraste(color!, fondo), `${red} sobre ${fondo}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('TikTok va en neutro, el secundario del panel de cada modo: su marca es blanco y negro', () => {
    expect(deNoche('color-marca-tiktok')).toBe(SECUNDARIO)
    expect(delDia('color-marca-tiktok')).toBe(delDia('color-fg-muted'))
  })

  // La app del teléfono los repite a mano en su paleta (`colores.ts`), para el punto de cada red.
  it.each(REDES)('el de %s en la app del teléfono es el del panel, de noche y de día', (red) => {
    expect(deLaApp(red), red).toBe(deNoche(`color-marca-${red}`))
    expect(deLaApp(red, 'COLORES_DIA'), red).toBe(delDia(`color-marca-${red}`))
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
    expect(deLaApp('fondo')).toBe(FONDO)
    expect(deLaApp('tarjeta')).toBe(CHAPA)
  })

  // De día, la app tiene que ser el mismo papel de arroz que el panel: cada color de su paleta
  // del día es una variable del bloque `.acerado[data-tema='dia']`.
  it.each([
    ['fondo', 'color-acero-950'],
    ['tarjeta', 'color-acero-900'],
    ['texto', 'color-fg'],
    ['suave', 'color-fg-muted'],
    ['tenue', 'color-fg-faint'],
    ['brasa', 'color-brasa'],
    ['verde', 'color-positive'],
    ['rojo', 'color-negative'],
    ['ambar', 'color-caution'],
    ['velo', 'color-velo'],
    ['acero', 'color-acero-700'],
  ])('la app de día: %s es --%s del panel de día', (nombre, variable) => {
    const delPanelDeDia = delDia(variable)
    expect(delPanelDeDia, variable).toBeDefined()
    expect(deLaApp(nombre, 'COLORES_DIA')).toBe(delPanelDeDia)
  })
})
