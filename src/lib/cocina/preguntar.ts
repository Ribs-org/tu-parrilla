import { and, asc, eq, isNull, lte } from 'drizzle-orm'
import { comandaEventos, comandas, getDb, preguntas, type Comanda, type EstadoComanda, type Pregunta } from '@/db'
import { esUuid } from '@/lib/uuid'
import { comandaDelChef } from './cocina'
import { TERMINALES, puedePreguntar } from './estados'
import { leerRespuesta, mensajeDeRespuesta, PREGUNTA_NO_ESPERA, type PreguntaNueva } from './pregunta'

// Las preguntas del chef en la base: hacer una (el chef, `POST /api/cocina/comandas/{id}/preguntas`),
// contestarla (el dueño, desde La Cocina del panel o del teléfono) y, pasado el plazo, cerrarla con
// la opción por defecto (`vencerPreguntas`, en cada corrida del cron y cada vez que el chef lee).
// Mientras espera, la comanda está en `pregunta`; cerrarla, de cualquiera de las tres formas, la
// devuelve al estado de donde salió, y la línea de tiempo lo cuenta.

export type ResultadoPreguntar =
  /** `nueva` es false si era un reintento de la misma pregunta: ni otra fila ni otro correo. */
  | { ok: true; pregunta: Pregunta; comanda: Comanda; nueva: boolean }
  | { falla: 'no-existe' | 'sin-tomar' | 'terminada' | 'ya-pregunta' }
  | { falla: 'transicion'; de: EstadoComanda }

/**
 * El chef pregunta: la comanda pasa a `pregunta` y queda esperando al dueño. Se puede desde
 * `revisando` y `en_preparacion` (`PREGUNTAN_DESDE`). Mandar otra vez la misma pregunta mientras
 * espera devuelve la que ya está —un reintento es seguro—; otra distinta, no: una a la vez.
 *
 * La escritura exige el estado leído en su `where`, como `cambiarEstado`: si el dueño canceló entre
 * medio, no pregunta. Con eso, también, el correo al dueño sale de una sola llamada.
 */
export async function preguntar(comandaId: string, nueva: PreguntaNueva, ahora: Date): Promise<ResultadoPreguntar> {
  const actual = await comandaDelChef(comandaId)
  if (!actual) return { falla: 'no-existe' }
  if (actual.estado === 'recibida') return { falla: 'sin-tomar' }
  if (TERMINALES.has(actual.estado)) return { falla: 'terminada' }
  const db = getDb()
  if (actual.estado === 'pregunta') {
    const [abierta] = await db
      .select()
      .from(preguntas)
      .where(and(eq(preguntas.comandaId, comandaId), isNull(preguntas.respondidaEn)))
    if (abierta && abierta.texto === nueva.texto) return { ok: true, pregunta: abierta, comanda: actual, nueva: false }
    return { falla: 'ya-pregunta' }
  }
  if (!puedePreguntar(actual.estado)) return { falla: 'transicion', de: actual.estado }

  const escrita = await db.transaction(async (tx) => {
    const [comanda] = await tx
      .update(comandas)
      // El mensaje del paso anterior ya no es lo que pasa: lo que pasa es la pregunta.
      .set({ estado: 'pregunta', mensaje: null, actualizadaEn: ahora })
      .where(and(eq(comandas.id, comandaId), eq(comandas.estado, actual.estado)))
      .returning()
    if (!comanda) return null
    const [pregunta] = await tx
      .insert(preguntas)
      .values({
        comandaId,
        ownerId: comanda.ownerId,
        texto: nueva.texto,
        opciones: nueva.opciones,
        plazo: nueva.plazo,
        porDefecto: nueva.porDefecto,
        estadoPrevio: actual.estado,
        creadaEn: ahora,
      })
      .returning()
    await tx.insert(comandaEventos).values({ comandaId, estado: 'pregunta', mensaje: nueva.texto, eta: comanda.eta, creadoEn: ahora })
    return { comanda, pregunta: pregunta! }
  })
  if (!escrita) {
    // Alguien la movió entre la lectura y la escritura: el dueño la canceló, u otra petición del
    // chef preguntó primero. Se vuelve a mirar, para contestar lo que de verdad pasó.
    const ahoraEsta = await comandaDelChef(comandaId)
    if (!ahoraEsta) return { falla: 'no-existe' }
    if (TERMINALES.has(ahoraEsta.estado)) return { falla: 'terminada' }
    if (ahoraEsta.estado === 'pregunta') return preguntar(comandaId, nueva, ahora)
    return { falla: 'transicion', de: ahoraEsta.estado }
  }
  return { ok: true, ...escrita, nueva: true }
}

/** Para deshacer la transacción de `cerrar` cuando la comanda ya no esperaba. */
class YaNoEspera extends Error {}

/**
 * Cierra una pregunta con su respuesta y devuelve la comanda a donde estaba. Primero toma la
 * pregunta —con `respondida_en` nula en el `where`, así que de dos que cierran a la vez, la del
 * dueño y la del plazo, gana una sola—, y después la comanda, que tiene que seguir en `pregunta`:
 * si el dueño la canceló, no se cierra nada. Devuelve si la cerró.
 */
async function cerrar(p: Pregunta, respuesta: string, porPlazo: boolean, ahora: Date): Promise<boolean> {
  try {
    return await getDb().transaction(async (tx) => {
      const [tomada] = await tx
        .update(preguntas)
        .set({ respuesta, respondidaEn: ahora, porPlazo })
        .where(and(eq(preguntas.id, p.id), isNull(preguntas.respondidaEn)))
        .returning({ id: preguntas.id })
      if (!tomada) return false
      const [comanda] = await tx
        .update(comandas)
        .set({ estado: p.estadoPrevio, mensaje: null, actualizadaEn: ahora })
        .where(and(eq(comandas.id, p.comandaId), eq(comandas.estado, 'pregunta')))
        .returning({ eta: comandas.eta })
      if (!comanda) throw new YaNoEspera()
      await tx.insert(comandaEventos).values({
        comandaId: p.comandaId,
        estado: p.estadoPrevio,
        mensaje: mensajeDeRespuesta(respuesta, porPlazo),
        eta: comanda.eta,
        creadoEn: ahora,
      })
      return true
    })
  } catch (e) {
    if (e instanceof YaNoEspera) return false
    throw e
  }
}

export type ResultadoResponder = { ok: true } | { error: string }

/**
 * El dueño contesta una pregunta suya que sigue esperando: con opciones, una de ellas; libre, su
 * texto. Una respuesta que llega pasado el plazo cuenta mientras la opción por defecto no se haya
 * aplicado todavía: el chef recién se entera cuando se cierra, así que no hay nada que deshacer.
 */
export async function responderPregunta(ownerId: string, preguntaId: string, crudo: unknown, ahora: Date): Promise<ResultadoResponder> {
  if (!esUuid(preguntaId)) return { error: PREGUNTA_NO_ESPERA }
  const [fila] = await getDb()
    .select({ pregunta: preguntas, estado: comandas.estado })
    .from(preguntas)
    .innerJoin(comandas, eq(comandas.id, preguntas.comandaId))
    .where(and(eq(preguntas.id, preguntaId), eq(preguntas.ownerId, ownerId), eq(comandas.ownerId, ownerId)))
  if (!fila || fila.pregunta.respondidaEn || fila.estado !== 'pregunta') return { error: PREGUNTA_NO_ESPERA }
  const respuesta = leerRespuesta(fila.pregunta.opciones, crudo)
  if (typeof respuesta !== 'string') return respuesta
  return (await cerrar(fila.pregunta, respuesta, false, ahora)) ? { ok: true } : { error: PREGUNTA_NO_ESPERA }
}

/** Cuántas se cierran por vuelta, a lo más: son pocas, y la vuelta siguiente sigue. */
const POR_VUELTA = 100

/**
 * Las preguntas cuyo plazo pasó sin respuesta se cierran con su opción por defecto, y su comanda
 * vuelve a donde estaba: «pasado el plazo, el chef sigue con esa opción». Corre en cada corrida del
 * cron de publicación (cada cinco minutos) y cada vez que el chef lee sus comandas o sus respuestas,
 * así que el chef se entera en el minuto en que pregunta. Nunca lanza: lo llaman rutas que tienen
 * otra cosa que hacer. Devuelve cuántas cerró.
 */
export async function vencerPreguntas(ahora: Date = new Date()): Promise<number> {
  try {
    const vencidas = await getDb()
      .select({ pregunta: preguntas })
      .from(preguntas)
      .innerJoin(comandas, eq(comandas.id, preguntas.comandaId))
      .where(and(isNull(preguntas.respondidaEn), lte(preguntas.plazo, ahora), eq(comandas.estado, 'pregunta')))
      .orderBy(asc(preguntas.plazo))
      .limit(POR_VUELTA)
    let cerradas = 0
    for (const { pregunta } of vencidas) {
      if (await cerrar(pregunta, pregunta.porDefecto, true, ahora)) cerradas += 1
    }
    return cerradas
  } catch (error) {
    console.error('No se pudieron cerrar las preguntas vencidas:', String(error).slice(0, 300))
    return 0
  }
}
