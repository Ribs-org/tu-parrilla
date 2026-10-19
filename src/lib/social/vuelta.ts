// La vuelta de una conexión: la marca de «Agregar cuenta →» y la frase con que vuelve. Sin base
// de datos, para que la ventana de ayuda (`ayuda-conexion.ts`) la use sin arrastrarla.
import { networkLabel } from '@/lib/networks'

/**
 * La cookie con que «Agregar cuenta →» le avisa a la vuelta que se quería una cuenta más, no
 * renovar la de antes. Vive diez minutos, como el resto de la conexión, y solo en la ruta de
 * esa red (`/api/social/<red>`).
 */
export const COOKIE_AGREGAR = 'agregar_cuenta'

/** Si la vuelta de `network` viene de «Agregar cuenta →», leído del header `Cookie`. */
export function pidioAgregar(cookies: string | null, network: string): boolean {
  return cookies?.match(new RegExp(`(?:^|;\\s*)${COOKIE_AGREGAR}=([^;]+)`))?.[1] === network
}

/**
 * La vuelta de «Agregar cuenta →» cuando la red entró sola con la cuenta que ya estaba
 * conectada: TikTok entra con la sesión abierta en el navegador, y Meta repite lo que se
 * compartió la vez anterior. Antes volvía con «TikTok conectado.» y ninguna fila nueva, y
 * parecía que no se podía tener más de una cuenta por red. Frase fija: la ventana de ayuda
 * (`ayuda-conexion.ts`) la reconoce.
 */
export function soloSeRenovo(network: string): string {
  return `${networkLabel(network)} entró con la cuenta que ya estaba conectada: se renovó y no se agregó otra.`
}

/** La frase con que vuelve una conexión de una sola cuenta. */
export function fraseDeVuelta(network: string, resultado: 'nueva' | 'renovada', agregar: boolean): string {
  return agregar && resultado === 'renovada' ? soloSeRenovo(network) : `${networkLabel(network)} conectado.`
}
