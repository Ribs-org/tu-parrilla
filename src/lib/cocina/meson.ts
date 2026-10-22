import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { borradorMedia, borradores, comandaEventos, comandas, creativoMedia, creativos, getDb, insumos, type EstadoCreativo } from '@/db'
import { borrar } from '@/lib/storage'
import { DIAS_INSUMO } from './panel'

// El mesón (de día, la vitrina): lo que el chef entregó y espera que el dueño lo programe o lo
// descarte (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «El mesón»). Se agrupa por
// comanda y, dentro, por pieza: la misma idea en estilos distintos va junta. Todo por dueño.

export { CREATIVO_NO_ESTA, MAX_NOTA_DESCARTE, MOTIVO_DESCARTE_FALTA, MOTIVOS_DESCARTE, NOMBRE_MOTIVO, NOTA_LARGA, leerDescarte, type MotivoDescarte } from './meson-motivos'
import type { MotivoDescarte } from './meson-motivos'

/** Los estados en que un creativo todavía espera algo del dueño: también el que está en un borrador. */
const PENDIENTES: EstadoCreativo[] = ['subiendo', 'mesa', 'borrador']

export type MediaDelMeson = { url: string; mediaType: 'image' | 'video' }

export type CreativoDelMeson = {
  id: string
  comandaId: string
  pieza: string | null
  tanda: string | null
  tipo: 'video' | 'carrusel' | 'imagen'
  texto: string
  tituloYoutube: string | null
  estilo: string | null
  atributos: Record<string, string | number | boolean>
  duracionS: number | null
  portadaUrl: string | null
  media: MediaDelMeson[]
  expiraEn: Date | null
}

export type PiezaDelMeson = { pieza: string | null; creativos: CreativoDelMeson[] }
export type ComandaEnElMeson = { id: string; principal: string | null; creadaEn: Date; piezas: PiezaDelMeson[] }

/**
 * Lo que hay en el mesón del dueño, de la comanda más nueva a la más vieja, y dentro de cada una
 * por pieza, en el orden en que llegó la primera de cada pieza. Un creativo sin pieza va solo.
 * Con `comandaId`, solo esa comanda.
 */
export async function mesonDelDueno(ownerId: string, comandaId?: string): Promise<ComandaEnElMeson[]> {
  const db = getDb()
  const enMesa = await db
    .select()
    .from(creativos)
    .where(
      and(
        eq(creativos.ownerId, ownerId),
        eq(creativos.estado, 'mesa'),
        ...(comandaId ? [eq(creativos.comandaId, comandaId)] : []),
      ),
    )
    .orderBy(asc(creativos.creadoEn))
  if (enMesa.length === 0) return []

  const media = await db
    .select()
    .from(creativoMedia)
    .where(
      and(
        inArray(
          creativoMedia.creativoId,
          enMesa.map((c) => c.id),
        ),
        eq(creativoMedia.rol, 'media'),
      ),
    )
    .orderBy(asc(creativoMedia.position))
  const ids = [...new Set(enMesa.map((c) => c.comandaId))]
  const filas = await db
    .select({ id: comandas.id, creadaEn: comandas.creadaEn })
    .from(comandas)
    .where(inArray(comandas.id, ids))
    .orderBy(desc(comandas.creadaEn))
  const principales = await db
    .select({ comandaId: insumos.comandaId, nombre: insumos.nombre })
    .from(insumos)
    .where(and(inArray(insumos.comandaId, ids), eq(insumos.tipo, 'principal')))

  return filas.map((c) => {
    const piezas = new Map<string, PiezaDelMeson>()
    for (const cr of enMesa.filter((x) => x.comandaId === c.id)) {
      const clave = cr.pieza ?? `solo:${cr.id}`
      const grupo = piezas.get(clave) ?? { pieza: cr.pieza, creativos: [] }
      grupo.creativos.push({
        id: cr.id,
        comandaId: cr.comandaId,
        pieza: cr.pieza,
        tanda: cr.tanda,
        tipo: cr.tipo,
        texto: cr.texto,
        tituloYoutube: cr.tituloYoutube,
        estilo: cr.estilo,
        atributos: (cr.atributos ?? {}) as Record<string, string | number | boolean>,
        duracionS: cr.duracionS,
        portadaUrl: cr.portadaUrl,
        media: media
          .filter((m) => m.creativoId === cr.id)
          .map((m) => ({ url: m.url, mediaType: m.mediaType as 'image' | 'video' })),
        expiraEn: cr.expiraEn,
      })
      piezas.set(clave, grupo)
    }
    return {
      id: c.id,
      principal: principales.find((p) => p.comandaId === c.id)?.nombre ?? null,
      creadaEn: c.creadaEn,
      piezas: [...piezas.values()],
    }
  })
}

/** Cuántos creativos tiene el dueño en el mesón. */
export async function cuantosEnElMeson(ownerId: string): Promise<number> {
  const filas = await getDb()
    .select({ id: creativos.id })
    .from(creativos)
    .where(and(eq(creativos.ownerId, ownerId), eq(creativos.estado, 'mesa')))
  return filas.length
}

/** Cuántos creativos del dueño esperan en un borrador de La Parrilla. */
export async function cuantosEnBorradores(ownerId: string): Promise<number> {
  const filas = await getDb()
    .select({ id: creativos.id })
    .from(creativos)
    .where(and(eq(creativos.ownerId, ownerId), eq(creativos.estado, 'borrador')))
  return filas.length
}

/**
 * «Programar»: lo pasa a un borrador de La Parrilla con su texto, su título de YouTube y su media, y
 * el creativo sale del mesón mientras espera ahí sus cuentas y su hora. La portada y los atributos
 * no van en el borrador: los pone `crearPostProgramado` al programarlo, desde el creativo. Todo en
 * una transacción, y solo desde el mesón: dos clics no abren dos borradores.
 */
export async function programarCreativo(ownerId: string, id: string, ahora: Date): Promise<{ borradorId: string } | { falla: 'no-esta' }> {
  return getDb().transaction(async (tx) => {
    const [c] = await tx
      .update(creativos)
      .set({ estado: 'borrador' })
      .where(and(eq(creativos.id, id), eq(creativos.ownerId, ownerId), eq(creativos.estado, 'mesa')))
      .returning()
    if (!c) return { falla: 'no-esta' as const }
    const archivos = await tx
      .select()
      .from(creativoMedia)
      .where(and(eq(creativoMedia.creativoId, id), eq(creativoMedia.rol, 'media')))
      .orderBy(asc(creativoMedia.position))
    const [b] = await tx
      .insert(borradores)
      .values({
        ownerId,
        creativoId: id,
        campos: { caption: [c.texto], tituloYoutube: [c.tituloYoutube ?? ''] },
        fecha: null,
        creadoEn: ahora,
        actualizadoEn: ahora,
      })
      .returning({ id: borradores.id })
    if (archivos.length > 0) {
      await tx.insert(borradorMedia).values(
        archivos.map((a, position) => ({ borradorId: b!.id, blobUrl: a.url, mediaType: a.mediaType, nombre: a.nombre, position })),
      )
    }
    return { borradorId: b!.id }
  })
}

/** Lo que el compositor muestra de un borrador que salió del mesón: su estilo y el título del chef. */
export async function creativoParaElCompositor(
  ownerId: string,
  creativoId: string,
): Promise<{ estilo: string | null; tituloYoutube: string | null } | null> {
  const [c] = await getDb()
    .select({ estilo: creativos.estilo, tituloYoutube: creativos.tituloYoutube })
    .from(creativos)
    .where(and(eq(creativos.id, creativoId), eq(creativos.ownerId, ownerId)))
  return c ?? null
}

/** Los archivos de un creativo en el almacén: su media y su portada. */
async function archivosDe(creativoId: string, portadaUrl: string | null): Promise<string[]> {
  const filas = await getDb().select({ url: creativoMedia.url }).from(creativoMedia).where(eq(creativoMedia.creativoId, creativoId))
  return [...new Set([...filas.map((f) => f.url), ...(portadaUrl ? [portadaUrl] : [])])]
}

/**
 * Lo saca del mesón con su motivo, que le queda al chef como memoria de la marca. Sus archivos se
 * borran del almacén en el acto: un video pesa, y descartado no se va a programar. La fila queda,
 * con su estilo y su motivo: es lo que el chef va a leer.
 */
export async function descartarCreativo(
  ownerId: string,
  id: string,
  motivo: MotivoDescarte,
  nota: string | null,
  ahora: Date,
): Promise<{ ok: true } | { falla: 'no-esta' }> {
  const [descartado] = await getDb()
    .update(creativos)
    .set({ estado: 'descartado', descarteMotivo: motivo, descarteNota: nota?.trim() || null })
    .where(and(eq(creativos.id, id), eq(creativos.ownerId, ownerId), eq(creativos.estado, 'mesa')))
    .returning({ comandaId: creativos.comandaId, portadaUrl: creativos.portadaUrl })
  if (!descartado) return { falla: 'no-esta' }
  for (const url of await archivosDe(id, descartado.portadaUrl)) {
    // Uno que no se pudo borrar lo recoge el barrido de huérfanos cuando la fila deje de nombrarlo.
    await borrar(url).catch((e) => console.error('descartar: no se pudo borrar', String(e).slice(0, 200)))
  }
  await servirSiTermino(descartado.comandaId, ahora)
  return { ok: true }
}

/**
 * Si una comanda lista ya no tiene nada por decidir —todo lo que entregó el chef se programó o se
 * descartó—, queda servida: se cierra, y lo crudo que llevaba se guarda `DIAS_INSUMO` más. La
 * escritura exige `lista`: una que sigue sirviendo espera sus tandas.
 */
export async function servirSiTermino(comandaId: string, ahora: Date): Promise<boolean> {
  const db = getDb()
  const pendientes = await db
    .select({ id: creativos.id })
    .from(creativos)
    .where(and(eq(creativos.comandaId, comandaId), inArray(creativos.estado, PENDIENTES)))
    .limit(1)
  if (pendientes.length > 0) return false
  return db.transaction(async (tx) => {
    const [servida] = await tx
      .update(comandas)
      .set({ estado: 'servida', servidaEn: ahora, actualizadaEn: ahora })
      .where(and(eq(comandas.id, comandaId), eq(comandas.estado, 'lista')))
      .returning({ id: comandas.id })
    if (!servida) return false
    await tx.insert(comandaEventos).values({ comandaId, estado: 'servida', creadoEn: ahora })
    await tx
      .update(insumos)
      .set({ expiraEn: new Date(ahora.getTime() + DIAS_INSUMO * 86_400_000) })
      .where(and(eq(insumos.comandaId, comandaId), isNull(insumos.expiraEn)))
    return true
  })
}
