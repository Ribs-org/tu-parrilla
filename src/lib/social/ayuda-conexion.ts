import { NO_FACEBOOK_PAGE } from './facebook'
import { NO_INSTAGRAM_ACCOUNT } from './instagram'
import { soloSeRenovo } from './vuelta'

/**
 * Lo que se le explica a quien vuelve de una red sin la cuenta que quería, cuando la frase de la
 * vuelta sola dice qué pasó pero no qué hacer. Dos casos:
 *
 * - **Le falta la página de Facebook** («Ninguna página de Facebook…»). Quien acaba de aceptar
 *   todos los permisos de Meta cree que ya hizo su parte. La página la exige la vía de Meta que
 *   usa Tu Parrilla, Instagram con login de Facebook; la otra vía, que no la pide, espera la
 *   segunda vuelta del App Review (`docs/pendientes.md`).
 * - **«Agregar cuenta →» volvió con la de antes** (`soloSeRenovo`): la red entró sola con la
 *   cuenta ya conectada, y parecía que no se podía tener más de una por red.
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
  [soloSeRenovo('tiktok')]: {
    titulo: 'No se agregó otra cuenta de TikTok',
    porque: 'TikTok entró con la cuenta que tienes abierta en este navegador, que ya estaba conectada.',
    pasos: [
      'Abre tiktok.com en este mismo navegador y cierra la sesión, o cambia a la otra cuenta.',
      'Vuelve y aprieta «Agregar otra cuenta de TikTok»: TikTok te muestra con qué cuenta vas a autorizar antes de seguir.',
    ],
    reintentar: { texto: 'Agregar otra cuenta de TikTok', href: '/api/social/tiktok/connect?agregar=1' },
  },
  [soloSeRenovo('instagram')]: {
    titulo: 'No se agregó otra cuenta de Instagram',
    porque: 'Meta entregó solo la cuenta que ya estaba conectada: repite lo que compartiste con Tu Parrilla la vez anterior.',
    pasos: [
      'La otra cuenta también tiene que ser profesional y estar enlazada a una página de Facebook que administres: en Instagram, en Editar perfil → «Página».',
      'En la ventana de Facebook, no sigas como la vez anterior: elige editar el acceso y marca también esa página y ese Instagram.',
      'De vuelta en Tu Parrilla, en «¿Qué cuentas de Instagram conectar?», marca la nueva.',
    ],
    reintentar: { texto: 'Agregar otra cuenta de Instagram', href: '/api/social/instagram/connect?agregar=1' },
  },
  [soloSeRenovo('facebook')]: {
    titulo: 'No se agregó otra página de Facebook',
    porque: 'Meta entregó solo la página que ya estaba conectada: repite lo que compartiste con Tu Parrilla la vez anterior.',
    pasos: [
      'La otra página tiene que administrarla la cuenta de Facebook con que entras.',
      'En la ventana de Facebook, no sigas como la vez anterior: elige editar el acceso y marca también la otra página.',
      'De vuelta en Tu Parrilla, en «¿Qué cuentas de Facebook conectar?», marca la nueva.',
    ],
    reintentar: { texto: 'Agregar otra página de Facebook', href: '/api/social/facebook/connect?agregar=1' },
  },
  [soloSeRenovo('youtube')]: {
    titulo: 'No se agregó otro canal de YouTube',
    porque: 'Google entregó solo el canal que ya estaba conectado.',
    pasos: ['En la ventana de Google, elige la cuenta de Google del otro canal: Google pregunta con cuál entrar.'],
    reintentar: { texto: 'Agregar otro canal de YouTube', href: '/api/social/youtube/connect?agregar=1' },
  },
}

/** La ayuda para la frase con que volvió una conexión, o nada si la frase no tiene una. */
export function ayudaDeConexion(mensaje: string | null): AyudaDeConexion | null {
  return mensaje ? (AYUDAS[mensaje] ?? null) : null
}
