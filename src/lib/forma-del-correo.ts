// Qué correo vale, sin nada más: lo usan el servidor y los formularios del navegador, que no
// pueden traer `ingreso.ts` (usa `node:crypto`). Los dos lados tienen que decir lo mismo.

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_CORREO = 254

/** Minúsculas y sin espacios: es la clave por la que se busca al usuario. */
export function normalizarCorreo(bruto: string): string | null {
  const limpio = bruto.trim().toLowerCase()
  if (limpio.length === 0 || limpio.length > MAX_CORREO) return null
  return CORREO.test(limpio) ? limpio : null
}
