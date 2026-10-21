// La cuenta de un limitador de intentos, sin servidor ni red: la usa `limite-ip.ts` con la IP
// de cada petición, y la prueban los tests con un reloj propio.

export type Cuentas = Map<string, { cuenta: number; hasta: number }>

/**
 * Cuántas claves guarda un limitador como mucho. Antes no había tope ni barrido: cada IP
 * nueva dejaba su entrada para siempre, y una instancia que vive días juntaba una por cada
 * visitante que alguna vez pidió un código.
 */
export const MAX_CLAVES = 10_000

/**
 * Suma un intento de `clave` y dice si ya pasó el `tope` en su ventana. Una ventana vencida
 * empieza de cero. Cuando el mapa se llena, primero se barre lo vencido, y si aun así no hay
 * lugar se van las claves más viejas: es un limitador de mejor esfuerzo (ver `limite-ip.ts`),
 * y olvidar la cuenta de alguien es mejor que quedarse sin memoria.
 */
export function sumarIntento(cuentas: Cuentas, clave: string, tope: number, ventanaMs: number, ahora: number): boolean {
  const entrada = cuentas.get(clave)
  if (entrada && ahora <= entrada.hasta) {
    entrada.cuenta += 1
    return entrada.cuenta > tope
  }
  if (entrada) cuentas.delete(clave)
  if (cuentas.size >= MAX_CLAVES) hacerLugar(cuentas, ahora)
  cuentas.set(clave, { cuenta: 1, hasta: ahora + ventanaMs })
  return false
}

function hacerLugar(cuentas: Cuentas, ahora: number): void {
  for (const [clave, entrada] of cuentas) {
    if (ahora > entrada.hasta) cuentas.delete(clave)
  }
  // Un `Map` recorre en orden de llegada: lo primero es lo más viejo.
  for (const clave of cuentas.keys()) {
    if (cuentas.size < MAX_CLAVES) break
    cuentas.delete(clave)
  }
}
