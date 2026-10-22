// Los estados de una comanda y por dónde puede pasar cada una. Puro: lo usan la API de la
// cocina, el panel y las pruebas, y la regla es una sola. El diseño está en
// `docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «La comanda».

import { ESTADOS_COMANDA, type EstadoComanda } from '@/db/schema'

export { ESTADOS_COMANDA, TIPOS_COMANDA, type EstadoComanda, type TipoComanda } from '@/db/schema'

/** Los que ya no se mueven: ni el chef ni el usuario los cambian. */
export const TERMINALES: ReadonlySet<EstadoComanda> = new Set(['servida', 'rechazada', 'cancelada', 'fallida'])

/**
 * A dónde puede llevar el chef una comanda desde cada estado. `recibida` no está: la saca de ahí
 * tomarla (`tomar`, que la pasa a `revisando`), no un cambio de estado. `pregunta` y `probando`
 * esperan su fase (preguntas con plazo y el probador): hasta entonces no se entra a ellas.
 * `sirviendo` se repite: cada tanda que llega actualiza el «3 de 5» sin cambiar de estado.
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

/** Hasta dónde la puede cancelar el usuario: mientras no esté en el horno. */
export const CANCELABLES: ReadonlySet<EstadoComanda> = new Set(['recibida', 'revisando', 'en_preparacion', 'probando', 'pregunta'])

export function esEstado(valor: unknown): valor is EstadoComanda {
  return typeof valor === 'string' && (ESTADOS_COMANDA as readonly string[]).includes(valor)
}

// Cómo se dice cada estado, y el «3 de 5»: en `nombres.ts`, que también lee el navegador.
export { NOMBRE_ESTADO, tandasEnPalabras } from './nombres'
