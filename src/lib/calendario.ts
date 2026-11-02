// La aritmética del calendario del panel (`components/selector-fecha.tsx`), pura y en texto. Un
// día es «YYYY-MM-DD» y un valor con hora, «YYYY-MM-DDTHH:MM»: lo mismo que mandaba el
// `datetime-local` del navegador, en la hora de pared de quien lo usa. Nada pasa por un `Date`
// local, así que la zona horaria la sigue decidiendo el formulario que lo envía, como antes.

import { addDays, mondayOfKey } from './schedule-week'

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

/** Las columnas del mes, de lunes a domingo, como la semana de La Parrilla. */
export const CABECERA_DE_SEMANA = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

export type Modo = 'fecha' | 'fecha-hora'

const DIA = /^\d{4}-\d{2}-\d{2}$/
const DIA_Y_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

const dos = (n: number) => String(n).padStart(2, '0')

/** Si el valor es uno entero del modo: un día, o un día con hora. Vacío o a medias, no. */
export function esValor(valor: string, modo: Modo): boolean {
  return (modo === 'fecha' ? DIA : DIA_Y_HORA).test(valor) && esDia(valor.slice(0, 10))
}

/** Un día que existe: «2026-02-30» tiene la forma, pero no está en ningún calendario. */
export function esDia(dia: string): boolean {
  return DIA.test(dia) && addDays(dia, 0) === dia
}

/** «2026-11» */
export function mesDe(dia: string): string {
  return dia.slice(0, 7)
}

export function sumarMeses(mes: string, n: number): string {
  const total = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7)) - 1 + n
  return `${Math.floor(total / 12)}-${dos((total % 12) + 1)}`
}

function ultimoDia(mes: string): number {
  return Number(addDays(`${sumarMeses(mes, 1)}-01`, -1).slice(8))
}

/** El mismo número de día, `n` meses más allá; si ese mes es más corto, su último día. */
export function mismoDiaEnOtroMes(dia: string, n: number): string {
  const mes = sumarMeses(mesDe(dia), n)
  return `${mes}-${dos(Math.min(Number(dia.slice(8)), ultimoDia(mes)))}`
}

/**
 * Las seis semanas que muestra un mes, de lunes a domingo, desde la que tiene el día 1. Siempre
 * seis, aunque al mes le basten cuatro o cinco: la ventana no cambia de alto al pasar de mes.
 */
export function semanasDelMes(mes: string): string[][] {
  const lunes = mondayOfKey(`${mes}-01`)
  return Array.from({ length: 6 }, (_, semana) => Array.from({ length: 7 }, (_, d) => addDays(lunes, semana * 7 + d)))
}

/** «noviembre de 2026» */
export function nombreDelMes(mes: string): string {
  return `${MESES[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`
}

function diaDeLaSemana(dia: string): number {
  return (new Date(`${dia}T00:00:00Z`).getUTCDay() + 6) % 7
}

/** «martes 3 de noviembre de 2026»: lo que oye quien recorre el mes con un lector de pantalla. */
export function diaEnPalabras(dia: string): string {
  return `${DIAS[diaDeLaSemana(dia)]} ${Number(dia.slice(8))} de ${nombreDelMes(mesDe(dia))}`
}

/**
 * Lo que dice el campo cerrado: «mar 3 nov 2026» o «mar 3 nov 2026 · 18:30». Escrito a mano y no
 * con `Intl`: el servidor y el navegador traen tablas distintas («nov» y «nov.»), y el campo se
 * dibuja en los dos.
 */
export function textoDelValor(valor: string): string {
  const dia = valor.slice(0, 10)
  const fecha = `${DIAS_CORTOS[diaDeLaSemana(dia)]} ${Number(dia.slice(8))} ${MESES_CORTOS[Number(dia.slice(5, 7)) - 1]} ${dia.slice(0, 4)}`
  return valor.length > 10 ? `${fecha} · ${valor.slice(11, 16)}` : fecha
}

/** Si el día cabe entre los topes, que vienen como los de un `<input type="date">`. */
export function dentro(dia: string, min?: string, max?: string): boolean {
  return (!min || dia >= min.slice(0, 10)) && (!max || dia <= max.slice(0, 10))
}

export function acotar(dia: string, min?: string, max?: string): string {
  if (min && dia < min.slice(0, 10)) return min.slice(0, 10)
  if (max && dia > max.slice(0, 10)) return max.slice(0, 10)
  return dia
}

/**
 * Adónde va el foco del mes con cada tecla, como en un calendario de escritorio: las flechas,
 * un día o una semana; Inicio y Fin, el lunes y el domingo de esa semana; Re Pág y Av Pág, el
 * mismo día del mes anterior o del siguiente. Null si la tecla no mueve nada.
 */
export function moverDia(dia: string, tecla: string): string | null {
  switch (tecla) {
    case 'ArrowLeft':
      return addDays(dia, -1)
    case 'ArrowRight':
      return addDays(dia, 1)
    case 'ArrowUp':
      return addDays(dia, -7)
    case 'ArrowDown':
      return addDays(dia, 7)
    case 'Home':
      return mondayOfKey(dia)
    case 'End':
      return addDays(mondayOfKey(dia), 6)
    case 'PageUp':
      return mismoDiaEnOtroMes(dia, -1)
    case 'PageDown':
      return mismoDiaEnOtroMes(dia, 1)
    default:
      return null
  }
}

/** Lo que se escribió en un cuadro de la hora, solo los dígitos y a lo más dos. */
export function soloDigitos(escrito: string): string {
  return escrito.replace(/\D/g, '').slice(0, 2)
}

/**
 * Las horas o los minutos escritos, dentro de su rango y con dos cifras: «7» es «07», «75»
 * minutos son «59». Vacío vale el cero, que es lo que se ve en el cuadro.
 */
export function cifra(escrito: string, tope: number): string {
  const n = Number(soloDigitos(escrito) || '0')
  return dos(Math.min(n, tope))
}

/** Una hora o un minuto más o menos, dando la vuelta: después de 23 viene 00. */
export function girar(escrito: string, paso: number, tope: number): string {
  const n = Number(cifra(escrito, tope))
  return dos((((n + paso) % (tope + 1)) + tope + 1) % (tope + 1))
}
