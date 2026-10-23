// Las frases de «Regenerar todos», aparte del componente para poder probarlas sin el servidor.

export const SIN_CAMBIOS_GUARDADOS = 'Guarda las instrucciones antes de regenerar: se usan las guardadas.'
export const NADA_QUE_REGENERAR = 'No hay borradores pendientes que regenerar.'
export const SE_CORTO_REGENERAR = 'No se pudo hablar con Tu Parrilla. Recarga la página y vuelve a intentarlo.'

/** La frase de lo que hizo «Regenerar todos». */
export function fraseRegenerado(r: { regenerados: number; fallidos: number; quedan: number }): string {
  if (r.regenerados === 0 && r.fallidos === 0 && r.quedan === 0) return NADA_QUE_REGENERAR
  const hechos = r.regenerados === 1 ? 'Un borrador nuevo.' : `${r.regenerados} borradores nuevos.`
  const fallos =
    r.fallidos === 0 ? '' : r.fallidos === 1 ? ' Uno no se pudo rehacer y quedó como estaba.' : ` ${r.fallidos} no se pudieron rehacer y quedaron como estaban.`
  const resto = r.quedan === 0 ? '' : ` Quedan ${r.quedan}: aprieta «Regenerar todos» otra vez.`
  return hechos + fallos + resto
}
