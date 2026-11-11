// Lo que dice cada aviso al teléfono, sin base. Una notificación se lee de una pasada, así que es
// la frase corta del correo que sale al mismo tiempo, con las palabras del modo de la cuenta
// (`src/lib/vocabulario.ts`): de día no se quema nada, se echa a perder.
import { NOMBRE_ESTADO } from '@/lib/cocina/nombres'
import type { AvisoDeComanda } from '@/lib/cocina/correo-de-comanda'
import { networkLabel } from '@/lib/networks'
import type { Tema } from '@/lib/tema'
import { LIBRO, MESON, SE_ENFRIA, SE_QUEMO, cortes, nombreDe } from '@/lib/vocabulario'
import { recortar, type AvisoAlTelefono } from './expo'

function cuenta(red: string, handle: string | null): string {
  return handle ? `${networkLabel(red)} · ${handle}` : networkLabel(red)
}

/** «Instagram», «Instagram y YouTube», «Instagram, Facebook y YouTube». */
function enLista(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? ''
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

/**
 * El resumen de La Mesa: cuántos comentarios entraron desde el último y en qué redes. No lleva el
 * texto de ninguno: lo que escribió otra persona no pasa por los servidores de los avisos.
 */
export function avisoDeComentarios(n: number, redes: readonly string[]): AvisoAlTelefono {
  const mesa = nombreDe('/admin/comments')
  const nombres = [...new Set(redes)].map((r) => networkLabel(r)).sort()
  return {
    titulo: n === 1 ? `Un comentario nuevo en ${mesa}` : `${n} comentarios nuevos en ${mesa}`,
    cuerpo: `${n === 1 ? 'Espera' : 'Esperan'} tu respuesta${nombres.length ? `, en ${enLista(nombres)}` : ''}.`,
    tipo: 'comentarios',
  }
}

/** Un destino que se quemó: la red, el principio del texto y el motivo. */
export function avisoDeQuemado(
  p: { postId: string; red: string; handle: string | null; texto: string; motivo: string },
  tema: Tema,
): AvisoAlTelefono {
  const texto = recortar(p.texto, 50) || '(sin texto)'
  return {
    titulo: `${SE_QUEMO[tema]}: ${cuenta(p.red, p.handle)}`,
    cuerpo: `«${texto}» no salió.${p.motivo.trim() ? ` ${p.motivo.trim()}` : ''}`,
    tipo: 'quemado',
    id: p.postId,
  }
}

/** Una cuenta cuyo fierro se enfría (el permiso vence esta semana) o se apagó. De día, el cuchillo. */
export function avisoDeFierro(
  c: { red: string; handle: string | null; estado: 'enfriandose' | 'frio' },
  tema: Tema,
): AvisoAlTelefono {
  const nombre = cuenta(c.red, c.handle)
  const fierros = nombreDe('/admin/accounts', tema)
  if (c.estado === 'enfriandose') {
    return {
      titulo: `${nombre} ${SE_ENFRIA[tema]}`,
      cuerpo: `Su permiso vence esta semana. Reconéctala en ${fierros}, en el panel, antes de que ${
        tema === 'dia' ? 'pierda el filo' : 'se apague'
      }.`,
      tipo: 'fierro',
    }
  }
  return {
    titulo: tema === 'dia' ? `${nombre} quedó sin filo` : `Se apagó ${nombre}`,
    cuerpo: `Así no publica: lo que tenga programado no va a salir. Reconéctala en ${fierros}, en el panel.`,
    tipo: 'fierro',
  }
}

/** La pregunta del chef, tal cual: se contesta en La Cocina del teléfono. */
export function avisoDePregunta(p: { comandaId: string; principal: string | null; texto: string }): AvisoAlTelefono {
  return {
    titulo: `El chef te pregunta: ${p.principal ? `«${p.principal}»` : 'tu comanda'}`,
    cuerpo: p.texto,
    tipo: 'pregunta',
    id: p.comandaId,
  }
}

/** Una comanda que entregó o terminó: la primera tanda, lista en el mesón, rechazada o fallida. */
export function avisoDeComanda(
  c: { id: string; estado: AvisoDeComanda; principal: string | null; motivo: string | null; enElMeson: number },
  tema: Tema,
): AvisoAlTelefono {
  const cual = c.principal ? `«${c.principal}»` : 'tu comanda'
  const donde = MESON[tema].toLowerCase()
  if (c.estado === 'sirviendo') {
    return {
      titulo: `Salió la primera tanda: ${cual}`,
      cuerpo:
        c.enElMeson > 0
          ? `El chef te dejó ${cortes(c.enElMeson, tema)} en ${donde}; lo demás sigue en la cocina.`
          : `Lo primero está llegando a ${donde}; lo demás sigue en la cocina.`,
      tipo: 'comanda',
      id: c.id,
    }
  }
  const titulo = `${NOMBRE_ESTADO[c.estado][tema]}: ${cual}`
  const cuerpo =
    c.estado === 'lista'
      ? c.enElMeson > 0
        ? `El chef te dejó ${cortes(c.enElMeson, tema)} en ${donde}, para programar en el panel.`
        : 'El chef la terminó.'
      : c.motivo?.trim() || 'El chef no dejó el motivo.'
  return { titulo, cuerpo, tipo: 'comanda', id: c.id }
}

/** La respuesta del equipo en el libro de sugerencias (de día, la caja). */
export function avisoDeRespuesta(s: { id: string; respuesta: string }, tema: Tema): AvisoAlTelefono {
  return {
    titulo: `Te respondimos en ${LIBRO[tema].toLowerCase()}`,
    cuerpo: s.respuesta,
    tipo: 'sugerencia',
    id: s.id,
  }
}

/** «1.200»: el punto de los miles escrito a mano; el `Intl` en español no agrupa los de cuatro cifras. */
function conMiles(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Un hito de «Lo que trajo» (`src/lib/hitos.ts`), apenas se alcanza: «Tu corte pasó las 1.000
 * vistas» —de día, la pieza— con el comienzo de su texto. Lleva al detalle del corte.
 */
export function avisoDeHito(h: { postId: string; umbral: number; texto: string }, tema: Tema): AvisoAlTelefono {
  const vistas = h.umbral === 1_000_000 ? 'el millón de vistas' : `las ${conMiles(h.umbral)} vistas`
  const texto = recortar(h.texto, 60)
  return {
    titulo: `${tema === 'dia' ? 'Tu pieza' : 'Tu corte'} pasó ${vistas}`,
    cuerpo: texto ? `«${texto}». Míralo en Lo que trajo.` : 'Míralo en Lo que trajo.',
    tipo: 'hito',
    id: h.postId,
  }
}

/**
 * Lo que trajeron los cortes en el día, si no hubo hito: «Hoy: +120 me gusta y +9 comentarios en
 * tus cortes.», solo lo que subió. Sin los «me gusta» de YouTube, que no deja restar
 * (`politica-youtube.ts`). Lleva a La Parrilla.
 */
export function avisoDelDia(d: { meGusta: number; comentarios: number }, tema: Tema): AvisoAlTelefono {
  const partes = [
    d.meGusta > 0 ? `+${conMiles(d.meGusta)} me gusta` : null,
    d.comentarios > 0 ? `+${conMiles(d.comentarios)} ${d.comentarios === 1 ? 'comentario' : 'comentarios'}` : null,
  ].filter((p): p is string => p !== null)
  return {
    titulo: 'Lo que trajo hoy',
    cuerpo: `Hoy: ${enLista(partes)} en tus ${tema === 'dia' ? 'piezas' : 'cortes'}.`,
    tipo: 'bueno',
  }
}
