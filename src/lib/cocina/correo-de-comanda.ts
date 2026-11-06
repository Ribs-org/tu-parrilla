import type { EstadoComanda } from '@/db/schema'
import type { Tema } from '@/lib/tema'
import { MESON, cortes } from '@/lib/vocabulario'
import { NOMBRE_ESTADO } from './nombres'
import { DIAS_INSUMO } from './panel'

// Los correos que le llegan al dueño de una comanda: cuando termina —lista en el mesón, rechazada
// al revisarla o fallida a medio camino— y cuando el chef le pregunta algo («Avisos», en
// `docs/superpowers/specs/2026-10-22-la-cocina-design.md`). Sin consultas: lo arma
// `avisarDeLaComanda` (`avisar.ts`) con lo que lee, y las pruebas lo leen tal cual. En el modo de
// la cuenta, como el resto de los avisos: de día el mesón es la bandeja.

/** Los cambios que avisan. `servida` no: llega siempre después de `lista`, y la hace el dueño. */
export const AVISAN: ReadonlySet<EstadoComanda> = new Set(['lista', 'rechazada', 'fallida'])
export type AvisoDeComanda = 'lista' | 'rechazada' | 'fallida'

export type ComandaQueAvisa = {
  id: string
  estado: AvisoDeComanda
  /** El nombre del archivo del plato principal, para reconocerla; null si no lo tiene. */
  principal: string | null
  /** Lo que el chef escribió al rechazarla o darla por fallida. */
  motivo: string | null
  /** Cuántos creativos de esa comanda esperan en el mesón. */
  enElMeson: number
}

/** «video9.mp4», entre comillas, o «tu comanda» si no hay nombre. */
function cual(principal: string | null): string {
  return principal ? `«${principal}»` : 'tu comanda'
}

/** «12 cortes en el mesón, listos para programar» (de día, «12 piezas en la bandeja, listas…»). */
function loQueDejo(n: number, tema: Tema): string {
  const donde = MESON[tema].toLowerCase()
  const listos = tema === 'dia' ? (n === 1 ? 'lista' : 'listas') : n === 1 ? 'listo' : 'listos'
  return `${cortes(n, tema)} en ${donde}, ${listos} para programar`
}

/**
 * El asunto y el cuerpo del aviso. `sitio` es el origen del panel (`https://tu-parrilla.cl`), o
 * vacío si no se sabe: el enlace queda como ruta.
 */
export function correoDeComanda(c: ComandaQueAvisa, sitio: string, tema: Tema = 'noche'): { subject: string; text: string } {
  const meson = `${sitio}/admin/ia/meson?comanda=${c.id}`
  const cocina = `${sitio}/admin/ia`
  const donde = MESON[tema].toLowerCase()
  const pie = 'Este correo llega una vez por comanda, cuando termina. Cómo va cada una, paso a paso, está en La Cocina.'

  if (c.estado === 'lista') {
    const que =
      c.enElMeson > 0
        ? `El chef terminó ${cual(c.principal)}: te dejó ${loQueDejo(c.enElMeson, tema)}.`
        : `El chef terminó ${cual(c.principal)}. Lo que entregó ya no está en ${donde}: lo programaste o lo descartaste.`
    return {
      subject: `${NOMBRE_ESTADO.lista[tema]}: ${c.principal ? `«${c.principal}»` : 'tu comanda'}`,
      text: [
        que,
        '',
        c.enElMeson > 0 ? `Míralo en ${donde}: ${meson}` : `Mírala en La Cocina: ${cocina}`,
        '',
        'Programa lo que te guste y descarta lo que no, diciendo por qué: el chef aprende de eso. Lo que nadie programa en 30 días se borra solo.',
        '',
        pie,
      ].join('\n'),
    }
  }

  const rechazada = c.estado === 'rechazada'
  const que = rechazada
    ? `El chef revisó ${cual(c.principal)} y no la puede ${tema === 'dia' ? 'preparar' : 'cocinar'}:`
    : `Algo se rompió en la cocina y el chef no pudo terminar ${cual(c.principal)}:`
  const alcanzo =
    !rechazada && c.enElMeson > 0
      ? [`Lo que alcanzó a salir te espera en ${donde}: ${cortes(c.enElMeson, tema)}. ${meson}`, '']
      : []
  return {
    subject: `${NOMBRE_ESTADO[c.estado][tema]}: ${c.principal ? `«${c.principal}»` : 'tu comanda'}`,
    text: [
      que,
      '',
      c.motivo?.trim() || 'El chef no dejó el motivo.',
      '',
      ...alcanzo,
      `Lo que subiste para esa comanda se guarda ${DIAS_INSUMO} días y después se borra. Si lo arreglas, pide una comanda nueva: ${sitio}/admin/ia/pedir`,
      '',
      `La comanda, en La Cocina: ${cocina}`,
      '',
      pie,
    ].join('\n'),
  }
}

export type PreguntaQueAvisa = {
  /** El nombre del archivo del plato principal, para reconocer la comanda; null si no lo tiene. */
  principal: string | null
  texto: string
  opciones: string[] | null
  /** «Si no contestas hoy antes de las 18:00, el chef sigue con «…».», ya en la zona del dueño (`siNoContestas`). */
  siNoContestas: string
}

/**
 * El correo de cuando el chef pregunta: la pregunta tal cual, sus opciones, el plazo con lo que
 * pasa si nadie contesta, y dónde se responde. Sale uno por pregunta: lo pide solo la llamada que
 * la hizo (`/api/cocina/comandas/{id}/preguntas`).
 */
export function correoDePregunta(p: PreguntaQueAvisa, sitio: string): { subject: string; text: string } {
  return {
    subject: `El chef te pregunta: ${p.principal ? `«${p.principal}»` : 'tu comanda'}`,
    text: [
      `El chef tiene una duda sobre ${cual(p.principal)}:`,
      '',
      p.texto,
      '',
      ...(p.opciones ? [`Las opciones: ${p.opciones.map((o) => `«${o}»`).join(', ')}.`, ''] : []),
      p.siNoContestas,
      '',
      `Respóndele en La Cocina: ${sitio}/admin/ia`,
      '',
      'Mientras espera tu respuesta, la comanda no avanza. Si ya no la quieres, también la puedes cancelar desde ahí.',
      '',
      'Este correo llega una vez por pregunta.',
    ].join('\n'),
  }
}
