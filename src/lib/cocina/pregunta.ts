// Las preguntas del chef, sin base: cómo llega una del chef y cómo se valida, cómo llega una
// respuesta del dueño, y cómo se dicen el plazo y lo que pasa si nadie contesta. El diseño
// (`docs/superpowers/specs/2026-10-22-la-cocina-design.md`, «El chef no es 100 % automático»): cada
// pregunta trae su plazo y su opción por defecto, dichos en la misma pregunta —«Si no me contestas
// antes de las 18:00, sigo con la parte de ventas»—, y una comanda nunca queda colgada para
// siempre. Lo lee también el navegador (la tarjeta de La Cocina), así que acá no entra la base.

import type { EstadoComanda, Pregunta } from '@/db/schema'

/** Lo más largo que puede ser una pregunta, y una respuesta libre. */
export const MAX_TEXTO_PREGUNTA = 500
export const MAX_RESPUESTA = 500
/** Las opciones, cuando las hay: de dos a cuatro, cortas, para tocar una. */
export const MIN_OPCIONES = 2
export const MAX_OPCIONES = 4
export const MAX_OPCION = 100
/**
 * El plazo, contado desde que llega la pregunta. Al menos un cuarto de hora, para que el dueño
 * alcance a ver el correo; a lo más tres días, para que un fin de semana quepa y una comanda no
 * quede parada una semana esperando.
 */
export const PLAZO_MINIMO_MINUTOS = 15
export const PLAZO_MAXIMO_HORAS = 72

// Lo que lee el chef cuando una pregunta no vale (`POST /api/cocina/comandas/{id}/preguntas`).
export const TEXTO_FALTA = `«texto» es la pregunta, de 1 a ${MAX_TEXTO_PREGUNTA} caracteres.`
export const OPCIONES_ILEGIBLES = `«opciones» son de ${MIN_OPCIONES} a ${MAX_OPCIONES} textos distintos, de hasta ${MAX_OPCION} caracteres cada uno, o null para una respuesta libre.`
export const PLAZO_ILEGIBLE = `«plazo» tiene que ser una fecha ISO con su zona, entre ${PLAZO_MINIMO_MINUTOS} minutos y ${PLAZO_MAXIMO_HORAS} horas desde ahora.`
export const POR_DEFECTO_ILEGIBLE = `«porDefecto» es lo que haces si nadie contesta: una de las «opciones», o un texto de hasta ${MAX_RESPUESTA} caracteres si la respuesta es libre.`
export const YA_PREGUNTA = 'Esa comanda ya espera la respuesta de otra pregunta: pregunta de nuevo cuando llegue.'

// Lo que lee el dueño al responder, en el panel o en el teléfono.
export const PREGUNTA_NO_ESPERA = 'Esa pregunta ya no espera respuesta: se respondió, pasó su plazo o la comanda se canceló.'
export const RESPUESTA_FALTA = 'Escribe tu respuesta al chef.'
export const RESPUESTA_LARGA = `Tu respuesta llega hasta ${MAX_RESPUESTA} caracteres.`
export const RESPUESTA_NO_ES_OPCION = 'Elige una de las opciones del chef.'

export type PreguntaNueva = {
  texto: string
  /** Null: la respuesta es libre. */
  opciones: string[] | null
  plazo: Date
  porDefecto: string
}

function textoLimpio(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  return limpio.length > 0 && limpio.length <= max ? limpio : null
}

/** Una pregunta tal como la manda el chef, validada, o la frase de por qué no. */
export function preguntaDe(cuerpo: Record<string, unknown>, ahora: Date): PreguntaNueva | { error: string } {
  const texto = textoLimpio(cuerpo.texto, MAX_TEXTO_PREGUNTA)
  if (!texto) return { error: TEXTO_FALTA }

  let opciones: string[] | null = null
  if (cuerpo.opciones !== undefined && cuerpo.opciones !== null) {
    if (!Array.isArray(cuerpo.opciones)) return { error: OPCIONES_ILEGIBLES }
    const limpias = cuerpo.opciones.map((o) => textoLimpio(o, MAX_OPCION))
    if (limpias.some((o) => o === null)) return { error: OPCIONES_ILEGIBLES }
    const unicas = limpias as string[]
    if (unicas.length < MIN_OPCIONES || unicas.length > MAX_OPCIONES) return { error: OPCIONES_ILEGIBLES }
    if (new Set(unicas.map((o) => o.toLowerCase())).size !== unicas.length) return { error: OPCIONES_ILEGIBLES }
    opciones = unicas
  }

  // Con su zona, como la `eta`: una hora sin offset se leería en la zona del servidor.
  if (typeof cuerpo.plazo !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(cuerpo.plazo)) return { error: PLAZO_ILEGIBLE }
  const plazo = new Date(cuerpo.plazo)
  const falta = plazo.getTime() - ahora.getTime()
  if (Number.isNaN(falta) || falta < PLAZO_MINIMO_MINUTOS * 60_000 || falta > PLAZO_MAXIMO_HORAS * 3_600_000) {
    return { error: PLAZO_ILEGIBLE }
  }

  const porDefecto = textoLimpio(cuerpo.porDefecto, opciones ? MAX_OPCION : MAX_RESPUESTA)
  if (!porDefecto) return { error: POR_DEFECTO_ILEGIBLE }
  // Con opciones, la de por defecto es una de ellas, escrita igual: es la que se marca sola.
  const entreLasOpciones = opciones?.find((o) => o.toLowerCase() === porDefecto.toLowerCase())
  if (opciones && !entreLasOpciones) return { error: POR_DEFECTO_ILEGIBLE }

  return { texto, opciones, plazo, porDefecto: entreLasOpciones ?? porDefecto }
}

/**
 * La respuesta del dueño, validada contra la pregunta: con opciones, una de ellas (se guarda como
 * la escribió el chef); libre, un texto de hasta `MAX_RESPUESTA`.
 */
export function leerRespuesta(opciones: readonly string[] | null, crudo: unknown): string | { error: string } {
  if (typeof crudo !== 'string' || crudo.trim() === '') return { error: opciones ? RESPUESTA_NO_ES_OPCION : RESPUESTA_FALTA }
  const limpia = crudo.trim()
  if (opciones) {
    const opcion = opciones.find((o) => o.toLowerCase() === limpia.toLowerCase())
    return opcion ?? { error: RESPUESTA_NO_ES_OPCION }
  }
  return limpia.length <= MAX_RESPUESTA ? limpia : { error: RESPUESTA_LARGA }
}

/** Una pregunta como la lee el chef, con su respuesta si llegó (`docs/cocina-api.md`). */
export type PreguntaParaElChef = {
  id: string
  texto: string
  opciones: string[] | null
  plazo: string
  porDefecto: string
  /** El estado al que vuelve la comanda cuando llega la respuesta: el de donde salió. */
  vuelveA: EstadoComanda
  /** Lo que contestó el dueño, o la opción por defecto si pasó el plazo; null mientras espera. */
  respuesta: string | null
  respondidaEn: string | null
  /** Si la respuesta es la opción por defecto porque pasó el plazo sin que nadie contestara. */
  porPlazo: boolean
  creadaEn: string
}

export function preguntaParaElChef(p: Pregunta): PreguntaParaElChef {
  return {
    id: p.id,
    texto: p.texto,
    opciones: p.opciones ?? null,
    plazo: p.plazo.toISOString(),
    porDefecto: p.porDefecto,
    vuelveA: p.estadoPrevio,
    respuesta: p.respuesta,
    respondidaEn: p.respondidaEn?.toISOString() ?? null,
    porPlazo: p.porPlazo,
    creadaEn: p.creadaEn.toISOString(),
  }
}

/** Lo que queda en la línea de tiempo cuando la pregunta se cierra. */
export function mensajeDeRespuesta(respuesta: string, porPlazo: boolean): string {
  return porPlazo ? `Pasó el plazo: el chef sigue con «${respuesta}».` : `Respondiste: «${respuesta}».`
}

/** Las partes de una fecha en una zona, con la hora de 0 a 23. */
function partes(fecha: Date, zona: string) {
  const f = new Intl.DateTimeFormat('es-CL', {
    timeZone: zona,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const p = Object.fromEntries(f.formatToParts(fecha).map((x) => [x.type, x.value]))
  return { dia: `${p.year}-${p.month}-${p.day}`, semana: p.weekday, numero: p.day, mes: p.month, hora: `${p.hour}:${p.minute}` }
}

/**
 * «hoy antes de las 18:00», «mañana antes de las 09:30» o «el sábado 7 de noviembre antes de las
 * 18:00», en la zona de quien lo lee.
 */
export function plazoEnPalabras(plazo: Date, ahora: Date, zona: string): string {
  const p = partes(plazo, zona)
  const hoy = partes(ahora, zona).dia
  const manana = partes(new Date(ahora.getTime() + 86_400_000), zona).dia
  const cuando = p.dia === hoy ? 'hoy' : p.dia === manana ? 'mañana' : `el ${p.semana} ${p.numero} de ${p.mes}`
  return `${cuando} antes de las ${p.hora}`
}

/** «Si no contestas hoy antes de las 18:00, el chef sigue con «La parte de ventas».» */
export function siNoContestas(plazo: Date, porDefecto: string, ahora: Date, zona: string): string {
  return `Si no contestas ${plazoEnPalabras(plazo, ahora, zona)}, el chef sigue con «${porDefecto}».`
}
