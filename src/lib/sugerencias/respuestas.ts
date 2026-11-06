// La respuesta del equipo a una sugerencia, sin base ni red: qué se acepta, el correo que le
// llega a la persona y el comentario que queda en el issue. Lo prueba `respuestas.test.ts`.
//
// La respuesta se escribe dentro de Tu Parrilla —en Las Sugerencias, o con la llave del admin— y
// la persona la lee en el libro. El correo es para que se entere; el comentario, para que el
// issue diga lo que se le contestó. El repositorio es público: el comentario no lleva el nombre
// ni el correo de la persona, aunque quien respondió los haya escrito («Hola, Juan»).

import type { Tema } from '@/lib/tema'
import { esUuid } from '@/lib/uuid'
import { LIBRO, nombreDe } from '@/lib/vocabulario'
import { citar } from './formato'
import type { TipoSugerencia } from './tipos'

/** El largo máximo de una respuesta: el doble de lo que se le deja escribir a la persona. */
export const MAX_RESPUESTA = 4000

export const RESPUESTA_VACIA = 'Escribe la respuesta antes de guardarla.'
export const RESPUESTA_LARGA = `La respuesta es muy larga: el máximo son ${MAX_RESPUESTA} caracteres.`
export const RESPUESTA_SIN_CUAL =
  'Falta cuál sugerencia: manda "issue" (el número del issue en GitHub) o "id" (el de la sugerencia).'
export const SUGERENCIA_NO_EXISTE = 'No hay ninguna sugerencia con ese issue o ese id.'
export const SOLO_EL_ADMIN = 'Solo el admin responde sugerencias: esta llave es de otra cuenta.'

/** La firma con que termina todo comentario del equipo en GitHub (`AGENTS.md`). */
export const FIRMA_DEL_EQUIPO = '---\n💻 Equipo de desarrollo de parrilla'

/** Lo que va en lugar del nombre de la persona, si quien respondió lo escribió. */
export const NOMBRE_QUITADO = '(nombre quitado)'

/** Cuántos caracteres de lo que escribió la persona van en el correo, para que lo reconozca. */
const RECORTE_EN_EL_CORREO = 300

/** La respuesta limpia, o la frase de por qué no sirve. */
export function validarRespuesta(bruto: unknown): { texto: string } | { error: string } {
  const texto = typeof bruto === 'string' ? bruto.replace(/\r\n?/g, '\n').trim() : ''
  if (!texto) return { error: RESPUESTA_VACIA }
  if (texto.length > MAX_RESPUESTA) return { error: RESPUESTA_LARGA }
  return { texto }
}

/** Cuál sugerencia se responde: por el número de su issue, o por su id. */
export type Cual = { issue: number } | { id: string }

/**
 * Lo que llega a `POST /api/sugerencias/respuesta`: `{ "issue": 321, "respuesta": "…" }` o
 * `{ "id": "<uuid>", "respuesta": "…" }`. Con los dos, manda el id. Un número de issue escrito
 * como texto («321», «#321») también vale: es lo que copia un agente del título.
 */
export function pedidoDeRespuesta(cuerpo: unknown): { cual: Cual; texto: string } | { error: string } {
  const c = (cuerpo ?? {}) as { issue?: unknown; id?: unknown; respuesta?: unknown }
  let cual: Cual | null = null
  if (esUuid(c.id)) cual = { id: c.id.toLowerCase() }
  else {
    const issue = typeof c.issue === 'string' ? Number(c.issue.trim().replace(/^#/, '')) : c.issue
    if (typeof issue === 'number' && Number.isSafeInteger(issue) && issue > 0) cual = { issue }
  }
  if (!cual) return { error: RESPUESTA_SIN_CUAL }
  const valida = validarRespuesta(c.respuesta)
  if ('error' in valida) return valida
  return { cual, texto: valida.texto }
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * «6 nov 2026», en la zona de quien lo lee. Una zona que no existe cae en la de Chile. Los meses
 * van escritos acá y no los pone `Intl`: según la versión de ICU, el corto de es-CL es «sept» o
 * «nov.», y el panel, el correo y la app dirían cosas distintas.
 */
export function fechaCorta(fecha: Date | string, zona: string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  let partes: Intl.DateTimeFormatPart[]
  try {
    partes = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: zona }).formatToParts(d)
  } catch {
    partes = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'America/Santiago' }).formatToParts(d)
  }
  const p = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((x) => x.type === tipo)?.value ?? ''
  return `${Number(p('day'))} ${MESES[Number(p('month')) - 1] ?? ''} ${p('year')}`
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * El texto sin el nombre de la persona: el completo y cada palabra suya de tres letras o más,
 * como palabra entera y sin importar mayúsculas. Quita de más antes que de menos: un «Rosa» que
 * era un color se va igual.
 */
export function quitarNombre(texto: string, nombre: string | null | undefined): string {
  const limpio = nombre?.trim().replace(/\s+/g, ' ') ?? ''
  if (limpio.length < 2) return texto
  const partes = [limpio, ...limpio.split(' ').filter((p) => p.length >= 3)]
    .sort((a, b) => b.length - a.length)
    .map(escaparRegex)
  return texto.replace(new RegExp(`(?<![\\p{L}\\p{N}])(?:${partes.join('|')})(?![\\p{L}\\p{N}])`, 'giu'), NOMBRE_QUITADO)
}

/**
 * Una sugerencia como la ve la persona en el libro, la del panel y la del teléfono: con las fechas
 * en texto (cruzan al navegador y a la app) y `nueva` si tiene una respuesta que no abrió.
 */
export type SugerenciaDelLibro = {
  id: string
  tipo: TipoSugerencia
  texto: string
  creadaEn: string
  respuesta: string | null
  respondidaEn: string | null
  nueva: boolean
}

export function paraElLibro(f: {
  id: string
  tipo: TipoSugerencia
  texto: string
  creadaEn: Date
  respuesta: string | null
  respondidaEn: Date | null
  respuestaLeidaEn: Date | null
}): SugerenciaDelLibro {
  return {
    id: f.id,
    tipo: f.tipo,
    texto: f.texto,
    creadaEn: f.creadaEn.toISOString(),
    respuesta: f.respuesta,
    respondidaEn: f.respondidaEn?.toISOString() ?? null,
    nueva: f.respuesta !== null && f.respuestaLeidaEn === null,
  }
}

/** El comienzo de lo que escribió, en un renglón, para reconocerlo. */
function recorte(texto: string): string {
  const renglon = texto.replace(/\s+/g, ' ').trim()
  return renglon.length > RECORTE_EN_EL_CORREO ? `${renglon.slice(0, RECORTE_EN_EL_CORREO - 1).trimEnd()}…` : renglon
}

/**
 * El correo que le llega a la persona la primera vez que se le responde. Lleva la respuesta
 * entera —es suya, y es un gesto— y dónde volver a leerla. `sitio` es el origen del panel
 * (`https://tu-parrilla.cl`), o vacío si no se sabe: entonces el correo no lleva enlace.
 */
export function correoDeRespuesta(
  s: { texto: string; respuesta: string; creadaEn: Date; nombre: string | null; zona: string },
  sitio: string,
  tema: Tema = 'noche',
): { subject: string; text: string } {
  const libro = LIBRO[tema]
  const nombre = s.nombre?.trim().split(/\s+/)[0]
  const enlace = sitio ? ` (${sitio}/admin)` : ''
  return {
    subject: `Te respondimos en ${libro.toLowerCase()}`,
    text: [
      `Hola${nombre ? ` ${nombre}` : ''}:`,
      '',
      `Te respondimos lo que nos escribiste en ${libro.toLowerCase()} de Tu Parrilla.`,
      '',
      `Lo que nos escribiste el ${fechaCorta(s.creadaEn, s.zona)}:`,
      `«${recorte(s.texto)}»`,
      '',
      'Lo que te respondemos:',
      s.respuesta,
      '',
      `También lo puedes leer en el panel, en Ajustes → ${libro} → «Lo que nos escribiste»${enlace}, o en la app del teléfono, al final de Ajustes.`,
      '',
      'Gracias por escribirnos.',
      'El equipo que hace Tu Parrilla',
    ].join('\n'),
  }
}

/**
 * El comentario del issue con la respuesta, citada como lo que escribió la persona: sin su nombre
 * ni su correo, sin menciones ni referencias a otros issues. `cambiada` es que ya tenía una
 * respuesta y se reemplazó; esa vez no sale correo, y el comentario no lo promete.
 */
export function comentarioDeRespuesta(respuesta: string, opciones: { cambiada: boolean; nombre: string | null }): string {
  const encabezado = opciones.cambiada
    ? '**Cambiamos la respuesta a quien escribió esta sugerencia.** La nueva le aparece sin leer en el libro de sugerencias de Tu Parrilla:'
    : '**Le respondimos a quien escribió esta sugerencia.** Lo lee dentro de Tu Parrilla, en el libro de sugerencias, y le avisamos por correo:'
  return [
    encabezado,
    '',
    citar(quitarNombre(respuesta, opciones.nombre)),
    '',
    `<sub>Sin su nombre ni su correo: este repositorio es público. La respuesta se cambia en ${nombreDe('/admin/sugerencias')}, en el panel, o con \`POST /api/sugerencias/respuesta\`.</sub>`,
    '',
    FIRMA_DEL_EQUIPO,
    '',
  ].join('\n')
}
