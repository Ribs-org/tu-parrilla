import type { Formato } from './parrilla'

/*
 * Las siluetas del corte, las mismas curvas del panel (`SILUETA` en `src/components/corte.tsx`), en
 * su lienzo de 120 × 64. Están copiadas y no importadas porque Metro no sale de `mobile/`, y un test
 * del panel (`src/components/corte.test.ts`) las compara con las suyas: si una cambia sola, la misma
 * publicación tendría una forma en el panel y otra en el teléfono, que es justo lo que pasaba con la
 * entraña cuando la app la armaba con bordes redondeados y salía con forma de chori.
 */
export const SILUETA: Record<Formato, string> = {
  bife: 'M12 33C10 17 30 7 58 7C86 7 110 13 111 31C112 47 94 58 64 58C36 58 14 50 12 33Z',
  tira: 'M5 20C28 14 92 14 115 20C117 28 117 38 115 46C92 52 28 52 5 46C3 38 3 28 5 20Z',
  entrana:
    'M3 30C16 20 32 18 48 22C64 26 76 28 92 23C104 19 113 19 117 23C119 30 118 37 116 42C104 40 94 43 82 46C64 50 50 46 36 45C22 44 11 47 4 48C1 42 1 36 3 30Z',
  chori: 'M14 31C14 21 26 18 40 19C54 20 66 23 80 22C96 21 106 23 107 32C108 42 96 46 80 46C66 46 54 43 40 44C26 45 14 41 14 31Z',
  choripan:
    'M53 7C53 1 67 1 67 7V10H73C77 10 78 12 78 16V49C78 53 77 55 73 55H67V57C67 63 53 63 53 57V55H47C43 55 42 53 42 49V16C42 12 43 10 47 10H53Z',
}

/** Las motas del chori, como en el panel: `[cx, cy, r]`. */
export const MOTAS: readonly (readonly [number, number, number])[] = [
  [26, 27, 1.6], [34, 36, 1.3], [44, 29, 1.8], [52, 38, 1.2], [60, 27, 1.5], [68, 35, 1.7], [76, 28, 1.2],
  [84, 38, 1.5], [92, 30, 1.6], [98, 36, 1.1], [30, 40, 1.1], [64, 42, 1.2], [88, 25, 1],
]

/**
 * Dónde cae la marca de cada destino: repartidas entre 34 y 92, o al centro si es una. En el
 * choripán, que es angosto, entre 50 y 70: más afuera, la silueta las recortaría enteras.
 */
export function posiciones(n: number, formato: Formato): number[] {
  const [desde, hasta, centro] = formato === 'choripan' ? [50, 70, 60] : [34, 92, 62]
  if (n <= 1) return [centro]
  return Array.from({ length: n }, (_, i) => desde + (i * (hasta - desde)) / (n - 1))
}
