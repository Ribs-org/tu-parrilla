// «Qué te funciona»: que Los Números digan solos qué tema, qué estilo y qué formato anduvieron
// mejor en el período, sin tener que entrar a «Comparar por atributo» a buscarlo (#300). No
// hay estadística nueva: son las medianas de «Contra su cuenta» de `compararPor`, la misma
// cuenta de esa pantalla, y lo único que se agrega es cuándo alcanza para decir que uno gana.
// Puro, para los tests; lo usan el tablero y `GET /api/metrics/que-funciona`.

import { MIN_DE_SU_CUENTA } from './igual-edad'
import { formatoDeLaRed } from './mejores'
import { POCAS_PUBLICACIONES, compararPor, textoDeAtributo, type FilaComparada } from './pieza'
import type { PostRow } from './posts-kpis'
import type { Atributos } from './social/publish/atributos'
import { formatNumber } from './utils'

/**
 * Lo que se mira. `tema` y `estilo` son atributos del vocabulario recomendado de la API
 * (`api-llm.md`, 2b); `formato` es el tipo de post que da la red —Reel, Carrusel, Foto,
 * Video—, que es por lo que la guía pide no usar `formato` como atributo.
 */
export const DIMENSIONES = [
  { clave: 'tema', plural: 'temas', deLaRed: false },
  { clave: 'estilo', plural: 'estilos', deLaRed: false },
  { clave: 'formato', plural: 'formatos', deLaRed: true },
] as const

export type ClaveDimension = (typeof DIMENSIONES)[number]['clave']

/**
 * Cuántas veces lo normal tiene que sacar el mejor para decir que «anduvo mejor». Más cerca de
 * ×1, la diferencia entre dos medianas de diez publicaciones es la que se ve de un mes a otro
 * sin cambiar nada.
 */
export const PARA_DESTACAR = 1.2

/**
 * - `gana`: hay al menos dos valores con `POCAS_PUBLICACIONES` medidas, y el mejor saca
 *   `PARA_DESTACAR` o más y más que el segundo.
 * - `parejo`: hay con qué comparar, pero ninguno se sale de lo normal.
 * - `faltan`: hay valores, pero no dos con muestra suficiente.
 * - `sinValor`: nada de lo publicado lo lleva.
 */
export type Estado = 'gana' | 'parejo' | 'faltan' | 'sinValor'

export type Veredicto = {
  clave: ClaveDimension
  estado: Estado
  /** Los dos con muestra suficiente que más sacaron contra su cuenta, en `gana` y `parejo`. */
  primero: FilaComparada | null
  segundo: FilaComparada | null
  /** Cada valor del período (sin «sin valor»), del que tiene más publicaciones al que menos. */
  valores: FilaComparada[]
}

type Entrada = { fila: PostRow; atributos: Atributos | null }

function valorDe(clave: ClaveDimension, { fila, atributos }: Entrada): string | null {
  if (clave === 'formato') return formatoDeLaRed(fila.mediaType)
  const texto = textoDeAtributo(atributos?.[clave])
  return texto === '—' ? null : texto
}

/**
 * El veredicto de cada dimensión. `relativos` es `contraSuCuenta` de todo lo del período,
 * como en «Comparar por atributo»: la vara de cada cuenta son todas sus publicaciones, no solo
 * las que llevan tema. La muestra que cuenta es la de las medidas —las que ya tienen su
 * lectura de los 7 días—, no la de todas: de las otras no se sabe cómo les fue.
 */
export function queFunciona(entradas: readonly Entrada[], relativos: ReadonlyMap<string, number>): Veredicto[] {
  return DIMENSIONES.map(({ clave }) => {
    const valores = compararPor(entradas, (e) => valorDe(clave, e), relativos).filter((v) => v.valor !== null)
    if (valores.length === 0) return { clave, estado: 'sinValor', primero: null, segundo: null, valores }

    const candidatos = valores
      .filter((v) => v.medidas >= POCAS_PUBLICACIONES && v.contraSuCuenta !== null)
      .sort((a, b) => b.contraSuCuenta! - a.contraSuCuenta! || b.medidas - a.medidas)
    if (candidatos.length < 2) return { clave, estado: 'faltan', primero: null, segundo: null, valores }

    const [primero, segundo] = candidatos as [FilaComparada, FilaComparada]
    const gana = primero.contraSuCuenta! >= PARA_DESTACAR && primero.contraSuCuenta! > segundo.contraSuCuenta!
    return { clave, estado: gana ? 'gana' : 'parejo', primero, segundo, valores }
  })
}

/** Un valor como lo devuelve la API: `medidas` es de cuántas sale `contraSuCuenta`. */
export type ValorApi = { valor: string; publicaciones: number; medidas: number; contraSuCuenta: number | null }

function valorApi(v: FilaComparada): ValorApi {
  return { valor: v.valor!, publicaciones: v.publicaciones, medidas: v.medidas, contraSuCuenta: v.contraSuCuenta }
}

/** La respuesta de `GET /api/metrics/que-funciona`, una clave por dimensión, con la frase del tablero. */
export function queFuncionaApi(
  entradas: readonly Entrada[],
  relativos: ReadonlyMap<string, number>,
): Record<
  ClaveDimension,
  { estado: Estado; frase: string; primero: ValorApi | null; segundo: ValorApi | null; valores: ValorApi[] }
> {
  // Una clave por cada una de `DIMENSIONES`, que `queFunciona` recorre entera.
  return Object.fromEntries(
    queFunciona(entradas, relativos).map((v) => [
      v.clave,
      {
        estado: v.estado,
        frase: fraseDe(v),
        primero: v.primero ? valorApi(v.primero) : null,
        segundo: v.segundo ? valorApi(v.segundo) : null,
        valores: v.valores.map(valorApi),
      },
    ]),
  ) as ReturnType<typeof queFuncionaApi>
}

/** «×2,1», «×0,85»: como en «Comparar por atributo». */
export function veces(valor: number): string {
  return `×${valor.toFixed(valor < 1 ? 2 : 1).replace('.', ',')}`
}

function publicaciones(n: number): string {
  return n === 1 ? '1 publicación' : `${formatNumber(n)} publicaciones`
}

/** Hasta tres valores con cuántas medidas tiene cada uno: «“recetas” 6, “humor” 3 y 2 más». */
function muestras(valores: FilaComparada[]): string {
  const orden = [...valores].sort((a, b) => b.medidas - a.medidas || b.publicaciones - a.publicaciones)
  const partes = orden.slice(0, 3).map((v) => `«${v.valor}» ${formatNumber(v.medidas)}`)
  const resto = orden.length - partes.length
  if (resto > 0) return `${partes.join(', ')} y ${resto} más`
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}` : partes[0]!
}

/** El veredicto dicho en una frase, la misma en el tablero y en la API. */
export function fraseDe(v: Veredicto): string {
  const dim = DIMENSIONES.find((d) => d.clave === v.clave)!
  const { primero, segundo } = v
  switch (v.estado) {
    case 'gana':
      return (
        `Lo de ${v.clave} «${primero!.valor}» tuvo ${veces(primero!.contraSuCuenta!)} las views normales de su ` +
        `cuenta a los 7 días (${publicaciones(primero!.medidas)}). Le sigue «${segundo!.valor}», con ` +
        `${veces(segundo!.contraSuCuenta!)} (${publicaciones(segundo!.medidas)}).`
      )
    case 'parejo':
      return (
        `Ningún ${v.clave} se sale de lo normal: el que mejor anduvo, «${primero!.valor}», tuvo ` +
        `${veces(primero!.contraSuCuenta!)} las views normales de su cuenta (${publicaciones(primero!.medidas)}), ` +
        `y «${segundo!.valor}», ${veces(segundo!.contraSuCuenta!)}.`
      )
    case 'faltan': {
      if (v.valores.length === 1) {
        return `Hay un solo ${v.clave} en el período, «${v.valores[0]!.valor}»: no hay con qué compararlo.`
      }
      if (v.valores.every((x) => x.medidas === 0)) {
        return (
          `Todavía no hay cómo medirlo: cada publicación se mide a los 7 días, contra lo normal de su ` +
          `cuenta, y una cuenta necesita al menos ${MIN_DE_SU_CUENTA} publicaciones medidas en el período.`
        )
      }
      return (
        `Todavía no alcanza para decirlo: hacen falta dos ${dim.plural} con al menos ${POCAS_PUBLICACIONES} ` +
        `publicaciones medidas a los 7 días cada uno. Hoy: ${muestras(v.valores.filter((x) => x.medidas > 0))}.`
      )
    }
    case 'sinValor':
      return dim.deLaRed
        ? 'Las redes no dieron el formato de nada de lo publicado en el período.'
        : `Nada de lo publicado en el período lleva «${v.clave}» en sus atributos.`
  }
}
