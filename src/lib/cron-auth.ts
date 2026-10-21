import { timingSafeEqual } from 'node:crypto'

/**
 * Si la petición viene del cron: `Authorization: Bearer <CRON_SECRET>`, comparado en tiempo
 * constante. Con `!==` la comparación corta en el primer carácter distinto, y cuánto tarda
 * le dice a quien prueba cuántos acertó. Sin secreto configurado no pasa nadie: un
 * despliegue sin `CRON_SECRET` deja los crons cerrados, no abiertos.
 */
export function cronAutorizado(authorization: string | null, secreto: string | undefined): boolean {
  if (!secreto || !authorization) return false
  const recibido = Buffer.from(authorization)
  const esperado = Buffer.from(`Bearer ${secreto}`)
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado)
}
