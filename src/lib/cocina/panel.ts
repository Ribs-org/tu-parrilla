import { createHash } from 'node:crypto'
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, max, sql } from 'drizzle-orm'
import { comandaEventos, comandas, creativos, getDb, insumos, latidos, preguntas, users, type EntregaDeComanda, type EstadoComanda } from '@/db'
import { prioridadDelDueno } from '@/lib/planes/prioridad'
import { CANCELABLES, EN_MARCHA } from './estados'
import { ordenarFila } from './fila'
import { clasificarCocina, type EstadoDeLaCocina } from './latido'
import { instruccionDe } from './pedido'
import { entregaSinVer } from './tarjeta'

// Lo que la pestaña La Cocina lee y escribe para su dueño: sus comandas con su línea de tiempo, si
// la cocina está abierta, y cancelar. Todo por dueño; lo de los demás entra solo como una cuenta
// —cuántas comandas hay antes en la fila—, nunca como filas. Las consultas van en serie: son
// chicas, y varias en paralelo contra el pooler ya colgaron una corrida (`docs/pendientes.md`).

// Si la cocina está abierta y cómo atiende, sin base: en `latido.ts`. Se reexporta para los que ya
// lo leían de acá.
export { MINUTOS_SIN_LATIDO, etaEnLaFila, type EstadoDeLaCocina } from './latido'

/** Lo que se guarda lo crudo de una comanda después de terminada. */
export const DIAS_INSUMO = 14
/** Cuántas comandas muestra la pestaña, las más nuevas. */
export const LIMITE_COMANDAS_PANEL = 50

export const COMANDA_NO_CANCELABLE = 'Esa comanda ya está en el horno o terminó: no se puede cancelar.'
export const COMANDA_AJENA = 'Esa comanda no existe.'

/**
 * Si la cocina está abierta y cómo atiende —sola, a mano o cerrada—, según los latidos de todos sus
 * trabajadores (`clasificarCocina`, en `latido.ts`). Son uno o dos: la tabla tiene una fila por
 * trabajador.
 */
export async function estadoDeLaCocina(ahora: Date): Promise<EstadoDeLaCocina> {
  const filas = await getDb().select().from(latidos).orderBy(desc(latidos.en)).limit(20)
  return clasificarCocina(filas, ahora)
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
  /** «Tu instrucción al chef», si la dejó. */
  instruccion: string | null
  /** Cuántos creativos esperan en el mesón. */
  enElMeson: number
  /** Cuántas comandas van antes en la fila; solo mientras espera. */
  antes: number | null
  cancelable: boolean
  eventos: EventoDelPanel[]
  /** Lo que el chef pregunta y espera respuesta; solo mientras la comanda está en `pregunta`. */
  pregunta: PreguntaDelPanel | null
  /** La entrega que el dueño todavía no vio salir (`entregaSinVer`): la tarjeta la anima una vez. */
  entrega: EntregaDeComanda | null
}

export type PreguntaDelPanel = {
  id: string
  texto: string
  /** Null: la respuesta es libre. */
  opciones: string[] | null
  plazo: Date
  porDefecto: string
  /** De dónde salió la comanda para preguntar, y adonde vuelve: dice el tramo del recorrido. */
  vuelveA: EstadoComanda
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
  // Las preguntas que esperan, de estas comandas y de este dueño: a lo más una por comanda.
  const abiertas = propias.some((c) => c.estado === 'pregunta')
    ? await db
        .select()
        .from(preguntas)
        .where(and(inArray(preguntas.comandaId, ids), eq(preguntas.ownerId, ownerId), isNull(preguntas.respondidaEn)))
    : []

  // La fila entera, como la ve el chef: sin ella no se sabe cuántas van antes. De las ajenas solo
  // se lee lo que ordena —dueño, tipo y hora—, y lo único que sale de acá es una cuenta.
  const orden = propias.some((c) => c.estado === 'recibida')
    ? ordenarFila(
        await db
          .select({ id: comandas.id, ownerId: comandas.ownerId, tipo: comandas.tipo, creadaEn: comandas.creadaEn, prioridad: prioridadDelDueno(comandas.ownerId) })
          .from(comandas)
          .innerJoin(users, eq(users.id, comandas.ownerId))
          .where(and(eq(comandas.estado, 'recibida'), isNotNull(users.cocinaDesde))),
      ).map((c) => c.id)
    : []

  return propias.map((c) => {
    const lugar = orden.indexOf(c.id)
    const abierta = c.estado === 'pregunta' ? abiertas.find((p) => p.comandaId === c.id) : undefined
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
      instruccion: instruccionDe(c.pedido),
      enElMeson: enMesa.find((m) => m.comandaId === c.id)?.n ?? 0,
      antes: c.estado === 'recibida' && lugar >= 0 ? lugar : null,
      cancelable: CANCELABLES.has(c.estado),
      eventos: eventos
        .filter((e) => e.comandaId === c.id)
        .map((e) => ({ estado: e.estado, mensaje: e.mensaje, eta: e.eta, creadoEn: e.creadoEn })),
      pregunta: abierta
        ? {
            id: abierta.id,
            texto: abierta.texto,
            opciones: abierta.opciones ?? null,
            plazo: abierta.plazo,
            porDefecto: abierta.porDefecto,
            vuelveA: abierta.estadoPrevio,
          }
        : null,
      entrega: entregaSinVer(c.estado, c.entregaVista ?? null),
    }
  })
}

/**
 * Anota que el dueño vio salir esa entrega, para que la animación no se repita: ni al volver, ni en
 * otro navegador. Solo la suya, y solo si la comanda sigue en ese momento: si mientras miraba la
 * primera tanda la comanda quedó lista, `lista` sigue sin ver y sale cuando la mire. No toca
 * `actualizada_en`: no es un cambio de la comanda, y la vigía no tiene por qué recargar por esto.
 */
export async function verEntrega(ownerId: string, id: string, entrega: EntregaDeComanda): Promise<boolean> {
  const filas = await getDb()
    .update(comandas)
    .set({ entregaVista: entrega })
    .where(and(eq(comandas.id, id), eq(comandas.ownerId, ownerId), eq(comandas.estado, entrega)))
    .returning({ id: comandas.id })
  return filas.length > 0
}

export type PulsoDeLaCocina = {
  /** Cuántas comandas del dueño están en marcha (`EN_MARCHA`): sin ninguna, nadie pregunta. */
  vivas: number
  /** Cambia cuando cambia algo de lo que muestra la tarjeta; no dice qué. */
  firma: string
}

/**
 * Lo mínimo para saber si la tarjeta de La Cocina quedó vieja, sin armarla: lo pregunta el panel
 * cada pocos segundos mientras hay comandas en marcha (`/api/admin/cocina/pulso`), y solo si la
 * firma cambió vuelve a pedir la página. Entran en la firma las comandas del dueño (cuántas y la
 * última vez que alguna cambió), lo que tiene en el mesón, cómo atiende la cocina y, mientras
 * alguna suya espera, cuántas esperan en total: cuando el chef toma la de otro, la suya avanza en
 * la fila. Va hecha un resumen para no contar afuera cuántas comandas hay de los demás.
 */
export async function pulsoDeLaCocina(ownerId: string, ahora: Date): Promise<PulsoDeLaCocina> {
  const db = getDb()
  const [propias] = await db
    .select({
      n: count(),
      vivas: sql<number>`count(*) filter (where ${inArray(comandas.estado, [...EN_MARCHA])})`.mapWith(Number),
      esperan: sql<number>`count(*) filter (where ${eq(comandas.estado, 'recibida')})`.mapWith(Number),
      ultima: max(comandas.actualizadaEn),
    })
    .from(comandas)
    .where(eq(comandas.ownerId, ownerId))
  const [{ mesa } = { mesa: 0 }] = await db
    .select({ mesa: count() })
    .from(creativos)
    .where(and(eq(creativos.ownerId, ownerId), eq(creativos.estado, 'mesa')))
  const [{ fila } = { fila: 0 }] = propias?.esperan
    ? await db
        .select({ fila: count() })
        .from(comandas)
        .innerJoin(users, eq(users.id, comandas.ownerId))
        .where(and(eq(comandas.estado, 'recibida'), isNotNull(users.cocinaDesde)))
    : []
  // Cómo atiende —sola, a mano o cerrada—, no solo si late: la línea de arriba cambia con eso.
  const { atiende } = await estadoDeLaCocina(ahora)
  const partes = [propias?.n ?? 0, propias?.ultima?.toISOString() ?? '', mesa, fila, atiende]
  return {
    vivas: propias?.vivas ?? 0,
    firma: createHash('sha256').update(partes.join('|')).digest('hex').slice(0, 16),
  }
}

/**
 * La cancela, si es suya y no está en el horno. La escritura repite la condición: si el chef la
 * metió al horno entre medio, no se cancela. Lo que eligió de la cámara de frío sigue en la cámara;
 * lo crudo con archivo propio, de antes de la cámara, se guarda `DIAS_INSUMO` más.
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
    // Solo lo crudo con archivo propio, el de antes de la cámara de frío: lo que vino de la cámara no vence.
    await tx
      .update(insumos)
      .set({ expiraEn: new Date(ahora.getTime() + DIAS_INSUMO * 86_400_000) })
      .where(and(eq(insumos.comandaId, id), isNull(insumos.materialId)))
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
