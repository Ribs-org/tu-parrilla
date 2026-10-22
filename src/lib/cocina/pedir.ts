import { and, asc, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { comandaEventos, comandas, getDb, insumos, marcas, users, type Usuario } from '@/db'
import { esChoqueCon } from '@/lib/choque-de-unicidad'
import { ordenarFila } from './fila'
import { minutosDe, type MarcaBasica, type PedidoDeComanda } from './pedido'
import type { InsumoSubido } from './subidas'

// Colgar una comanda desde el panel: lo que el dueño subió, lo que pidió y su marca, congelado en la
// receta (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «La comanda nueva»). Todo por
// dueño: un insumo de otro, o uno que ya está en otra comanda, no entra.

export const PRINCIPAL_NO_SIRVE = 'El plato principal ya no está, o ya es parte de otra comanda: súbelo de nuevo.'
export const ACOMPANAMIENTO_NO_SIRVE = 'Uno de los acompañamientos ya no está, o ya es parte de otra comanda: sácalo y súbelo de nuevo.'
export const ARCHIVOS_CAMBIARON = 'Uno de los archivos pasó a otra comanda mientras pedías: recarga la página y revisa la comanda.'

type Dueno = Pick<Usuario, 'id' | 'cocinaDesde'>

/** La marca del dueño: la primera, que en la fase 0 es la única. */
export async function marcaDe(ownerId: string): Promise<MarcaBasica | null> {
  const [m] = await getDb().select().from(marcas).where(eq(marcas.ownerId, ownerId)).orderBy(asc(marcas.creadaEn)).limit(1)
  return m ? { nombre: m.nombre, handle: m.handle, acento: m.acento, ctaTexto: m.ctaTexto } : null
}

/**
 * Lo que subió y todavía no pidió, del más nuevo al más viejo: si la página se recargó después de
 * subir un largo de horas, el formulario lo ofrece en vez de pedirlo de nuevo. Se borra solo a los
 * tres días (`barrerSubidas`).
 */
export async function insumosSueltos(ownerId: string): Promise<InsumoSubido[]> {
  const filas = await getDb()
    .select()
    .from(insumos)
    .where(and(eq(insumos.ownerId, ownerId), isNull(insumos.comandaId), isNull(insumos.borradoEn)))
    .orderBy(desc(insumos.creadoEn))
  return filas.map((i) => ({
    id: i.id,
    tipo: i.tipo,
    subtipo: i.subtipo,
    nombre: i.nombre,
    bytes: i.bytes,
    duracionS: i.duracionS,
    tipoArchivo: i.tipoArchivo,
  }))
}

/** El lugar que tendría en la fila una comanda que se cuelgue ahora: cuántas irían antes. */
export async function lugarDeUnaNueva(ownerId: string, ahora: Date): Promise<number> {
  const fila = await getDb()
    .select({ id: comandas.id, ownerId: comandas.ownerId, tipo: comandas.tipo, creadaEn: comandas.creadaEn })
    .from(comandas)
    .innerJoin(users, eq(users.id, comandas.ownerId))
    .where(and(eq(comandas.estado, 'recibida'), isNotNull(users.cocinaDesde)))
  const NUEVA = 'nueva'
  return ordenarFila([...fila, { id: NUEVA, ownerId, tipo: 'tanda' as const, creadaEn: ahora }]).findIndex((c) => c.id === NUEVA)
}

class InsumosCambiaron extends Error {}

export type ResultadoPedido =
  | { ok: true; id: string; repetida: boolean }
  | { falla: 'apagada' | 'principal' | 'acompanamiento' | 'cambiaron' }

/**
 * La cuelga: guarda la marca (la crea la primera vez), congela la receta, crea la comanda con su
 * primer paso y le amarra sus insumos, todo en una transacción. Mandarla otra vez con la misma
 * `ref` devuelve la misma. Si entre que se leyó y se escribió un insumo pasó a otra comanda, no se
 * cuelga nada.
 */
export async function pedirComanda(dueno: Dueno, pedido: PedidoDeComanda, ahora: Date): Promise<ResultadoPedido> {
  if (!dueno.cocinaDesde) return { falla: 'apagada' }
  const db = getDb()
  const repetida = async () => {
    const [ya] = await db
      .select({ id: comandas.id })
      .from(comandas)
      .where(and(eq(comandas.ownerId, dueno.id), eq(comandas.ref, pedido.ref)))
    return ya ? ({ ok: true, id: ya.id, repetida: true } as const) : null
  }
  const ya = await repetida()
  if (ya) return ya

  const ids = [pedido.principal, ...pedido.acompanamientos]
  const libres = await db
    .select()
    .from(insumos)
    .where(and(inArray(insumos.id, ids), eq(insumos.ownerId, dueno.id), isNull(insumos.comandaId), isNull(insumos.borradoEn)))
  const principal = libres.find((i) => i.id === pedido.principal)
  if (!principal || principal.tipo !== 'principal') return { falla: 'principal' }
  for (const id of pedido.acompanamientos) {
    const i = libres.find((x) => x.id === id)
    if (!i || i.tipo === 'principal') return { falla: 'acompanamiento' }
  }

  try {
    const id = await db.transaction(async (tx) => {
      const [existente] = await tx.select().from(marcas).where(eq(marcas.ownerId, dueno.id)).orderBy(asc(marcas.creadaEn)).limit(1)
      const [marca] = existente
        ? await tx.update(marcas).set({ ...pedido.marca, actualizadaEn: ahora }).where(eq(marcas.id, existente.id)).returning()
        : await tx
            .insert(marcas)
            .values({ ownerId: dueno.id, ...pedido.marca, creadaEn: ahora, actualizadaEn: ahora })
            .returning()
      const [comanda] = await tx
        .insert(comandas)
        .values({
          ownerId: dueno.id,
          marcaId: marca!.id,
          ref: pedido.ref,
          tipo: 'tanda',
          estado: 'recibida',
          pedido: {
            formatos: pedido.formatos,
            cantidad: pedido.cantidad,
            notas: pedido.notas,
            paraCuando: pedido.paraCuando,
            estilos: 'chef',
          },
          // Lo que no cambia aunque el dueño cambie su marca mañana: lo que está en el horno no cambia.
          receta: {
            marca: { id: marca!.id, nombre: marca!.nombre, handle: marca!.handle, acento: marca!.acento, cta: marca!.ctaTexto },
            estilos: 'chef',
          },
          minutos: minutosDe(principal.duracionS),
          creadaEn: ahora,
          actualizadaEn: ahora,
        })
        .returning({ id: comandas.id })
      await tx.insert(comandaEventos).values({ comandaId: comanda!.id, estado: 'recibida', creadoEn: ahora })
      const amarrados = await tx
        .update(insumos)
        .set({ comandaId: comanda!.id })
        .where(and(inArray(insumos.id, ids), eq(insumos.ownerId, dueno.id), isNull(insumos.comandaId), isNull(insumos.borradoEn)))
        .returning({ id: insumos.id })
      if (amarrados.length !== ids.length) throw new InsumosCambiaron()
      return comanda!.id
    })
    return { ok: true, id, repetida: false }
  } catch (error) {
    if (error instanceof InsumosCambiaron) return { falla: 'cambiaron' }
    // Dos envíos a la vez del mismo formulario: el segundo choca con la `ref` y devuelve el primero.
    if (esChoqueCon(error, 'comandas_owner_ref_key')) {
      const otra = await repetida()
      if (otra) return otra
    }
    throw error
  }
}
