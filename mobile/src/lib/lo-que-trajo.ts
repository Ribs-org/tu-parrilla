import { sumarDias } from './agenda'
import type { Tema } from './tema'
import type { PostProgramado } from './tipos'

// «Lo que trajo», sin pantalla: lo que dice el circulito de cada corte, el detalle, los hitos y la
// racha. Lo nuevo lo cuenta el servidor (`src/lib/lo-que-trajo.ts` en la raíz): los «me gusta» y
// comentarios que llegaron desde que se miró el corte —sin los «me gusta» de YouTube, que no deja
// restar—, sus comentarios de YouTube en La Mesa y las visitas a tu página. Los hitos y la racha,
// también (`src/lib/hitos.ts` y `src/lib/racha.ts`).

export type LoNuevo = { meGusta: number; comentarios: number; visitas: number }

/**
 * Un corte de la fila: el de La Parrilla, con lo nuevo y `hito`, el umbral más alto que pasaron sus
 * vistas (null si ninguno). Un servidor de antes no manda `hito`.
 */
export type CorteQueTrajo = PostProgramado & { nuevo: LoNuevo; hito?: number | null }

/** Los días seguidos con algo servido; `hoy`, si ya salió algo hoy (si no, llega hasta ayer). */
export type Racha = { dias: number; hoy: boolean }

/** Un hito que la app celebra al abrir, con su corte, que puede ser de cualquier fecha. */
export type HitoPorCelebrar = { id: string; umbral: number; corte: PostProgramado }

/**
 * `GET /api/mobile/lo-que-trajo`. `numero` es el del ícono y la pestaña. `racha` y `porCelebrar`
 * no vienen de un servidor de antes, ni en lo guardado de antes.
 */
export type LoQueTrajo = {
  hoy: string
  cortes: CorteQueTrajo[]
  numero: number
  racha?: Racha
  porCelebrar?: HitoPorCelebrar[]
}

/** Un hito en el detalle. `alcanzadoEn`, null en los que el corte ya traía al estrenarse los hitos. */
export type HitoDelCorte = { umbral: number; alcanzadoEn: string | null }

/** Lo que lleva una red, tal como la red lo da. `segunLaRed`: YouTube, que se muestra con su rótulo. */
export type RedDelCorte = {
  id: string
  red: string
  handle: string | null
  views: number | null
  likes: number | null
  comments: number | null
  seguidores: number | null
  segunLaRed: boolean
}

/** `GET /api/mobile/cortes/{id}`. `vistoEn`, null si nunca se miró. */
export type DetalleDelCorte = {
  corte: PostProgramado
  nuevo: LoNuevo
  vistoEn: string | null
  redes: RedDelCorte[]
  visitas: number
  /** De menor a mayor. Un servidor de antes no lo manda. */
  hitos?: HitoDelCorte[]
}

export function totalDe(nuevo: LoNuevo): number {
  return nuevo.meGusta + nuevo.comentarios + nuevo.visitas
}

/** Lo que dice el circulito: «+37», «+1,2 mil», «+12 mil», «+1,5 M». Corto, para que quepa en la burbuja. */
export function circulito(n: number): string {
  if (n >= 1_000_000) return `+${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} M`
  if (n >= 10_000) return `+${Math.floor(n / 1000)} mil`
  if (n >= 1000) return `+${(Math.floor(n / 100) / 10).toFixed(1).replace('.', ',').replace(',0', '')} mil`
  return `+${n}`
}

const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/** El día de un corte, en la zona del dueño: «lun 9», como La Parrilla. */
function diaCorto(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  return `${DIAS_SEMANA[new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay()]} ${d}`
}

/** Lo que va bajo la burbuja: «hoy», «ayer» o «lun 9». `cuando` viene con la hora del dueño. */
export function diaDeLaBurbuja(cuando: string, hoy: string): string {
  const dia = cuando.slice(0, 10)
  if (dia === hoy) return 'hoy'
  if (dia === sumarDias(hoy, -1)) return 'ayer'
  return diaCorto(dia)
}

/** «1.200»: con el punto de los miles escrito a mano, sin depender del `Intl` del teléfono. */
function conMiles(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parte(n: number, uno: string, varios: string): string | null {
  return n > 0 ? `+${conMiles(n)} ${n === 1 ? uno : varios}` : null
}

/** El título del bloque de lo nuevo en el detalle. */
export function tituloDelNuevo(vistoEn: string | null): string {
  return vistoEn ? 'Desde la última vez' : 'Desde que salió'
}

/**
 * «+31 me gusta · +4 comentarios · +2 visitas», solo lo que subió. Sin nada: «Nada nuevo desde el
 * lun 9 a las 21:40.», o, si nunca se miró, «Todavía no llega nada.».
 */
export function fraseDelNuevo(nuevo: LoNuevo, vistoEn: string | null): string {
  const partes = [
    parte(nuevo.meGusta, 'me gusta', 'me gusta'),
    parte(nuevo.comentarios, 'comentario', 'comentarios'),
    parte(nuevo.visitas, 'visita', 'visitas'),
  ].filter((p): p is string => p !== null)
  if (partes.length > 0) return partes.join(' · ')
  if (!vistoEn) return 'Todavía no llega nada.'
  return `Nada nuevo desde el ${diaCorto(vistoEn.slice(0, 10))} a las ${vistoEn.slice(11, 16)}.`
}

/** El umbral en la llamita de la burbuja: «100», «1 mil», «10 mil», «1 M». */
export function umbralCorto(umbral: number): string {
  if (umbral >= 1_000_000) return `${umbral / 1_000_000} M`
  if (umbral >= 1000) return `${umbral / 1000} mil`
  return String(umbral)
}

/** «las 1.000 vistas»; el millón, «el millón de vistas». */
function lasVistas(umbral: number): string {
  return umbral === 1_000_000 ? 'el millón de vistas' : `las ${conMiles(umbral)} vistas`
}

/** Lo que dice la celebración: de noche un corte, de día una pieza, como en el resto de la app. */
export function tituloDelHito(umbral: number, tema: Tema): string {
  return `${tema === 'dia' ? 'Tu pieza' : 'Tu corte'} pasó ${lasVistas(umbral)}`
}

/** El botón de la celebración que abre el detalle, en el modo que se ve. */
export const VER_EL_CORTE: Record<Tema, string> = { noche: 'Ver el corte', dia: 'Ver la pieza' }

/** Un hito en el detalle: «1.000 vistas · mié 12», o sin día si ya lo traía al estrenarse los hitos. */
export function renglonDelHito(hito: HitoDelCorte): string {
  const vistas = `${conMiles(hito.umbral)} vistas`
  return hito.alcanzadoEn ? `${vistas} · ${diaCorto(hito.alcanzadoEn.slice(0, 10))}` : vistas
}

/**
 * La racha arriba de La Parrilla: «La parrilla lleva 5 días prendida» —de día, «La barra lleva 5
 * días abierta»— y, si hoy todavía no salió nada, el aviso de que se apaga a medianoche. Con menos
 * de dos días no se muestra: una racha de uno no es una racha.
 */
export function fraseDeLaRacha(racha: Racha | undefined, tema: Tema): { titulo: string; aviso: string | null } | null {
  if (!racha || racha.dias < 2) return null
  return {
    titulo: tema === 'dia' ? `La barra lleva ${racha.dias} días abierta` : `La parrilla lleva ${racha.dias} días prendida`,
    aviso: racha.hoy ? null : 'Hoy todavía no sale nada: la racha se apaga a medianoche.',
  }
}

/** La llama de la racha crece con ella: 18 de alto a los dos días, hasta 34 a los diez. */
export function altoDeLaLlama(dias: number): number {
  return Math.min(34, 18 + Math.max(0, dias - 2) * 2)
}

/**
 * Los hitos que quedan por celebrar: los que vinieron, sin los que este teléfono ya celebró —lo
 * guardado de antes puede traer uno que ya se celebró y el servidor ya no manda—.
 */
export function quedanPorCelebrar(hitos: readonly HitoPorCelebrar[] | undefined, celebrados: ReadonlySet<string>): HitoPorCelebrar[] {
  return (hitos ?? []).filter((h) => !celebrados.has(h.id))
}

/** Cuántos ids de hitos celebrados guarda el teléfono: los últimos, que son los que lo guardado puede traer. */
export const CELEBRADOS_QUE_SE_GUARDAN = 50

/** La lista guardada con uno más al final, sin repetir y con las últimas `CELEBRADOS_QUE_SE_GUARDAN`. */
export function sumarCelebrado(guardados: readonly string[], id: string): string[] {
  return [...guardados.filter((g) => g !== id), id].slice(-CELEBRADOS_QUE_SE_GUARDAN)
}
