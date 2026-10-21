import 'server-only'
import { headers } from 'next/headers'
import { sumarIntento, type Cuentas } from './limite'

/**
 * Mejor esfuerzo, igual que el que tenía el login anterior: las instancias son efímeras y
 * hay varias, así que esto frena un intento a mano, no una botnet. La defensa real es que
 * el código viva diez minutos y se agote a los cinco intentos. La cuenta tiene tope y barre
 * lo vencido (`sumarIntento`).
 */
const intentos: Cuentas = new Map()

export async function demasiadosIntentos(balde: string, tope: number, ventanaMs: number): Promise<boolean> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconocida'
  return sumarIntento(intentos, `${balde}:${ip}`, tope, ventanaMs, Date.now())
}
