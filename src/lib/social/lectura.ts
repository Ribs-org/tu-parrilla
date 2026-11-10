// Qué publicaciones se leen cada día en las redes. Hasta octubre de 2026 se leían las 200
// más recientes de cada cuenta, todas, todos los días: con unas 50 publicaciones diarias
// en una cuenta, eso cubría cuatro días, y lo de la semana anterior quedaba congelado con
// los números del día en que salió de la ventana —y se veía peor de lo que era—. Ahora la
// lectura va por edad: lo nuevo se lista y se lee entero a diario, y lo viejo se lee por
// su id, cada vez más espaciado, porque casi no se mueve. Puro, para los tests.
//
// Además, lo de las últimas 48 horas se vuelve a leer cada hora (`reciente.ts`), con el listado
// recortado a eso (`soloDesde`).

import type { OpcionesDeListado } from './connector'

/** Lo publicado en estos últimos días se lista y se lee entero, todos los días. */
export const DIAS_DE_LECTURA_DIARIA = 10

/**
 * Y al menos esto se lista siempre, aunque la cuenta publique poco: es lo que se leía
 * antes, y lo que trae el catálogo de una cuenta recién conectada.
 */
export const MIN_LISTADAS = 200

/**
 * Cada cuántos días se vuelve a leer una publicación, según cuántos días tiene. Diario
 * mientras crece rápido —y así hay una lectura en el día 7 de cada una, la que se usa para
 * comparar a la misma edad—; después, cada vez más espaciado.
 *
 * El techo de 28 cuida a YouTube: la retención borra sus lecturas de más de 30 días
 * (`retencion-youtube`), y con una cada 28 nunca se queda sin ninguna.
 */
export function intervaloDeLectura(edadEnDias: number): number {
  if (edadEnDias <= DIAS_DE_LECTURA_DIARIA) return 1
  if (edadEnDias <= 30) return 7
  if (edadEnDias <= 90) return 14
  return 28
}

/** Cuántos días van de `desde` a `hasta`, dos llaves «YYYY-MM-DD». */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 864e5)
}

/** Una publicación ya guardada, con el día (del dueño) en que salió y el de su última lectura. */
export type Conocida = { externalId: string; publicadaDia: string; ultimaLectura: string | null }

/** Si a esta publicación le toca leerse hoy. Sin ninguna lectura, siempre. */
export function tocaLeer(publicacion: Conocida, hoy: string): boolean {
  if (publicacion.ultimaLectura === null) return true
  const edad = diasEntre(publicacion.publicadaDia, hoy)
  return diasEntre(publicacion.ultimaLectura, hoy) >= intervaloDeLectura(edad)
}

/**
 * Las conocidas que el listado no trajo y a las que hoy les toca, de la más nueva a la más
 * vieja. El orden importa: si el plazo de la corrida no alcanza, lo que queda sin leer es
 * lo más viejo, que es lo que menos se mueve, y mañana sigue en la fila —la regla mira la
 * última lectura, no el calendario, así que nada se salta por haber esperado un día—.
 */
export function porLeerHoy(conocidas: readonly Conocida[], listadas: ReadonlySet<string>, hoy: string): string[] {
  return conocidas
    .filter((p) => !listadas.has(p.externalId) && tocaLeer(p, hoy))
    .sort((a, b) =>
      a.publicadaDia === b.publicadaDia
        ? a.externalId.localeCompare(b.externalId)
        : b.publicadaDia.localeCompare(a.publicadaDia),
    )
    .map((p) => p.externalId)
}

/**
 * Si un listado (de lo más nuevo hacia atrás) sigue pidiendo páginas: hasta juntar `minimo`
 * —por omisión, `MIN_LISTADAS`—, y después mientras lo más viejo que trajo siga siendo de
 * `desde` en adelante. Cada conector pone además su tope de páginas, que es lo que lo frena
 * si la red entrega páginas vacías con cursor.
 */
export function sigueListando(
  listadas: number,
  masVieja: Date | null,
  desde: Date | undefined,
  minimo: number = MIN_LISTADAS,
): boolean {
  if (listadas < minimo) return true
  return desde !== undefined && masVieja !== null && masVieja.getTime() >= desde.getTime()
}

/**
 * El mínimo de un listado: el de siempre, o uno si se pidió solo lo de `desde` en adelante
 * (`soloDesde`, la lectura de cada hora). Uno y no cero: sin nada listado todavía no hay
 * fecha que mirar, y la primera página se pide igual.
 */
export function minimoDelListado(opciones?: OpcionesDeListado): number {
  return opciones?.soloDesde ? 1 : MIN_LISTADAS
}

/**
 * Lo listado que entra en lo pedido: todo, salvo con `soloDesde`, que deja afuera lo que salió
 * antes de `desde`. Va antes de pedir los números de cada publicación, para no pagarlos.
 */
export function dentroDeLoPedido<T>(items: readonly T[], fechaDe: (item: T) => Date, opciones?: OpcionesDeListado): T[] {
  const desde = opciones?.desde
  if (!opciones?.soloDesde || !desde) return [...items]
  return items.filter((item) => fechaDe(item).getTime() >= desde.getTime())
}

/** La más vieja entre la que se llevaba y una fecha nueva. */
export function laMasVieja(actual: Date | null, otra: Date): Date {
  return actual === null || otra.getTime() < actual.getTime() ? otra : actual
}
