// Los colores del selector de color del panel (`components/selector-color.tsx`), puros: la
// muestra para elegir con el dedo y la lectura de un código escrito a mano.

const dos = (n: number) => Math.round(n).toString(16).padStart(2, '0')

/** Un color HSL (tono en grados, saturación y luz de 0 a 100) como «#rrggbb». */
export function hslAHex(tono: number, saturacion: number, luz: number): string {
  const s = saturacion / 100
  const l = luz / 100
  const k = (n: number) => (n + tono / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const canal = (n: number) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))
  return `#${dos(canal(0))}${dos(canal(8))}${dos(canal(4))}`
}

/** Los tonos de la muestra: doce, cada 30 grados, desde el rojo. */
const TONOS = Array.from({ length: 12 }, (_, i) => i * 30)
/** Las filas, de lo más claro a lo más hondo. */
const LUCES = [78, 66, 55, 44, 32]

/**
 * La muestra: una fila por luz con los doce tonos, y una última de grises, del blanco al negro.
 * Sesenta y doce: lo bastante para acercarse a cualquier color sin escribir un código.
 */
export function muestraDeColores(): string[][] {
  const filas = LUCES.map((luz) => TONOS.map((tono) => hslAHex(tono, 80, luz)))
  const grises = Array.from({ length: 12 }, (_, i) => hslAHex(0, 0, 100 - (i * 100) / 11))
  return [...filas, grises]
}

/**
 * Un código escrito a mano, como lo entiende el campo: con o sin «#», de tres o de seis cifras,
 * en mayúsculas o minúsculas. Devuelve «#rrggbb», o null si no es un color.
 */
export function leerHex(escrito: string): string | null {
  const limpio = escrito.trim().replace(/^#/, '').toLowerCase()
  if (/^[0-9a-f]{6}$/.test(limpio)) return `#${limpio}`
  if (/^[0-9a-f]{3}$/.test(limpio)) return `#${[...limpio].map((c) => c + c).join('')}`
  return null
}
