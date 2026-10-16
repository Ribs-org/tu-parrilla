// Si el permiso de una cuenta vence antes de la hora a la que se programa. Puro: el compositor
// lo pregunta mientras se elige la fecha, y acá se lo prueba.

import { seRenuevaSola } from '@/lib/parrilla'
import { toZonedInput } from '@/lib/utils'

/**
 * La hora local («YYYY-MM-DDTHH:MM», en la zona del dueño) en que vence el permiso de la
 * cuenta, si vence antes de `cuando` —la hora elegida en el compositor, en esa misma zona—, o
 * `null` si no hay de qué avisar.
 *
 * Es el aviso que el fierro frío daba tarde: la cuenta se enfría en Los Fierros, pero el post se
 * programa igual para después del vencimiento y se quema a su hora con «La cuenta no está
 * conectada». Diciéndolo al elegir la fecha, se reconecta antes.
 *
 * No avisa de lo que no se sabe: sin hora elegida, sin fecha de vencimiento, una cuenta
 * desconectada (esa ya no se puede marcar) o una red que se renueva sola (`seRenuevaSola`).
 * Las dos horas son de la misma zona y del mismo largo, así que se comparan como texto.
 */
export function venceAntesDe(
  cuenta: { network: string; connected: boolean; expiresAt: string | null },
  cuando: string,
  zona: string,
): string | null {
  if (!cuenta.connected || !cuenta.expiresAt || seRenuevaSola(cuenta.network)) return null
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(cuando)) return null
  const vence = toZonedInput(new Date(cuenta.expiresAt), zona).slice(0, 16)
  return vence <= cuando ? vence : null
}
