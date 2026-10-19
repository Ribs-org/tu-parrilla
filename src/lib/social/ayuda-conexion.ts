import { NO_FACEBOOK_PAGE } from './facebook'
import { NO_INSTAGRAM_ACCOUNT } from './instagram'

/**
 * Lo que se le explica a quien vuelve de Meta sin cuenta conectada porque le falta la página de
 * Facebook. La frase de la vuelta sola («Ninguna página de Facebook…») dice qué pasó, pero no qué
 * hacer, y quien acaba de aceptar todos los permisos de Meta cree que ya hizo su parte. La página
 * la exige la vía de Meta que usa Tu Parrilla, Instagram con login de Facebook; la otra vía, que no
 * la pide, espera la segunda vuelta del App Review (`docs/pendientes.md`).
 *
 * Los Fierros la muestra en una ventana que se abre sola (`accounts/aviso-de-conexion.tsx`).
 * Frases fijas, cada una con test letra por letra: la wiki de la UI las cita.
 */
export type AyudaDeConexion = {
  titulo: string
  porque: string
  pasos: readonly string[]
  /** El botón para volver a intentarlo, y adónde lleva. */
  reintentar: { texto: string; href: string }
}

const AYUDAS: Record<string, AyudaDeConexion> = {
  [NO_INSTAGRAM_ACCOUNT]: {
    titulo: 'Instagram no se conectó',
    porque:
      'Aceptar los permisos de Meta no basta: Tu Parrilla encuentra tu Instagram a través de una página de Facebook, y Meta no entregó ninguna página tuya con un Instagram enlazado.',
    pasos: [
      'Tu Instagram tiene que ser una cuenta profesional, de creador o de empresa. Se cambia en la configuración de Instagram.',
      'Tiene que estar enlazado a una página de Facebook: en Instagram, en Editar perfil → «Página», conecta tu página o crea una. Enlazar las cuentas en el Centro de cuentas de Meta no sirve para esto.',
      'Al volver a conectar, entra con el Facebook que administra esa página y, cuando Meta pregunte qué compartir con Tu Parrilla, marca esa página y ese Instagram. Si ya lo pasaste sin marcarlos, corrígelo en la configuración de Facebook, en «Integraciones comerciales».',
    ],
    reintentar: { texto: 'Volver a conectar Instagram', href: '/api/social/instagram/connect' },
  },
  [NO_FACEBOOK_PAGE]: {
    titulo: 'Facebook no se conectó',
    porque:
      'Tu Parrilla publica en una página de Facebook, no en un perfil personal, y Meta no entregó ninguna página que administre la cuenta con que entraste.',
    pasos: [
      'Si todavía no tienes una página, créala en Facebook, en «Páginas».',
      'Al volver a conectar, entra con la cuenta de Facebook que administra la página y, cuando Meta pregunte qué compartir con Tu Parrilla, márcala.',
    ],
    reintentar: { texto: 'Volver a conectar Facebook', href: '/api/social/facebook/connect' },
  },
}

/** La ayuda para la frase con que volvió una conexión, o nada si la frase no tiene una. */
export function ayudaDeConexion(mensaje: string | null): AyudaDeConexion | null {
  return mensaje ? (AYUDAS[mensaje] ?? null) : null
}
