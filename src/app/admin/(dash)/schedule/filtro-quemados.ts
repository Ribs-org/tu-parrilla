// Qué muestra «Se quemó» con el filtro por red y el «Ver más». Puro: la lista lo usa en el
// navegador, y acá se lo prueba sin pintar nada.

/** Cuántas filas se ven de entrada, y cuántas suma cada «Ver más». */
export const PAGINA_QUEMADOS = 15

/**
 * Las redes que tienen algo quemado, con cuántas filas cada una, en el orden en que aparecen
 * por primera vez —que es el de la lista: de lo más reciente a lo más viejo—. Son los botones
 * del filtro: una red sin nada quemado no tiene nada que apagar.
 */
export function redesQuemadas(filas: ReadonlyArray<{ red: string }>): Array<{ red: string; cuantas: number }> {
  const cuenta = new Map<string, number>()
  for (const { red } of filas) cuenta.set(red, (cuenta.get(red) ?? 0) + 1)
  return [...cuenta].map(([red, cuantas]) => ({ red, cuantas }))
}

/**
 * Lo que se ve: las filas de las redes encendidas, hasta `mostradas`, y cuántas quedan
 * detrás del «Ver más». Todo parte encendido; apagar una red no borra nada, solo la saca de
 * la vista.
 */
export function quemadosVisibles<T extends { red: string }>(
  filas: readonly T[],
  apagadas: ReadonlySet<string>,
  mostradas: number,
): { visibles: T[]; total: number; quedan: number } {
  const encendidas = filas.filter((f) => !apagadas.has(f.red))
  const visibles = encendidas.slice(0, mostradas)
  return { visibles, total: encendidas.length, quedan: encendidas.length - visibles.length }
}
