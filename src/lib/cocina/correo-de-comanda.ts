import type { EstadoComanda } from '@/db/schema'
import type { Tema } from '@/lib/tema'
import { MESON, cortes } from '@/lib/vocabulario'
import { NOMBRE_ESTADO, tandasEnPalabras } from './nombres'
import { DIAS_INSUMO } from './panel'

// Los correos que le llegan al dueño de una comanda: cuando el chef le entrega —la primera tanda en
// el mesón y la comanda lista—, cuando termina mal —rechazada al revisarla o fallida a medio
// camino— y cuando el chef le pregunta algo («Avisos», en
// `docs/superpowers/specs/2026-10-22-la-cocina-design.md`). Sin consultas: lo arma
// `avisarDeLaComanda` (`avisar.ts`) con lo que lee, y las pruebas lo leen tal cual. En el modo de
// la cuenta, como el resto de los avisos: de día el mesón es la bandeja.

/** Los cambios que avisan cada vez que pasan. `servida` no: llega siempre después de `lista`, y la hace el dueño. */
export const AVISAN: ReadonlySet<EstadoComanda> = new Set(['lista', 'rechazada', 'fallida'])
export type AvisoDeComanda = 'sirviendo' | 'lista' | 'rechazada' | 'fallida'

/**
 * El correo que le debe al dueño el paso de `de` a `a`, o null. `sirviendo` avisa solo al entrar,
 * no en cada tanda que sigue: lo que importa es que ya hay algo para programar, y la segunda tanda
 * es más de lo mismo. Como el chef nunca vuelve a `sirviendo` desde otro estado, entrar es la
 * primera vez.
 */
export function avisoDelCambio(de: EstadoComanda, a: EstadoComanda): AvisoDeComanda | null {
  if (a === 'sirviendo') return de === 'sirviendo' ? null : 'sirviendo'
  return AVISAN.has(a) ? (a as AvisoDeComanda) : null
}

/**
 * El ajuste con que el dueño apaga estos correos (la tabla `ajustes`, `src/lib/ajustes.ts`), desde
 * Tu Cuenta. Sin fila, salen: es lo que esperaba quien ya tenía la cocina antes de que se pudieran
 * apagar. Apaga los de la comanda —las entregas y los finales—, no el de una pregunta del chef, que
 * tiene plazo, ni el aviso al teléfono.
 */
export const CLAVE_CORREOS_DE_LA_COCINA = 'cocina_correos'
export const CORREOS_APAGADOS = 'apagados'

export function correosApagados(valor: string | null): boolean {
  return valor === CORREOS_APAGADOS
}

export type ComandaQueAvisa = {
  id: string
  estado: AvisoDeComanda
  /** El nombre del archivo del plato principal, para reconocerla; null si no lo tiene. */
  principal: string | null
  /** Lo que el chef escribió al rechazarla o darla por fallida. */
  motivo: string | null
  /** Lo que el chef dijo en ese cambio (su `mensaje`): va en el correo de una entrega. */
  mensaje?: string | null
  /** El asunto que mandó el chef con el cambio, ya saneado (`asuntoDe`, en `api.ts`); sin él, el de siempre. */
  asunto?: string | null
  /** Cuántos creativos de esa comanda esperan en el mesón. */
  enElMeson: number
  /** El «1 de 5» al servir; sin él, el correo no lo dice. */
  tandas?: { servidas: number; total: number | null }
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

/** «El chef: «Aquí su pedido»», con su línea en blanco, si dejó mensaje; nada si no. */
function loQueDijo(mensaje: string | null | undefined): string[] {
  const m = mensaje?.trim()
  return m ? [`El chef: «${m}»`, ''] : []
}

/**
 * El asunto y el cuerpo del aviso. `sitio` es el origen del panel (`https://tu-parrilla.cl`), o
 * vacío si no se sabe: el enlace queda como ruta. Si el chef mandó un asunto, reemplaza al de
 * siempre; el cuerpo no cambia.
 */
export function correoDeComanda(c: ComandaQueAvisa, sitio: string, tema: Tema = 'noche'): { subject: string; text: string } {
  const meson = `${sitio}/admin/ia/meson?comanda=${c.id}`
  const cocina = `${sitio}/admin/ia`
  const donde = MESON[tema].toLowerCase()
  const pie = [
    'Te escribimos cuando sale la primera tanda y cuando la comanda termina. Cómo va cada una, paso a paso, está en La Cocina.',
    `Si no quieres estos correos, apágalos en Tu Cuenta: ${sitio}/admin/cuenta`,
  ].join('\n')
  const asunto = (deSiempre: string) => c.asunto?.trim() || deSiempre

  if (c.estado === 'sirviendo') {
    const tandas = c.tandas ? ` Van ${tandasEnPalabras(c.tandas.servidas, c.tandas.total, tema)}.` : ''
    const que =
      c.enElMeson > 0
        ? `El chef empezó a servir ${cual(c.principal)}: te dejó ${loQueDejo(c.enElMeson, tema)}.${tandas}`
        : `El chef empezó a servir ${cual(c.principal)}: lo primero está llegando a ${donde}.${tandas}`
    return {
      subject: asunto(`Salió la primera tanda: ${cual(c.principal)}`),
      text: [
        que,
        '',
        ...loQueDijo(c.mensaje),
        `Míralo en ${donde}: ${meson}`,
        '',
        'Lo demás sigue en la cocina: te escribimos de nuevo cuando esté lista. Mientras, puedes programar lo que ya llegó.',
        '',
        pie,
      ].join('\n'),
    }
  }

  if (c.estado === 'lista') {
    const que =
      c.enElMeson > 0
        ? `El chef terminó ${cual(c.principal)}: te dejó ${loQueDejo(c.enElMeson, tema)}.`
        : `El chef terminó ${cual(c.principal)}. Lo que entregó ya no está en ${donde}: lo programaste o lo descartaste.`
    return {
      subject: asunto(`${NOMBRE_ESTADO.lista[tema]}: ${cual(c.principal)}`),
      text: [
        que,
        '',
        ...loQueDijo(c.mensaje),
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
    subject: asunto(`${NOMBRE_ESTADO[c.estado][tema]}: ${cual(c.principal)}`),
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
