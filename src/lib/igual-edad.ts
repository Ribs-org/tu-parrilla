// Comparar a igual edad y contra la propia cuenta. Con mil publicaciones por semana en varias
// cuentas, «la que más views ganó» premia a la que lleva más tiempo publicada y a la cuenta con
// más seguidores. Esto pone a todas a la misma edad (las views a los 7 días) y a cada una contra
// lo normal de su cuenta. Puro, para los tests; la lectura de los 7 días la trae `getPostRows`.

import { medianaDe } from './parrilla'
import type { PostRow } from './posts-kpis'

/** La edad a la que se comparan: una semana después de publicar. */
export const DIAS_A_IGUAL_EDAD = 7

/**
 * Hasta qué edad sirve la lectura «de los 7 días». Se lee una vez al día, así que la primera
 * después de cumplir 7 días llega dentro de las 24 horas siguientes; el día de más cubre una
 * sincronización que falló. Una lectura más tarde ya no es la misma edad, y la publicación se
 * queda sin el número.
 */
export const DIAS_HASTA_LA_LECTURA = 9

/** Con menos publicaciones con su lectura de los 7 días, una cuenta no tiene «lo normal». */
export const MIN_DE_SU_CUENTA = 5

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Cada publicación contra lo normal de su cuenta: sus views a los 7 días divididas por la
 * mediana de las de su cuenta entre `filas` (lo del período). ×2 es el doble de lo normal de
 * esa cuenta, sin importar cuántos seguidores tenga ni en qué red esté. Una cuenta con menos de
 * `MIN_DE_SU_CUENTA` lecturas, o con mediana cero, no tiene contra qué medir. Por id de
 * publicación; la que no está, no se sabe.
 */
export function contraSuCuenta(filas: readonly PostRow[]): Map<string, number> {
  const porCuenta = new Map<string, Array<{ id: string; views: number }>>()
  for (const fila of filas) {
    if (fila.viewsA7Dias === null) continue
    const lista = porCuenta.get(fila.accountId) ?? []
    lista.push({ id: fila.id, views: fila.viewsA7Dias })
    porCuenta.set(fila.accountId, lista)
  }
  const relativos = new Map<string, number>()
  for (const lista of porCuenta.values()) {
    if (lista.length < MIN_DE_SU_CUENTA) continue
    const normal = medianaDe(lista.map((l) => l.views))
    if (normal === null || normal <= 0) continue
    for (const { id, views } of lista) relativos.set(id, views / normal)
  }
  return relativos
}

/** Cuándo cierra el período para medir edades: su final, o ahora si todavía no llega. */
export function cierreDe(hasta: Date, ahora: Date = new Date()): Date {
  return hasta.getTime() < ahora.getTime() ? hasta : ahora
}

/** Si al cierre del período tenía menos de 7 días: casi no tuvo tiempo de sumar. */
export function esReciente(publicadaEl: Date, cierre: Date): boolean {
  return cierre.getTime() - publicadaEl.getTime() < DIAS_A_IGUAL_EDAD * DIA_MS
}
