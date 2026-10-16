// El vocabulario del panel, en un solo sitio. La dirección visual (docs/superpowers/specs/
// 2026-09-18-parrilla-direccion-visual-design.md, §2) bautizó cada pantalla con el nombre del
// asado y le exigió un subtítulo en llano debajo, para que a los seis meses se siga
// encontrando todo. Las rutas no cambian nunca: son las de siempre, y esta tabla solo les
// pone nombre. Nadie fuera de este archivo escribe «Los Fierros».

export type Pantalla = {
  ruta: string
  nombre: string
  subtitulo: string
  /** Pestaña de la barra, o entrada del menú de Ajustes. */
  grupo: 'pestana' | 'ajustes'
  soloAdmin?: true
}

// La Parrilla va primera porque es la entrada: `/admin` lleva a ella. Hasta el 2026-10-13
// la entrada era El Fuego, con su propia pestaña; se fundió en La Parrilla (ver
// `docs/superpowers/specs/2026-10-13-parrilla-entrada-y-borradores-design.md`). Ese mismo
// día Los Cortes dejó de ser pestaña: sus publicaciones viven dentro de Los Números
// (`docs/superpowers/specs/2026-10-13-numeros-tablero-design.md`).
export const PANTALLAS: readonly Pantalla[] = [
  { ruta: '/admin/schedule', nombre: 'La Parrilla', subtitulo: 'lo que viene y cómo salió lo que ya se fue', grupo: 'pestana' },
  { ruta: '/admin/comments', nombre: 'La Mesa', subtitulo: 'lo que te responden y tus respuestas', grupo: 'pestana' },
  { ruta: '/admin/analytics', nombre: 'Los Números', subtitulo: 'cómo te fue en las redes y en tu página', grupo: 'pestana' },
  { ruta: '/admin/accounts', nombre: 'Los Fierros', subtitulo: 'tus redes conectadas', grupo: 'ajustes' },
  { ruta: '/admin/profiles', nombre: 'La Vitrina', subtitulo: 'tus páginas públicas', grupo: 'ajustes' },
  { ruta: '/admin/usuarios', nombre: 'Los Maestros', subtitulo: 'quién puede entrar', grupo: 'ajustes', soloAdmin: true },
  { ruta: '/admin/cuenta', nombre: 'Tu Cuenta', subtitulo: 'tu nombre, tu hora y tus llaves', grupo: 'ajustes' },
]

function visibles(esAdmin: boolean): Pantalla[] {
  return PANTALLAS.filter((p) => !p.soloAdmin || esAdmin)
}

export function pestanas(esAdmin: boolean): Pantalla[] {
  return visibles(esAdmin).filter((p) => p.grupo === 'pestana')
}

export function ajustes(esAdmin: boolean): Pantalla[] {
  return visibles(esAdmin).filter((p) => p.grupo === 'ajustes')
}

/**
 * La pantalla a la que pertenece una ruta, por segmento (`/admin/schedule/abc` es La
 * Parrilla, `/admin/scheduleX` no es nada). Devuelve todas las pantallas, incluida la de
 * admin, porque decide qué se marca activo, no qué se muestra.
 */
export function pantallaDe(pathname: string): Pantalla | null {
  return PANTALLAS.find((p) => pathname === p.ruta || pathname.startsWith(`${p.ruta}/`)) ?? null
}

/**
 * El nombre de una pantalla por su ruta exacta, para la prosa que necesita nombrarla sin
 * escribir «Los Fierros» a mano en otro archivo. Lanza si la ruta no está en la tabla: un
 * nombre mal escrito debe romper en desarrollo, no aparecer vacío en producción.
 */
export function nombreDe(ruta: string): string {
  const pantalla = PANTALLAS.find((p) => p.ruta === ruta)
  if (!pantalla) throw new Error(`nombreDe: ${ruta} no está en el vocabulario`)
  return pantalla.nombre
}
