import { and, asc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { comandaEventos, comandas, getDb, insumos, marcas, materiales, users, type Usuario } from '@/db'
import { esChoqueCon } from '@/lib/choque-de-unicidad'
import { claseDe } from './bodega'
import { COCINA_APAGADA } from './subidas'
import { ordenarFila } from './fila'
import { minutosDe, rolEnLaComanda, type MarcaBasica, type PedidoDeComanda } from './pedido'

// Colgar una comanda desde el panel: lo que el dueño eligió de su cámara de frío, lo que pidió y su
// marca, congelado en la receta (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «La comanda
// nueva», y `2026-11-02-la-bodega-design.md`). Todo por dueño: un material de otro, o uno que ya se
// sacó de la cámara, no entra.

export const PRINCIPAL_NO_SIRVE = 'El plato principal ya no está en la cámara, o no es un video: elige otro.'
export const ACOMPANAMIENTO_NO_SIRVE = 'Uno de los materiales ya no está en la cámara: recarga la página y vuelve a elegir.'

type Dueno = Pick<Usuario, 'id' | 'cocinaDesde'>

/** La marca del dueño: la primera, que en la fase 0 es la única. */
export async function marcaDe(ownerId: string): Promise<MarcaBasica | null> {
  const [m] = await getDb().select().from(marcas).where(eq(marcas.ownerId, ownerId)).orderBy(asc(marcas.creadaEn)).limit(1)
  return m ? { nombre: m.nombre, handle: m.handle, acento: m.acento, ctaTexto: m.ctaTexto } : null
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

class MaterialesCambiaron extends Error {
  constructor(public falla: 'principal' | 'acompanamiento') {
    super(falla)
  }
}

export type ResultadoPedido = { ok: true; id: string; repetida: boolean } | { falla: 'apagada' | 'principal' | 'acompanamiento' }

/** Lo que se le dice al dueño cuando no se colgó, desde el panel o desde el teléfono. */
export const NO_SE_PIDIO: Record<Exclude<ResultadoPedido, { ok: true }>['falla'], string> = {
  apagada: COCINA_APAGADA,
  principal: PRINCIPAL_NO_SIRVE,
  acompanamiento: ACOMPANAMIENTO_NO_SIRVE,
}

/**
 * La cuelga: guarda la marca (la crea la primera vez), congela la receta, crea la comanda con su
 * primer paso y una foto de cada material elegido (`insumos`), todo en una transacción. Los
 * materiales se leen bloqueados: si alguien los saca de la cámara a la vez, uno de los dos espera
 * al otro, y o la comanda se cuelga con ellos o no se cuelga. Mandarla otra vez con la misma `ref`
 * devuelve la misma.
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

  const ids = [pedido.principal, ...pedido.acompanamientos.map((a) => a.id)]
  try {
    const id = await db.transaction(async (tx) => {
      const elegidos = await tx
        .select()
        .from(materiales)
        .where(and(inArray(materiales.id, ids), eq(materiales.ownerId, dueno.id), isNull(materiales.borradoEn)))
        .for('update')
      const principal = elegidos.find((m) => m.id === pedido.principal)
      if (!principal || claseDe(principal.tipoArchivo) !== 'video') throw new MaterialesCambiaron('principal')
      const acompanamientos = pedido.acompanamientos.map((a) => {
        const m = elegidos.find((x) => x.id === a.id)
        if (!m) throw new MaterialesCambiaron('acompanamiento')
        return { material: m, tipo: rolEnLaComanda(claseDe(m.tipoArchivo), a.rol) }
      })

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
      // La foto de cada material: su nombre, su uso y su peso de hoy, y la misma URL. El archivo
      // sigue siendo de la cámara, así que el insumo no vence.
      const fotos = [{ material: principal, tipo: 'principal' as const }, ...acompanamientos]
      await tx.insert(insumos).values(
        fotos.map(({ material: m, tipo }, posicion) => ({
          ownerId: dueno.id,
          comandaId: comanda!.id,
          materialId: m.id,
          tipo,
          subtipo: tipo === 'principal' ? pedido.subtipo : null,
          uso: m.uso,
          posicion,
          nombre: m.nombre,
          url: m.url,
          bytes: m.bytes,
          duracionS: m.duracionS,
          tipoArchivo: m.tipoArchivo,
          derechosEn: m.derechosEn,
          creadoEn: ahora,
        })),
      )
      return comanda!.id
    })
    return { ok: true, id, repetida: false }
  } catch (error) {
    if (error instanceof MaterialesCambiaron) return { falla: error.falla }
    // Dos envíos a la vez del mismo formulario: el segundo choca con la `ref` y devuelve el primero.
    if (esChoqueCon(error, 'comandas_owner_ref_key')) {
      const otra = await repetida()
      if (otra) return otra
    }
    throw error
  }
}
