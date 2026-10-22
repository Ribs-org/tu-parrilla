import { NextResponse } from 'next/server'
import { cronAutorizado } from '@/lib/cron-auth'
import { env } from '@/lib/env'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import type { CambioDeEstado } from './cocina'
import { esEstado } from './estados'

// Lo que comparten las rutas de `/api/cocina/…`: la credencial de la cocina y cómo se lee un
// cuerpo. El contrato entero está en `docs/cocina-api.md`.

/**
 * Si la petición trae la credencial de la cocina: `Authorization: Bearer <COCINA_SECRET>`,
 * comparada en tiempo constante, como la del cron. Sin la variable, la cocina queda cerrada.
 */
export function cocinaAutorizada(request: Request): boolean {
  return cronAutorizado(request.headers.get('authorization'), env('COCINA_SECRET'))
}

export function noAutorizado(): NextResponse {
  return new NextResponse('No autorizado', { status: 401 })
}

export function error(estado: number, frase: string): NextResponse {
  return NextResponse.json({ error: frase }, { status: estado })
}

/** El cuerpo como objeto, o null si no lo es. Vacío vale `{}`. */
export async function cuerpoDe(request: Request): Promise<Record<string, unknown> | null> {
  const texto = await request.text()
  if (texto.trim() === '') return {}
  try {
    const crudo: unknown = JSON.parse(texto)
    return typeof crudo === 'object' && crudo !== null && !Array.isArray(crudo) ? (crudo as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export const TRABAJADOR_FALTA = 'Di quién eres en «trabajador»: un texto de 1 a 100 caracteres.'
export const ESTADO_DESCONOCIDO = '«estado» no es un estado de comanda.'
export const ETA_ILEGIBLE = '«eta» tiene que ser una fecha ISO con su zona, o null.'
export const TANDAS_ILEGIBLES = '«tandas» es { "servidas": <n>, "total": <n> o null }, con enteros desde 0.'

export function trabajadorDe(cuerpo: Record<string, unknown>): string | null {
  const t = cuerpo.trabajador
  return typeof t === 'string' && t.trim().length > 0 && t.length <= 100 ? t.trim() : null
}

/** Un cambio de estado tal como llega, validado, o la frase de por qué no. */
export function cambioDe(cuerpo: Record<string, unknown>): CambioDeEstado | { error: string } {
  if (!esEstado(cuerpo.estado)) return { error: ESTADO_DESCONOCIDO }
  const cambio: CambioDeEstado = { estado: cuerpo.estado }

  if (cuerpo.mensaje !== undefined && cuerpo.mensaje !== null) {
    if (typeof cuerpo.mensaje !== 'string' || cuerpo.mensaje.length > 500) return { error: CUERPO_ILEGIBLE }
    cambio.mensaje = cuerpo.mensaje
  }
  if (cuerpo.motivo !== undefined && cuerpo.motivo !== null) {
    if (typeof cuerpo.motivo !== 'string' || cuerpo.motivo.length > 500) return { error: CUERPO_ILEGIBLE }
    cambio.motivo = cuerpo.motivo
  }
  if (cuerpo.eta !== undefined) {
    if (cuerpo.eta === null) cambio.eta = null
    else {
      // Con su zona: una hora sin offset se leería en la zona del servidor, que no es la de nadie.
      if (typeof cuerpo.eta !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(cuerpo.eta)) return { error: ETA_ILEGIBLE }
      const eta = new Date(cuerpo.eta)
      if (Number.isNaN(eta.getTime())) return { error: ETA_ILEGIBLE }
      cambio.eta = eta
    }
  }
  if (cuerpo.tandas !== undefined && cuerpo.tandas !== null) {
    const t = cuerpo.tandas as { servidas?: unknown; total?: unknown }
    const entero = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n >= 0
    if (typeof t !== 'object' || !entero(t.servidas) || !(t.total === null || t.total === undefined || entero(t.total))) {
      return { error: TANDAS_ILEGIBLES }
    }
    const servidas = t.servidas as number
    const total = (t.total ?? null) as number | null
    if (total !== null && servidas > total) return { error: TANDAS_ILEGIBLES }
    cambio.tandas = { servidas, total }
  }
  return cambio
}
