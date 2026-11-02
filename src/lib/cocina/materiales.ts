import { and, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { comandas, getDb, insumos, materiales, users } from '@/db'
import { borrar } from '@/lib/storage'
import { esUuid } from '@/lib/uuid'
import type { UsoMaterial } from './bodega'
import { EN_MARCHA } from './estados'
import { paraElPanel, type MaterialSubido } from './subidas'

// La cámara de frío de La Cocina (de día, la nevera), lo que lee y escribe el panel: lo que hay
// adentro, renombrarlo, cambiarle el uso y sacarlo
// (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`). Todo por dueño: el material de otro
// no existe para quien pregunta. Subir está en `subidas.ts`; pedir con lo de adentro, en `pedir.ts`.

/** Un material como lo muestra la cámara: con cuántas comandas en marcha lo usan, que no lo dejan sacar. */
export type MaterialDeLaCamara = MaterialSubido & { enMarcha: number }

/** Lo que hay en la cámara del dueño, de lo más nuevo a lo más viejo. */
export async function materialesDeLaCamara(ownerId: string): Promise<MaterialDeLaCamara[]> {
  const db = getDb()
  const filas = await db
    .select()
    .from(materiales)
    .where(and(eq(materiales.ownerId, ownerId), isNull(materiales.borradoEn)))
    .orderBy(desc(materiales.creadoEn))
  if (filas.length === 0) return []
  const enUso = await db
    .select({ materialId: insumos.materialId, n: count() })
    .from(insumos)
    .innerJoin(comandas, eq(comandas.id, insumos.comandaId))
    .where(
      and(
        eq(insumos.ownerId, ownerId),
        inArray(
          insumos.materialId,
          filas.map((m) => m.id),
        ),
        inArray(comandas.estado, [...EN_MARCHA]),
      ),
    )
    .groupBy(insumos.materialId)
  return filas.map((m) => ({ ...paraElPanel(m), enMarcha: enUso.find((u) => u.materialId === m.id)?.n ?? 0 }))
}

/** Le cambia el nombre o el uso a un material del dueño. Lo que ya se pidió no cambia: el insumo guardó su foto. */
export async function editarMaterial(
  ownerId: string,
  id: string,
  cambios: { nombre: string; uso: UsoMaterial | null },
): Promise<{ ok: true } | { falla: 'no-existe' }> {
  if (!esUuid(id)) return { falla: 'no-existe' }
  const [fila] = await getDb()
    .update(materiales)
    .set({ nombre: cambios.nombre, uso: cambios.uso })
    .where(and(eq(materiales.id, id), eq(materiales.ownerId, ownerId), isNull(materiales.borradoEn)))
    .returning({ id: materiales.id })
  return fila ? { ok: true } : { falla: 'no-existe' }
}

/**
 * Lo saca de la cámara y lo borra del almacén, si ninguna comanda en marcha lo usa. Con la fila del
 * material bloqueada: una comanda que se cuelga a la vez con él espera, y al seguir ya no lo
 * encuentra (o este espera a que la comanda quede escrita, y la ve). El archivo se borra antes de
 * soltar el candado: si el almacén falla, nada cambia y se puede volver a intentar. Si alguna
 * comanda lo usó, la fila queda con `borradoEn`, y sus insumos también, para la historia de esa
 * comanda; si nunca se usó, la fila se va.
 */
export async function sacarMaterial(ownerId: string, id: string, ahora: Date): Promise<{ ok: true } | { falla: 'no-existe' | 'en-uso' }> {
  if (!esUuid(id)) return { falla: 'no-existe' }
  return getDb().transaction(async (tx) => {
    const [m] = await tx
      .select({ id: materiales.id, url: materiales.url })
      .from(materiales)
      .where(and(eq(materiales.id, id), eq(materiales.ownerId, ownerId), isNull(materiales.borradoEn)))
      .for('update')
    if (!m) return { falla: 'no-existe' as const }
    const usos = await tx
      .select({ estado: comandas.estado })
      .from(insumos)
      .innerJoin(comandas, eq(comandas.id, insumos.comandaId))
      .where(and(eq(insumos.ownerId, ownerId), eq(insumos.materialId, id)))
    if (usos.some((u) => EN_MARCHA.has(u.estado))) return { falla: 'en-uso' as const }
    await borrar(m.url)
    if (usos.length > 0) {
      await tx
        .update(materiales)
        .set({ borradoEn: ahora })
        .where(and(eq(materiales.id, id), eq(materiales.ownerId, ownerId)))
      await tx
        .update(insumos)
        .set({ borradoEn: ahora })
        .where(and(eq(insumos.ownerId, ownerId), eq(insumos.materialId, id), isNull(insumos.borradoEn)))
    } else {
      await tx.delete(materiales).where(and(eq(materiales.id, id), eq(materiales.ownerId, ownerId)))
    }
    return { ok: true as const }
  })
}

/**
 * La cuota de la cámara de un usuario, en bytes; null vuelve a la de siempre. La cambia el admin
 * desde Los Maestros; un plan de pago, mañana, escribirá lo mismo.
 */
export async function cambiarCuotaDeLaCamara(usuarioId: string, bytes: number | null): Promise<boolean> {
  const [fila] = await getDb().update(users).set({ bodegaBytes: bytes }).where(eq(users.id, usuarioId)).returning({ id: users.id })
  return Boolean(fila)
}

/**
 * Cuánto ocupa cada usuario en la cámara, para Los Maestros. Cruza dueños a propósito: lo lee solo
 * la pantalla del admin, que ya lista a todos.
 */
export async function ocupadoPorUsuario(): Promise<Map<string, number>> {
  const filas = await getDb()
    .select({ ownerId: materiales.ownerId, bytes: sql<number>`coalesce(sum(${materiales.bytes}), 0)`.mapWith(Number) })
    .from(materiales)
    .where(isNull(materiales.borradoEn))
    .groupBy(materiales.ownerId)
  return new Map(filas.map((f) => [f.ownerId, f.bytes]))
}
