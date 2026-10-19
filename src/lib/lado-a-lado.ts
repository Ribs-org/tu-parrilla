// «Lado a lado»: dos publicaciones con sus portadas, sus atributos y cómo crecieron sus views,
// para ver con los ojos si fue el color, la letra o el corte. Puro, para los tests; las
// lecturas las trae `getLecturasDe` (`posts.ts`) y la pantalla vive en
// `analytics/lado-a-lado`.

import { CLAVE_PIEZA, textoDeAtributo } from './pieza'
import type { Atributos } from './social/publish/atributos'
import { sinMetricasDerivadas } from './social/politica-youtube'

/** Hasta qué edad se dibuja la curva: lo que pasa después casi no cambia la comparación. */
export const DIAS_DE_LA_CURVA = 30

/** Cuántas portadas se muestran de cada lado. */
export const PORTADAS_POR_LADO = 12

const DIA_MS = 24 * 60 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** El id que pide la URL para A o B, si tiene forma de id; si no, null, y entra el de siempre. */
export function idPedido(valor: unknown): string | null {
  return typeof valor === 'string' && UUID.test(valor) ? valor : null
}

export type Lectura = { postId: string; capturedAt: Date; views: number | null }

export type PuntoDeCurva = { dia: number; a: number | null; b: number | null }

type Publicada = { id: string; network: string; publishedAt: Date }

/**
 * Las views de A y de B por días cumplidos desde su publicación: el día 3 es la última lectura
 * de cuando tenía entre 3 y 4 días. Así se comparan a la misma edad aunque hayan salido con
 * meses de diferencia. Hasta `DIAS_DE_LA_CURVA`; un día sin lectura queda en null, y el
 * gráfico une lo que hay. YouTube no entra: compararlo es lo que sus reglas no permiten
 * (`politica-youtube`).
 */
export function curvaLadoALado(a: Publicada | null, b: Publicada | null, lecturas: readonly Lectura[]): PuntoDeCurva[] {
  const porDia = { a: new Map<number, number>(), b: new Map<number, number>() }
  let ultimo = -1
  for (const [lado, publicada] of [['a', a], ['b', b]] as const) {
    if (!publicada || sinMetricasDerivadas(publicada.network)) continue
    for (const lectura of lecturas) {
      if (lectura.postId !== publicada.id || lectura.views === null) continue
      const dia = Math.floor((lectura.capturedAt.getTime() - publicada.publishedAt.getTime()) / DIA_MS)
      if (dia < 0 || dia > DIAS_DE_LA_CURVA) continue
      // Dos lecturas el mismo día cumplido (un «Sincronizar ahora» de noche y la de la mañana
      // siguiente): vale la última, que es la más alta del contador.
      porDia[lado].set(dia, Math.max(porDia[lado].get(dia) ?? 0, lectura.views))
      ultimo = Math.max(ultimo, dia)
    }
  }
  return Array.from({ length: ultimo + 1 }, (_, dia) => ({
    dia,
    a: porDia.a.get(dia) ?? null,
    b: porDia.b.get(dia) ?? null,
  }))
}

/**
 * Los atributos de las dos, clave por clave: los que comparten y los que cambian. Una clave que
 * una tiene y la otra no, cambia. `pieza` no va: junta versiones, no dice nada del video.
 */
export function atributosLadoALado(
  a: Atributos | null,
  b: Atributos | null,
): Array<{ clave: string; a: string; b: string; igual: boolean }> {
  const claves = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])
  claves.delete(CLAVE_PIEZA)
  return [...claves].sort().map((clave) => {
    const deA = textoDeAtributo(a?.[clave])
    const deB = textoDeAtributo(b?.[clave])
    return { clave, a: deA, b: deB, igual: deA === deB && deA !== '—' }
  })
}
