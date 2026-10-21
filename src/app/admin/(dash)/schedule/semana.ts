// La semana en filas: cómo va cada fila, cuánto salió y cuánto viene cada día, a qué red va lo
// del día y dónde cae «ahora». Puro: el calendario lo dibuja, y acá se lo prueba sin pintar.

import { SOCIAL_NETWORKS } from '@/lib/networks'
import type { Coccion, Sello } from '@/lib/parrilla'
import { bordeDe } from './dibujo'

/**
 * Cómo se ve la fila de un corte. Lo que ya salió deja la chapa: se aplana y se hunde, porque
 * ya no está en la parrilla. Lo que viene la conserva. Lo que se quemó, y lo que pide atención
 * (una bandeja de TikTok, un reintento, un fierro frío), no se aplana aunque ya haya pasado su
 * hora: todavía le falta algo del dueño.
 *
 * Va por el estado y no por la hora. Una publicación cuya hora pasó pero que todavía no sale
 * sigue en la chapa: no está servida, y la línea de «ahora» ya dice que su hora pasó.
 */
export type EstadoDeFila = 'servida' | 'quemada' | 'atencion' | 'saliendo' | 'por-salir'

export function estadoDeFila(coccion: Coccion, sellos: readonly Sello[]): EstadoDeFila {
  const borde = bordeDe(coccion, sellos)
  if (borde === 'mano') return 'quemada'
  if (borde === 'atencion') return 'atencion'
  if (coccion === 'punto') return 'servida'
  if (coccion === 'sellada') return 'saliendo'
  return 'por-salir'
}

export type Resumen = { servidos: number; fallaron: number; porSalir: number }

/**
 * Lo que dice cada día bajo su nombre: cuántos cortes salieron en todas sus redes, cuántos se
 * quemaron en alguna y cuántos faltan. Por la cocción, como la tarjeta: lo que llegó a la
 * bandeja de TikTok cuenta como salido, porque la red ya lo tiene.
 */
export function resumenDelDia(cocciones: readonly Coccion[]): Resumen {
  const resumen: Resumen = { servidos: 0, fallaron: 0, porSalir: 0 }
  for (const coccion of cocciones) {
    if (coccion === 'punto') resumen.servidos++
    else if (coccion === 'quemada' || coccion === 'parcial') resumen.fallaron++
    else resumen.porSalir++
  }
  return resumen
}

/**
 * A qué red va lo del día: cuántos destinos tiene cada una, en el orden de siempre. Es la barra
 * fina bajo el nombre del día; un corte que sale a dos redes pinta en las dos.
 */
export function mezclaDeRedes(items: ReadonlyArray<{ targets: ReadonlyArray<{ network: string }> }>): Array<{ red: string; destinos: number }> {
  const cuenta = new Map<string, number>()
  for (const { targets } of items) for (const { network } of targets) cuenta.set(network, (cuenta.get(network) ?? 0) + 1)
  const orden = (red: string) => {
    const i = (SOCIAL_NETWORKS as readonly string[]).indexOf(red)
    return i === -1 ? SOCIAL_NETWORKS.length : i
  }
  return [...cuenta]
    .sort(([a], [b]) => orden(a) - orden(b) || a.localeCompare(b))
    .map(([red, destinos]) => ({ red, destinos }))
}

/**
 * El estado que dice un bloque de la reja por hora, que no tiene lugar para un chip por red: el
 * del destino que más pide. Lo quemado manda, después lo que pide atención y después lo que está
 * saliendo; si salió en todas, que salió. Lo que solo espera su hora no dice nada.
 */
export function selloQueManda(sellos: readonly Sello[]): Sello | null {
  for (const sello of ['quemado', 'frio', 'reintento', 'bandeja', 'saliendo'] as const) {
    if (sellos.includes(sello)) return sello
  }
  return sellos.length > 0 && sellos.every((s) => s === 'servido') ? 'servido' : null
}

/**
 * Dónde va la línea de «ahora» entre las filas de hoy, que vienen por hora: después de las que
 * ya tienen su hora encima. Una publicación de las 14:20, a las 14:20, ya quedó arriba.
 */
export function dondeVaAhora(horas: readonly number[], ahora: number): number {
  let i = 0
  while (i < horas.length && horas[i]! <= ahora) i++
  return i
}
