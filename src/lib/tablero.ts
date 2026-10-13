// Las reglas de Los Números que no tocan la base: qué cuenta se eligió, qué secciones
// tienen sus «⋯ Más» abiertos, cuánto se ganó en seguidores, y cómo se arma la URL sin
// perder los filtros. Puro, para que lo prueben los tests.

/** Las dos mitades del tablero: lo que pasó en las redes y lo que pasó en tu página. */
export type Seccion = 'redes' | 'pagina'

const SECCIONES: readonly Seccion[] = ['redes', 'pagina']

/** Lo que viene de la URL: una clave puede repetirse (`?mas=redes&mas=pagina`). */
export type Params = Record<string, string | string[] | undefined>

function lista(valor: string | string[] | undefined): string[] {
  if (typeof valor === 'string') return [valor]
  return Array.isArray(valor) ? valor : []
}

/**
 * La cuenta que pide la URL (`?cuenta=<id>`), si es una de las del dueño. Un id ajeno o
 * inventado no filtra nada —es «Todas las cuentas»—, en vez de dejar el tablero vacío por
 * un enlace viejo.
 */
export function cuentaElegida<T extends { id: string }>(params: Params, cuentas: T[]): T | null {
  const pedida = lista(params.cuenta)[0]
  return cuentas.find((c) => c.id === pedida) ?? null
}

/** Qué secciones tienen abierto su «⋯ Más». */
export function seccionesAbiertas(params: Params): Set<Seccion> {
  return new Set(lista(params.mas).filter((m): m is Seccion => (SECCIONES as readonly string[]).includes(m)))
}

/** La lista de secciones abiertas después de abrir o cerrar una. */
export function alternarSeccion(params: Params, seccion: Seccion): string[] {
  const abiertas = seccionesAbiertas(params)
  if (abiertas.has(seccion)) abiertas.delete(seccion)
  else abiertas.add(seccion)
  return SECCIONES.filter((s) => abiertas.has(s))
}

/**
 * Los seguidores ganados entre las tarjetas que se ven: la suma de lo que se sabe. Una
 * tarjeta sin lectura previa —o de YouTube, que no deja calcularlo— no aporta un cero
 * inventado; si ninguna lo sabe, no se sabe (`null`, que se pinta «—»).
 */
export function seguidoresGanados(tarjetas: Array<{ followersChange: number | null }>): number | null {
  const conocidos = tarjetas.map((t) => t.followersChange).filter((c): c is number => c !== null)
  return conocidos.length === 0 ? null : conocidos.reduce((a, b) => a + b, 0)
}

/**
 * Rearma la URL de una pantalla de Los Números cambiando claves y acarreando el resto: el
 * período, la cuenta, la página, los bots. `null` borra la clave; una lista la repite.
 * `mensaje` —el desenlace de una vuelta de OAuth— nunca viaja.
 */
export function numerosHref(ruta: string, params: Params, cambios: Record<string, string | string[] | null>): string {
  const next = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (clave in cambios || clave === 'mensaje') continue
    for (const v of lista(valor)) next.append(clave, v)
  }
  for (const [clave, valor] of Object.entries(cambios)) {
    if (valor === null) continue
    for (const v of Array.isArray(valor) ? valor : [valor]) next.append(clave, v)
  }
  const query = next.toString()
  return query ? `${ruta}?${query}` : ruta
}
