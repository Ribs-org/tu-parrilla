import type { PostEditable } from './tipos'

// Corregir un post programado desde La Parrilla (`app/programado/[id].tsx`): el texto, la hora
// y quitar cuentas. Las reglas son las del panel y las aplica el servidor; acá solo lo que la
// pantalla necesita para dibujarse y armar lo que manda.

/** Lo que dice la pantalla si no pudo abrir el post y no fue un rechazo del servidor. */
export const NO_SE_ABRIO_POST = 'No se pudo abrir la publicación. Revisa tu señal.'

/** Los destinos que siguen, sin los que se marcaron para quitar. */
export function destinosQueSiguen(post: PostEditable, quitados: readonly string[]): PostEditable['destinos'] {
  return post.destinos.filter((d) => !quitados.includes(d.id))
}

/**
 * El largo máximo del texto: el de la red más estricta entre las que siguen (X, 280; Threads,
 * 500). El servidor manda la cifra de cada destino; sin destinos, la de Instagram.
 */
export function limiteDelTexto(post: PostEditable, quitados: readonly string[]): number {
  const limites = destinosQueSiguen(post, quitados).map((d) => d.limite)
  return limites.length > 0 ? Math.min(...limites) : 2200
}

/** Si a ese destino se le puede tocar «Quitar»: el último no, que para eso está «Borrar publicación». */
export function sePuedeQuitar(post: PostEditable, quitados: readonly string[], id: string): boolean {
  return !quitados.includes(id) && destinosQueSiguen(post, quitados).length > 1
}

/**
 * El cuerpo de «Guardar». La hora va solo si se eligió otra: sin ella el servidor deja la que
 * estaba, aunque ya haya pasado —corregir el texto de lo que falló no obliga a moverla—.
 */
export function cuerpoDeLaEdicion(
  texto: string,
  fechaNueva: Date | null,
  quitados: readonly string[],
): { texto: string; cuando?: string; quitar: string[] } {
  return {
    texto,
    ...(fechaNueva ? { cuando: fechaNueva.toISOString() } : {}),
    quitar: [...quitados],
  }
}
