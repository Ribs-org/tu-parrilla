// La URL de la parrilla, armada aparte de la página: es una regla pura —qué parámetro
// sobrevive a un clic y cuál no— y acá se la puede pinchar con un test, como a `orden.ts`.

/** Los parámetros de un solo uso: valen para el render que los trajo y no viajan al siguiente. */
const UN_SOLO_USO = new Set([
  // El desenlace de una vuelta de OAuth.
  'mensaje',
  // Los que abren el panel lateral: el compositor (nuevo, en un día o con un borrador), la
  // lista de borradores y la carga por CSV. Cerrar el panel es navegar sin ellos.
  'componer',
  'dia',
  'borrador',
  'panel',
  // El aviso de que algo se programó, que se lee una vez al volver del compositor.
  'hecho',
])

/**
 * Rearma la URL de la página cambiando una clave y acarreando el resto — el molde del
 * `contentHref` de Los Cortes. Las claves de un solo uso (`UN_SOLO_USO`) nunca se acarrean.
 */
export function scheduleHref(
  params: Record<string, string | string[] | undefined>,
  changes: Record<string, string | null>,
): string {
  const next = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (key in changes || UN_SOLO_USO.has(key)) continue
    if (typeof value === 'string') next.set(key, value)
    else if (Array.isArray(value)) for (const v of value) next.append(key, v)
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value !== null) next.set(key, value)
  }
  const query = next.toString()
  return query ? `/admin/schedule?${query}` : '/admin/schedule'
}
