import { sumarDias } from './agenda'
import type { PostProgramado } from './tipos'

// «Lo que trajo», sin pantalla: lo que dice el circulito de cada corte y el detalle. Lo nuevo lo
// cuenta el servidor (`src/lib/lo-que-trajo.ts` en la raíz): los «me gusta» y comentarios que
// llegaron desde que se miró el corte —sin los «me gusta» de YouTube, que no deja restar—, sus
// comentarios de YouTube en La Mesa y las visitas a tu página.

export type LoNuevo = { meGusta: number; comentarios: number; visitas: number }

/** Un corte de la fila: el de La Parrilla, con lo nuevo. */
export type CorteQueTrajo = PostProgramado & { nuevo: LoNuevo }

/** `GET /api/mobile/lo-que-trajo`. `numero` es el del ícono y la pestaña. */
export type LoQueTrajo = { hoy: string; cortes: CorteQueTrajo[]; numero: number }

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
