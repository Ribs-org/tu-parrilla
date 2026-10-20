import type { PostProgramado } from './tipos'

// El filtro por red de La Parrilla en el teléfono, el mismo del panel
// (`src/app/admin/(dash)/schedule/filtro-red.ts`): por red y, en una red con varias cuentas,
// por cuenta. La cuenta es su red y su nombre en la red: la API del teléfono no manda el id de
// la cuenta de cada destino, y dos cuentas de una misma red no se llaman igual.

/** Lo elegido: una red entera, o una sola cuenta de esa red (su nombre; `''` si no tiene). */
export type Filtro = { red: string; cuenta: string | null }

type Destino = PostProgramado['redes'][number]

/** El orden de siempre, el de `SOCIAL_NETWORKS` del panel. */
const ORDEN = ['instagram', 'tiktok', 'youtube', 'facebook', 'threads', 'x']

export function cabeEnElFiltro(destino: Destino, filtro: Filtro): boolean {
  return destino.red === filtro.red && (filtro.cuenta === null || (destino.handle ?? '') === filtro.cuenta)
}

/**
 * Cada post con solo sus destinos del filtro, y fuera el que no tiene ninguno, como la semana y
 * el día del panel: con «Facebook», un post que sale a Instagram y a Facebook se dibuja según lo
 * de Facebook. Sin filtro, todos enteros.
 */
export function recortar(posts: readonly PostProgramado[], filtro: Filtro | null): PostProgramado[] {
  if (!filtro) return [...posts]
  return posts.flatMap((post) => {
    const redes = post.redes.filter((r) => cabeEnElFiltro(r, filtro))
    return redes.length > 0 ? [{ ...post, redes }] : []
  })
}

export type CuentaEnElFiltro = { cuenta: string; nombre: string | null; cuantos: number }
export type RedEnElFiltro = { red: string; cuantos: number; cuentas: CuentaEnElFiltro[] }

/**
 * Los botones del filtro: «Todas» y cada red con algo en lo que se mira, en el orden de siempre,
 * con cuántos posts salen a ella. Uno que sale a dos redes cuenta en las dos, y una vez en
 * «Todas»: cada número es lo que queda a la vista al apretar ese botón. Una red con dos cuentas o
 * más trae sus cuentas, que aparecen debajo al elegirla.
 */
export function opcionesDelFiltro(posts: readonly PostProgramado[]): { todas: number; redes: RedEnElFiltro[] } {
  const cuentasPorRed = new Map<string, Map<string, string | null>>()
  for (const post of posts) {
    for (const destino of post.redes) {
      const cuentas = cuentasPorRed.get(destino.red) ?? new Map<string, string | null>()
      cuentas.set(destino.handle ?? '', destino.handle)
      cuentasPorRed.set(destino.red, cuentas)
    }
  }
  const orden = (red: string) => (ORDEN.includes(red) ? ORDEN.indexOf(red) : ORDEN.length)
  const cuantosCon = (cabe: (d: Destino) => boolean) => posts.filter((post) => post.redes.some(cabe)).length
  return {
    todas: posts.length,
    redes: [...cuentasPorRed]
      .sort(([a], [b]) => orden(a) - orden(b) || a.localeCompare(b))
      .map(([red, cuentas]) => ({
        red,
        cuantos: cuantosCon((d) => d.red === red),
        cuentas:
          cuentas.size > 1
            ? [...cuentas].map(([cuenta, nombre]) => ({
                cuenta,
                nombre,
                cuantos: cuantosCon((d) => d.red === red && (d.handle ?? '') === cuenta),
              }))
            : [],
      })),
  }
}

/** Si hay algo que elegir: dos redes o más, o una sola con varias cuentas. */
export function hayQueFiltrar(redes: readonly RedEnElFiltro[]): boolean {
  return redes.length > 1 || redes.some((r) => r.cuentas.length > 1)
}
