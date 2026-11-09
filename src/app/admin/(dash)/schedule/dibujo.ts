// Qué se dibuja de un corte en La Parrilla: la silueta, la carne, una marca por destino y el
// borde de su fila. Puro: la semana, la vista «Día», «Se quemó» y la portada lo arman igual,
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
import { esHistoria } from '@/lib/social/publish/opciones'

type Destino = {
  accountId: string
  network: string
  status: TargetStatus
  lastError: string | null
  opciones: unknown
  externalId: string | null
}

export type Dibujo = {
  formato: Formato
  huesos: number
  coccion: Coccion
  carne: Carne
  /** Uno por destino, en el orden de los destinos. */
  sellos: Sello[]
}

/** `videosLiberados`, los del post que ya no están en el almacén (ver `formatoDe`). */
export function dibujoDe(
  destinos: readonly Destino[],
  media: ReadonlyArray<{ mediaType: string }>,
  frias: ReadonlySet<string>,
  videosLiberados = 0,
): Dibujo {
  const estados = destinos.map((d) => d.status)
  return {
    // Una historia lo es en todos sus destinos (`validarOpcionesPorCuenta`): basta que lo sean todos.
    ...formatoDe(media, videosLiberados, destinos.length > 0 && destinos.every((d) => esHistoria(d.opciones))),
    coccion: coccionDe(estados),
    carne: carneDe(estados),
    sellos: destinos.map((d) => selloDe(d, frias.has(d.accountId) ? 'frio' : 'al-rojo')),
  }
}

/**
 * Qué borde lleva la fila de un corte (`estadoDeFila`, en `semana.ts`). No se pinta de colores:
 * cambia de borde solo cuando necesita algo del dueño. Ámbar, si pide atención —un borrador espera en la bandeja de
 * TikTok, un destino reintenta, una cuenta se enfrió—; rojo, si pide su mano: se quemó.
 */
export type Borde = 'cuenta' | 'atencion' | 'mano'

export function bordeDe(coccion: Coccion, sellos: readonly Sello[]): Borde {
  if (coccion === 'parcial' || coccion === 'quemada') return 'mano'
  if (sellos.some((s) => s === 'bandeja' || s === 'reintento' || s === 'frio')) return 'atencion'
  return 'cuenta'
}
