import type { Carne, Formato } from './parrilla'

/*
 * Las medidas de la pieza de sushi, en el lienzo de 120 × 64 del panel: las mismas funciones
 * que `src/components/pieza-sushi.tsx`. Están copiadas y no importadas porque Metro no sale de
 * `mobile/`, y un test del panel (`src/lib/parrilla.test.ts`) las compara con las suyas. La app
 * las escala a su lienzo (`ESCALA`, en `components/lienzo.tsx`).
 */

/**
 * Dónde va cada rodaja del roll, y su radio: como los huesos de la tira, una por archivo. Juntas,
 * apenas montadas una sobre otra: separadas, el pescado quedaba chico para decir la cocción.
 */
export function rodajas(n: number): { cx: number; r: number }[] {
  const cuantas = Math.max(n, 2)
  const r = Math.min(21, 118 / (cuantas * 2 - (cuantas - 1) * 0.12))
  const paso = 2 * r * 0.94
  const inicio = 60 - (paso * (cuantas - 1)) / 2
  return Array.from({ length: cuantas }, (_, i) => ({ cx: inicio + i * paso, r }))
}

/** El roll entero, visto de lado: su alto fijo, la punta redonda y la cara del corte de la orilla. */
export const ROLL = { arriba: 20, abajo: 48, punta: 8, cara: 7 }

/** De punta a punta de donde caerían sus rodajas, y las líneas por donde se va a cortar. */
export function rollEntero(n: number): { x0: number; x1: number; cortes: number[] } {
  const discos = rodajas(n)
  const primero = discos[0]!
  const ultimo = discos[discos.length - 1]!
  return {
    x0: primero.cx - primero.r,
    x1: ultimo.cx + ultimo.r,
    cortes: discos.slice(1).map((d, i) => (discos[i]!.cx + d.cx) / 2),
  }
}

/** El roll va en rodajas cuando se sirvió: con el pescado a punto. */
export function rollCortado(carne: Carne): boolean {
  return carne === 'punto'
}

/**
 * Dónde cae la banda de cada destino: repartidas entre 30 y 90, o al centro si es una. En el
 * onigiri, que es más angosto, entre 46 y 74.
 */
export function posiciones(n: number, formato?: Formato): number[] {
  const [desde, hasta] = formato === 'choripan' ? [46, 74] : [30, 90]
  if (n <= 1) return [60]
  return Array.from({ length: n }, (_, i) => desde + (i * (hasta - desde)) / (n - 1))
}

/**
 * En el roll, cada banda cruza el centro de una rodaja y nunca la juntura de dos. Con más
 * destinos que rodajas, van de a varias por rodaja, repartidas dentro de ella.
 */
export function posicionesMaki(bandas: number, huesos: number): number[] {
  const discos = rodajas(huesos)
  if (bandas <= discos.length) {
    return Array.from({ length: bandas }, (_, i) => {
      const j = bandas === 1 ? Math.floor(discos.length / 2) : Math.round((i * (discos.length - 1)) / (bandas - 1))
      return discos[j]!.cx
    })
  }
  const porDisco = Math.ceil(bandas / discos.length)
  return Array.from({ length: bandas }, (_, i) => {
    const d = discos[Math.floor(i / porDisco)]!
    const enEste = Math.min(porDisco, bandas - Math.floor(i / porDisco) * porDisco)
    const k = i % porDisco
    return enEste === 1 ? d.cx : d.cx - d.r * 0.45 + (k * d.r * 0.9) / (enEste - 1)
  })
}
