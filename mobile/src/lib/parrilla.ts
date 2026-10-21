/**
 * Las reglas de la parrilla en el teléfono.
 *
 * Es un gemelo de `src/lib/parrilla.ts` del panel web. Está copiado y no importado
 * porque `mobile/` es un paquete aparte con su propio empaquetador: Metro no sale de
 * esta carpeta, así que no hay forma de compartir el módulo sin montar un paquete
 * común, que para cuatro colores y dos funciones cuesta más de lo que ahorra.
 *
 * Lo que sí hay contra la deriva: el test del panel (`src/lib/parrilla.test.ts`) lee
 * este archivo y compara los hexes con los suyos. Si alguien cambia un lado, falla el
 * otro.
 *
 * Ver `docs/superpowers/specs/2026-09-18-parrilla-de-verdad-design.md`.
 */

/** «parcial» es «se quemó en una red»: algo salió o sigue en la parrilla y algo falló. */
export type Coccion = 'cruda' | 'sellada' | 'punto' | 'parcial' | 'quemada'
/** Las cuatro carnes que se pintan. Un corte «parcial» se pinta con la de lo que no se quemó. */
export type Carne = 'cruda' | 'sellada' | 'punto' | 'quemada'
export type Calor = 'apagada' | 'prendida' | 'llena'

/** Qué corte es un post: lo decide el servidor (`formatoDe` en el panel) y llega en la API. */
export type Formato = 'entrana' | 'tira' | 'bife' | 'chori'

/** Cómo le fue a cada destino: su marca en el corte. También llega decidido en la API. */
export type Sello = 'pendiente' | 'saliendo' | 'servido' | 'bandeja' | 'reintento' | 'quemado' | 'frio'

/**
 * Los tres topes de cada carne, de la esquina clara a la honda. Ordenadas de clara a
 * oscura, y ese orden es la información: contar la cocción por luminosidad y no por tono
 * es lo que hace que la escala se siga leyendo con daltonismo. Ningún texto va encima: va
 * al lado, en la chapa.
 */
export const CARNE: Record<Carne, { claro: string; medio: string; hondo: string }> = {
  cruda: { claro: '#f0a08f', medio: '#e8907f', hondo: '#c45a52' },
  sellada: { claro: '#d47d50', medio: '#c46a40', hondo: '#9a4a2e' },
  punto: { claro: '#b47640', medio: '#8f5326', hondo: '#6a3a1a' },
  quemada: { claro: '#3a2722', medio: '#2b1d1a', hondo: '#150e0c' },
}

/**
 * El pescado de la pieza de sushi, la carne del modo día: los mismos topes del panel
 * (`PESCADO` en `src/components/pieza-sushi.tsx`), de claro a oscuro. Crudo es salmón fresco;
 * sellado, con los bordes dorados por el soplete; a punto, el aburi tostado. Lo que falló no es
 * carbón: es pescado pasado, un verde gris igual de hondo.
 */
export const PESCADO: Record<Carne, { claro: string; medio: string; hondo: string }> = {
  cruda: { claro: '#ffd2c2', medio: '#ffb39a', hondo: '#f48d6f' },
  sellada: { claro: '#f4ad7e', medio: '#e5864a', hondo: '#c66737' },
  punto: { claro: '#d58e4f', medio: '#b46a33', hondo: '#86491f' },
  quemada: { claro: '#5d6a43', medio: '#282d20', hondo: '#161a10' },
}

/** El veteado de la grasa y los huesos de la tira. */
export const GRASA = '#e8d7b8'

/** El rojo de «se quemó»: el halo y la banderita. Se aleja del naranjo de la brasa. */
export const QUEMO = '#f2557a'

/** Cómo se llama cada cocción, para el lector de pantalla y para la leyenda. */
export const NOMBRE_COCCION: Record<Coccion, string> = {
  cruda: 'Programada',
  sellada: 'Saliendo ahora',
  punto: 'Publicada',
  parcial: 'Falló en parte',
  quemada: 'Falló',
}

/** El formato en palabras: lo que lee el lector de pantalla en vez de la silueta. */
export const NOMBRE_FORMATO: Record<Formato, string> = {
  entrana: 'Video',
  tira: 'Carrusel',
  bife: 'Foto',
  chori: 'Texto',
}

/**
 * Cuánto fuego tiene un día según cuántos cortes lleve. El tres de «llena» sale de la
 * promesa del producto, que es publicar a volumen: tiene que alcanzarse en un día de
 * trabajo normal.
 */
/** Cómo salió un corte comparado con los demás del período. */
export type Marca = 'se-paso' | 'salio-bien' | 'normal' | 'sin-datos'

/**
 * La mediana de un conjunto de números, o `null` si no hay ninguno.
 *
 * Mediana y no promedio: a un creador con un post viral el promedio se le va arriba y
 * todo lo demás le aparece frío, que es el mensaje contrario al que el producto quiere
 * dar. La mediana aguanta el outlier sin moverse.
 */
export function medianaDe(valores: readonly number[]): number | null {
  if (valores.length === 0) return null
  const orden = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(orden.length / 2)
  return orden.length % 2 === 0 ? (orden[medio - 1]! + orden[medio]!) / 2 : orden[medio]!
}

/**
 * Cómo salió un corte, comparado con la mediana del período.
 *
 * Se compara contra vistas ganadas en el período y no contra el acumulado: el acumulado
 * premia la antigüedad y haría que los posts nuevos, que son los que hay que evaluar,
 * salgan siempre fríos.
 */
export function comoSalio(ganadas: number | null, mediana: number | null): Marca {
  if (ganadas === null || mediana === null || mediana <= 0) return 'sin-datos'
  if (ganadas >= mediana * 2) return 'se-paso'
  if (ganadas >= mediana) return 'salio-bien'
  return 'normal'
}

export function calorDelDia(cortes: number): Calor {
  if (cortes <= 0) return 'apagada'
  if (cortes < 3) return 'prendida'
  return 'llena'
}

/**
 * La cocción de un post según el estado de sus destinos: si fallaron todos es «quemada», y
 * si falló alguno, «parcial»; sin fallos, todos publicados es «a punto», algo en curso es
 * «sellada», el resto queda cruda.
 *
 * Un post sin destinos queda crudo y no «a punto»: `every` sobre una lista vacía
 * devuelve `true`, así que sin el largo explícito se vería como publicado.
 */
export function coccionDe(estados: readonly string[]): Coccion {
  const fallidos = estados.filter((estado) => estado === 'failed').length
  if (fallidos > 0) return fallidos === estados.length ? 'quemada' : 'parcial'
  if (estados.length > 0 && estados.every((estado) => estado === 'published')) return 'punto'
  if (estados.some((estado) => estado === 'publishing')) return 'sellada'
  return 'cruda'
}

/** Con qué carne se pinta: la de la cocción y, si se quemó en una red, la de lo demás. */
export function carneDe(estados: readonly string[]): Carne {
  const coccion = coccionDe(estados)
  if (coccion !== 'parcial') return coccion
  return coccionDe(estados.filter((estado) => estado !== 'failed')) as Carne
}

/**
 * El sello de un destino si la API no lo trae —una respuesta del servidor de antes de que
 * existiera—: lo que se puede saber solo con el estado. Sin el servidor no se sabe si la
 * cuenta se enfrió ni si TikTok recibió un borrador.
 */
export function selloPorEstado(estado: string, error?: string | null): Sello {
  if (estado === 'failed') return 'quemado'
  if (estado === 'published') return 'servido'
  if (estado === 'publishing') return 'saliendo'
  return error ? 'reintento' : 'pendiente'
}

/**
 * Qué borde lleva la tarjeta de un corte, como en el panel (`bordeDe`, en
 * `src/app/admin/(dash)/schedule/dibujo.ts`): la tarjeta no se pinta de colores, cambia de
 * borde solo cuando necesita algo del dueño. Ámbar si pide atención, rojo si se quemó.
 */
export type Borde = 'cuenta' | 'atencion' | 'mano'

export function bordeDe(coccion: Coccion, sellos: readonly Sello[]): Borde {
  if (coccion === 'parcial' || coccion === 'quemada') return 'mano'
  if (sellos.some((s) => s === 'bandeja' || s === 'reintento' || s === 'frio')) return 'atencion'
  return 'cuenta'
}
