// «Lo que trajo», en el panel, sin pantalla: lo que dicen el circulito de cada corte, el detalle,
// los hitos y la racha. Son las frases de la app del teléfono (`mobile/src/lib/lo-que-trajo.ts`),
// con las fechas como las escribe el panel —«lun 9 de nov», con el mes, como «Se quemó» y los
// borradores—. Lo que se cuenta lo decide el servidor (`lo-que-trajo.ts`, `hitos.ts`, `racha.ts`);
// esto solo lo escribe. Puro, para el servidor y el navegador, y para pincharlo con un test.

import { formatNumber } from './utils'
import { addDays, dayLabelConMes } from './schedule-week'
import type { Tema } from './tema'

export type LoNuevo = { meGusta: number; comentarios: number; visitas: number }

/** Los días seguidos con algo servido; `hoy`, si ya salió algo hoy (si no, llega hasta ayer). */
export type Racha = { dias: number; hoy: boolean }

/** Un día y una hora en la zona del dueño: `AAAA-MM-DD` y `HH:MM`. */
export type Momento = { dia: string; hora: string }

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

/** Lo que va bajo la burbuja: «hoy», «ayer» o «lun 9». Sin el mes: la fila es de una semana. */
export function diaDeLaBurbuja(dia: string, hoy: string): string {
  if (dia === hoy) return 'hoy'
  if (dia === addDays(hoy, -1)) return 'ayer'
  return `${DIAS_SEMANA[new Date(`${dia}T00:00:00Z`).getUTCDay()]} ${Number(dia.slice(8))}`
}

/**
 * «1.200»: con el punto de los miles escrito a mano. El `Intl` en español no agrupa los números de
 * cuatro cifras, y «+1200 me gusta» se lee peor que «+1.200».
 */
function conMiles(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function parte(n: number, uno: string, varios: string): string | null {
  return n > 0 ? `+${conMiles(n)} ${n === 1 ? uno : varios}` : null
}

/** El título del bloque de lo nuevo en el detalle. */
export function tituloDelNuevo(visto: Momento | null): string {
  return visto ? 'Desde la última vez' : 'Desde que salió'
}

/**
 * «+31 me gusta · +4 comentarios · +2 visitas», solo lo que subió. Sin nada: «Nada nuevo desde el
 * lun 9 de nov a las 21:40.», o, si nunca se miró, «Todavía no llega nada.».
 */
export function fraseDelNuevo(nuevo: LoNuevo, visto: Momento | null): string {
  const partes = [
    parte(nuevo.meGusta, 'me gusta', 'me gusta'),
    parte(nuevo.comentarios, 'comentario', 'comentarios'),
    parte(nuevo.visitas, 'visita', 'visitas'),
  ].filter((p): p is string => p !== null)
  if (partes.length > 0) return partes.join(' · ')
  if (!visto) return 'Todavía no llega nada.'
  return `Nada nuevo desde el ${dayLabelConMes(visto.dia)} a las ${visto.hora}.`
}

/** El umbral en la llamita de la burbuja: «100», «1 mil», «10 mil», «1 M». */
export function umbralCorto(umbral: number): string {
  if (umbral >= 1_000_000) return `${umbral / 1_000_000} M`
  if (umbral >= 1000) return `${umbral / 1000} mil`
  return String(umbral)
}

/** Lo que lee un lector de pantalla en una burbuja: el día, el texto, lo nuevo y el hito. */
export function etiquetaDeLaBurbuja(dia: string, texto: string, nuevo: number, hito: number | null): string {
  const loNuevo = nuevo > 0 ? `${circulito(nuevo)} desde la última vez` : 'Nada nuevo'
  return `${dia}, ${texto || 'sin texto'}. ${loNuevo}${hito ? `. Pasó las ${umbralCorto(hito)} vistas` : ''}`
}

/** «las 1.000 vistas»; el millón, «el millón de vistas». */
function lasVistas(umbral: number): string {
  return umbral === 1_000_000 ? 'el millón de vistas' : `las ${conMiles(umbral)} vistas`
}

/** Lo que dice la celebración: de noche un corte, de día una pieza, como en el resto del panel. */
export function tituloDelHito(umbral: number, tema: Tema): string {
  return `${tema === 'dia' ? 'Tu pieza' : 'Tu corte'} pasó ${lasVistas(umbral)}`
}

/** El botón de la celebración que abre el detalle, en cada modo. */
export const VER_EL_CORTE: Record<Tema, string> = { noche: 'Ver el corte', dia: 'Ver la pieza' }

/**
 * Un hito en el detalle: «1.000 vistas · mié 12 de nov», o sin día si el corte ya lo traía cuando
 * llegaron los hitos (`alcanzado_en` nulo). `dia`, en la zona del dueño.
 */
export function renglonDelHito(umbral: number, dia: string | null): string {
  const vistas = `${conMiles(umbral)} vistas`
  return dia ? `${vistas} · ${dayLabelConMes(dia)}` : vistas
}

/**
 * La racha: «La parrilla lleva 5 días prendida» —de día, «La barra lleva 5 días abierta»— y, si
 * hoy todavía no salió nada, el aviso de que se apaga a medianoche. Con menos de dos días no se
 * muestra: una racha de uno no es una racha.
 */
export function fraseDeLaRacha(racha: Racha, tema: Tema): { titulo: string; aviso: string | null } | null {
  if (racha.dias < 2) return null
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
 * Lo que lleva una red, tal como la red lo da: «1200 vistas · 56 me gusta · 7 comentarios», con los
 * números como los escribe el resto del panel (`formatNumber`). Null si la red todavía no dio
 * ninguno.
 */
export function cifrasDeUnaRed(lectura: { views: number | null; likes: number | null; comments: number | null } | null): string | null {
  if (!lectura) return null
  const cifras = [
    lectura.views !== null ? `${formatNumber(lectura.views)} vistas` : null,
    lectura.likes !== null ? `${formatNumber(lectura.likes)} me gusta` : null,
    lectura.comments !== null ? `${formatNumber(lectura.comments)} comentarios` : null,
  ].filter((c): c is string => c !== null)
  return cifras.length > 0 ? cifras.join(' · ') : null
}

/** «+8 seguidores», o «+8 suscriptores» en YouTube. Null si la red no los da o no trajo ninguno. */
export function seguidoresDeUnaRed(red: string, seguidores: number | null): string | null {
  if (seguidores === null || seguidores <= 0) return null
  return `+${formatNumber(seguidores)} ${red === 'youtube' ? 'suscriptores' : 'seguidores'}`
}
