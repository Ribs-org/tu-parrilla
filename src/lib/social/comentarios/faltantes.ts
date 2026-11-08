// Cuándo La Mesa avisa que Instagram cuenta comentarios que no entrega. Puro: sin base, sin red;
// la consulta vive en `comentarios-cola.ts`.
//
// Instagram esconde a veces el comentario que es solo una palabra —«GUIA», la palabra clave de
// la publicación— y no se lo muestra a nadie más que a quien lo escribió: ni a la dueña en la
// app ni a la API, pero sí lo suma en su cuenta de comentarios (ver `docs/pendientes.md`). Lo
// único que Tu Parrilla puede ver de eso es la diferencia entre lo que Instagram cuenta y lo
// que entregó.
//
// La cuenta de Instagram suma también las respuestas. De las respuestas, Tu Parrilla sabe las
// de la dueña (las que mandó desde La Mesa, o desde la app y el sondeo vio); las que se dan
// otras personas entre ellas no se guardan, y por eso el aviso lo dice en vez de afirmar que
// todo lo que falta lo escondió Instagram.

import { TOPE_COMENTARIOS_POR_PASADA } from './instagram'

/** Desde cuántos que faltan se avisa: uno solo es casi siempre una respuesta entre otras personas. */
export const MIN_FALTANTES = 2

export type ConteoDePublicacion = {
  /** Lo que Instagram cuenta, de la última lectura del sync; null si nunca lo dio. */
  contados: number | null
  /** Los comentarios de primer nivel que el sondeo guardó de esa publicación. */
  llegaron: number
  /** Las respuestas de la dueña que Tu Parrilla conoce: también suman en la cuenta de Instagram. */
  respuestasPropias: number
}

/**
 * Cuántos comentarios cuenta Instagram que no llegaron, o null si no vale la pena avisar: sin
 * cuenta de Instagram, por debajo de `MIN_FALTANTES`, o por encima de lo que una pasada lee
 * (ahí la diferencia es del tope del sondeo, no de Instagram).
 */
export function comentariosQueFaltan(c: ConteoDePublicacion): number | null {
  if (c.contados === null || c.contados > TOPE_COMENTARIOS_POR_PASADA) return null
  const faltan = c.contados - c.llegaron - c.respuestasPropias
  return faltan >= MIN_FALTANTES ? faltan : null
}

/** El título del aviso, en el panel y en el teléfono (`mobile/src/lib/mesa.ts` lo copia). */
export const TITULO_FALTANTES = 'Comentarios que Instagram no entrega'

/** El pie del aviso, igual en los dos lados; la copia del teléfono la vigila `telefono-copias.test.ts`. */
export const EXPLICACION_FALTANTES =
  'Instagram a veces esconde el comentario que es solo una palabra, como «GUIA», y no se lo muestra ni a ti ni a Tu Parrilla: solo lo ve quien lo escribió. Si pediste una palabra clave, pide que la escriban dentro de una frase, o usa otra palabra en el próximo post. También puedes probar a apagar, en la app de Instagram, «Palabras ocultas» → «Ocultar comentarios» y el filtro avanzado de comentarios (en inglés, Hidden Words → «Hide comments» y «Advanced comment filtering»). Las respuestas que otras personas se dan entre ellas también suman en la cuenta de Instagram y aquí no aparecen: parte de la diferencia puede ser eso.'

/** La frase de cada publicación en el aviso de La Mesa. */
export function fraseDeFaltantes(contados: number, entregados: number): string {
  const entrego = entregados === 0 ? 'no nos entregó ninguno' : `solo nos entregó ${entregados}`
  return `Instagram cuenta ${contados} comentarios en esta publicación y ${entrego}.`
}
