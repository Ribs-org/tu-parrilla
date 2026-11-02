// Dónde va el globito de ayuda (`components/globitos.tsx`), puro: encima de lo que explica y
// centrado; debajo si arriba no cabe; y siempre adentro de la pantalla, con un margen.

export type Caja = { left: number; top: number; width: number; height: number }

const SEPARACION = 8
const MARGEN = 8

export function posicionDelGlobito(
  ancla: Caja,
  globito: { width: number; height: number },
  pantalla: { width: number; height: number },
): { left: number; top: number; abajo: boolean } {
  const centro = ancla.left + ancla.width / 2
  const left = Math.min(Math.max(MARGEN, centro - globito.width / 2), Math.max(MARGEN, pantalla.width - MARGEN - globito.width))
  const arriba = ancla.top - SEPARACION - globito.height
  const abajo = arriba < MARGEN && ancla.top + ancla.height + SEPARACION + globito.height <= pantalla.height - MARGEN
  return { left, top: abajo ? ancla.top + ancla.height + SEPARACION : Math.max(MARGEN, arriba), abajo }
}
