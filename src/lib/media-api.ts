import { prepararSubida } from '@/lib/mobile-api'
import { carpetaDeLaApi, typeFromContentType } from '@/lib/social/publish/batch'

// Las keys llevan el nombre que puso quien sube; uno kilométrico solo alarga cada URL que
// Meta y YouTube van a descargar. El mismo criterio que `prepararSubida`.
const MAX_NOMBRE = 80

/**
 * La clave y el tipo de un archivo que un cliente de la API va a subir directo al almacén
 * (`POST /api/media`). Valida como el teléfono —`prepararSubida`: tipo publicable, tamaño
 * declarado—, con dos diferencias:
 *
 * - La clave va en la carpeta del dueño de la llave (`carpetaDeLaApi`). El lote acepta sin
 *   bajarlos solo los archivos de esa carpeta, así que una llave no puede programar con lo
 *   que subió otra.
 * - Termina en la extensión de su tipo, no en la que traiga el nombre: las reglas de formato
 *   del lote leen la extensión de la URL, y un `video.mov` subido como `video/mp4` les
 *   mentiría.
 */
export function subidaDeLaApi(
  ownerId: string,
  nombre: string,
  tipo: string,
  bytes: unknown,
  uuid: string,
): { key: string; mediaType: 'image' | 'video'; tipo: string } | { error: string } {
  const subida = prepararSubida(nombre, tipo, bytes, uuid)
  if ('error' in subida) return subida
  const { extension } = typeFromContentType(subida.tipo)!
  const base =
    (nombre.split(/[\\/]/).pop() ?? '').trim().replace(/\.[A-Za-z0-9]{1,5}$/, '').slice(-MAX_NOMBRE) || 'archivo'
  return { ...subida, key: `${carpetaDeLaApi(ownerId)}${uuid}-${base}.${extension}` }
}
