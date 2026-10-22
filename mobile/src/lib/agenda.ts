import { agruparPorDia } from './agrupar'
import { bordeDe, coccionDe, selloPorEstado } from './parrilla'
import { servidos, type Tema } from './tema'
import type { BorradorResumido, PostProgramado } from './tipos'

// Las reglas de La Parrilla en el teléfono, sin pantalla: qué días se muestran, qué se quemó
// y cuántos cortes salieron ayer. Los días son `YYYY-MM-DD` en la zona del dueño, como los
// manda la API; nunca se arma un `Date` en la zona del teléfono.

/** Los días que se muestran siempre, vacíos o no, desde hoy: los que tienen un «+» útil. */
export const DIAS_FIJOS = 7

const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** Un día más o menos, sobre la fecha y no sobre el reloj: sin horarios de verano de por medio. */
export function sumarDias(dia: string, dias: number): string {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(Date.UTC(a!, m! - 1, d! + dias)).toISOString().slice(0, 10)
}

/** «Hoy · jue 15», «Mañana · vie 16» o «sáb 17». */
export function rotuloDelDia(dia: string, hoy: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  const corto = `${DIAS_SEMANA[new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay()]} ${d}`
  if (dia === hoy) return `Hoy · ${corto}`
  if (dia === sumarDias(hoy, 1)) return `Mañana · ${corto}`
  return corto
}

export type DiaDeLaAgenda = { dia: string; posts: PostProgramado[]; borradores: BorradorResumido[] }

/**
 * De hoy en adelante: los siete primeros días siempre, aunque estén vacíos —para poder
 * prenderlos con su «+»—, y después solo los que tienen algo. Lo que ya pasó no está:
 * lo que falló sale arriba, en «Se quemó».
 *
 * Un borrador con fecha va también en su día, como en el calendario del panel, y alcanza
 * para que el día aparezca; pero no es un corte: no cuenta para el calor.
 */
export function diasDeLaAgenda(
  posts: PostProgramado[],
  hoy: string,
  borradores: BorradorResumido[] = [],
): DiaDeLaAgenda[] {
  const porDia = new Map(agruparPorDia(posts).map((g) => [g.dia, g.posts]))
  const borradoresPorDia = new Map<string, BorradorResumido[]>()
  for (const b of [...borradores].sort((x, y) => (x.cuando ?? '').localeCompare(y.cuando ?? ''))) {
    if (!b.cuando) continue
    const dia = b.cuando.slice(0, 10)
    borradoresPorDia.set(dia, [...(borradoresPorDia.get(dia) ?? []), b])
  }
  const dias = new Set<string>()
  for (let i = 0; i < DIAS_FIJOS; i++) dias.add(sumarDias(hoy, i))
  for (const dia of [...porDia.keys(), ...borradoresPorDia.keys()]) if (dia >= hoy) dias.add(dia)
  return [...dias]
    .sort()
    .map((dia) => ({ dia, posts: porDia.get(dia) ?? [], borradores: borradoresPorDia.get(dia) ?? [] }))
}

export type Quemado = { post: PostProgramado; destino: PostProgramado['redes'][number] }

/**
 * Cada destino que falló y nadie archivó, del más reciente al más viejo: un corte que falló en
 * dos redes son dos filas. Lo archivado (en el panel o por la API) ya no pide una acción, como
 * en «Se quemó» del panel.
 */
export function seQuemo(posts: PostProgramado[]): Quemado[] {
  return posts
    .flatMap((post) => post.redes.filter((r) => r.estado === 'failed' && !r.archivado).map((destino) => ({ post, destino })))
    .sort((a, b) => b.post.cuando.localeCompare(a.post.cuando))
}

/** Los cortes de ayer que salieron en al menos una red. Cuenta cortes y no redes, como el panel. */
export function servidosAyer(posts: PostProgramado[], hoy: string): number {
  const ayer = sumarDias(hoy, -1)
  return posts.filter((p) => p.cuando.slice(0, 10) === ayer && p.redes.some((r) => r.estado === 'published')).length
}

/**
 * «Ayer no salió nada.», «Ayer: 1 corte servido» o «Ayer: N cortes servidos», como el pie del
 * panel; de día, piezas servidas.
 */
export function pieDeAyer(cuantos: number, tema: Tema = 'noche'): string {
  if (cuantos === 0) return 'Ayer no salió nada.'
  return `Ayer: ${servidos(cuantos, tema)}`
}

/**
 * La hora del corte, o el día y la hora si no es de hoy: «19:00» o «mar 14 de oct · 19:00»,
 * como «Se quemó» en el panel (`horaConDia`, en `src/lib/fuego.ts`). Antes decía «14 oct ·
 * 19:00», y el mismo fallo se escribía distinto en el teléfono y en el panel.
 */
export function cuandoQuemado(cuando: string, hoy: string): string {
  const hora = cuando.slice(11, 16)
  if (cuando.slice(0, 10) === hoy) return hora
  const [a, m, d] = cuando.slice(0, 10).split('-').map(Number)
  const semana = DIAS_SEMANA[new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay()]
  return `${semana} ${d} de ${MESES[m! - 1]} · ${hora}`
}

let toques = 0

/**
 * Una marca nueva por cada «+» que se aprieta en la sesión. Viaja a Publicar como `n`: si se
 * aprieta el del mismo día dos veces, la fecha se vuelve a poner aunque el día sea el mismo.
 * En el módulo y no en un estado, como `anotarCambio`: sobrevive a que la pantalla se monte
 * de nuevo.
 */
export function marcaDeToque(): string {
  toques += 1
  return String(toques)
}

/**
 * Si el post ya salió en todas sus redes y no le falta nada del dueño: es el que deja la chapa y
 * se hunde, como en el panel (`estadoDeFila`). Lo que llegó a la bandeja de TikTok ya salió, pero
 * falta terminarlo: no se hunde.
 */
export function servidoEnTodas(post: PostProgramado): boolean {
  const estados = post.redes.map((r) => r.estado)
  const sellos = post.redes.map((r) => r.sello ?? selloPorEstado(r.estado, r.error))
  return coccionDe(estados) === 'punto' && bordeDe('punto', sellos) === 'cuenta'
}

export type Resumen = { servidos: number; fallaron: number; porSalir: number }

/** Cuánto salió, cuánto se quemó y cuánto falta de un día, por la cocción, como en el panel. */
export function resumenDelDia(posts: readonly PostProgramado[]): Resumen {
  const resumen: Resumen = { servidos: 0, fallaron: 0, porSalir: 0 }
  for (const post of posts) {
    const coccion = coccionDe(post.redes.map((r) => r.estado))
    if (coccion === 'punto') resumen.servidos++
    else if (coccion === 'quemada' || coccion === 'parcial') resumen.fallaron++
    else resumen.porSalir++
  }
  return resumen
}

const ORDEN_DE_REDES = ['instagram', 'tiktok', 'youtube', 'facebook', 'threads', 'x']

/** A qué red va lo del día: cuántos destinos tiene cada una, en el orden de siempre. */
export function mezclaDeRedes(posts: readonly PostProgramado[]): { red: string; destinos: number }[] {
  const cuenta = new Map<string, number>()
  for (const post of posts) for (const { red } of post.redes) cuenta.set(red, (cuenta.get(red) ?? 0) + 1)
  const orden = (red: string) => (ORDEN_DE_REDES.includes(red) ? ORDEN_DE_REDES.indexOf(red) : ORDEN_DE_REDES.length)
  return [...cuenta].sort(([a], [b]) => orden(a) - orden(b)).map(([red, destinos]) => ({ red, destinos }))
}

/**
 * Cuántos posts de hoy ya tuvieron su hora: la línea de «ahora» va después de ellos. Por el
 * instante y no por la hora escrita: `cuando` trae la zona del dueño, y el reloj del teléfono
 * puede estar en otra.
 */
export function dondeVaAhora(posts: readonly PostProgramado[], ahora: number): number {
  let i = 0
  while (i < posts.length && new Date(posts[i]!.cuando).getTime() <= ahora) i++
  return i
}

/**
 * La hora de ahora en la zona del dueño, «14:20», sacada de la zona que trae `cuando` y no de la
 * del teléfono, que puede ser otra. Sin un `cuando` del que sacarla, la del teléfono.
 */
export function horaDeAhora(ahora: number, cuando?: string): string {
  const zona = cuando?.match(/([+-])(\d{2}):(\d{2})$/)
  if (!zona) {
    const local = new Date(ahora)
    return `${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`
  }
  const minutos = (zona[1] === '-' ? -1 : 1) * (Number(zona[2]) * 60 + Number(zona[3]))
  return new Date(ahora + minutos * 60_000).toISOString().slice(11, 16)
}
