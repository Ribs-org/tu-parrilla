// El vocabulario del panel, en un solo sitio. La dirección visual (docs/superpowers/specs/
// 2026-09-18-parrilla-direccion-visual-design.md, §2) bautizó cada pantalla con el nombre del
// asado y le exigió un subtítulo en llano debajo, para que a los seis meses se siga
// encontrando todo. Las rutas no cambian nunca: son las de siempre, y esta tabla solo les
// pone nombre. Nadie fuera de este archivo escribe «Los Fierros».
//
// De día el plato es sushi (`docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`), y
// desde el 2026-10-20 también cambian las palabras que con sushi no tenían sentido —lo pidió el
// dueño: «Los Fierros no tiene tanto sentido con sushi»—. Dos pantallas: La Parrilla es La Barra
// y Los Fierros son Los Cuchillos. Y lo que se dice del fuego, del fierro y de los cortes. Las
// rutas, las frases de error y la API no cambian. Cada palabra de día sale de acá, y la wiki las
// cuenta todas en «El modo día» (`PALABRAS_DE_DIA`, que `docs-ui.test.ts` le exige).

import { fraseDelAviso, type Calor } from './parrilla'
import type { Tema } from './tema'

export type Pantalla = {
  ruta: string
  nombre: string
  /** El nombre de día, si el día lo cambia. Sin él, la pantalla se llama igual en los dos modos. */
  nombreDeDia?: string
  subtitulo: string
  /** Pestaña de la barra, o entrada del menú de Ajustes. */
  grupo: 'pestana' | 'ajustes'
  soloAdmin?: true
}

// La Parrilla va primera porque es la entrada: `/admin` lleva a ella. Hasta el 2026-10-13
// la entrada era El Fuego, con su propia pestaña; se fundió en La Parrilla (ver
// `docs/superpowers/specs/2026-10-13-parrilla-entrada-y-borradores-design.md`). Ese mismo
// día Los Cortes dejó de ser pestaña: sus publicaciones viven dentro de Los Números
// (`docs/superpowers/specs/2026-10-13-numeros-tablero-design.md`). Tu IA es pestaña desde el
// 2026-10-19, a pedido del dueño: conectar la IA propia tiene que estar a la vista, no dentro de
// Ajustes. Se llevó las llaves, que antes vivían en Tu Cuenta.
//
// De día, la barra de sushi es donde se ponen las piezas, como la parrilla los cortes, y los
// cuchillos son al maestro de sushi lo que los fierros al parrillero: hay que mantenerlos, y
// el de una cuenta que se desconecta pierde el filo. Las demás sirven igual con sushi: la mesa,
// la vitrina —la de la barra, con el pescado a la vista— y los maestros.
export const PANTALLAS: readonly Pantalla[] = [
  {
    ruta: '/admin/schedule',
    nombre: 'La Parrilla',
    nombreDeDia: 'La Barra',
    subtitulo: 'lo que viene y cómo salió lo que ya se fue',
    grupo: 'pestana',
  },
  { ruta: '/admin/comments', nombre: 'La Mesa', subtitulo: 'lo que te responden y tus respuestas', grupo: 'pestana' },
  { ruta: '/admin/analytics', nombre: 'Los Números', subtitulo: 'cómo te fue en las redes y en tu página', grupo: 'pestana' },
  { ruta: '/admin/ia', nombre: 'Tu IA', subtitulo: 'tu propio chef: la llave y la guía para conectarla', grupo: 'pestana' },
  {
    ruta: '/admin/accounts',
    nombre: 'Los Fierros',
    nombreDeDia: 'Los Cuchillos',
    subtitulo: 'tus redes conectadas',
    grupo: 'ajustes',
  },
  { ruta: '/admin/profiles', nombre: 'La Vitrina', subtitulo: 'tus páginas públicas', grupo: 'ajustes' },
  { ruta: '/admin/usuarios', nombre: 'Los Maestros', subtitulo: 'quién puede entrar', grupo: 'ajustes', soloAdmin: true },
  { ruta: '/admin/cuenta', nombre: 'Tu Cuenta', subtitulo: 'tu nombre y tu hora', grupo: 'ajustes' },
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

/** El nombre de una pantalla en un modo: el de día si lo tiene, si no el de siempre. */
export function nombreEn(pantalla: Pick<Pantalla, 'nombre' | 'nombreDeDia'>, tema: Tema): string {
  return tema === 'dia' ? (pantalla.nombreDeDia ?? pantalla.nombre) : pantalla.nombre
}

/**
 * El nombre de una pantalla por su ruta exacta, para la prosa que necesita nombrarla sin
 * escribir «Los Fierros» a mano en otro archivo. Lanza si la ruta no está en la tabla: un
 * nombre mal escrito debe romper en desarrollo, no aparecer vacío en producción.
 *
 * Sin modo, el de noche: lo que no sabe en qué modo se lee —las páginas legales, que siguen de
 * noche— nombra la pantalla como siempre. En el panel, el nombre va en los dos modos
 * (`NombreDe`, en `components/de-noche-y-de-dia.tsx`), y el modo esconde uno.
 */
export function nombreDe(ruta: string, tema: Tema = 'noche'): string {
  const pantalla = PANTALLAS.find((p) => p.ruta === ruta)
  if (!pantalla) throw new Error(`nombreDe: ${ruta} no está en el vocabulario`)
  return nombreEn(pantalla, tema)
}

/**
 * «Se quemó», la sección de La Parrilla con lo que falló, en cada modo. De día nada se quema, y
 * el pescado que no se sirvió se echó a perder. Lo pidió el dueño el 2026-10-19.
 */
export const SE_QUEMO: Record<Tema, string> = { noche: 'Se quemó', dia: 'Se echó a perder' }

/** La wiki de la UI dentro de Tu IA, para que la lea la persona. */
export const MANUAL: Record<Tema, string> = { noche: 'El manual del parrillero', dia: 'El manual del maestro de sushi' }

/** Lo que dice el destino de una cuenta con el fierro frío: de día, el cuchillo perdió el filo. */
export const FIERRO_FRIO: Record<Tema, string> = {
  noche: 'Su fierro está frío: reconéctala',
  dia: 'Su cuchillo está sin filo: reconéctala',
}

/** En chico, al lado de una cuenta cuyo permiso vence en la semana. */
export const SE_ENFRIA: Record<Tema, string> = { noche: 'se enfría', dia: 'se desafila' }

/** La línea de estado de esa cuenta en Los Fierros, con la fecha en que vence. */
export function seEstaEnfriando(vence: string, tema: Tema): string {
  return tema === 'dia'
    ? `Este cuchillo se está desafilando: la conexión vence ${vence}. Reconéctala antes de que pierda el filo.`
    : `Este fierro se está enfriando: la conexión vence ${vence}. Reconéctala antes de que se apague.`
}

/** Una o varias publicaciones en la prosa del panel: cortes de noche, piezas de día. */
export function cortes(n: number, tema: Tema): string {
  if (tema === 'dia') return n === 1 ? 'una pieza' : `${n} piezas`
  return n === 1 ? 'un corte' : `${n} cortes`
}

/** Lo que salió, en el pie de La Parrilla. */
export function servidos(n: number, tema: Tema): string {
  if (tema === 'dia') return n === 1 ? '1 pieza servida' : `${n} piezas servidas`
  return n === 1 ? '1 corte servido' : `${n} cortes servidos`
}

/**
 * Lo que dice la grilla de cada día, arriba a la derecha: su calor. De día no hay fuego: la
 * tabla de servir está vacía, tiene piezas o va llena. También la vista «Día» y la portada.
 */
export const ROTULO_CALOR: Record<Tema, Record<Calor, string>> = {
  noche: { apagada: 'Apagada', prendida: 'Prendida', llena: 'Parrilla llena' },
  dia: { apagada: 'Vacía', prendida: 'Con piezas', llena: 'Tabla llena' },
}

/**
 * Cada palabra que cambia de día, con la de noche: la wiki las cuenta todas en «El modo día»
 * (`public/docs/ui/index.md`), para que un agente que oye una sepa que es la otra.
 */
export const PALABRAS_DE_DIA: ReadonlyArray<Record<Tema, string>> = [
  ...PANTALLAS.flatMap((p) => (p.nombreDeDia ? [{ noche: p.nombre, dia: p.nombreDeDia }] : [])),
  SE_QUEMO,
  MANUAL,
  FIERRO_FRIO,
  SE_ENFRIA,
  { noche: fraseDelAviso({ nivel: 'enfriandose', cuantos: 1 }), dia: fraseDelAviso({ nivel: 'enfriandose', cuantos: 1 }, 'dia') },
  { noche: fraseDelAviso({ nivel: 'apagado', cuantos: 1 }), dia: fraseDelAviso({ nivel: 'apagado', cuantos: 1 }, 'dia') },
  { noche: cortes(1, 'noche'), dia: cortes(1, 'dia') },
  { noche: servidos(1, 'noche'), dia: servidos(1, 'dia') },
  ...(['apagada', 'prendida', 'llena'] as const).map((calor) => ({
    noche: ROTULO_CALOR.noche[calor],
    dia: ROTULO_CALOR.dia[calor],
  })),
]
