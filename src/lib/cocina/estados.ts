// Los estados de una comanda y por dónde puede pasar cada una. Puro: lo usan la API de la
// cocina, el panel y las pruebas, y la regla es una sola. El diseño está en
// `docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «La comanda».

import { ESTADOS_COMANDA, type EstadoComanda } from '@/db/schema'

export { ESTADOS_COMANDA, TIPOS_COMANDA, type EstadoComanda, type TipoComanda } from '@/db/schema'

/** Los que ya no se mueven: ni el chef ni el usuario los cambian. */
export const TERMINALES: ReadonlySet<EstadoComanda> = new Set(['servida', 'rechazada', 'cancelada', 'fallida'])

/**
 * A dónde puede llevar el chef una comanda desde cada estado, con `estado`. `recibida` no está: la
 * saca de ahí tomarla (`tomar`, que la pasa a `revisando`), no un cambio de estado. A `pregunta`
 * no se entra por acá sino preguntando (`PREGUNTAN_DESDE`), porque no hay pregunta sin su texto,
 * su plazo y su opción por defecto; y de ahí no la saca el chef sino la respuesta, o el plazo. A
 * `probando` todavía no se entra: espera el probador. `sirviendo` se repite: cada tanda que llega
 * actualiza el «3 de 5» sin cambiar de estado.
 */
const DEL_CHEF: Readonly<Partial<Record<EstadoComanda, readonly EstadoComanda[]>>> = {
  revisando: ['en_preparacion', 'en_el_horno', 'rechazada', 'fallida'],
  en_preparacion: ['en_el_horno', 'sirviendo', 'fallida'],
  en_el_horno: ['sirviendo', 'lista', 'fallida'],
  sirviendo: ['sirviendo', 'lista', 'fallida'],
}

/** Si el chef puede pasar una comanda de `de` a `a`. */
export function puedePasar(de: EstadoComanda, a: EstadoComanda): boolean {
  return DEL_CHEF[de]?.includes(a) ?? false
}

/**
 * Desde dónde puede preguntar el chef: al revisar lo que llegó y mientras elige los cortes, que es
 * donde aparece la duda (el diseño, «Los estados»). En el horno ya no: lo que está en el horno no
 * se cancela, y una pregunta que no se puede contestar con «mejor no» no es una pregunta. Responder
 * la devuelve al estado de donde salió.
 */
export const PREGUNTAN_DESDE: ReadonlySet<EstadoComanda> = new Set(['revisando', 'en_preparacion'])

export function puedePreguntar(de: EstadoComanda): boolean {
  return PREGUNTAN_DESDE.has(de)
}

/** Hasta dónde la puede cancelar el usuario: mientras no esté en el horno. */
export const CANCELABLES: ReadonlySet<EstadoComanda> = new Set(['recibida', 'revisando', 'en_preparacion', 'probando', 'pregunta'])

/**
 * Las que están en marcha: el chef las tiene o las va a tomar, y lo próximo que les pase lo hace
 * él. Mientras el dueño tenga alguna, la tarjeta de La Cocina se actualiza sola (`pulsoDeLaCocina`).
 * `lista` no: de ahí la mueve solo el dueño, desde el mesón.
 */
export const EN_MARCHA: ReadonlySet<EstadoComanda> = new Set([
  'recibida',
  'revisando',
  'en_preparacion',
  'probando',
  'pregunta',
  'en_el_horno',
  'sirviendo',
])

export function esEstado(valor: unknown): valor is EstadoComanda {
  return typeof valor === 'string' && (ESTADOS_COMANDA as readonly string[]).includes(valor)
}

// Cómo se dice cada estado, y el «3 de 5»: en `nombres.ts`, que también lee el navegador.
export { NOMBRE_ESTADO, tandasEnPalabras } from './nombres'
