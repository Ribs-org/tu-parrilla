// «Tu mejor 10 %»: de lo publicado en un período, las publicaciones que más rindieron en una
// métrica, el corte para entrar, y qué tienen en común frente al resto. Puro, para que lo
// prueben los tests; lo usan la pantalla de Los Números y `GET /api/metrics/mejores`.

import { networkLabel } from './networks'
import { medianaDe } from './parrilla'
import { CLAVE_PIEZA, textoDeAtributo } from './pieza'
import type { PostRow } from './posts-kpis'
import type { Atributos } from './social/publish/atributos'

export type Metrica = 'viewsGanadas' | 'visitas' | 'clicks' | 'interacciones' | 'arrastre'

type DefinicionMetrica = {
  nombre: string
  valor: (fila: PostRow) => number | null
  /** Derivada de lo que da la red: YouTube no entra (`politica-youtube`). */
  sinYouTube: boolean
  /** Formato del valor: un conteo o un porcentaje. */
  porcentaje: boolean
}

/**
 * Lo ganado en likes, comentarios y compartidos dentro del período, sumando lo que se sabe.
 * Null si la red no informó ninguno de los tres: no se sabe no es cero.
 */
export function interaccionesDe(fila: PostRow): number | null {
  const partes = [fila.likesChange, fila.commentsChange, fila.sharesChange].filter((v): v is number => v !== null)
  return partes.length === 0 ? null : partes.reduce((a, b) => a + b, 0)
}

/**
 * Las métricas por las que se puede ordenar. Las visitas y los clicks los mide Tu Parrilla,
 * así que YouTube compite; lo ganado, las interacciones y el arrastre salen de restar
 * lecturas de la red, y `getPostRows` ya se las anula a YouTube.
 */
export const METRICAS: Record<Metrica, DefinicionMetrica> = {
  viewsGanadas: { nombre: 'Views ganadas', valor: (f) => f.viewsChange, sinYouTube: true, porcentaje: false },
  visitas: { nombre: 'Visitas a tu página', valor: (f) => f.visits, sinYouTube: false, porcentaje: false },
  clicks: { nombre: 'Clicks en tus links', valor: (f) => f.clicks, sinYouTube: false, porcentaje: false },
  interacciones: { nombre: 'Interacciones', valor: interaccionesDe, sinYouTube: true, porcentaje: false },
  arrastre: { nombre: 'Arrastre', valor: (f) => f.pull, sinYouTube: true, porcentaje: true },
}

export const ORDEN_METRICAS: readonly Metrica[] = ['viewsGanadas', 'visitas', 'clicks', 'interacciones', 'arrastre']
export const METRICA_POR_DEFECTO: Metrica = 'viewsGanadas'

/** Los porcentajes que ofrece la pantalla; la API acepta cualquier entero de 1 a 50. */
export const PERCENTILES: readonly number[] = [5, 10, 20, 25]
export const PERCENTIL_POR_DEFECTO = 10
export const PERCENTIL_MIN = 1
export const PERCENTIL_MAX = 50

export const METRICA_ERROR = 'La métrica no se entendió (usa viewsGanadas, visitas, clicks, interacciones o arrastre).'
export const PERCENTIL_ERROR = 'El percentil tiene que ser un entero entre 1 y 50.'

/**
 * Con menos publicaciones que esto compitiendo, el mejor 10 % son una o dos: sirve para
 * mirarlas, no para sacar conclusiones. La pantalla y la API lo avisan.
 */
export const POCAS_PARA_CONCLUIR = 20

/** Con menos de esto en el grupo de arriba, «qué tienen en común» no tiene con qué contar. */
export const MIN_MEJORES_PARA_COMPARAR = 3

export function esMetrica(valor: unknown): valor is Metrica {
  return typeof valor === 'string' && (ORDEN_METRICAS as readonly string[]).includes(valor)
}

/** El porcentaje pedido, si es un entero entre 1 y 50; si no, null. */
export function leerPercentil(valor: string | null | undefined): number | null {
  if (valor === null || valor === undefined || !/^\d{1,2}$/.test(valor)) return null
  const n = Number(valor)
  return n >= PERCENTIL_MIN && n <= PERCENTIL_MAX ? n : null
}

export type Entrada = { fila: PostRow; atributos: Atributos | null }

export type Medianas = {
  viewsGanadas: number | null
  visitas: number | null
  interacciones: number | null
  arrastre: number | null
}

export type Rasgo = {
  /** Qué se mira: un atributo por su clave, o «red», «formato», «día» u «hora». */
  rasgo: string
  valor: string
  enMejores: number
  mejores: number
  enTodas: number
  todas: number
  /** Cuántas veces más frecuente es en el grupo de arriba que entre todas las que compiten. */
  veces: number
}

export type Resultado = {
  metrica: Metrica
  percentil: number
  /** Todo lo publicado en el período que se le pasó, compita o no. */
  publicaciones: number
  /** Las que tienen la métrica (y, en el arrastre, pasan el piso de views). */
  compiten: number
  /** El valor de la última que entra; null si ninguna entra. */
  corte: number | null
  mejores: Array<Entrada & { puesto: number; valor: number }>
  medianas: { mejores: Medianas; resto: Medianas }
  /** La mediana del grupo de arriba sobre la del resto, en la métrica elegida. */
  rinden: number | null
  enComun: Rasgo[]
}

function medianasDe(entradas: Entrada[]): Medianas {
  const de = (pick: (f: PostRow) => number | null) =>
    medianaDe(entradas.map((e) => pick(e.fila)).filter((v): v is number => v !== null))
  return {
    viewsGanadas: de((f) => f.viewsChange),
    visitas: de((f) => f.visits),
    interacciones: de(interaccionesDe),
    arrastre: de((f) => f.pull),
  }
}

/**
 * El arrastre de un post chico es casualidad: con 30 views, una visita ya es un 3 %. Por
 * eso en el arrastre solo compite lo que ganó al menos la mediana de views de lo que ganó
 * algo en el período.
 */
export function pisoDeArrastre(entradas: Entrada[]): number | null {
  return medianaDe(entradas.map((e) => e.fila.viewsChange).filter((v): v is number => v !== null && v > 0))
}

const FORMATOS: Record<string, string> = {
  reel: 'Reel',
  video: 'Video',
  short: 'Short',
  image: 'Foto',
  carousel: 'Carrusel',
  link: 'Enlace',
}

const FRANJAS = [
  { hasta: 6, nombre: 'madrugada (0 a 6)' },
  { hasta: 12, nombre: 'mañana (6 a 12)' },
  { hasta: 18, nombre: 'tarde (12 a 18)' },
  { hasta: 24, nombre: 'noche (18 a 24)' },
]

const DIA = new Map<string, Intl.DateTimeFormat>()
const HORA = new Map<string, Intl.DateTimeFormat>()

function formateador(cache: Map<string, Intl.DateTimeFormat>, zona: string, opciones: Intl.DateTimeFormatOptions) {
  let f = cache.get(zona)
  if (!f) {
    f = new Intl.DateTimeFormat('es', { ...opciones, timeZone: zona })
    cache.set(zona, f)
  }
  return f
}

/** Los rasgos de una publicación que se pueden repetir entre las mejores. */
export function rasgosDe(entrada: Entrada, zona: string): Array<{ rasgo: string; valor: string }> {
  const { fila, atributos } = entrada
  const rasgos: Array<{ rasgo: string; valor: string }> = []
  for (const [clave, valor] of Object.entries(atributos ?? {})) {
    // La pieza junta versiones de un mismo video: que dos de las mejores compartan pieza
    // dice que el video anduvo bien, no qué lo hizo andar.
    if (clave === CLAVE_PIEZA) continue
    const texto = textoDeAtributo(valor)
    if (texto !== '—') rasgos.push({ rasgo: clave, valor: texto })
  }
  rasgos.push({ rasgo: 'red', valor: networkLabel(fila.network) })
  if (fila.mediaType) rasgos.push({ rasgo: 'formato', valor: FORMATOS[fila.mediaType] ?? fila.mediaType })
  rasgos.push({ rasgo: 'día', valor: formateador(DIA, zona, { weekday: 'long' }).format(fila.publishedAt) })
  const hora = Number(formateador(HORA, zona, { hour: '2-digit', hourCycle: 'h23' }).format(fila.publishedAt))
  rasgos.push({ rasgo: 'hora', valor: FRANJAS.find((f) => hora < f.hasta)!.nombre })
  return rasgos
}

/**
 * Lo que se repite más entre las mejores que entre todas las que compiten: el valor tiene
 * que estar en al menos dos de las de arriba y ser al menos 1,5 veces más frecuente ahí.
 * Con menos de tres arriba no hay con qué contar y la lista sale vacía.
 */
export function enComun(mejores: Entrada[], todas: Entrada[], zona: string): Rasgo[] {
  if (mejores.length < MIN_MEJORES_PARA_COMPARAR) return []
  const contar = (entradas: Entrada[]) => {
    const cuenta = new Map<string, { rasgo: string; valor: string; n: number }>()
    for (const entrada of entradas) {
      // Un rasgo cuenta una vez por publicación.
      const vistos = new Set<string>()
      for (const r of rasgosDe(entrada, zona)) {
        const llave = `${r.rasgo}\u0000${r.valor}`
        if (vistos.has(llave)) continue
        vistos.add(llave)
        const actual = cuenta.get(llave) ?? { ...r, n: 0 }
        actual.n += 1
        cuenta.set(llave, actual)
      }
    }
    return cuenta
  }
  const arriba = contar(mejores)
  const total = contar(todas)
  const rasgos: Rasgo[] = []
  for (const [llave, { rasgo, valor, n }] of arriba) {
    const enTodas = total.get(llave)?.n ?? n
    const veces = n / mejores.length / (enTodas / todas.length)
    if (n >= 2 && veces >= 1.5) {
      rasgos.push({ rasgo, valor, enMejores: n, mejores: mejores.length, enTodas, todas: todas.length, veces })
    }
  }
  return rasgos
    .sort((a, b) => b.veces - a.veces || b.enMejores - a.enMejores || a.rasgo.localeCompare(b.rasgo))
    .slice(0, 8)
}

/**
 * El mejor `percentil` % en `metrica`. Entran las primeras `ceil(n × percentil / 100)` (al
 * menos una) y todas las empatadas con la última; nunca una con cero, que no rindió nada.
 * Un null es «no se sabe» y no compite: YouTube en lo derivado, un post cuyo link nunca se
 * pegó en las visitas.
 */
export function mejores(entradas: Entrada[], metrica: Metrica, percentil: number, zona: string): Resultado {
  const def = METRICAS[metrica]
  const piso = metrica === 'arrastre' ? pisoDeArrastre(entradas) : null
  const compiten = entradas
    .map((e) => ({ ...e, valor: def.valor(e.fila) }))
    .filter((e): e is Entrada & { valor: number } => e.valor !== null)
    .filter((e) => piso === null || (e.fila.viewsChange ?? 0) >= piso)
    .sort((a, b) => b.valor - a.valor || b.fila.publishedAt.getTime() - a.fila.publishedAt.getTime())

  const cuantas = Math.max(1, Math.ceil((compiten.length * percentil) / 100))
  const ultima = compiten[cuantas - 1]
  const corte = ultima && ultima.valor > 0 ? ultima.valor : null
  const arriba = corte === null ? [] : compiten.filter((e) => e.valor >= corte)
  const resto = compiten.slice(arriba.length)

  const medianaArriba = medianaDe(arriba.map((e) => e.valor))
  const medianaResto = medianaDe(resto.map((e) => e.valor))

  return {
    metrica,
    percentil,
    publicaciones: entradas.length,
    compiten: compiten.length,
    corte,
    mejores: arriba.map((e, i) => ({ fila: e.fila, atributos: e.atributos, valor: e.valor, puesto: i + 1 })),
    medianas: { mejores: medianasDe(arriba), resto: medianasDe(resto) },
    rinden: medianaArriba !== null && medianaResto !== null && medianaResto > 0 ? medianaArriba / medianaResto : null,
    enComun: enComun(arriba, compiten, zona),
  }
}
