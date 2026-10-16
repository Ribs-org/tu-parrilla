// Qué se dibuja de un corte en La Parrilla: la silueta, la carne, una marca por destino y lo
// que dice la tarjeta en palabras. Puro: la semana, la vista «Día» y «Se quemó» lo arman igual,
// y acá se lo puede pinchar con un test sin pintar nada.

import type { TargetStatus } from '@/db/schema'
import {
  carneDe,
  coccionDe,
  formatoDe,
  selloDe,
  type Carne,
  type Coccion,
  type Formato,
  type Sello,
} from '@/lib/parrilla'

type Destino = {
  accountId: string
  network: string
  status: TargetStatus
  lastError: string | null
  opciones: unknown
}

export type Dibujo = {
  formato: Formato
  huesos: number
  coccion: Coccion
  carne: Carne
  /** Uno por destino, en el orden de los destinos. */
  sellos: Sello[]
}

export function dibujoDe(
  destinos: readonly Destino[],
  media: ReadonlyArray<{ mediaType: string }>,
  frias: ReadonlySet<string>,
): Dibujo {
  const estados = destinos.map((d) => d.status)
  return {
    ...formatoDe(media),
    coccion: coccionDe(estados),
    carne: carneDe(estados),
    sellos: destinos.map((d) => selloDe(d, frias.has(d.accountId) ? 'frio' : 'al-rojo')),
  }
}

/**
 * El estado en palabras, al lado de la hora. Nada para lo que solo está programado —es el
 * caso de casi todo, y escribirlo en cada tarjeta sería ruido—: la marca punteada ya lo dice.
 * Lo quemado en parte lleva la cuenta, porque es lo que el dibujo dice y una palabra sola no.
 */
export function estadoCorto(coccion: Coccion, sellos: readonly Sello[]): string | null {
  if (coccion === 'sellada') return 'saliendo'
  if (coccion === 'punto') return 'publicado'
  if (coccion === 'quemada') return 'falló'
  if (coccion === 'parcial') return `falló en ${sellos.filter((s) => s === 'quemado').length} de ${sellos.length}`
  return null
}

/**
 * Qué borde lleva la tarjeta. La tarjeta no se pinta de colores: cambia de borde solo cuando
 * necesita algo del dueño. Ámbar, si pide atención —un borrador espera en la bandeja de
 * TikTok, un destino reintenta, una cuenta se enfrió—; rojo, si pide su mano: se quemó.
 */
export type Borde = 'cuenta' | 'atencion' | 'mano'

export function bordeDe(coccion: Coccion, sellos: readonly Sello[]): Borde {
  if (coccion === 'parcial' || coccion === 'quemada') return 'mano'
  if (sellos.some((s) => s === 'bandeja' || s === 'reintento' || s === 'frio')) return 'atencion'
  return 'cuenta'
}
