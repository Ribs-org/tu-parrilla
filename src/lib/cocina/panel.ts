import { and, asc, count, desc, eq, inArray, isNotNull } from 'drizzle-orm'
import { comandaEventos, comandas, creativos, getDb, insumos, latidos, users, type EstadoComanda } from '@/db'
import { CANCELABLES } from './estados'
import { ordenarFila } from './fila'

// Lo que la pestaña La Cocina lee y escribe para su dueño: sus comandas con su línea de tiempo, si
// la cocina está abierta, y cancelar. Todo por dueño; lo de los demás entra solo como una cuenta
// —cuántas comandas hay antes en la fila—, nunca como filas. Las consultas van en serie: son
// chicas, y varias en paralelo contra el pooler ya colgaron una corrida (`docs/pendientes.md`).

/** Sin latido por más de esto, la cocina está cerrada por ahora. */
export const MINUTOS_SIN_LATIDO = 10
/** Lo que se guarda lo crudo de una comanda después de terminada. */
export const DIAS_INSUMO = 14
/** Cuántas comandas muestra la pestaña, las más nuevas. */
export const LIMITE_COMANDAS_PANEL = 50

export const COMANDA_NO_CANCELABLE = 'Esa comanda ya está en el horno o terminó: no se puede cancelar.'
export const COMANDA_AJENA = 'Esa comanda no existe.'

export type EstadoDeLaCocina = {
  abierta: boolean
  /** Cuándo latió por última vez, si alguna vez latió. */
  ultimoLatido: Date | null
  /** Lo que el chef contó en su último latido, si lo contó: lo usa la hora estimada. */
  trabajos: number | null
  minutosPorComanda: number | null
}

function numero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : null
}

/** Si la cocina está abierta: algún trabajador latió en los últimos `MINUTOS_SIN_LATIDO`. */
export async function estadoDeLaCocina(ahora: Date): Promise<EstadoDeLaCocina> {
  const [ultimo] = await getDb().select().from(latidos).orderBy(desc(latidos.en)).limit(1)
  if (!ultimo) return { abierta: false, ultimoLatido: null, trabajos: null, minutosPorComanda: null }
  const datos = (ultimo.datos ?? {}) as Record<string, unknown>
  return {
    abierta: ahora.getTime() - ultimo.en.getTime() <= MINUTOS_SIN_LATIDO * 60_000,
    ultimoLatido: ultimo.en,
    trabajos: numero(datos.trabajos),
    minutosPorComanda: numero(datos.minutosPorComanda),
  }
}

/**
 * La hora estimada de una que espera, antes de que el chef dé la suya: las que van antes más ella,
 * repartidas entre los trabajos que hace a la vez, a lo que tarda una en promedio. Sin esos datos
 * en el último latido, no se adivina.
 */
export function etaEnLaFila(antes: number, cocina: EstadoDeLaCocina, ahora: Date): Date | null {
  if (!cocina.minutosPorComanda) return null
  const tandas = Math.ceil((antes + 1) / (cocina.trabajos ?? 1))
  return new Date(ahora.getTime() + tandas * cocina.minutosPorComanda * 60_000)
}

export type EventoDelPanel = { estado: EstadoComanda; mensaje: string | null; eta: Date | null; creadoEn: Date }

export type ComandaDelPanel = {
  id: string
  estado: EstadoComanda
  creadaEn: Date
  eta: Date | null
  mensaje: string | null
  motivo: string | null
  tandasServidas: number
  tandasTotal: number | null
  /** El nombre del plato principal, para reconocerla. */
  principal: string | null
  /** Cuántos creativos esperan en el mesón. */
  enElMeson: number
  /** Cuántas comandas van antes en la fila; solo mientras espera. */
  antes: number | null
  cancelable: boolean
  eventos: EventoDelPanel[]
}

/** Las comandas del dueño, de la más nueva a la más vieja, con lo que la tarjeta muestra. */
export async function comandasDelDueno(ownerId: string): Promise<ComandaDelPanel[]> {
  const db = getDb()
  const propias = await db
    .select()
    .from(comandas)
    .where(eq(comandas.ownerId, ownerId))
    .orderBy(desc(comandas.creadaEn))
    .limit(LIMITE_COMANDAS_PANEL)
  if (propias.length === 0) return []
  const ids = propias.map((c) => c.id)

  const eventos = await db
    .select()
    .from(comandaEventos)
    .where(inArray(comandaEventos.comandaId, ids))
    .orderBy(asc(comandaEventos.creadoEn))
  const principales = await db
    .select({ comandaId: insumos.comandaId, nombre: insumos.nombre })
    .from(insumos)
    .where(and(inArray(insumos.comandaId, ids), eq(insumos.tipo, 'principal')))
  const enMesa = await db
    .select({ comandaId: creativos.comandaId, n: count() })
    .from(creativos)
    .where(and(inArray(creativos.comandaId, ids), eq(creativos.estado, 'mesa')))
    .groupBy(creativos.comandaId)

  // La fila entera, como la ve el chef: sin ella no se sabe cuántas van antes. De las ajenas solo
  // se lee lo que ordena —dueño, tipo y hora—, y lo único que sale de acá es una cuenta.
  const orden = propias.some((c) => c.estado === 'recibida')
    ? ordenarFila(
        await db
          .select({ id: comandas.id, ownerId: comandas.ownerId, tipo: comandas.tipo, creadaEn: comandas.creadaEn })
          .from(comandas)
          .innerJoin(users, eq(users.id, comandas.ownerId))
          .where(and(eq(comandas.estado, 'recibida'), isNotNull(users.cocinaDesde))),
      ).map((c) => c.id)
    : []

  return propias.map((c) => {
    const lugar = orden.indexOf(c.id)
    return {
      id: c.id,
      estado: c.estado,
      creadaEn: c.creadaEn,
      eta: c.eta,
      mensaje: c.mensaje,
      motivo: c.motivo,
      tandasServidas: c.tandasServidas,
      tandasTotal: c.tandasTotal,
      principal: principales.find((p) => p.comandaId === c.id)?.nombre ?? null,
      enElMeson: enMesa.find((m) => m.comandaId === c.id)?.n ?? 0,
      antes: c.estado === 'recibida' && lugar >= 0 ? lugar : null,
      cancelable: CANCELABLES.has(c.estado),
      eventos: eventos
        .filter((e) => e.comandaId === c.id)
        .map((e) => ({ estado: e.estado, mensaje: e.mensaje, eta: e.eta, creadoEn: e.creadoEn })),
    }
  })
}

/**
 * La cancela, si es suya y no está en el horno. La escritura repite la condición: si el chef la
 * metió al horno entre medio, no se cancela. Lo crudo que llevaba se guarda `DIAS_INSUMO` más.
 */
export async function cancelarComanda(
  ownerId: string,
  id: string,
  ahora: Date,
): Promise<{ ok: true } | { falla: 'no-existe' | 'no-cancelable' }> {
  const db = getDb()
  const [actual] = await db
    .select({ estado: comandas.estado })
    .from(comandas)
    .where(and(eq(comandas.id, id), eq(comandas.ownerId, ownerId)))
  if (!actual) return { falla: 'no-existe' }
  // Las tres cosas o ninguna: una comanda cancelada sin su evento, o con lo crudo sin vencimiento,
  // quedaría contando otra historia.
  const cancelada = await db.transaction(async (tx) => {
    const [fila] = await tx
      .update(comandas)
      .set({ estado: 'cancelada', actualizadaEn: ahora })
      .where(and(eq(comandas.id, id), eq(comandas.ownerId, ownerId), inArray(comandas.estado, [...CANCELABLES])))
      .returning({ id: comandas.id })
    if (!fila) return false
    await tx.insert(comandaEventos).values({ comandaId: id, estado: 'cancelada', creadoEn: ahora })
    await tx
      .update(insumos)
      .set({ expiraEn: new Date(ahora.getTime() + DIAS_INSUMO * 86_400_000) })
      .where(eq(insumos.comandaId, id))
    return true
  })
  return cancelada ? { ok: true } : { falla: 'no-cancelable' }
}

/** Le enciende o le apaga la cocina a un usuario. Apagarla es despedir al chef: deja de ver sus comandas. */
export async function encenderCocinaDe(usuarioId: string, encender: boolean, ahora: Date): Promise<boolean> {
  const [fila] = await getDb()
    .update(users)
    .set({ cocinaDesde: encender ? ahora : null })
    .where(eq(users.id, usuarioId))
    .returning({ id: users.id })
  return Boolean(fila)
}
