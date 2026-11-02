// El ingreso por correo, en su parte pura: qué correo vale, cómo se genera y se guarda un
// código, cuándo sigue vivo y cuántos se pueden pedir. Quien toca la base y Resend está en
// lib/usuarios.ts y en las acciones de /ingresar.
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { env } from './env'
import { normalizarCorreo } from './forma-del-correo'

// Las frases viven en `ingreso-frases.ts`, y la forma de un correo en `forma-del-correo.ts`: el
// navegador las importa sin `node:crypto`.
export * from './ingreso-frases'
export { normalizarCorreo }

export const VIGENCIA_MS = 10 * 60_000
export const MAX_INTENTOS = 5
export const MAX_CODIGOS_POR_VENTANA = 3
export const VENTANA_MS = 15 * 60_000

/**
 * Los códigos equivocados que una persona puede escribir en un día, sumando todos sus
 * códigos. Los cinco intentos de cada uno no bastan solos: pedir otro código da cinco más,
 * y a tres códigos cada quince minutos son 1.440 al día contra un millón de combinaciones
 * —contra el código fijo del revisor, siempre el mismo, la mitad en un año—. Con diez, un
 * año entero de intentos no llega a cubrir el 0,4 %. El costo: quien conozca un correo
 * invitado puede dejarlo sin entrar por un día; una sesión ya abierta no se entera.
 */
export const MAX_FALLOS_POR_DIA = 10
export const VENTANA_FALLOS_MS = 24 * 60 * 60_000

/**
 * Los revisores de Meta y de YouTube tienen que poder entrar sin leer nuestro correo: para un
 * solo correo, mientras estén puestas las dos variables, el código que vale es fijo y no se
 * manda nada. Se queda aunque la app de Meta esté en Live, porque Meta vuelve a revisar las
 * apps aprobadas y pide que la cuenta de prueba siga activa. Sin variables, esto no existe.
 */
export function codigoDeRevision(correo: string): string | null {
  const revision = env('REVISION_CORREO')
  const codigo = env('REVISION_CODIGO')
  if (!revision || !codigo) return null
  if (normalizarCorreo(revision) !== correo) return null
  if (!/^\d{6}$/.test(codigo)) {
    console.warn('REVISION_CODIGO tiene que ser de seis dígitos; se ignora.')
    return null
  }
  return codigo
}

export function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/** Con la clave derivada, para que una copia de la tabla no sirva de nada por sí sola. */
export function hashCodigo(codigo: string, clave: string): string {
  return createHash('sha256').update(`${codigo}:${clave}`).digest('hex')
}

export function codigoCoincide(codigo: string, hash: string, clave: string): boolean {
  if (!/^\d{6}$/.test(codigo)) return false
  const a = Buffer.from(hashCodigo(codigo, clave), 'hex')
  const b = Buffer.from(hash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

export function vigente(fila: { expiraEn: Date; usadoEn: Date | null; intentos: number }, now: Date): boolean {
  if (fila.usadoEn) return false
  if (fila.intentos >= MAX_INTENTOS) return false
  return fila.expiraEn.getTime() > now.getTime()
}

/** Tres códigos por usuario cada quince minutos: frena a quien martille «reenviar». */
export function puedePedir(pedidosRecientes: Date[], now: Date): boolean {
  const desde = now.getTime() - VENTANA_MS
  return pedidosRecientes.filter((d) => d.getTime() > desde).length < MAX_CODIGOS_POR_VENTANA
}
