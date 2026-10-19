// «Tu mejor 10 %» y «Tu peor 10 %»: de lo publicado en un período, las publicaciones que más
// (o menos) rindieron en una métrica, el corte para entrar, y qué tienen en común frente al
// resto. Puro, para que lo prueben los tests; lo usan la pantalla de Los Números y
// `GET /api/metrics/mejores`.

import { contraSuCuenta, esReciente } from './igual-edad'
import { networkLabel } from './networks'
import { medianaDe } from './parrilla'
import { CLAVE_PIEZA, textoDeAtributo } from './pieza'
import type { PostRow } from './posts-kpis'
import type { Atributos } from './social/publish/atributos'

export type Metrica =
  | 'contraSuCuenta'
  | 'viewsA7Dias'
  | 'viewsGanadas'
  | 'visitas'
  | 'clicks'
  | 'interacciones'
  | 'arrastre'

/** La tajada de arriba o la de abajo. */
export type Lado = 'mejor' | 'peor'

type DefinicionMetrica = {
  /** Su nombre en una cifra o en una columna: «Views ganadas». */
  nombre: string
  /** La opción del selector: «Por views ganadas». */
  opcion: string
  /** `relativos` es `contraSuCuenta` de lo que compite, por id de publicación. */
  valor: (fila: PostRow, relativos: ReadonlyMap<string, number>) => number | null
  /** Derivada de lo que da la red: YouTube no entra (`politica-youtube`). */
  sinYouTube: boolean
  /** Un conteo, un porcentaje, o cuántas veces lo normal de su cuenta. */
  formato: 'conteo' | 'porcentaje' | 'veces'
  /**
   * Se mide a la misma edad para todas. Lo de menos de 7 días no la tiene, así que el
   * interruptor de las recientes no le aplica.
   */
  igualEdad: boolean
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
 * lecturas de la red, y `getPostRows` ya se las anula a YouTube, igual que las views a los 7
 * días, de las que sale «contra su cuenta».
 */
export const METRICAS: Record<Metrica, DefinicionMetrica> = {
  contraSuCuenta: {
    nombre: 'Contra su cuenta',
    opcion: 'Contra su cuenta, a los 7 días',
    valor: (f, relativos) => relativos.get(f.id) ?? null,
    sinYouTube: true,
    formato: 'veces',
    igualEdad: true,
  },
  viewsA7Dias: {
    nombre: 'Views a los 7 días',
    opcion: 'Por views a los 7 días',
    valor: (f) => f.viewsA7Dias,
    sinYouTube: true,
    formato: 'conteo',
    igualEdad: true,
  },
  viewsGanadas: {
    nombre: 'Views ganadas',
    opcion: 'Por views ganadas',
    valor: (f) => f.viewsChange,
    sinYouTube: true,
    formato: 'conteo',
    igualEdad: false,
  },
  visitas: {
    nombre: 'Visitas a tu página',
    opcion: 'Por visitas a tu página',
    valor: (f) => f.visits,
    sinYouTube: false,
    formato: 'conteo',
    igualEdad: false,
  },
  clicks: {
    nombre: 'Clicks en tus links',
    opcion: 'Por clicks en tus links',
    valor: (f) => f.clicks,
    sinYouTube: false,
    formato: 'conteo',
    igualEdad: false,
  },
  interacciones: {
    nombre: 'Interacciones',
    opcion: 'Por interacciones',
    valor: interaccionesDe,
    sinYouTube: true,
    formato: 'conteo',
    igualEdad: false,
  },
  arrastre: {
    nombre: 'Arrastre',
    opcion: 'Por arrastre',
    valor: (f) => f.pull,
    sinYouTube: true,
    formato: 'porcentaje',
    igualEdad: false,
  },
}

export const ORDEN_METRICAS: readonly Metrica[] = [
  'contraSuCuenta',
  'viewsA7Dias',
  'viewsGanadas',
  'visitas',
  'clicks',
  'interacciones',
  'arrastre',
]

/**
 * La de la pantalla: a igual edad y contra su propia cuenta, para que mil publicaciones en
 * varias cuentas se puedan comparar sin que gane la más vieja ni la cuenta más grande.
 */
export const METRICA_POR_DEFECTO: Metrica = 'contraSuCuenta'

/** La de la API, la de siempre: cambiarla le movería la respuesta a quien ya la usa. */
export const METRICA_POR_DEFECTO_API: Metrica = 'viewsGanadas'

export const LADO_POR_DEFECTO: Lado = 'mejor'

/** Los porcentajes que ofrece la pantalla; la API acepta cualquier entero de 1 a 50. */
export const PERCENTILES: readonly number[] = [5, 10, 20, 25]
export const PERCENTIL_POR_DEFECTO = 10
export const PERCENTIL_MIN = 1
export const PERCENTIL_MAX = 50

export const METRICA_ERROR =
  'La métrica no se entendió (usa contraSuCuenta, viewsA7Dias, viewsGanadas, visitas, clicks, interacciones o arrastre).'
export const PERCENTIL_ERROR = 'El percentil tiene que ser un entero entre 1 y 50.'
export const LADO_ERROR = 'El lado no se entendió (usa mejor o peor).'
export const RECIENTES_ERROR = 'recientes va con si o no.'

/**
 * Con menos publicaciones que esto compitiendo, el mejor 10 % son una o dos: sirve para
 * mirarlas, no para sacar conclusiones. La pantalla y la API lo avisan.
 */
export const POCAS_PARA_CONCLUIR = 20

/** Con menos de esto en el grupo elegido, «qué tienen en común» no tiene con qué contar. */
export const MIN_MEJORES_PARA_COMPARAR = 3

export function esMetrica(valor: unknown): valor is Metrica {
  return typeof valor === 'string' && (ORDEN_METRICAS as readonly string[]).includes(valor)
}

export function esLado(valor: unknown): valor is Lado {
  return valor === 'mejor' || valor === 'peor'
}

/** El porcentaje pedido, si es un entero entre 1 y 50; si no, null. */
export function leerPercentil(valor: string | null | undefined): number | null {
  if (valor === null || valor === undefined || !/^\d{1,2}$/.test(valor)) return null
  const n = Number(valor)
  return n >= PERCENTIL_MIN && n <= PERCENTIL_MAX ? n : null
}

export type Entrada = { fila: PostRow; atributos: Atributos | null }

export type Medianas = {
  contraSuCuenta: number | null
  viewsA7Dias: number | null
  viewsGanadas: number | null
  visitas: number | null
  interacciones: number | null
  arrastre: number | null
}

export type Rasgo = {
  /** Qué se mira: un atributo por su clave, o «red», «formato», «día» u «hora». */
  rasgo: string
  valor: string
  /** En cuántas del grupo elegido está, de cuántas tiene el grupo. */
  enElGrupo: number
  grupo: number
  enTodas: number
  todas: number
  /** Cuántas veces más frecuente es en el grupo elegido que entre todas las que compiten. */
  veces: number
}

export type Opciones = {
  lado?: Lado
  /**
   * Si compiten las que tenían menos de 7 días al `cierre`. Solo en las métricas que no son a
   * igual edad; por omisión sí, que es como la API respondió siempre.
   */
  conRecientes?: boolean
  /** Cuándo cierra el período (`cierreDe`); hace falta si `conRecientes` es false. */
  cierre?: Date
}

export type Resultado = {
  metrica: Metrica
  lado: Lado
  percentil: number
  /** Todo lo publicado en el período que se le pasó, compita o no. */
  publicaciones: number
  /** Las que tienen la métrica (y, en el arrastre, pasan el piso de views). */
  compiten: number
  /** Las que habrían competido pero tenían menos de 7 días al cierre (con `conRecientes` en false). */
  fueraPorRecientes: number
  /**
   * El valor de la última que entra: lo mínimo para entrar arriba, lo máximo para entrar
   * abajo. Null si ninguna entra.
   */
  corte: number | null
  grupo: Array<Entrada & { puesto: number; valor: number }>
  medianas: { grupo: Medianas; resto: Medianas }
  /** La mediana del grupo elegido sobre la del resto, en la métrica elegida. */
  rinden: number | null
  enComun: Rasgo[]
}

function medianasDe(entradas: Entrada[], relativos: ReadonlyMap<string, number>): Medianas {
  const de = (pick: (f: PostRow) => number | null) =>
    medianaDe(entradas.map((e) => pick(e.fila)).filter((v): v is number => v !== null))
  return {
    contraSuCuenta: de((f) => relativos.get(f.id) ?? null),
    viewsA7Dias: de((f) => f.viewsA7Dias),
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

/** Los rasgos de una publicación que se pueden repetir entre las del grupo. */
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
 * Lo que se repite más en el grupo elegido que entre todas las que compiten: el valor tiene
 * que estar en al menos dos del grupo y ser al menos 1,5 veces más frecuente ahí. Con menos
 * de tres en el grupo no hay con qué contar y la lista sale vacía.
 */
export function enComun(grupo: Entrada[], todas: Entrada[], zona: string): Rasgo[] {
  if (grupo.length < MIN_MEJORES_PARA_COMPARAR) return []
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
  const delGrupo = contar(grupo)
  const total = contar(todas)
  const rasgos: Rasgo[] = []
  for (const [llave, { rasgo, valor, n }] of delGrupo) {
    const enTodas = total.get(llave)?.n ?? n
    const veces = n / grupo.length / (enTodas / todas.length)
    if (n >= 2 && veces >= 1.5) {
      rasgos.push({ rasgo, valor, enElGrupo: n, grupo: grupo.length, enTodas, todas: todas.length, veces })
    }
  }
  return rasgos
    .sort((a, b) => b.veces - a.veces || b.enElGrupo - a.enElGrupo || a.rasgo.localeCompare(b.rasgo))
    .slice(0, 8)
}

/**
 * El mejor (o el peor) `percentil` % en `metrica`. Entran las primeras `ceil(n × percentil /
 * 100)` (al menos una) y todas las empatadas con la última. Arriba nunca entra una con cero,
 * que no rindió nada; abajo sí, que es justamente lo que se busca. Un null es «no se sabe» y
 * no compite: YouTube en lo derivado, un post cuyo link nunca se pegó en las visitas, uno sin
 * su lectura de los 7 días.
 *
 * Con `conRecientes: false`, en las métricas que no son a igual edad tampoco compite lo que
 * tenía menos de 7 días al cierre: casi no tuvo tiempo de sumar, y abajo llenaría la tajada.
 */
export function tajada(
  entradas: Entrada[],
  metrica: Metrica,
  percentil: number,
  zona: string,
  opciones: Opciones = {},
): Resultado {
  const def = METRICAS[metrica]
  const lado = opciones.lado ?? LADO_POR_DEFECTO
  const sinRecientes = !def.igualEdad && opciones.conRecientes === false
  const cierre = opciones.cierre ?? new Date()

  const relativos = contraSuCuenta(entradas.map((e) => e.fila))
  const conValor = entradas
    .map((e) => ({ ...e, valor: def.valor(e.fila, relativos) }))
    .filter((e): e is Entrada & { valor: number } => e.valor !== null)
  const vigente = (e: Entrada) => !sinRecientes || !esReciente(e.fila.publishedAt, cierre)
  const pozo = conValor.filter(vigente)
  // El piso, sobre lo que de verdad compite: con las recientes fuera, sus pocas views no lo bajan.
  const piso = metrica === 'arrastre' ? pisoDeArrastre(entradas.filter(vigente)) : null
  const compiten = pozo
    .filter((e) => piso === null || (e.fila.viewsChange ?? 0) >= piso)
    .sort(
      (a, b) =>
        (lado === 'mejor' ? b.valor - a.valor : a.valor - b.valor) ||
        b.fila.publishedAt.getTime() - a.fila.publishedAt.getTime(),
    )

  const cuantas = Math.max(1, Math.ceil((compiten.length * percentil) / 100))
  const ultima = compiten[cuantas - 1]
  const corte = !ultima ? null : lado === 'mejor' && ultima.valor <= 0 ? null : ultima.valor
  const grupo =
    corte === null ? [] : compiten.filter((e) => (lado === 'mejor' ? e.valor >= corte : e.valor <= corte))
  const resto = compiten.slice(grupo.length)

  const medianaGrupo = medianaDe(grupo.map((e) => e.valor))
  const medianaResto = medianaDe(resto.map((e) => e.valor))

  return {
    metrica,
    lado,
    percentil,
    publicaciones: entradas.length,
    compiten: compiten.length,
    fueraPorRecientes: conValor.length - pozo.length,
    corte,
    grupo: grupo.map((e, i) => ({ fila: e.fila, atributos: e.atributos, valor: e.valor, puesto: i + 1 })),
    medianas: { grupo: medianasDe(grupo, relativos), resto: medianasDe(resto, relativos) },
    rinden: medianaGrupo !== null && medianaResto !== null && medianaResto > 0 ? medianaGrupo / medianaResto : null,
    enComun: enComun(grupo, compiten, zona),
  }
}
