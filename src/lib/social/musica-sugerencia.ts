// «Sugiéreme una»: Parrilla propone UNA canción de la biblioteca de Instagram que le quede al
// post, y «Otra» saca una distinta sin repetir las ya mostradas.
//
// El modelo no inventa canciones: elige por id entre candidatas reales —lo que está sonando y,
// si el post tiene texto, lo que encuentran una o dos búsquedas que él mismo propone—, y lo que
// conteste que no sea una de ellas se descarta. Sin pasarela, o si el modelo no contesta algo
// usable, elige el azar entre las que están sonando: el botón funciona igual, con otra razón.
//
// Puro: la red y el modelo se los pasan (`lib/musica-instagram.ts` en el servidor, los tests).

import type { CancionInstagram } from './instagram-audio'

export type Sugerencia = {
  cancion: CancionInstagram
  /** Una línea en español, debajo de la canción. */
  razon: string
  /** Si la eligió el modelo; si no, el azar entre lo que está sonando. */
  conModelo: boolean
}

export type Candidata = CancionInstagram & { origen: string | null }

/** Le pide algo al modelo: instrucciones y pedido, el texto que contestó. */
export type PedirAlModelo = (instrucciones: string, pedido: string) => Promise<string>

export type DepsSugerencia = {
  /** Lo que está sonando (null) o una búsqueda. */
  buscar: (busqueda: string | null) => Promise<{ canciones: CancionInstagram[] } | { error: string }>
  /** null sin pasarela: entonces elige el azar. */
  pedirAlModelo: PedirAlModelo | null
  azar?: () => number
}

export const SIN_MAS_CANCIONES = 'Ya te mostré todas las que encontré para este post. Busca una por nombre.'
export const RAZON_SONANDO = 'Es de las que están sonando en Instagram estos días.'

/** Cuántas búsquedas propone el modelo como mucho, y cuán largas. */
export const MAX_BUSQUEDAS = 2
const LARGO_BUSQUEDA = 60
/** Cuántas candidatas ve el modelo: más no elige mejor y cuesta más. */
const MAX_CANDIDATAS = 40
const LARGO_RAZON = 160
const LARGO_TEXTO = 1500

/** El primer objeto JSON de un texto, aunque venga entre comillas de código o con una frase antes. */
function primerObjeto(texto: string): Record<string, unknown> | null {
  const inicio = texto.indexOf('{')
  const fin = texto.lastIndexOf('}')
  if (inicio < 0 || fin <= inicio) return null
  try {
    const valor = JSON.parse(texto.slice(inicio, fin + 1)) as unknown
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor) ? (valor as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Las búsquedas que se aceptan: texto corto, sin repetir, hasta `MAX_BUSQUEDAS`. */
export function limpiarBusquedas(crudas: unknown): string[] {
  if (!Array.isArray(crudas)) return []
  const salida: string[] = []
  for (const b of crudas) {
    if (typeof b !== 'string') continue
    const limpia = b.replace(/\s+/g, ' ').trim().slice(0, LARGO_BUSQUEDA)
    if (limpia && !salida.some((s) => s.toLowerCase() === limpia.toLowerCase())) salida.push(limpia)
    if (salida.length >= MAX_BUSQUEDAS) break
  }
  return salida
}

/** Lo que contestó el modelo al pedirle búsquedas: `{"busquedas": [...]}`. */
export function leerBusquedas(texto: string): string[] {
  return limpiarBusquedas(primerObjeto(texto)?.busquedas)
}

/**
 * Lo que contestó el modelo al pedirle una canción: `{"id": "...", "razon": "..."}`. Solo vale
 * un id que esté entre las candidatas —ninguna de las ya mostradas, porque esas no se le
 * dieron—; cualquier otra cosa es null y elige el azar. La razón queda en una línea corta.
 */
export function leerEleccion(texto: string, candidatas: readonly Candidata[]): { cancion: Candidata; razon: string } | null {
  const objeto = primerObjeto(texto)
  if (!objeto) return null
  const id = typeof objeto.id === 'string' ? objeto.id.trim() : typeof objeto.id === 'number' ? String(objeto.id) : ''
  const cancion = candidatas.find((c) => c.id === id)
  if (!cancion) return null
  const cruda = typeof objeto.razon === 'string' ? objeto.razon.replace(/\s+/g, ' ').trim() : ''
  const razon = cruda.length > LARGO_RAZON ? `${cruda.slice(0, LARGO_RAZON - 1).trimEnd()}…` : cruda
  return { cancion, razon: razon || razonSinModelo(cancion) }
}

function razonSinModelo(c: Candidata): string {
  return c.origen ? `Salió buscando «${c.origen}».` : RAZON_SONANDO
}

/**
 * La elección sin modelo: al azar entre las que están sonando y no se mostraron; si ya no queda
 * ninguna de esas, entre las de las búsquedas. null si no queda nada.
 */
export function elegirSinModelo(candidatas: readonly Candidata[], azar: () => number = Math.random): Sugerencia | null {
  const sonando = candidatas.filter((c) => c.origen === null)
  const pool = sonando.length > 0 ? sonando : candidatas
  if (pool.length === 0) return null
  const cancion = pool[Math.min(pool.length - 1, Math.floor(azar() * pool.length))]!
  return { cancion: sinOrigen(cancion), razon: razonSinModelo(cancion), conModelo: false }
}

function sinOrigen(c: Candidata): CancionInstagram {
  return { id: c.id, titulo: c.titulo, artista: c.artista, duracionMs: c.duracionMs, portada: c.portada, muestra: c.muestra }
}

/** Lo que está sonando y lo de las búsquedas, sin repetir y sin las ya mostradas. */
export function juntarCandidatas(
  sonando: readonly CancionInstagram[],
  buscadas: ReadonlyArray<{ busqueda: string; canciones: readonly CancionInstagram[] }>,
  vistas: ReadonlySet<string>,
): Candidata[] {
  const salida: Candidata[] = []
  const ya = new Set(vistas)
  const sumar = (c: CancionInstagram, origen: string | null) => {
    if (ya.has(c.id)) return
    ya.add(c.id)
    salida.push({ ...c, origen })
  }
  for (const c of sonando) sumar(c, null)
  for (const { busqueda, canciones } of buscadas) for (const c of canciones) sumar(c, busqueda)
  return salida
}

const INSTRUCCIONES_BUSQUEDAS = [
  'Ayudas a un creador de contenido a ponerle música a un reel de Instagram.',
  'Lee el texto del post y propone hasta dos búsquedas cortas para la biblioteca de música de Instagram:',
  'un género, un ánimo o un artista que le quede (por ejemplo «lofi chill», «reggaetón alegre», «Bad Bunny»).',
  'Contesta solo con JSON, sin nada más: {"busquedas": ["...", "..."]}',
].join(' ')

const INSTRUCCIONES_ELECCION = [
  'Ayudas a un creador de contenido a ponerle música a un reel de Instagram.',
  'Elige UNA canción de la lista que le quede al post: por el ánimo, el ritmo y el tema.',
  'Solo puedes elegir de la lista, por su id; no inventes canciones.',
  'Contesta solo con JSON, sin nada más: {"id": "<id de la lista>", "razon": "<una frase corta en español, de tú, de por qué le queda>"}',
].join(' ')

export function pedidoDeBusquedas(texto: string): string {
  return `Texto del post:\n"""\n${texto.slice(0, LARGO_TEXTO)}\n"""`
}

export function pedidoDeEleccion(texto: string, candidatas: readonly Candidata[]): string {
  const lista = candidatas
    .slice(0, MAX_CANDIDATAS)
    .map((c) => {
      const de = c.artista ? ` — ${c.artista}` : ''
      const como = c.origen ? ` (buscando «${c.origen}»)` : ' (sonando ahora)'
      return `- id ${c.id}: ${c.titulo}${de}${como}`
    })
    .join('\n')
  const post = texto.trim() ? texto.slice(0, LARGO_TEXTO) : '(sin texto: elige la que mejor funcione en un reel en general)'
  return `Texto del post:\n"""\n${post}\n"""\n\nCanciones:\n${lista}`
}

/**
 * Una sugerencia para el post. `vistas` son los ids ya mostrados en esta sesión —los de
 * sugerencias anteriores—: ninguna vuelve a salir. `busquedas`, las que el modelo propuso la
 * primera vez, si quien llama las trae de vuelta: así «Otra» no le pide búsquedas de nuevo, solo
 * la elección. La respuesta las devuelve para eso.
 */
export async function sugerirCancion(
  entrada: { texto: string; vistas: readonly string[]; busquedas?: readonly string[] | null },
  deps: DepsSugerencia,
): Promise<{ sugerencia: Sugerencia; busquedas: string[] } | { agotadas: true; busquedas: string[] } | { error: string }> {
  const texto = entrada.texto.trim()
  const vistas = new Set(entrada.vistas)

  const sonando = await deps.buscar(null)

  let busquedas = limpiarBusquedas(entrada.busquedas ?? [])
  if (deps.pedirAlModelo && texto && entrada.busquedas == null) {
    try {
      busquedas = leerBusquedas(await deps.pedirAlModelo(INSTRUCCIONES_BUSQUEDAS, pedidoDeBusquedas(texto)))
    } catch (error) {
      console.error('Música: el modelo no propuso búsquedas:', String(error).slice(0, 300))
      busquedas = []
    }
  }
  const buscadas = await Promise.all(
    busquedas.map(async (busqueda) => {
      const r = await deps.buscar(busqueda)
      return { busqueda, canciones: 'error' in r ? [] : r.canciones }
    }),
  )

  if ('error' in sonando && buscadas.every((b) => b.canciones.length === 0)) return { error: sonando.error }
  const candidatas = juntarCandidatas('error' in sonando ? [] : sonando.canciones, buscadas, vistas)
  if (candidatas.length === 0) return { agotadas: true, busquedas }

  if (deps.pedirAlModelo) {
    try {
      const eleccion = leerEleccion(
        await deps.pedirAlModelo(INSTRUCCIONES_ELECCION, pedidoDeEleccion(texto, candidatas)),
        candidatas.slice(0, MAX_CANDIDATAS),
      )
      if (eleccion) {
        return { sugerencia: { cancion: sinOrigen(eleccion.cancion), razon: eleccion.razon, conModelo: true }, busquedas }
      }
    } catch (error) {
      console.error('Música: el modelo no eligió:', String(error).slice(0, 300))
    }
  }
  const alAzar = elegirSinModelo(candidatas, deps.azar)
  return alAzar ? { sugerencia: alAzar, busquedas } : { agotadas: true, busquedas }
}
