// Las reglas de la pieza y de la comparación por atributo que no tocan la base: qué junta
// versiones, qué las distingue, y las medianas de cada valor. Puro, para que lo prueben
// los tests; las consultas viven en `piezas.ts`.

import type { PostRow } from './posts-kpis'
import { medianaDe } from './parrilla'
import type { Atributos } from './social/publish/atributos'
import { validarOpciones } from './social/publish/opciones'

/**
 * La única clave de los atributos que el panel interpreta: los posts programados con el
 * mismo valor son versiones de la misma pieza. Hace falta porque un post programado no
 * puede ir dos veces a la misma cuenta y tiene un solo juego de atributos: dos hooks del
 * mismo video, o el trial reel y el reel normal en una cuenta, son dos posts.
 */
export const CLAVE_PIEZA = 'pieza'

/** El valor de `pieza` en los atributos, o null si no hay (o está vacío). */
export function clavePieza(atributos: Atributos | null): string | null {
  const valor = atributos?.[CLAVE_PIEZA]
  if (typeof valor === 'boolean' || valor === undefined) return null
  const texto = String(valor).trim()
  return texto === '' ? null : texto
}

/** Si un destino salió como trial reel: la opción de Instagram, ya validada. */
export function esTrialReel(network: string, opciones: unknown): boolean {
  if (network !== 'instagram') return false
  const check = validarOpciones(network, opciones)
  return !('error' in check) && check.opciones !== null && 'trialReel' in check.opciones
}

/**
 * Un valor de atributo como se lee en pantalla: `true` → «sí», el texto sin espacios en
 * los bordes —«pregunta » y «pregunta» son el mismo valor, como en `clavePieza`—, y la
 * falta (o un texto vacío) como raya. Las mayúsculas cuentan: el vocabulario es de quien
 * etiqueta, y la guía de la API le pide mantenerlo estable.
 */
export function textoDeAtributo(valor: string | number | boolean | undefined): string {
  if (valor === undefined) return '—'
  if (typeof valor === 'boolean') return valor ? 'sí' : 'no'
  return String(valor).trim() || '—'
}

/**
 * Qué atributos comparten todas las versiones (se muestran una vez, arriba) y cuáles
 * cambian de una a otra (una columna cada uno). Un atributo que falta en una versión
 * cuenta como distinto: «sin hook» también es una diferencia. `pieza` no va en ninguna de
 * las dos: es lo que las junta, y ya está dicho.
 */
export function repartirAtributos(versiones: Array<{ atributos: Atributos | null }>): {
  comunes: Array<[string, string]>
  queCambian: string[]
} {
  if (versiones.length === 0) return { comunes: [], queCambian: [] }
  const claves = new Set<string>()
  for (const v of versiones) for (const clave of Object.keys(v.atributos ?? {})) claves.add(clave)
  claves.delete(CLAVE_PIEZA)

  const comunes: Array<[string, string]> = []
  const queCambian: string[] = []
  for (const clave of [...claves].sort()) {
    const valores = new Set(versiones.map((v) => textoDeAtributo(v.atributos?.[clave])))
    if (valores.size === 1 && !valores.has('—')) comunes.push([clave, [...valores][0]!])
    else queCambian.push(clave)
  }
  return { comunes, queCambian }
}

/**
 * El orden de las versiones: las que ya tienen números, de más a menos views; después las
 * que todavía no salieron o no trajeron nada, por fecha. Así la que ganó queda arriba.
 */
export function ordenarVersiones<V extends { fecha: Date | null; fila: PostRow | null }>(versiones: V[]): V[] {
  return [...versiones].sort((a, b) => {
    const va = a.fila?.views ?? null
    const vb = b.fila?.views ?? null
    if (va !== null && vb !== null) return vb - va
    if (va !== null) return -1
    if (vb !== null) return 1
    return (a.fecha?.getTime() ?? 0) - (b.fecha?.getTime() ?? 0)
  })
}

/* ------------------------------------------------------- comparar por atributo -- */

/** Con menos publicaciones que esto en un valor, la diferencia no dice mucho. */
export const POCAS_PUBLICACIONES = 10

export type FilaComparada = {
  /** El valor del atributo, o null para «sin este atributo». */
  valor: string | null
  publicaciones: number
  /** A igual edad y contra su propia cuenta (`igual-edad.ts`): ×1 es lo normal de cada cuenta. */
  contraSuCuenta: number | null
  viewsA7Dias: number | null
  viewsGanadas: number | null
  visitas: number | null
  arrastre: number | null
}

/**
 * Los atributos que aparecen en lo publicado, del más usado al menos usado. `pieza` va al
 * final: compararlo agrupa versiones de una misma pieza, que es otra pregunta.
 */
export function clavesDeAtributos(lista: Array<Atributos | null>): string[] {
  const usos = new Map<string, number>()
  for (const atributos of lista) {
    for (const clave of Object.keys(atributos ?? {})) usos.set(clave, (usos.get(clave) ?? 0) + 1)
  }
  return [...usos.entries()]
    .sort(([ca, a], [cb, b]) => {
      if ((ca === CLAVE_PIEZA) !== (cb === CLAVE_PIEZA)) return ca === CLAVE_PIEZA ? 1 : -1
      return b - a || ca.localeCompare(cb)
    })
    .map(([clave]) => clave)
}

/** El atributo que pide la URL si existe; si no, `hook`; si no, el más usado. */
export function claveElegida(pedida: string | undefined, claves: string[]): string | null {
  if (pedida && claves.includes(pedida)) return pedida
  if (claves.includes('hook')) return 'hook'
  return claves[0] ?? null
}

/**
 * Cada valor del atributo con sus medianas, del que tiene más publicaciones al que tiene
 * menos; «sin este atributo» al final, como vara. Una mediana solo cuenta a quien tiene
 * ese número: un null es «no se sabe», no un cero —por eso YouTube, que no tiene views
 * ganadas, views a los 7 días ni arrastre (`politica-youtube`), no entra en esas y sí en las
 * visitas—. `relativos` es `contraSuCuenta` de todo lo del período, por id de publicación: la
 * vara de cada cuenta son todas sus publicaciones, no solo las de un valor.
 */
export function compararPorAtributo(
  entradas: Array<{ atributos: Atributos | null; fila: PostRow }>,
  clave: string,
  relativos: ReadonlyMap<string, number> = new Map(),
): FilaComparada[] {
  const grupos = new Map<string | null, PostRow[]>()
  for (const { atributos, fila } of entradas) {
    const texto = textoDeAtributo(atributos?.[clave])
    const llave = texto === '—' ? null : texto
    const grupo = grupos.get(llave) ?? []
    grupo.push(fila)
    grupos.set(llave, grupo)
  }

  const medianaDeCampo = (filas: PostRow[], campo: (f: PostRow) => number | null) =>
    medianaDe(filas.map(campo).filter((v): v is number => v !== null))

  return [...grupos.entries()]
    .map(([valor, filas]) => ({
      valor,
      publicaciones: filas.length,
      contraSuCuenta: medianaDeCampo(filas, (f) => relativos.get(f.id) ?? null),
      viewsA7Dias: medianaDeCampo(filas, (f) => f.viewsA7Dias),
      viewsGanadas: medianaDeCampo(filas, (f) => f.viewsChange),
      visitas: medianaDeCampo(filas, (f) => f.visits),
      arrastre: medianaDeCampo(filas, (f) => f.pull),
    }))
    .sort((a, b) => {
      if ((a.valor === null) !== (b.valor === null)) return a.valor === null ? 1 : -1
      return b.publicaciones - a.publicaciones || (a.valor ?? '').localeCompare(b.valor ?? '')
    })
}
