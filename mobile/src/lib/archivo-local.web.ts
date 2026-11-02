import type { Fuente } from './archivo-local'

/**
 * `archivo-local.ts` en la web, donde `expo-file-system` no existe: el selector entrega el archivo
 * del navegador (`asset.file`), que se corta con `slice` sin leerlo entero, y cada parte sube con
 * un `XMLHttpRequest`, que avisa el avance. Sirve para probar La Cocina con Expo web; en el
 * teléfono corre la otra.
 */

/** En la web no hay caché que se limpie: lo elegido se queda donde está. */
export async function conservar(uri: string): Promise<string> {
  return uri
}

export async function existe(): Promise<boolean> {
  return false
}

export async function soltarCopia(): Promise<void> {}

export async function barrerCopias(): Promise<void> {}

async function blobDe(fuente: Fuente): Promise<Blob> {
  return fuente.web ?? (await (await fetch(fuente.uri)).blob())
}

export async function pesoDe(fuente: Fuente): Promise<number> {
  return (await blobDe(fuente)).size
}

export async function subirTramo(
  fuente: Fuente,
  url: string,
  desde: number,
  hasta: number,
  alAvanzar: (bytes: number) => void,
  senal: AbortSignal,
): Promise<void> {
  const parte = (await blobDe(fuente)).slice(desde, hasta)
  await new Promise<void>((listo, fallo) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.upload.onprogress = (e) => alAvanzar(e.loaded)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? listo() : fallo(new Error(`HTTP ${xhr.status}`)))
    xhr.onerror = () => fallo(new Error('Sin red'))
    xhr.onabort = () => fallo(new Error('Abortada'))
    senal.addEventListener('abort', () => xhr.abort())
    xhr.send(parte)
  })
}
