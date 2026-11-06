// «Qué te funciona»: que Los Números digan solos qué tema, qué estilo y qué formato anduvieron
// mejor en el período, sin tener que entrar a «Comparar por atributo» a buscarlo (#300). No
// hay estadística nueva: son las medianas de «Contra su cuenta» de `compararPor`, la misma
// cuenta de esa pantalla, y lo único que se agrega es cuándo alcanza para decir que uno gana.
// Desde el 2026-11-06 mira también la música: con música contra sin música, dentro de cada red
// y formato (`queFuncionaLaMusica`, al final). Puro, para los tests; lo usan el tablero y
// `GET /api/metrics/que-funciona`.

import { MIN_DE_SU_CUENTA } from './igual-edad'
import { formatoDeLaRed } from './mejores'
import { networkLabel } from './networks'
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

/**
 * `publicado` es cómo salió desde Tu Parrilla (`publicadosDesdeTuParrilla`); sin él, la
 * publicación se subió directo en la red, y de la música no se sabe.
 */
type Entrada = { fila: PostRow; atributos: Atributos | null; publicado?: Publicado | null }

/** Los que tienen la muestra mínima medida, del que más sacó contra su cuenta al que menos. */
function candidatosDe(valores: readonly FilaComparada[]): FilaComparada[] {
  return valores
    .filter((v) => v.medidas >= POCAS_PUBLICACIONES && v.contraSuCuenta !== null)
    .sort((a, b) => b.contraSuCuenta! - a.contraSuCuenta! || b.medidas - a.medidas)
}

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

    const candidatos = candidatosDe(valores)
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

type DimensionApi = {
  estado: Estado
  frase: string
  primero: ValorApi | null
  segundo: ValorApi | null
  valores: ValorApi[]
}

/** La música en la API: el veredicto de cada red y formato donde algo la llevó. */
export type MusicaApi = {
  estado: Estado
  frase: string
  /** Lo que no salió desde Tu Parrilla (o salió a la bandeja de TikTok): no se sabe y no entra. */
  sinSaber: number
  grupos: Array<DimensionApi & { red: string; formato: string; canciones: ValorApi[] }>
}

/**
 * La respuesta de `GET /api/metrics/que-funciona`: una clave por dimensión y `musica`, cada
 * una con la frase del tablero.
 */
export function queFuncionaApi(
  entradas: readonly Entrada[],
  relativos: ReadonlyMap<string, number>,
): Record<ClaveDimension, DimensionApi> & { musica: MusicaApi } {
  // Una clave por cada una de `DIMENSIONES`, que `queFunciona` recorre entera.
  const dimensiones = Object.fromEntries(
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
  ) as Record<ClaveDimension, DimensionApi>

  const musica = queFuncionaLaMusica(entradas, relativos)
  return {
    ...dimensiones,
    musica: {
      estado: musica.estado,
      frase: fraseDeMusica(musica),
      sinSaber: musica.sinSaber,
      grupos: musica.grupos.map((g) => ({
        red: g.red,
        formato: g.formato,
        estado: g.estado,
        frase: fraseDeGrupo(g),
        primero: g.primero ? valorApi(g.primero) : null,
        segundo: g.segundo ? valorApi(g.segundo) : null,
        valores: g.valores.map(valorApi),
        canciones: g.canciones.map(valorApi),
      })),
    },
  }
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

/* ---------------------------------------------------------------------- música -- */

/**
 * Cómo salió una publicación desde Tu Parrilla, para saber si llevó música: las opciones que
 * se guardaron para su destino (`scheduled_post_targets.opciones`) y si el post iba solo en
 * fotos —sin video, ni uno que ya se liberó del almacén (`videosLiberados`)—. TikTok da todo
 * como «Video», así que que fueran fotos lo sabe el post, no la red.
 */
export type Publicado = { opciones: unknown; soloFotos: boolean }

export type Musica = 'con' | 'sin'

/** Cómo se llama cada lado en pantalla y en la API (`valor`). */
export const CON_MUSICA = 'con música'
export const SIN_MUSICA = 'sin música'

function claveMusica(opciones: unknown): unknown {
  return typeof opciones === 'object' && opciones !== null ? (opciones as Record<string, unknown>).musica : undefined
}

/**
 * Si una publicación llevó la música que Tu Parrilla le pide a la red al publicar, o null si
 * no se sabe. Cuenta la clave `musica` de las opciones encendida con cualquier forma: `true`
 * en las fotos de TikTok (`OpcionesTikTok`), o un objeto con la canción en una red que la
 * guarde. Lo que ya suena en el video no es esto, y no se ve.
 *
 * - Sin `publicado`: se subió directo en la red. No se sabe, y no es «sin música».
 * - TikTok a la bandeja (`modo: 'borrador'`): la persona lo terminó en la app, donde pudo
 *   ponerle música. Tampoco se sabe.
 * - TikTok en video: la música de TikTok solo viaja con fotos (`cuerpoInit`); guardada en un
 *   video no se mandó, así que es «sin».
 */
export function musicaDe(network: string, publicado: Publicado | null | undefined): Musica | null {
  if (!publicado) return null
  const { opciones, soloFotos } = publicado
  const encendida = Boolean(claveMusica(opciones))
  if (network === 'tiktok') {
    if (typeof opciones === 'object' && opciones !== null && (opciones as { modo?: unknown }).modo === 'borrador') {
      return null
    }
    return encendida && soloFotos ? 'con' : 'sin'
  }
  return encendida ? 'con' : 'sin'
}

/** El título de la canción, si la red lo guardó (`musica: { titulo }`); las fotos de TikTok no lo traen. */
export function cancionDe(publicado: Publicado | null | undefined): string | null {
  const musica = claveMusica(publicado?.opciones)
  if (typeof musica !== 'object' || musica === null) return null
  const titulo = (musica as { titulo?: unknown }).titulo
  return typeof titulo === 'string' && titulo.trim() !== '' ? titulo.trim() : null
}

/** El formato con que se compara la música: el de la red, salvo las fotos de TikTok, que lo da el post. */
function formatoParaLaMusica(fila: PostRow, publicado: Publicado): string | null {
  if (fila.network === 'tiktok' && publicado.soloFotos) return 'Foto'
  return formatoDeLaRed(fila.mediaType)
}

export type GrupoMusica = {
  red: string
  /** Como en «Formato»: «Foto», «Reel»… */
  formato: string
  estado: Exclude<Estado, 'sinValor'>
  /** El lado que más sacó y el otro, en `gana` y `parejo`. */
  primero: FilaComparada | null
  segundo: FilaComparada | null
  /** «con música» y, si hay, «sin música», con sus medianas. */
  valores: FilaComparada[]
  /** Las canciones de lo que llevó música, si la red da el título; sin veredicto. */
  canciones: FilaComparada[]
}

export type VeredictoMusica = {
  /** `gana` si en algún grupo gana un lado; si no, `parejo` si alguno lo está; `sinValor` sin grupos. */
  estado: Estado
  grupos: GrupoMusica[]
  /** De cuántas no se sabe: subidas directo en la red, o a la bandeja de TikTok. */
  sinSaber: number
}

/**
 * Con música contra sin música, dentro de cada red y formato donde algo llevó música: las
 * fotos de TikTok con las fotos de TikTok, porque un video de TikTok no puede llevarla y
 * compararlo sería comparar formatos. La vara es la de las demás dimensiones (`relativos`, lo
 * normal de cada cuenta en el período), y la muestra mínima también: cada lado con
 * `POCAS_PUBLICACIONES` medidas. Como son solo dos lados, uno gana si saca `PARA_DESTACAR`
 * veces lo del otro, no lo normal de la cuenta: las fotos pueden andar todas bajo lo normal, y
 * aun así la música hacerles diferencia.
 */
export function queFuncionaLaMusica(
  entradas: readonly Entrada[],
  relativos: ReadonlyMap<string, number>,
): VeredictoMusica {
  type Marcada = { fila: PostRow; musica: Musica; cancion: string | null }
  const porGrupo = new Map<string, { red: string; formato: string; marcadas: Marcada[] }>()
  let sinSaber = 0
  for (const { fila, publicado } of entradas) {
    const musica = musicaDe(fila.network, publicado)
    if (musica === null || !publicado) {
      sinSaber += 1
      continue
    }
    const formato = formatoParaLaMusica(fila, publicado)
    if (formato === null) continue
    const llave = `${fila.network}\u0000${formato}`
    const grupo = porGrupo.get(llave) ?? { red: fila.network, formato, marcadas: [] }
    grupo.marcadas.push({ fila, musica, cancion: musica === 'con' ? cancionDe(publicado) : null })
    porGrupo.set(llave, grupo)
  }

  const grupos = [...porGrupo.values()]
    .filter((g) => g.marcadas.some((m) => m.musica === 'con'))
    .sort((a, b) => b.marcadas.length - a.marcadas.length || a.red.localeCompare(b.red))
    .map(({ red, formato, marcadas }): GrupoMusica => {
      const valores = compararPor(marcadas, (m) => (m.musica === 'con' ? CON_MUSICA : SIN_MUSICA), relativos)
      const canciones = compararPor(
        marcadas.filter((m) => m.cancion !== null),
        (m) => m.cancion,
        relativos,
      )
      const candidatos = candidatosDe(valores)
      if (candidatos.length < 2) {
        return { red, formato, estado: 'faltan', primero: null, segundo: null, valores, canciones }
      }
      const [primero, segundo] = candidatos as [FilaComparada, FilaComparada]
      const gana =
        primero.contraSuCuenta! > segundo.contraSuCuenta! &&
        primero.contraSuCuenta! >= PARA_DESTACAR * segundo.contraSuCuenta!
      return { red, formato, estado: gana ? 'gana' : 'parejo', primero, segundo, valores, canciones }
    })

  const estado: Estado =
    grupos.length === 0
      ? 'sinValor'
      : grupos.some((g) => g.estado === 'gana')
        ? 'gana'
        : grupos.some((g) => g.estado === 'parejo')
          ? 'parejo'
          : 'faltan'
  return { estado, grupos, sinSaber }
}

const EN_PLURAL: Record<string, string> = {
  Foto: 'las fotos',
  Reel: 'los reels',
  Video: 'los videos',
  Short: 'los shorts',
  Carrusel: 'los carruseles',
  Enlace: 'los enlaces',
  Texto: 'los textos',
  Audio: 'los audios',
}

/** «las fotos de TikTok», «los reels de Instagram». */
function nombreDeGrupo({ red, formato }: { red: string; formato: string }): string {
  return `${EN_PLURAL[formato] ?? `las publicaciones de formato «${formato}»`} de ${networkLabel(red)}`
}

function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** El veredicto de un grupo en una frase, la misma en el tablero y en la API. */
export function fraseDeGrupo(g: GrupoMusica): string {
  const nombre = nombreDeGrupo(g)
  const { primero, segundo } = g
  switch (g.estado) {
    case 'gana':
      return (
        `${conMayuscula(nombre)} anduvieron mejor ${primero!.valor}: ${veces(primero!.contraSuCuenta!)} las ` +
        `views normales de su cuenta a los 7 días (${publicaciones(primero!.medidas)}), contra ` +
        `${veces(segundo!.contraSuCuenta!)} ${segundo!.valor} (${publicaciones(segundo!.medidas)}).`
      )
    case 'parejo':
      return (
        `En ${nombre} la música no marca diferencia: ${primero!.valor} tuvieron ` +
        `${veces(primero!.contraSuCuenta!)} las views normales de su cuenta a los 7 días ` +
        `(${publicaciones(primero!.medidas)}), y ${segundo!.valor}, ${veces(segundo!.contraSuCuenta!)} ` +
        `(${publicaciones(segundo!.medidas)}).`
      )
    case 'faltan': {
      const con = g.valores.find((v) => v.valor === CON_MUSICA)
      const sin = g.valores.find((v) => v.valor === SIN_MUSICA)
      if (!sin) return `En ${nombre}, todo lo publicado desde Tu Parrilla llevó música: no hay con qué compararlo.`
      if (g.valores.every((v) => v.medidas === 0)) {
        return (
          `En ${nombre} todavía no hay cómo medirlo: cada publicación se mide a los 7 días, contra lo normal ` +
          `de su cuenta, y una cuenta necesita al menos ${MIN_DE_SU_CUENTA} publicaciones medidas en el período.`
        )
      }
      return (
        `En ${nombre} todavía no alcanza para decirlo: hacen falta al menos ${POCAS_PUBLICACIONES} publicaciones ` +
        `medidas a los 7 días ${CON_MUSICA} y ${POCAS_PUBLICACIONES} ${SIN_MUSICA}. Hoy: ${CON_MUSICA} ` +
        `${formatNumber(con?.medidas ?? 0)} y ${SIN_MUSICA} ${formatNumber(sin.medidas)}.`
      )
    }
  }
}

/** La música en una frase: la de cada grupo, una tras otra, o por qué no hay ninguno. */
export function fraseDeMusica(v: VeredictoMusica): string {
  if (v.grupos.length === 0) {
    return 'Nada de lo publicado desde Tu Parrilla en el período llevó música de la red (como «Música de TikTok» en las fotos).'
  }
  return v.grupos.map(fraseDeGrupo).join(' ')
}
