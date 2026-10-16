import { agruparPorDia } from './agrupar'
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

/** Cada destino que falló, del más reciente al más viejo: un corte que falló en dos redes son dos filas. */
export function seQuemo(posts: PostProgramado[]): Quemado[] {
  return posts
    .flatMap((post) => post.redes.filter((r) => r.estado === 'failed').map((destino) => ({ post, destino })))
    .sort((a, b) => b.post.cuando.localeCompare(a.post.cuando))
}

/** Los cortes de ayer que salieron en al menos una red. Cuenta cortes y no redes, como el panel. */
export function servidosAyer(posts: PostProgramado[], hoy: string): number {
  const ayer = sumarDias(hoy, -1)
  return posts.filter((p) => p.cuando.slice(0, 10) === ayer && p.redes.some((r) => r.estado === 'published')).length
}

/** «Ayer no salió nada.», «Ayer: 1 corte servido» o «Ayer: N cortes servidos», como el pie del panel. */
export function pieDeAyer(servidos: number): string {
  if (servidos === 0) return 'Ayer no salió nada.'
  return servidos === 1 ? 'Ayer: 1 corte servido' : `Ayer: ${servidos} cortes servidos`
}

/** La hora del corte, o el día y la hora si no es de hoy: «19:00» o «14 oct · 19:00». */
export function cuandoQuemado(cuando: string, hoy: string): string {
  const hora = cuando.slice(11, 16)
  if (cuando.slice(0, 10) === hoy) return hora
  return `${Number(cuando.slice(8, 10))} ${MESES[Number(cuando.slice(5, 7)) - 1]} · ${hora}`
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
