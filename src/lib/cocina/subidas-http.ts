import { NextResponse } from 'next/server'
import type { Usuario } from '@/db'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { SIN_ALMACEN } from '@/lib/storage'
import { cuerpoDe, error } from './api'
import { leerSubida } from './bodega'
import {
  COCINA_APAGADA,
  PARTES_ILEGIBLES,
  SUBIDA_CERRADA,
  SUBIDA_MAL_CERRADA,
  SUBIDA_NO_EXISTE,
  abortarSubida,
  abrirSubida,
  cerrarSubida,
  estadoDeSubida,
  faltanPartes,
  firmarPartes,
} from './subidas'

// Las respuestas de las subidas por partes a la cámara de frío, una sola vez para las dos puertas:
// el panel (`/api/admin/cocina/subidas…`, con la cookie) y la app del teléfono
// (`/api/mobile/cocina/subidas…`, con su token). Cada ruta averigua quién pregunta a su manera y
// llama acá con el usuario: lo que se valida, las frases y los códigos son los mismos. `donde` es
// solo para el log.

/**
 * Abre una subida: un video, un audio, una imagen u otro archivo, con su uso si lo tiene y la
 * casilla de los derechos marcada. Si no cabe en la cuota —contando lo que ya está subiendo—,
 * `409` con cuánto pesa y cuánto queda. Devuelve cuántas partes son y de qué tamaño.
 */
export async function responderAbrir(usuario: Usuario, request: Request, donde: string): Promise<NextResponse> {
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const pedido = leerSubida(cuerpo)
  if ('error' in pedido) return error(400, pedido.error)
  try {
    const r = await abrirSubida(usuario, pedido, new Date())
    if ('falla' in r) return r.falla === 'no-cabe' ? error(409, r.frase) : error(403, COCINA_APAGADA)
    return NextResponse.json(r, { status: 201 })
  } catch (e) {
    console.error(`${donde}:`, String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}

/** Cómo va una subida: lo que se pregunta al retomarla, para no repetir las partes que llegaron. */
export async function responderEstado(usuario: Usuario, id: string, donde: string): Promise<NextResponse> {
  try {
    const r = await estadoDeSubida(usuario, id)
    if ('falla' in r) return error(404, SUBIDA_NO_EXISTE)
    return NextResponse.json(r)
  } catch (e) {
    console.error(`${donde}:`, String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}

/** La aborta: el almacén borra las partes que alcanzaron a llegar. */
export async function responderAbortar(usuario: Usuario, id: string, donde: string): Promise<NextResponse> {
  try {
    const r = await abortarSubida(usuario, id)
    if ('falla' in r) return r.falla === 'cerrada' ? error(409, SUBIDA_CERRADA) : error(404, SUBIDA_NO_EXISTE)
    return NextResponse.json(r)
  } catch (e) {
    console.error(`${donde}:`, String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}

/**
 * Un PUT firmado por cada parte pedida (`{ "partes": [1, 2, 3] }`), con lo que tiene que pesar. Se
 * manda solo los bytes de la parte: sin cabeceras, porque ninguna va en la firma.
 */
export async function responderPartes(usuario: Usuario, request: Request, id: string, donde: string): Promise<NextResponse> {
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  try {
    const r = await firmarPartes(usuario, id, cuerpo.partes, new Date())
    if ('falla' in r) {
      if (r.falla === 'ilegibles') return error(400, PARTES_ILEGIBLES)
      return r.falla === 'cerrada' ? error(409, SUBIDA_CERRADA) : error(404, SUBIDA_NO_EXISTE)
    }
    return NextResponse.json(r)
  } catch (e) {
    console.error(`${donde}:`, String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}

/**
 * La cierra con todas sus partes arriba, y nace el material en la cámara de frío: `201` con el
 * material, o `200` con el mismo si ya estaba cerrada. Si faltan partes, `409` dice cuántas.
 */
export async function responderCerrar(usuario: Usuario, id: string, donde: string): Promise<NextResponse> {
  try {
    const r = await cerrarSubida(usuario, id, new Date())
    if ('falla' in r) {
      if (r.falla === 'faltan') return error(409, faltanPartes(r.faltan))
      return r.falla === 'mal-cerrada' ? error(409, SUBIDA_MAL_CERRADA) : error(404, SUBIDA_NO_EXISTE)
    }
    return NextResponse.json({ material: r.material }, { status: r.nuevo ? 201 : 200 })
  } catch (e) {
    console.error(`${donde}:`, String(e).slice(0, 300))
    return error(500, SIN_ALMACEN)
  }
}
