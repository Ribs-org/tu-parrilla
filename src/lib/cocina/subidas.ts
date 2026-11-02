import { randomUUID } from 'node:crypto'
import { and, eq, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import { getDb, materiales, subidas, users, type Material, type Subida, type Usuario } from '@/db'
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
import { CUOTA_BODEGA_POR_DEFECTO, claseDe, extensionDe, noCabe, type ClaseMaterial, type SubidaPedida, type UsoMaterial } from './bodega'
import { MAX_PARTES_POR_PEDIDO, TAMANO_PARTE, baseDeNombre, bytesDeParte, cuantasPartes, partesQueFaltan } from './insumos'

// Las subidas a la cámara de frío de La Cocina (de día, la nevera), desde el panel: un largo crudo
// pesa hasta 20 GB y va por partes, directo del navegador al almacén (`subidas` en el esquema, y el
// diseño de La Cocina en «Subir archivos grandes»). Al cerrarse nace un material de la cámara
// (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`). Todo va por dueño: una subida o un
// material de otro no existe para quien pregunta. Las rutas están en `/api/admin/cocina/…`; el
// navegador, en `src/lib/subida-por-partes.ts`.

export const COCINA_APAGADA = 'La Cocina no está encendida para tu cuenta.'
export const SUBIDA_NO_EXISTE = 'Esa subida no existe, o ya se abortó.'
export const SUBIDA_CERRADA = 'Esa subida ya se cerró: el archivo está arriba.'
export const SUBIDA_MAL_CERRADA = 'El archivo llegó con otro tamaño: súbelo de nuevo.'
export const PARTES_ILEGIBLES = `«partes» es una lista de 1 a ${MAX_PARTES_POR_PEDIDO} números de parte de este archivo.`

export function faltanPartes(n: number): string {
  return n === 1 ? 'Falta 1 parte por subir: súbela y vuelve a cerrar.' : `Faltan ${n} partes por subir: súbelas y vuelve a cerrar.`
}

/** Una subida abierta y abandonada se aborta pasado esto, y el almacén borra sus partes. */
export const HORAS_SUBIDA_ABIERTA = 24

type Dueno = Pick<Usuario, 'id' | 'cocinaDesde'>

/** La clave de un material: fuera de `scheduled/`, porque lo crudo no se programa. */
export function claveDeMaterial(ownerId: string, nombre: string, tipoArchivo: string, uuid: string): string {
  return `cocina/${ownerId}/bodega/${uuid}-${baseDeNombre(nombre)}.${extensionDe(tipoArchivo)}`
}

/** Lo que el panel muestra de un material: sin su URL, que no le sirve al navegador. */
export type MaterialSubido = {
  id: string
  nombre: string
  uso: UsoMaterial | null
  bytes: number
  duracionS: number | null
  tipoArchivo: string
  clase: ClaseMaterial
  creadoEn: string
}

export function paraElPanel(m: Material): MaterialSubido {
  return {
    id: m.id,
    nombre: m.nombre,
    uso: m.uso,
    bytes: m.bytes,
    duracionS: m.duracionS,
    tipoArchivo: m.tipoArchivo,
    clase: claseDe(m.tipoArchivo),
    creadoEn: m.creadoEn.toISOString(),
  }
}

async function deDueno(ownerId: string, id: string): Promise<Subida | null> {
  if (!esUuid(id)) return null
  const [s] = await getDb()
    .select()
    .from(subidas)
    .where(and(eq(subidas.id, id), eq(subidas.ownerId, ownerId)))
  return s ?? null
}

async function materialDe(s: Subida): Promise<MaterialSubido | null> {
  if (!s.materialId) return null
  const [m] = await getDb()
    .select()
    .from(materiales)
    .where(and(eq(materiales.id, s.materialId), isNull(materiales.borradoEn)))
  return m ? paraElPanel(m) : null
}

export type SubidaAbierta = { id: string; tamanoParte: number; partes: number }

/**
 * Lo que el dueño ocupa en la cámara: lo que ya está adentro y lo que está subiendo, que ya tiene su
 * lugar reservado. Recibe la conexión, para contar dentro de la misma transacción que reserva.
 */
async function ocupadosCon(db: Pick<ReturnType<typeof getDb>, 'select'>, ownerId: string): Promise<{ guardados: number; subiendo: number }> {
  const [g] = await db
    .select({ n: sql<number>`coalesce(sum(${materiales.bytes}), 0)`.mapWith(Number) })
    .from(materiales)
    .where(and(eq(materiales.ownerId, ownerId), isNull(materiales.borradoEn)))
  const [s] = await db
    .select({ n: sql<number>`coalesce(sum(${subidas.bytes}), 0)`.mapWith(Number) })
    .from(subidas)
    .where(and(eq(subidas.ownerId, ownerId), isNull(subidas.cerradaEn)))
  return { guardados: g?.n ?? 0, subiendo: s?.n ?? 0 }
}

export type UsoDeLaCamara = { cuantos: number; guardados: number; subiendo: number; cuota: number }

/** Cuánto ocupa el dueño en la cámara, cuántas cosas tiene y cuánto le cabe: lo que dibuja la cuota. */
export async function usoDeLaCamara(ownerId: string): Promise<UsoDeLaCamara> {
  const db = getDb()
  const [u] = await db.select({ bodegaBytes: users.bodegaBytes }).from(users).where(eq(users.id, ownerId))
  const [c] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(materiales)
    .where(and(eq(materiales.ownerId, ownerId), isNull(materiales.borradoEn)))
  const { guardados, subiendo } = await ocupadosCon(db, ownerId)
  return { cuantos: c?.n ?? 0, guardados, subiendo, cuota: u?.bodegaBytes ?? CUOTA_BODEGA_POR_DEFECTO }
}

class NoCabe extends Error {
  constructor(public frase: string) {
    super(frase)
  }
}

/**
 * La abre, si cabe: cuenta lo que hay en la cámara y lo que está subiendo, con la fila del dueño
 * bloqueada (`FOR UPDATE`), así dos subidas que abren a la vez se ponen en fila y la segunda ve lo
 * que reservó la primera. Pide el id al almacén y guarda lo que hace falta para seguirla; desde ahí,
 * sus bytes ya cuentan. Si la base falla después de abrirla en el almacén, la aborta: no deja partes
 * sin dueño.
 */
export async function abrirSubida(
  dueno: Dueno,
  pedido: SubidaPedida,
  ahora: Date,
  uuid: () => string = randomUUID,
): Promise<SubidaAbierta | { falla: 'apagada' } | { falla: 'no-cabe'; frase: string }> {
  if (!dueno.cocinaDesde) return { falla: 'apagada' }
  const clave = claveDeMaterial(dueno.id, pedido.nombre, pedido.tipoArchivo, uuid())
  let abiertaEnAlmacen: string | null = null
  try {
    const fila = await getDb().transaction(async (tx) => {
      const [u] = await tx.select({ bodegaBytes: users.bodegaBytes }).from(users).where(eq(users.id, dueno.id)).for('update')
      if (!u) throw new Error('El dueño de la subida no existe')
      const cuota = u.bodegaBytes ?? CUOTA_BODEGA_POR_DEFECTO
      const { guardados, subiendo } = await ocupadosCon(tx, dueno.id)
      const libres = cuota - guardados - subiendo
      if (pedido.bytes > libres) throw new NoCabe(noCabe(pedido.nombre, pedido.bytes, libres, cuota))
      abiertaEnAlmacen = await abrirPorPartes(clave, pedido.tipoArchivo)
      const [nueva] = await tx
        .insert(subidas)
        .values({
          ownerId: dueno.id,
          idEnAlmacen: abiertaEnAlmacen,
          clave,
          nombre: pedido.nombre,
          tipoArchivo: pedido.tipoArchivo,
          bytes: pedido.bytes,
          tamanoParte: TAMANO_PARTE,
          uso: pedido.uso,
          duracionS: pedido.duracionS,
          derechosEn: ahora,
          creadaEn: ahora,
        })
        .returning()
      return nueva!
    })
    return { id: fila.id, tamanoParte: fila.tamanoParte, partes: cuantasPartes(fila.bytes, fila.tamanoParte) }
  } catch (error) {
    if (error instanceof NoCabe) return { falla: 'no-cabe', frase: error.frase }
    if (abiertaEnAlmacen) await abortarPorPartes(clave, abiertaEnAlmacen).catch(() => {})
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
  material: MaterialSubido | null
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
    return { ...base, llegaron: Array.from({ length: total }, (_, n) => n + 1), material: await materialDe(s) }
  }
  const partes = await partesSubidas(s.clave, s.idEnAlmacen)
  if (partes === null) {
    await getDb().delete(subidas).where(eq(subidas.id, s.id))
    return { falla: 'no-existe' }
  }
  const faltan = new Set(partesQueFaltan(s.bytes, s.tamanoParte, partes))
  const llegaron = Array.from({ length: total }, (_, n) => n + 1).filter((n) => !faltan.has(n))
  return { ...base, llegaron, material: null }
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
  | { material: MaterialSubido; nuevo: boolean }
  | { falla: 'no-existe' | 'mal-cerrada' }
  | { falla: 'faltan'; faltan: number }

/**
 * La cierra: con todas las partes arriba y cada una con su peso, el almacén las junta en el
 * objeto, se mira que el objeto pese lo anunciado, y nace el material de la cámara. Cerrarla otra
 * vez devuelve el mismo material. Dos cierres a la vez: el segundo se encuentra con que el almacén
 * ya no conoce la subida, relee y devuelve lo que dejó el primero.
 */
export async function cerrarSubida(dueno: Dueno, id: string, ahora: Date): Promise<ResultadoCierre> {
  const s = await deDueno(dueno.id, id)
  if (!s) return { falla: 'no-existe' }
  const yaCerrada = async (fila: Subida): Promise<ResultadoCierre> => {
    const material = await materialDe(fila)
    return material ? { material, nuevo: false } : { falla: 'no-existe' }
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

  // El material y la subida cerrada, juntos: si no, la subida seguiría contando en la cuota además
  // del material, o el material quedaría sin nadie que lo devuelva al retomar.
  const material = await getDb().transaction(async (tx) => {
    const [m] = await tx
      .insert(materiales)
      .values({
        ownerId: s.ownerId,
        nombre: s.nombre,
        uso: s.uso,
        url,
        bytes: objeto.bytes,
        tipoArchivo: s.tipoArchivo,
        duracionS: s.duracionS,
        derechosEn: s.derechosEn,
        creadoEn: ahora,
      })
      .returning()
    await tx.update(subidas).set({ cerradaEn: ahora, materialId: m!.id }).where(eq(subidas.id, s.id))
    return m!
  })
  return { material: paraElPanel(material), nuevo: true }
}

/** La aborta: el almacén borra las partes que llegaron, y su lugar en la cuota se libera. Una cerrada ya no se aborta. */
export async function abortarSubida(dueno: Dueno, id: string): Promise<{ ok: true } | { falla: 'no-existe' | 'cerrada' }> {
  const s = await deDueno(dueno.id, id)
  if (!s) return { falla: 'no-existe' }
  if (s.cerradaEn) return { falla: 'cerrada' }
  await abortarPorPartes(s.clave, s.idEnAlmacen)
  await getDb().delete(subidas).where(eq(subidas.id, s.id))
  return { ok: true }
}

export type BarridoDeSubidas = { abortadas: number; error?: string }

/**
 * El barrido de las subidas, una vez por hora junto al de huérfanos:
 *
 * - aborta las subidas abiertas hace más de `HORAS_SUBIDA_ABIERTA`, y el almacén borra sus
 *   partes, que si no se quedan cobrando y ocupando la cuota;
 * - olvida las cerradas de hace más de eso: su material ya existe, y no hay nada que retomar.
 *
 * Lo que está en la cámara no se toca: no vence. Hasta el 2026-11-02, lo que se subía y no llegaba
 * a una comanda se borraba a los tres días; ahora eso es la cámara.
 *
 * Nunca lanza, como el de huérfanos: la corrida que lo llama ya publicó.
 */
export async function barrerSubidas(ahora: Date = new Date()): Promise<BarridoDeSubidas> {
  const db = getDb()
  const corte = new Date(ahora.getTime() - HORAS_SUBIDA_ABIERTA * 3_600_000)
  let abortadas = 0
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
    return { abortadas }
  } catch (error) {
    console.error('Falló el barrido de las subidas de la cocina:', String(error).slice(0, 300))
    return { abortadas, error: 'El barrido de las subidas falló; ver el log.' }
  }
}
