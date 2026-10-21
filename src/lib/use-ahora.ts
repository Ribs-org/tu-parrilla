import { useSyncExternalStore } from 'react'

const MINUTO = 60_000

// Un reloj al minuto que todos los que lo miran comparten: cada uno se suscribe, y un solo
// intervalo por suscriptor le avisa cuando cambia el minuto.
function suscribir(aviso: () => void): () => void {
  const intervalo = setInterval(aviso, 15_000)
  return () => clearInterval(intervalo)
}

const minutoDeAhora = () => Math.floor(Date.now() / MINUTO) * MINUTO

/**
 * La hora de ahora, al minuto, y que se mueve sola. Al dibujarse en el servidor y al hidratar
 * es `desde`, la hora con que el servidor armó la página: así el primer dibujo del navegador es
 * el mismo, y apenas hidrata se corre a la de verdad.
 *
 * Es lo que usa todo lo del panel que dice un tiempo relativo («hace 5 horas», «vence
 * mañana») o depende de la hora (el día de hoy, el estado de un fierro). Calcularlo con
 * `Date.now()` en el render daba un texto en el servidor y otro en el navegador cuando el
 * cálculo cruzaba un cambio de unidad entre los dos, y React abortaba la hidratación.
 */
export function useAhora(desde: number): number {
  return useSyncExternalStore(suscribir, minutoDeAhora, () => desde)
}
