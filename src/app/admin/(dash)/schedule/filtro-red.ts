// El filtro por red de La Parrilla: qué pide `?red=`, qué queda de cada corte con él y
// cuántos tiene cada red en lo que se está mirando. Puro: la página trae las filas y esto
// decide, para poder probarlo sin base.

import { SOCIAL_NETWORKS } from '@/db/schema'

/** Una cuenta del dueño, como la lista Los Fierros. */
export type CuentaDelFiltro = { id: string; network: string; handle: string | null }

/** Lo que pide la URL: una red entera, o una sola cuenta de esa red. */
export type Filtro = { red: string; cuenta: string | null }

type Destino = { accountId: string; network: string }

/**
 * `?red=` como venga. Una red en la que el dueño tiene alguna cuenta, o el id de una de sus
 * cuentas —el filtro por cuenta, que se elige al pasar el mouse por la red—. Cualquier otra
 * cosa (una red sin cuentas, un id que no es suyo, nada) es «Todas»: una dirección editada a
 * mano no deja la parrilla vacía sin decir por qué.
 */
export function filtroDeLaUrl(param: string, cuentas: readonly CuentaDelFiltro[]): Filtro | null {
  if (!param) return null
  const cuenta = cuentas.find((c) => c.id === param)
  if (cuenta) return { red: cuenta.network, cuenta: cuenta.id }
  return cuentas.some((c) => c.network === param) ? { red: param, cuenta: null } : null
}

export function cabeEnElFiltro(destino: Destino, filtro: Filtro): boolean {
  return filtro.cuenta ? destino.accountId === filtro.cuenta : destino.network === filtro.red
}

/**
 * Cada corte con solo sus destinos del filtro, y fuera el que no tiene ninguno. Es lo que
 * miran la semana y el día: con «Facebook», un post que sale a Instagram y a Facebook se
 * dibuja cocido según lo de Facebook, con una sola marca. Sin filtro, todos enteros.
 */
export function recortar<T extends { targets: readonly Destino[] }>(items: readonly T[], filtro: Filtro | null): T[] {
  if (!filtro) return [...items]
  return items.flatMap((item) => {
    const targets = item.targets.filter((t) => cabeEnElFiltro(t, filtro))
    return targets.length > 0 ? [{ ...item, targets }] : []
  })
}

/**
 * Los cortes con algún destino del filtro, pero enteros: la lista. Ahí se sube, se reprograma
 * y se borra el post completo, y esconderle una red a quien está por borrarlo de todas sería
 * engañarlo.
 */
export function conAlguno<T extends { targets: readonly Destino[] }>(items: readonly T[], filtro: Filtro | null): T[] {
  if (!filtro) return [...items]
  return items.filter((item) => item.targets.some((t) => cabeEnElFiltro(t, filtro)))
}

/**
 * Los borradores con alguna cuenta del filtro marcada. Uno sin ninguna marcada no es de
 * ninguna red: con un filtro puesto no aparece.
 */
export function borradoresDelFiltro<T extends { cuentas: readonly string[] }>(
  borradores: readonly T[],
  filtro: Filtro | null,
  cuentas: readonly CuentaDelFiltro[],
): T[] {
  if (!filtro) return [...borradores]
  const caben = new Set(
    cuentas.filter((c) => (filtro.cuenta ? c.id === filtro.cuenta : c.network === filtro.red)).map((c) => c.id),
  )
  return borradores.filter((b) => b.cuentas.some((id) => caben.has(id)))
}

export type CuentaEnElFiltro = { id: string; handle: string | null; cuantos: number }
export type RedEnElFiltro = { red: string; cuantos: number; cuentas: CuentaEnElFiltro[] }

/**
 * Los botones del filtro: «Todas» y cada red en la que el dueño tiene cuentas, en el orden de
 * siempre (Instagram, TikTok, YouTube, Facebook…), con cuántos cortes salen a ella en lo que
 * se mira —la semana, el día o la lista entera—. Un corte que sale a dos redes cuenta en las
 * dos, y una vez en «Todas»: cada número es lo que queda a la vista al apretar ese botón.
 *
 * Una red con dos cuentas o más trae sus cuentas, cada una con lo suyo: es el filtro por
 * cuenta, que no se ve hasta pasar el mouse por la red.
 */
export function opcionesDelFiltro(
  items: ReadonlyArray<{ targets: readonly Destino[] }>,
  cuentas: readonly CuentaDelFiltro[],
): { todas: number; redes: RedEnElFiltro[] } {
  const orden = (red: string) => {
    const i = (SOCIAL_NETWORKS as readonly string[]).indexOf(red)
    return i === -1 ? SOCIAL_NETWORKS.length : i
  }
  const redes = [...new Set(cuentas.map((c) => c.network))].sort((a, b) => orden(a) - orden(b) || a.localeCompare(b))
  const cuantosCon = (cabe: (d: Destino) => boolean) => items.filter((item) => item.targets.some(cabe)).length
  return {
    todas: items.length,
    redes: redes.map((red) => {
      const suyas = cuentas.filter((c) => c.network === red)
      return {
        red,
        cuantos: cuantosCon((d) => d.network === red),
        cuentas:
          suyas.length > 1
            ? suyas.map((c) => ({ id: c.id, handle: c.handle, cuantos: cuantosCon((d) => d.accountId === c.id) }))
            : [],
      }
    }),
  }
}

/**
 * Si hay algo que filtrar: dos redes o más, o una sola con varias cuentas. Con una sola
 * cuenta, el filtro sería un botón que no cambia nada.
 */
export function hayQueFiltrar(redes: readonly RedEnElFiltro[]): boolean {
  return redes.length > 1 || redes.some((r) => r.cuentas.length > 1)
}
