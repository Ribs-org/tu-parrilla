/**
 * Chart tokens. The categorical order is fixed and never cycled — a ninth series
 * folds into "Otro" rather than inventing a hue.
 *
 * La validación (piso de croma, separación para daltonismo, contraste ≥ 3:1) ya no
 * se afirma aquí de palabra: se mide en `color.test.ts` contra la superficie de
 * referencia, que es la de la chapa (`CHART.surface`) porque los gráficos viven
 * dentro de un `Panel`, no sobre el fondo de la página.
 *
 * Medido el 2026-09-18 (ΔE76, simulación Machado 2009 severidad 1.0, sobre pares
 * adyacentes de esta lista): peor adyacencia en visión normal 51.58, peor bajo
 * protanopía 39.71, peor bajo deuteranopía 38.67, peor bajo tritanopía 10.56 — el
 * par crítico en los tres casos de daltonismo es cian-blue. Las ocho superan el
 * piso de 8.4 en las tres simulaciones y de 15 en visión normal.
 */
export const SERIES = [
  '#1f9aa8', // cian, no naranja: el naranja es la brasa de la marca y se confundía con lo accionable
  '#3987e5', // blue
  '#199e70', // aqua — el cian va antes del azul, no junto al aqua: bajo tritanopía caían casi encima
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
] as const

export const CHART = {
  surface: '#1d2124',
  grid: '#242a2f',
  axis: '#2a2e33',
  // Los textos secundario y tenue de `.acerado` (globals.css): `paleta.test.ts` los compara.
  muted: '#8a9096',
  text: '#f2ebe2',
  secondary: '#a39a8f',
} as const

/** Sequential blue, low → high. On a dark surface, near-zero recedes to the plane. */
export const SEQUENTIAL = [
  '#1b2338',
  '#184f95',
  '#256abf',
  '#3987e5',
  '#5598e7',
  '#86b6ef',
  '#cde2fb',
] as const

/** Ordinal steps for the funnel. Nothing darker than step 600 on dark. */
export const ORDINAL = ['#86b6ef', '#3987e5', '#184f95'] as const

export const POSITIVE = '#0ca30c'
export const NEGATIVE = '#d03b3b'

/**
 * Lo que pintan los componentes: variables que `.acerado` resuelve según el modo
 * (`globals.css`), así un gráfico se ve bien de noche y de día sin saber cuál es. Los hexes de
 * arriba son los de la noche, los que miden los tests (`color.test.ts`, `paleta.test.ts`). Las
 * ocho series no tienen variable: pasan 3:1 sobre la chapa de los dos modos, y `color.test.ts`
 * lo comprueba.
 */
export const PINTURA = {
  surface: 'var(--chart-surface)',
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  muted: 'var(--chart-muted)',
  text: 'var(--chart-text)',
  secondary: 'var(--chart-secondary)',
  sube: 'var(--chart-sube)',
  baja: 'var(--chart-baja)',
} as const

/** `SEQUENTIAL` como variables: de día va de la chapa al azul hondo, y lo que casi no tiene se pierde igual. */
export const SECUENCIA: readonly string[] = SEQUENTIAL.map((_, i) => `var(--chart-secuencia-${i})`)

/** `ORDINAL` como variables: de día, el escalón más grande es el más hondo, que es el que más se ve. */
export const ESCALONES: readonly string[] = ORDINAL.map((_, i) => `var(--chart-escalon-${i})`)

export function seriesColor(index: number): string {
  return SERIES[index % SERIES.length]!
}
