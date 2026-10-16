// La vista «Día» de La Parrilla: un solo día, en una columna por cuenta. Puro: la página
// trae las filas y esto decide en qué columna cae cada cosa, para poder probarlo sin base.

import type { ScheduledPost, ScheduledPostTarget } from '@/db/schema'
import { addDays, dayKey, dayLabelConMes } from '@/lib/schedule-week'

export type DestinoConHandle = ScheduledPostTarget & { handle: string | null }

type Item = {
  post: ScheduledPost
  targets: DestinoConHandle[]
  media: Array<{ blobUrl: string; mediaType: string }>
}

/** Una cuenta del dueño, como la lista Los Fierros. */
export type CuentaDelDia = { id: string; network: string; handle: string | null; connected: boolean }

/** Un destino de ese día, con el post del que sale y los demás destinos de ese post. */
export type CorteDelDia = {
  post: ScheduledPost
  destino: DestinoConHandle
  /** Los otros destinos del mismo post: «también sale en…». */
  otros: DestinoConHandle[]
  media: Item['media']
}

/** Un borrador con fecha en ese día, con las cuentas que tiene marcadas. */
export type BorradorDelDia = { id: string; href: string; fecha: Date; texto: string; cuentas: string[] }

export type Columna = {
  clave: string
  /** La cuenta de la columna; null en las dos columnas que no son de una cuenta viva. */
  cuenta: CuentaDelDia | null
  /** Sin cuenta, la red de los destinos cuya cuenta no está en la lista. */
  red: string | null
  cortes: CorteDelDia[]
  borradores: BorradorDelDia[]
}

/** La columna de los borradores que no tienen ninguna cuenta marcada. */
export const SIN_CUENTA = 'sin-cuenta'

/**
 * `?fecha=` como no la escribe nadie: viene de nuestros enlaces, pero una dirección editada a
 * mano tiene que caer en algún lado. Lo que no es un día de verdad —también el 31 de febrero,
 * que la cuenta en UTC correría en silencio— es hoy.
 */
export function normalizarFecha(param: string | undefined, now: Date, zone: string): string {
  if (param && /^\d{4}-\d{2}-\d{2}$/.test(param) && addDays(param, 0) === param) return param
  return dayKey(now, zone)
}

/** «Hoy · vie 16 de oct», «Mañana · …», «Ayer · …» o solo «vie 16 de oct». */
export function rotuloDelDia(dia: string, hoy: string): string {
  const base = dayLabelConMes(dia)
  if (dia === hoy) return `Hoy · ${base}`
  if (dia === addDays(hoy, 1)) return `Mañana · ${base}`
  if (dia === addDays(hoy, -1)) return `Ayer · ${base}`
  return base
}

/**
 * Las columnas del día, en el orden de Los Fierros (por red y por cuándo se conectó).
 *
 * - Cada cuenta conectada tiene la suya aunque ese día no tenga nada: ver los huecos de cada
 *   cuenta es la mitad de para qué sirve la vista. Una desconectada aparece solo si ese día
 *   tiene algo.
 * - Un post va en la columna de cada cuenta a la que sale: uno que sale a tres cuentas son
 *   tres tarjetas, cada una con el estado de su destino.
 * - Un destino cuya cuenta no está en la lista va al final, en una columna por red. No
 *   debería pasar —la base no deja borrar una cuenta con destinos—, pero un destino no se
 *   esconde por eso.
 * - Un borrador va en la columna de cada cuenta que tiene marcada; sin ninguna, en una
 *   columna propia al final (`SIN_CUENTA`).
 */
export function columnasDelDia({
  dia,
  cuentas,
  items,
  borradores,
  zone,
}: {
  dia: string
  cuentas: CuentaDelDia[]
  items: Item[]
  borradores: BorradorDelDia[]
  zone: string
}): Columna[] {
  const delDia = items
    .filter((item) => dayKey(item.post.scheduledAt, zone) === dia)
    .sort((a, b) => a.post.scheduledAt.getTime() - b.post.scheduledAt.getTime())
  const borradoresDelDia = borradores
    .filter((b) => dayKey(b.fecha, zone) === dia)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())

  const conocidas = new Map(cuentas.map((c) => [c.id, c]))
  const columnas = new Map<string, Columna>()
  const columna = (clave: string, cuenta: CuentaDelDia | null, red: string | null): Columna => {
    let col = columnas.get(clave)
    if (!col) {
      col = { clave, cuenta, red, cortes: [], borradores: [] }
      columnas.set(clave, col)
    }
    return col
  }

  for (const { post, targets, media } of delDia) {
    for (const destino of targets) {
      const cuenta = conocidas.get(destino.accountId)
      const col = cuenta ? columna(cuenta.id, cuenta, null) : columna(`red:${destino.network}`, null, destino.network)
      col.cortes.push({ post, destino, otros: targets.filter((t) => t.id !== destino.id), media })
    }
  }

  for (const b of borradoresDelDia) {
    const marcadas = b.cuentas.filter((id) => conocidas.has(id))
    if (marcadas.length === 0) columna(SIN_CUENTA, null, null).borradores.push(b)
    for (const id of marcadas) columna(id, conocidas.get(id)!, null).borradores.push(b)
  }

  const deCuentas = cuentas.flatMap((c) => {
    const col = columnas.get(c.id)
    if (col) return [col]
    return c.connected ? [{ clave: c.id, cuenta: c, red: null, cortes: [], borradores: [] }] : []
  })
  const sinCuenta = [...columnas.values()].filter((c) => c.cuenta === null)
  // Las de red primero y la de los borradores sin cuenta al último: es la que menos dice.
  sinCuenta.sort((a, b) => (a.clave === SIN_CUENTA ? 1 : b.clave === SIN_CUENTA ? -1 : a.clave.localeCompare(b.clave)))
  return [...deCuentas, ...sinCuenta]
}

/** Cuántos cortes tiene el día, sin contar dos veces el que sale a varias cuentas. */
export function cortesDelDia(columnas: Columna[]): number {
  return new Set(columnas.flatMap((c) => c.cortes.map((corte) => corte.post.id))).size
}
