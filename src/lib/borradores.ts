import 'server-only'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { borradorMedia, borradores, getDb } from '@/db'
import type { Campos } from './borrador'

/** Un archivo de un borrador, en el orden del carrusel. */
export type MediaDeBorrador = { url: string; mediaType: 'image' | 'video'; nombre: string }

/** Lo que el compositor necesita para volver a abrir un borrador. */
export type BorradorCargado = {
  id: string
  campos: Campos
  fecha: Date | null
  media: MediaDeBorrador[]
}

/** Lo que muestran la lista de borradores y el calendario. */
export type BorradorResumido = {
  id: string
  campos: Campos
  fecha: Date | null
  actualizadoEn: Date
  archivos: number
}

/** Los borradores del dueño, del tocado más recientemente al más viejo. */
export async function listarBorradores(ownerId: string): Promise<BorradorResumido[]> {
  const db = getDb()
  const filas = await db
    .select({
      id: borradores.id,
      campos: borradores.campos,
      fecha: borradores.fecha,
      actualizadoEn: borradores.actualizadoEn,
    })
    .from(borradores)
    .where(eq(borradores.ownerId, ownerId))
    .orderBy(desc(borradores.actualizadoEn))
  if (filas.length === 0) return []

  // Por los ids que la consulta de arriba ya filtró por dueño: `borrador_media` no tiene
  // columna de dueño propia, hereda por su clave foránea.
  const media = await db
    .select({ borradorId: borradorMedia.borradorId })
    .from(borradorMedia)
    .where(inArray(borradorMedia.borradorId, filas.map((f) => f.id)))
  const archivos = new Map<string, number>()
  for (const m of media) archivos.set(m.borradorId, (archivos.get(m.borradorId) ?? 0) + 1)

  return filas.map((f) => ({ ...f, archivos: archivos.get(f.id) ?? 0 }))
}

/** Un borrador con su media, o null si no existe o es de otro. */
export async function cargarBorrador(ownerId: string, id: string): Promise<BorradorCargado | null> {
  const db = getDb()
  const [fila] = await db
    .select({ id: borradores.id, campos: borradores.campos, fecha: borradores.fecha })
    .from(borradores)
    .where(and(eq(borradores.id, id), eq(borradores.ownerId, ownerId)))
    .limit(1)
  if (!fila) return null
  const media = await db
    .select({ url: borradorMedia.blobUrl, mediaType: borradorMedia.mediaType, nombre: borradorMedia.nombre })
    .from(borradorMedia)
    .where(eq(borradorMedia.borradorId, fila.id))
    .orderBy(asc(borradorMedia.position))
  return { ...fila, media }
}

/**
 * Crea o actualiza un borrador, con su media entera reemplazada: el compositor manda
 * siempre la lista completa, en orden.
 *
 * Un id que ya no existe —se programó o se descartó en otra pestaña mientras esta seguía
 * escribiendo— no se recrea: vuelve `perdido`, y el compositor deja de guardar. Recrearlo
 * resucitaría un borrador que alguien ya decidió sacar.
 */
export async function guardarBorrador(
  ownerId: string,
  datos: { id: string | null; campos: Campos; fecha: Date | null; media: MediaDeBorrador[] },
): Promise<{ id: string } | { perdido: true }> {
  return getDb().transaction(async (tx) => {
    let id: string
    if (datos.id) {
      const [fila] = await tx
        .update(borradores)
        .set({ campos: datos.campos, fecha: datos.fecha, actualizadoEn: new Date() })
        .where(and(eq(borradores.id, datos.id), eq(borradores.ownerId, ownerId)))
        .returning({ id: borradores.id })
      if (!fila) return { perdido: true as const }
      id = fila.id
    } else {
      const [fila] = await tx
        .insert(borradores)
        .values({ ownerId, campos: datos.campos, fecha: datos.fecha })
        .returning({ id: borradores.id })
      id = fila!.id
    }

    // El id ya está probado como del dueño: o lo devolvió el UPDATE filtrado por dueño, o
    // lo acaba de crear el INSERT a su nombre.
    await tx.delete(borradorMedia).where(eq(borradorMedia.borradorId, id))
    if (datos.media.length > 0) {
      await tx.insert(borradorMedia).values(
        datos.media.map((m, position) => ({
          borradorId: id,
          blobUrl: m.url,
          mediaType: m.mediaType,
          nombre: m.nombre,
          position,
        })),
      )
    }
    return { id }
  })
}

/**
 * Saca un borrador; su media se va con él por la clave foránea. Los archivos quedan en el
 * bucket sin nadie que los nombre, y el barrido de huérfanos los borra a la hora.
 */
export async function borrarBorrador(ownerId: string, id: string): Promise<void> {
  await getDb()
    .delete(borradores)
    .where(and(eq(borradores.id, id), eq(borradores.ownerId, ownerId)))
}
