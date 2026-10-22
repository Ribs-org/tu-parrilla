// Los estados de una comanda y por dónde puede pasar cada una. Puro: lo usan la API de la
// cocina, el panel y las pruebas, y la regla es una sola. El diseño está en
// `docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «La comanda».

import { ESTADOS_COMANDA, type EstadoComanda } from '@/db/schema'
import type { Tema } from '@/lib/tema'

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

/**
 * Cómo se dice cada estado, de noche y de día. «Se quemó» y «La Barra» ya tienen dueño —los
 * posts que fallaron y el calendario de día—, así que ninguna comanda las usa.
 */
export const NOMBRE_ESTADO: Record<EstadoComanda, Record<Tema, string>> = {
  recibida: { noche: 'Comanda colgada', dia: 'Comanda colgada' },
  revisando: { noche: 'El chef mira la res', dia: 'El chef mira el atún' },
  en_preparacion: { noche: 'El desposte', dia: 'El despiece' },
  probando: { noche: 'La degustación', dia: 'La degustación' },
  pregunta: { noche: 'El chef te pregunta', dia: 'El chef te pregunta' },
  en_el_horno: { noche: 'Al fuego', dia: 'Armando las piezas' },
  sirviendo: { noche: 'Sirviendo', dia: 'Sirviendo' },
  lista: { noche: 'Lista en el mesón', dia: 'Lista en la vitrina' },
  servida: { noche: 'Servida', dia: 'Servida' },
  rechazada: { noche: 'No se puede cocinar', dia: 'No se puede preparar' },
  cancelada: { noche: 'Cancelada', dia: 'Cancelada' },
  fallida: { noche: 'No se pudo terminar', dia: 'No se pudo terminar' },
}

/** «3 de 5 tandas en el mesón» (de día, en la vitrina), o solo cuántas si el total no se sabe. */
export function tandasEnPalabras(servidas: number, total: number | null, tema: Tema): string {
  const donde = tema === 'dia' ? 'en la vitrina' : 'en el mesón'
  const tandas = (n: number) => (n === 1 ? 'tanda' : 'tandas')
  if (total && total > 0) return `${servidas} de ${total} ${tandas(total)} ${donde}`
  return `${servidas} ${tandas(servidas)} ${donde}`
}
