import { File } from 'expo-file-system'

import { apiPost } from './api'
import type { Elegido } from './publicar'

export type SubidaHecha = { url: string; mediaType: 'image' | 'video' }

/** `tipo` es el que firmó el servidor; uno de antes del 2026-10-21 no lo manda, y vale el del archivo. */
type Destino = { subir: string; publica: string; mediaType: 'image' | 'video'; tipo?: string }

// Las dos cabeceras van dentro de la firma del PUT: tienen que ir tal cual o R2 responde
// 403. El valor de Cache-Control es el que pone el servidor en src/lib/storage.ts.
const CACHE_INMUTABLE = 'public, max-age=31536000, immutable'

/**
 * Un archivo de la galería, subido a R2: el servidor firma una URL (`/api/mobile/upload-url`)
 * y el teléfono sube directo ahí, sin pasar por el servidor. Publicar lo llama apenas se
 * elige el archivo, como el compositor del panel: el borrador tiene que poder guardarlo.
 *
 * Un 401 sube como `SesionCaducada` y una frase del servidor como `RechazoApi`; la red caída
 * o un PUT que R2 no aceptó, como un error cualquiera. Con `signal` abortado también revienta:
 * quien llama distingue la cancelación mirando el `signal`.
 */
export async function subirUno(
  token: string,
  archivo: Elegido,
  onProgreso: (progreso: number) => void,
  signal: AbortSignal,
): Promise<SubidaHecha> {
  const destino = await apiPost<Destino>('/api/mobile/upload-url', token, {
    nombre: archivo.nombre,
    tipo: archivo.tipo,
    bytes: archivo.bytes,
  })
  // `File` lee desde disco: un video de 200 MB nunca pasa entero por memoria.
  const resultado = await new File(archivo.uri).upload(destino.subir, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': destino.tipo ?? archivo.tipo, 'Cache-Control': CACHE_INMUTABLE },
    onProgress: ({ bytesSent, totalBytes }) => onProgreso(totalBytes > 0 ? bytesSent / totalBytes : 0),
    signal,
  })
  if (resultado.status < 200 || resultado.status >= 300) {
    console.warn('PUT a R2:', resultado.status, resultado.body.slice(0, 300))
    throw new Error(`HTTP ${resultado.status}`)
  }
  return { url: destino.publica, mediaType: destino.mediaType }
}
