// Las frases de La Mesa que dicen lo mismo en el panel y en el teléfono. Puras y sin servidor:
// las usa el componente del panel (`admin/(dash)/comments/cola.tsx`), y la app del teléfono las
// copia en `mobile/src/lib/mesa.ts`, que `telefono-copias.test.ts` compara con estas.

/** La línea de arriba: cuántos comentarios esperan respuesta. */
export function frasePendientes(cuantos: number): string {
  if (cuantos === 0) return 'No hay nada esperando respuesta.'
  if (cuantos === 1) return 'Un comentario espera tu respuesta.'
  return `${cuantos} comentarios esperan tu respuesta.`
}

/** Lo que dice la cola cuando el filtro no tiene nada. */
export function fraseColaVacia(conCronico: boolean): string {
  return `No hay comentarios aquí.${conCronico ? ' Los nuevos llegan cada cinco minutos.' : ''}`
}

const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

/** Hace cuánto llegó un comentario: «recién», «hace 3 horas», «ayer», «anteayer», «hace 5 días». */
export function hace(fecha: Date, ahora: number): string {
  const horas = Math.round((ahora - fecha.getTime()) / 3.6e6)
  if (horas < 1) return 'recién'
  if (horas < 24) return RELATIVE.format(-horas, 'hour')
  return RELATIVE.format(-Math.round(horas / 24), 'day')
}
