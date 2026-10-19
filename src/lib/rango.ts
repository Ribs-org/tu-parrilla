// El período elegido a mano en Los Números: desde y hasta, días enteros en la zona del dueño,
// con los mismos nombres y la misma lectura que la API de métricas (`parseRango`). Puro: lo
// usan el servidor, que arma los filtros, y la barra del navegador, que propone fechas.

import { addDays, mondayOfKey } from './schedule-week'

/** El primer día que se puede elegir: el mismo con que empieza «Todo». */
export const PRIMER_DIA = '2020-01-01'

/** Dos días «YYYY-MM-DD», los dos incluidos. */
export type Fechas = { desde: string; hasta: string }

export type Atajo = { etiqueta: string; fechas: Fechas }

/**
 * Los accesos rápidos del selector, contados desde hoy en la zona del dueño. La semana
 * empieza el lunes, como en La Parrilla. «Esta semana» y «Este mes» terminan hoy: lo que
 * viene todavía no tiene números.
 */
export function atajosDeFechas(hoy: string): Atajo[] {
  const lunes = mondayOfKey(hoy)
  const primeroDelMes = `${hoy.slice(0, 8)}01`
  const ultimoDelPasado = addDays(primeroDelMes, -1)
  return [
    { etiqueta: 'Esta semana', fechas: { desde: lunes, hasta: hoy } },
    { etiqueta: 'La semana pasada', fechas: { desde: addDays(lunes, -7), hasta: addDays(lunes, -1) } },
    { etiqueta: 'Este mes', fechas: { desde: primeroDelMes, hasta: hoy } },
    { etiqueta: 'El mes pasado', fechas: { desde: `${ultimoDelPasado.slice(0, 8)}01`, hasta: ultimoDelPasado } },
  ]
}

const SIN_ANO = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const CON_ANO = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/**
 * Cómo se lee el período en el botón: «22 ago – 7 sept», o «7 sept» si es un solo día. Con
 * el año en las dos puntas cuando alguna no es de este año, para que «3 ene» no se confunda.
 */
export function etiquetaDeFechas({ desde, hasta }: Fechas, hoy: string): string {
  const ano = hoy.slice(0, 4)
  const formato = desde.startsWith(ano) && hasta.startsWith(ano) ? SIN_ANO : CON_ANO
  const dia = (clave: string) => formato.format(new Date(`${clave}T00:00:00Z`))
  return desde === hasta ? dia(desde) : `${dia(desde)} – ${dia(hasta)}`
}

const DIA = /^\d{4}-\d{2}-\d{2}$/

export const FECHAS_INCOMPLETAS = 'Elige las dos fechas.'
export const FECHAS_AL_REVES = 'La primera fecha tiene que ir antes que la segunda.'
export const FECHAS_ANTES_DE_TODO = 'La primera fecha no puede ser anterior a 2020.'
export const FECHAS_FUTURAS = 'La segunda fecha no puede pasar de hoy: lo que viene todavía no tiene números.'

/** Por qué no se pueden ver estas fechas, o null si se puede. */
export function problemaDeFechas({ desde, hasta }: Fechas, hoy: string): string | null {
  if (!DIA.test(desde) || !DIA.test(hasta)) return FECHAS_INCOMPLETAS
  if (desde > hasta) return FECHAS_AL_REVES
  if (desde < PRIMER_DIA) return FECHAS_ANTES_DE_TODO
  if (hasta > hoy) return FECHAS_FUTURAS
  return null
}
