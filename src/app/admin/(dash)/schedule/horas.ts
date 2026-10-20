// La reja de horas de La Parrilla, la de «Día» y «Por hora»: qué horas abarca, a qué minuto del
// día cae cada cosa y cómo se reparten los bloques que se juntan. Puro: las dos vistas la dibujan,
// y acá se la prueba sin pintar.

import { hourLabel } from '@/lib/schedule-week'

/** Cuántos píxeles mide un minuto en la reja: dieciséis horas son unos 860 px. */
export const PX_POR_MINUTO = 0.9

/** De dónde a dónde va la reja si nada cae afuera: de 07:00 a 23:00, las horas del agente. */
export const DESDE_DE_SIEMPRE = 7 * 60
export const HASTA_DE_SIEMPRE = 23 * 60

/** El minuto del día (0 a 1439) en que cae este instante, en la zona del dueño. */
export function minutoDelDia(fecha: Date, zona: string): number {
  const [h, m] = hourLabel(fecha, zona).split(':').map(Number)
  return h! * 60 + m!
}

/**
 * Qué horas abarca la reja, en minutos del día y en horas enteras: de 07:00 a 23:00, o más si
 * algo cae antes o termina después —un bloque dura `dura` minutos—, o si «ahora» cae afuera y
 * la reja es la de hoy. Nunca sale del día.
 */
export function rangoDeLaReja(
  minutos: readonly number[],
  dura: number,
  ahora: number | null = null,
): { desde: number; hasta: number } {
  const todos = ahora === null ? [...minutos] : [...minutos, ahora]
  const primero = todos.length > 0 ? Math.min(...todos) : DESDE_DE_SIEMPRE
  const ultimo = todos.length > 0 ? Math.max(...minutos.map((m) => m + dura), ahora ?? 0) : HASTA_DE_SIEMPRE
  return {
    desde: Math.max(0, Math.min(DESDE_DE_SIEMPRE, Math.floor(primero / 60) * 60)),
    hasta: Math.min(24 * 60, Math.max(HASTA_DE_SIEMPRE, Math.ceil(ultimo / 60) * 60)),
  }
}

/**
 * Los carriles de los bloques que se tocan, como en Google Calendar: cada bloque dura `dura`
 * minutos, y los que se pisan van lado a lado. Un grupo es una cadena de bloques que se pisan;
 * dentro de él, cada uno toma el primer carril libre, y todos se reparten el ancho entre los
 * carriles del grupo (`de`). Los minutos vienen en orden; la salida va en el mismo orden.
 */
export function carriles(minutos: readonly number[], dura: number): Array<{ carril: number; de: number }> {
  const salida: Array<{ carril: number; de: number }> = []
  let grupo: Array<{ indice: number; minuto: number; carril: number }> = []
  let finDelGrupo = -Infinity
  const cerrar = () => {
    const de = Math.max(0, ...grupo.map((g) => g.carril)) + 1
    for (const g of grupo) salida[g.indice] = { carril: g.carril, de }
    grupo = []
  }
  minutos.forEach((minuto, indice) => {
    if (grupo.length > 0 && minuto >= finDelGrupo) cerrar()
    const ocupados = new Set(grupo.filter((g) => g.minuto + dura > minuto).map((g) => g.carril))
    let carril = 0
    while (ocupados.has(carril)) carril++
    grupo.push({ indice, minuto, carril })
    finDelGrupo = Math.max(finDelGrupo, minuto + dura)
  })
  if (grupo.length > 0) cerrar()
  return salida
}

/** Las horas enteras que la reja rotula, de `desde` a `hasta`. */
export function horasDeLaReja({ desde, hasta }: { desde: number; hasta: number }): number[] {
  const horas: number[] = []
  for (let minuto = desde; minuto <= hasta; minuto += 60) horas.push(minuto)
  return horas
}

/** «07:00», el rótulo de una hora entera de la reja. */
export function rotuloDeHora(minuto: number): string {
  return `${String(Math.floor(minuto / 60)).padStart(2, '0')}:00`
}
