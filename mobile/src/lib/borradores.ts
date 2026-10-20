import { opcionesParaGuardar, subidos, type Archivo, type MediaSubida, type OpcionesApp } from './publicar'
import { LA_PARRILLA, type Tema } from './tema'
import type { BorradorResumido, CuentaApp } from './tipos'

// Los borradores en el teléfono, sin pantalla. Son los mismos del compositor del panel: lo
// empezado en un lado se sigue en el otro. Publicar guarda solo, como el panel, un rato
// después de que se deja de escribir.

/** Copia la frase del servidor (src/lib/mobile-api.ts): la app tiene que reconocerla. */
export const BORRADOR_NO_EXISTE = 'Ese borrador ya no existe.'

/** Cuánto espera Publicar después del último cambio para guardar el borrador. */
export const PAUSA_MS = 1500

export type EstadoBorrador = 'nada' | 'abierto' | 'guardando' | 'guardado' | 'error' | 'perdido'

export const FRASE_BORRADOR: Record<EstadoBorrador, string> = {
  nada: 'Lo que escribas se guarda solo como borrador.',
  abierto: 'Abriste un borrador: lo que cambies se guarda solo.',
  guardando: 'Guardando borrador…',
  guardado: 'Borrador guardado.',
  error: 'No se pudo guardar el borrador.',
  // Sin decir dónde: también es lo que queda si este mismo envío salió y se perdió la respuesta.
  perdido: 'Este borrador ya no existe: se programó o se descartó. Mira cómo quedó en La Parrilla.',
}

/** La frase del borrador en el modo que se ve: la de «perdido» nombra La Parrilla, que de día es La Barra. */
export function fraseDelBorrador(estado: EstadoBorrador, tema: Tema): string {
  return FRASE_BORRADOR[estado].replace(LA_PARRILLA.noche, LA_PARRILLA[tema])
}

export const YA_NO_EXISTE = 'Ese borrador ya no existe: se programó o se descartó.'
export const NO_SE_ABRIO = 'No se pudo abrir el borrador. Revisa tu señal.'
export const NO_SE_DESCARTO = 'No se pudo descartar el borrador: sigue en la lista de borradores.'

/**
 * Si hay algo que guardar. Como en el panel, abrir Publicar y salir no deja un borrador
 * vacío: hace falta texto o un archivo ya subido. Las cuentas y la fecha solas no alcanzan,
 * porque vienen puestas (la cuenta única, el día del «+»).
 */
export function tieneContenido(texto: string, media: MediaSubida[]): boolean {
  return texto.trim() !== '' || media.length > 0
}

/** Lo que Publicar tiene en pantalla, tal como lo necesita el guardado. */
export type Formulario = {
  texto: string
  cuentas: string[]
  trial: string[]
  fecha: Date
  /** Si la fecha la eligió alguien —o vino de un «+» o de un borrador— y no es la de partida. */
  fechaPuesta: boolean
  archivos: Archivo[]
}

export type CuerpoBorrador = {
  texto: string
  cuentas: string[]
  cuando: string | null
  opciones: OpcionesApp
  media: MediaSubida[]
}

/**
 * El cuerpo de `POST /api/mobile/borradores`, sin el id. La fecha viaja solo si alguien la
 * puso: la próxima hora en punto con que abre Publicar no es una decisión, y sin esto cada
 * borrador nuevo aparecería en el día de hoy en La Parrilla.
 */
export function cuerpoDelBorrador(form: Formulario): CuerpoBorrador {
  return {
    texto: form.texto,
    cuentas: form.cuentas,
    cuando: form.fechaPuesta ? form.fecha.toISOString() : null,
    opciones: opcionesParaGuardar(form.cuentas, form.trial, form.archivos),
    media: subidos(form.archivos),
  }
}

/**
 * Las cuentas de un borrador que Publicar marca al abrirlo: las conectadas. Una que se
 * desconectó no se puede elegir —como en el panel—, y al guardar sale del borrador. Sin la
 * lista de cuentas todavía, van todas: se filtran cuando llega.
 */
export function cuentasDelBorrador(ids: string[], disponibles: CuentaApp[] | null): string[] {
  if (!disponibles) return ids
  return ids.filter((id) => disponibles.some((c) => c.id === id && c.conectada))
}

const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** «vie 16 de oct a las 19:00», leído del ISO con la zona del dueño, sin pasar por la del teléfono. */
function diaYHora(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  const semana = DIAS_SEMANA[new Date(Date.UTC(a!, m! - 1, d!)).getUTCDay()]
  return `${semana} ${d} de ${MESES[m! - 1]} a las ${iso.slice(11, 16)}`
}

/** La línea de un borrador en la lista, como la del panel: «para el vie 16 de oct a las 19:00 · 2 archivos · guardado el …». */
export function detalleDelBorrador(b: BorradorResumido): string {
  const partes = [b.cuando ? `para el ${diaYHora(b.cuando)}` : 'sin fecha']
  if (b.archivos > 0) partes.push(b.archivos === 1 ? '1 archivo' : `${b.archivos} archivos`)
  partes.push(`guardado el ${diaYHora(b.guardado)}`)
  return partes.join(' · ')
}

/** «Borradores (3)». */
export function rotuloBorradores(cuantos: number): string {
  return `Borradores (${cuantos})`
}
