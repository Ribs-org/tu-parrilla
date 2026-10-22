import { randomUUID } from 'node:crypto'
import { and, eq, isNotNull, isNull, lt } from 'drizzle-orm'
import { getDb, insumos, subidas, type Insumo, type Subida, type Usuario } from '@/db'
import {
  SUBIDA_SEGUNDOS,
  abortarPorPartes,
  abrirPorPartes,
  basePublica,
  borrar,
  cerrarPorPartes,
  objetoEnAlmacen,
  partesSubidas,
  urlParaParte,
  urlPublica,
  SIN_ALMACEN,
} from '@/lib/storage'
import { esUuid } from '@/lib/uuid'
import {
  MAX_PARTES_POR_PEDIDO,
  TAMANO_PARTE,
  baseDeNombre,
  bytesDeParte,
  cuantasPartes,
  extensionDe,
  partesQueFaltan,
  type SubidaPedida,
} from './insumos'

// Las subidas de La Cocina desde el panel: el plato principal y sus acompañamientos, que pesan
// hasta 20 GB y van por partes, directo del navegador al almacén (`subidas` en el esquema, y el
// diseño en «Subir archivos grandes»). Todo va por dueño: una subida o un insumo de otro no
// existe para quien pregunta. Las rutas están en `/api/admin/cocina/…`; el navegador, en
// `src/lib/subida-por-partes.ts`.

export const COCINA_APAGADA = 'La Cocina no está encendida para tu cuenta.'
export const SUBIDA_NO_EXISTE = 'Esa subida no existe, o ya se abortó.'
export const SUBIDA_CERRADA = 'Esa subida ya se cerró: el archivo está arriba.'
export const SUBIDA_MAL_CERRADA = 'El archivo llegó con otro tamaño: súbelo de nuevo.'
export const INSUMO_SUELTO_NO_EXISTE = 'Ese archivo no existe, o ya se borró.'
export const INSUMO_EN_COMANDA = 'Ese archivo ya es parte de una comanda: no se puede sacar.'
export const PARTES_ILEGIBLES = `«partes» es una lista de 1 a ${MAX_PARTES_POR_PEDIDO} números de parte de este archivo.`

export function faltanPartes(n: number): string {
  return n === 1 ? 'Falta 1 parte por subir: súbela y vuelve a cerrar.' : `Faltan ${n} partes por subir: súbelas y vuelve a cerrar.`
}

/** Una subida abierta y abandonada se aborta pasado esto, y el almacén borra sus partes. */
export const HORAS_SUBIDA_ABIERTA = 24
/** Lo que se subió y no llegó a ninguna comanda se borra pasado esto. */
export const DIAS_INSUMO_SUELTO = 3

type Dueno = Pick<Usuario, 'id' | 'cocinaDesde'>

/** La clave de un insumo: fuera de `scheduled/`, porque lo crudo no se programa. */
export function claveDeInsumo(ownerId: string, nombre: string, tipoArchivo: string, uuid: string): string {
  return `cocina/${ownerId}/insumos/${uuid}-${baseDeNombre(nombre)}.${extensionDe(tipoArchivo)}`
}

/** Lo que el panel muestra de un insumo subido: sin su URL, que no le sirve al navegador. */
export type InsumoSubido = {
  id: string
  tipo: string
  subtipo: string | null
  nombre: string
  bytes: number
  duracionS: number | null
  tipoArchivo: string
}

function paraElPanel(i: Insumo): InsumoSubido {
  return { id: i.id, tipo: i.tipo, subtipo: i.subtipo, nombre: i.nombre, bytes: i.bytes, duracionS: i.duracionS, tipoArchivo: i.tipoArchivo }
}

async function deDueno(ownerId: string, id: string): Promise<Subida | null> {
  if (!esUuid(id)) return null
  const [s] = await getDb()
    .select()
    .from(subidas)
    .where(and(eq(subidas.id, id), eq(subidas.ownerId, ownerId)))
  return s ?? null
}

async function insumoDe(s: Subida): Promise<InsumoSubido | null> {
  if (!s.insumoId) return null
  const [i] = await getDb().select().from(insumos).where(eq(insumos.id, s.insumoId))
  return i ? paraElPanel(i) : null
}

export type SubidaAbierta = { id: string; tamanoParte: number; partes: number }

/**
 * La abre: pide el id al almacén y guarda lo que hace falta para seguirla y, al cerrarla, el
 * insumo. Si la base falla después de abrirla en el almacén, la aborta: no deja partes sin dueño.
 */
export async function abrirSubida(
  dueno: Dueno,
  pedido: SubidaPedida,
  ahora: Date,
  uuid: () => string = randomUUID,
): Promise<SubidaAbierta | { falla: 'apagada' }> {
  if (!dueno.cocinaDesde) return { falla: 'apagada' }
  const clave = claveDeInsumo(dueno.id, pedido.nombre, pedido.tipoArchivo, uuid())
  const idEnAlmacen = await abrirPorPartes(clave, pedido.tipoArchivo)
  try {
    const [fila] = await getDb()
      .insert(subidas)
      .values({
        ownerId: dueno.id,
        idEnAlmacen,
        clave,
        nombre: pedido.nombre,
        tipoArchivo: pedido.tipoArchivo,
        bytes: pedido.bytes,
        tamanoParte: TAMANO_PARTE,
        tipo: pedido.tipo,
        subtipo: pedido.subtipo,
        duracionS: pedido.duracionS,
        derechosEn: ahora,
        creadaEn: ahora,
      })
      .returning()
    return { id: fila!.id, tamanoParte: fila!.tamanoParte, partes: cuantasPartes(fila!.bytes, fila!.tamanoParte) }
  } catch (error) {
    await abortarPorPartes(clave, idEnAlmacen).catch(() => {})
    throw error
  }
}

export type EstadoDeSubida = {
  id: string
  nombre: string
  bytes: number
  tamanoParte: number
  partes: number
  /** Las partes que llegaron con el peso que les toca. */
  llegaron: number[]
  insumo: InsumoSubido | null
}

/**
 * Cómo va: cuántas partes tiene y cuáles llegaron bien, según el almacén. Es lo que el navegador
 * pregunta al retomar una subida cortada. Una que el almacén ya no conoce se borra y no existe.
 */
export async function estadoDeSubida(dueno: Dueno, id: string): Promise<EstadoDeSubida | { falla: 'no-existe' }> {
  const s = await deDueno(dueno.id, id)
  if (!s) return { falla: 'no-existe' }
  const total = cuantasPartes(s.bytes, s.tamanoParte)
  const base = { id: s.id, nombre: s.nombre, bytes: s.bytes, tamanoParte: s.tamanoParte, partes: total }
  if (s.cerradaEn) {
    return { ...base, llegaron: Array.from({ length: total }, (_, n) => n + 1), insumo: await insumoDe(s) }
  }
  const partes = await partesSubidas(s.clave, s.idEnAlmacen)
  if (partes === null) {
    await getDb().delete(subidas).where(eq(subidas.id, s.id))
    return { falla: 'no-existe' }
  }
  const faltan = new Set(partesQueFaltan(s.bytes, s.tamanoParte, partes))
  const llegaron = Array.from({ length: total }, (_, n) => n + 1).filter((n) => !faltan.has(n))
  return { ...base, llegaron, insumo: null }
}

export type PartesFirmadas = { partes: Array<{ numero: number; url: string; bytes: number }>; vence: string }

/** Un PUT firmado por cada parte pedida, de a `MAX_PARTES_POR_PEDIDO`. Vencen en una hora. */
export async function firmarPartes(
  dueno: Dueno,
  id: string,
  numeros: unknown,
  ahora: Date,
): Promise<PartesFirmadas | { falla: 'no-existe' | 'cerrada' | 'ilegibles' }> {
  const s = await deDueno(dueno.id, id)
  if (!s) return { falla: 'no-existe' }
  if (s.cerradaEn) return { falla: 'cerrada' }
  const total = cuantasPartes(s.bytes, s.tamanoParte)
  if (
    !Array.isArray(numeros) ||
    numeros.length === 0 ||
    numeros.length > MAX_PARTES_POR_PEDIDO ||
    !numeros.every((n) => Number.isInteger(n) && n >= 1 && n <= total) ||
    new Set(numeros).size !== numeros.length
  ) {
    return { falla: 'ilegibles' }
  }
  const partes = []
  for (const numero of numeros as number[]) {
    partes.push({ numero, url: await urlParaParte(s.clave, s.idEnAlmacen, numero), bytes: bytesDeParte(numero, s.bytes, s.tamanoParte) })
  }
  return { partes, vence: new Date(ahora.getTime() + SUBIDA_SEGUNDOS * 1000).toISOString() }
}

export type ResultadoCierre =
  | { insumo: InsumoSubido; nuevo: boolean }
  | { falla: 'no-existe' | 'mal-cerrada' }
  | { falla: 'faltan'; faltan: number }

/**
 * La cierra: con todas las partes arriba y cada una con su peso, el almacén las junta en el
 * objeto, se mira que el objeto pese lo anunciado, y nace el insumo, todavía sin comanda.
 * Cerrarla otra vez devuelve el mismo insumo. Dos cierres a la vez: el segundo se encuentra con
 * que el almacén ya no conoce la subida, relee y devuelve lo que dejó el primero.
 */
export async function cerrarSubida(dueno: Dueno, id: string, ahora: Date): Promise<ResultadoCierre> {
  const s = await deDueno(dueno.id, id)
  if (!s) return { falla: 'no-existe' }
  const yaCerrada = async (fila: Subida): Promise<ResultadoCierre> => {
    const insumo = await insumoDe(fila)
    return insumo ? { insumo, nuevo: false } : { falla: 'no-existe' }
  }
  if (s.cerradaEn) return yaCerrada(s)

  const partes = await partesSubidas(s.clave, s.idEnAlmacen)
  if (partes === null) {
    const otraVez = await deDueno(dueno.id, id)
    if (otraVez?.cerradaEn) return yaCerrada(otraVez)
    if (otraVez) await getDb().delete(subidas).where(eq(subidas.id, s.id))
    return { falla: 'no-existe' }
  }
  const faltan = partesQueFaltan(s.bytes, s.tamanoParte, partes)
  if (faltan.length > 0) return { falla: 'faltan', faltan: faltan.length }

  const base = basePublica()
  if (!base) throw new Error(SIN_ALMACEN)
  const total = cuantasPartes(s.bytes, s.tamanoParte)
  await cerrarPorPartes(s.clave, s.idEnAlmacen, partes.filter((p) => p.numero <= total))
  const url = urlPublica(base, s.clave)
  const objeto = await objetoEnAlmacen(url)
  if (!objeto || objeto.bytes !== s.bytes) {
    await borrar(url)
    await getDb().delete(subidas).where(eq(subidas.id, s.id))
    return { falla: 'mal-cerrada' }
  }

  const insumo = await getDb().transaction(async (tx) => {
    const [i] = await tx
      .insert(insumos)
      .values({
        ownerId: s.ownerId,
        tipo: s.tipo,
        subtipo: s.subtipo,
        nombre: s.nombre,
        url,
        bytes: objeto.bytes,
        duracionS: s.duracionS,
        tipoArchivo: s.tipoArchivo,
        derechosEn: s.derechosEn,
        creadoEn: ahora,
      })
      .returning()
    await tx.update(subidas).set({ cerradaEn: ahora, insumoId: i!.id }).where(eq(subidas.id, s.id))
    return i!
  })
  return { insumo: paraElPanel(insumo), nuevo: true }
}

/** La aborta: el almacén borra las partes que llegaron. Una cerrada ya no se aborta: su archivo se borra aparte. */
export async function abortarSubida(dueno: Dueno, id: string): Promise<{ ok: true } | { falla: 'no-existe' | 'cerrada' }> {
  const s = await deDueno(dueno.id, id)
  if (!s) return { falla: 'no-existe' }
  if (s.cerradaEn) return { falla: 'cerrada' }
  await abortarPorPartes(s.clave, s.idEnAlmacen)
  await getDb().delete(subidas).where(eq(subidas.id, s.id))
  return { ok: true }
}

/**
 * Borra un insumo que todavía no es parte de ninguna comanda: el archivo que el usuario sacó del
 * formulario antes de pedir. El archivo se borra del almacén en el acto, porque pesa.
 */
export async function borrarInsumoSuelto(dueno: Dueno, id: string): Promise<{ ok: true } | { falla: 'no-existe' | 'en-comanda' }> {
  if (!esUuid(id)) return { falla: 'no-existe' }
  const db = getDb()
  const [i] = await db
    .select()
    .from(insumos)
    .where(and(eq(insumos.id, id), eq(insumos.ownerId, dueno.id), isNull(insumos.borradoEn)))
  if (!i) return { falla: 'no-existe' }
  if (i.comandaId) return { falla: 'en-comanda' }
  // La condición se repite en la escritura: si una comanda lo tomó entre medio, no se borra.
  const [borrado] = await db
    .delete(insumos)
    .where(and(eq(insumos.id, id), isNull(insumos.comandaId)))
    .returning({ url: insumos.url })
  if (!borrado) return { falla: 'en-comanda' }
  await borrar(borrado.url)
  return { ok: true }
}

export type BarridoDeSubidas = { abortadas: number; sueltos: number; error?: string }

/**
 * El barrido de la cocina, una vez por hora junto al de huérfanos:
 *
 * - aborta las subidas abiertas hace más de `HORAS_SUBIDA_ABIERTA`, y el almacén borra sus
 *   partes, que si no se quedan cobrando;
 * - olvida las cerradas de hace más de eso: su insumo ya existe, y no hay nada que retomar;
 * - borra lo que se subió y lleva más de `DIAS_INSUMO_SUELTO` sin llegar a una comanda.
 *
 * Nunca lanza, como el de huérfanos: la corrida que lo llama ya publicó.
 */
export async function barrerSubidas(ahora: Date = new Date()): Promise<BarridoDeSubidas> {
  const db = getDb()
  const corte = new Date(ahora.getTime() - HORAS_SUBIDA_ABIERTA * 3_600_000)
  let abortadas = 0
  let sueltos = 0
  try {
    const abiertas = await db
      .select()
      .from(subidas)
      .where(and(isNull(subidas.cerradaEn), lt(subidas.creadaEn, corte)))
    for (const s of abiertas) {
      await abortarPorPartes(s.clave, s.idEnAlmacen)
      await db.delete(subidas).where(eq(subidas.id, s.id))
      abortadas += 1
    }
    await db.delete(subidas).where(and(isNotNull(subidas.cerradaEn), lt(subidas.cerradaEn, corte)))

    const viejos = new Date(ahora.getTime() - DIAS_INSUMO_SUELTO * 86_400_000)
    const borrados = await db
      .delete(insumos)
      .where(and(isNull(insumos.comandaId), lt(insumos.creadoEn, viejos)))
      .returning({ url: insumos.url })
    for (const b of borrados) {
      await borrar(b.url)
      sueltos += 1
    }
    return { abortadas, sueltos }
  } catch (error) {
    console.error('Falló el barrido de las subidas de la cocina:', String(error).slice(0, 300))
    return { abortadas, sueltos, error: 'El barrido de las subidas falló; ver el log.' }
  }
}
