// Las piezas puras de las llaves de API por usuario: cómo se ve una, cómo se guarda y cómo
// se lee del header. Sin `server-only` ni base, para que vitest las importe; lo que toca la
// tabla vive en `llaves-api-guardia.ts`.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Lo que distingue una llave de usuario de `SCHEDULE_API_KEY` y de cualquier otro secreto:
 * quien la encuentre pegada en un log o en un repo sabe de dónde salió.
 */
export const PREFIJO = 'tp_'

/** Cuántas puede tener viva un usuario: una por agente sobra, y un tope frena a quien martilla el botón. */
export const MAX_LLAVES = 10

export const MAX_NOMBRE = 60

export const NOMBRE_VACIO = 'Ponle un nombre: el del agente que la va a usar.'
export const NOMBRE_LARGO = `El nombre puede tener hasta ${MAX_NOMBRE} caracteres.`
export const DEMASIADAS_LLAVES = `Ya tienes ${MAX_LLAVES} llaves: revoca una antes de generar otra.`

/** 32 bytes al azar: 256 bits, imposibles de adivinar y de sacar por fuerza bruta desde su hash. */
export function generarLlave(): string {
  return `${PREFIJO}${randomBytes(32).toString('base64url')}`
}

/**
 * SHA-256 a secas, sin sal ni clave derivada de `AUTH_SECRET`. Con 256 bits al azar no hay
 * diccionario que probar, así que la sal no compra nada; y atarla a `AUTH_SECRET` haría que
 * rotarlo matara todas las llaves de todos los usuarios, cuando rotarlo ya cuesta
 * reconectar las redes.
 */
export function hashLlave(llave: string): string {
  return createHash('sha256').update(llave).digest('hex')
}

/** Lo que se muestra en la lista para reconocerla: los últimos cuatro caracteres. */
export function finalDe(llave: string): string {
  return llave.slice(-4)
}

/** La llave que trae `Authorization: Bearer …`, o null si el header no tiene esa forma. */
export function llaveDelHeader(header: string | null): string | null {
  if (!header?.startsWith('Bearer ')) return null
  const llave = header.slice('Bearer '.length).trim()
  return llave === '' ? null : llave
}

/**
 * Si la llave que llegó es la del despliegue. En tiempo constante: comparar con `===`
 * corta en el primer carácter distinto, y el tiempo de respuesta delata cuántos acertó.
 * Sin llave configurada no hay nada con qué coincidir.
 */
export function esLlaveDelDespliegue(llave: string, configurada: string | undefined): boolean {
  if (!configurada) return false
  const a = Buffer.from(llave)
  const b = Buffer.from(configurada)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** El nombre limpio, o la frase de por qué no sirve. */
export function validarNombre(bruto: string): { nombre: string } | { error: string } {
  const nombre = bruto.trim()
  if (nombre === '') return { error: NOMBRE_VACIO }
  if (nombre.length > MAX_NOMBRE) return { error: NOMBRE_LARGO }
  return { nombre }
}
