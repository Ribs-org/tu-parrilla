import { Linking } from 'react-native'
import { SesionCaducada, apiPost } from './api'
import { API_BASE } from './config'

/**
 * Adónde lleva el botón de Los Fierros: al puente, que abre la sesión del panel en el navegador sin
 * pedir otro código (`src/lib/puente.ts` del servidor), o a Los Fierros a secas si el servidor no
 * dio una ruta de puente —uno de antes, o una respuesta que no se entiende—. Ahí el panel pide
 * entrar con el correo, como antes.
 */
export function destinoDeLosFierros(ruta: unknown, base: string = API_BASE): string {
  if (typeof ruta === 'string' && /^\/ingresar\/puente#t=[A-Za-z0-9_-]+$/.test(ruta)) return `${base}${ruta}`
  return `${base}/admin/accounts`
}

/** Abre Los Fierros del panel en el navegador del teléfono. Sin señal, sin puente: abre igual. */
export async function abrirLosFierros(token: string): Promise<void> {
  let ruta: unknown = null
  try {
    ruta = (await apiPost<{ ruta?: unknown }>('/api/mobile/puente', token, {})).ruta
  } catch (error) {
    // La sesión vencida sí sube: quien llama la cierra, como en cada pantalla.
    if (error instanceof SesionCaducada) throw error
  }
  await Linking.openURL(destinoDeLosFierros(ruta))
}
