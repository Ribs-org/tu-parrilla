import { Directory, File, FileMode, Paths, type FileHandle } from 'expo-file-system'

/**
 * El archivo del teléfono que sube a la cámara de frío, leído a trozos desde el disco: un video
 * grabado pesa lo que pesa —un largo, varios GB— y nunca pasa entero por la memoria de JavaScript.
 *
 * Cada parte de la subida (64 MB, la que fija el servidor) se copia de a `TROZO` a un archivo
 * temporal en la caché y ese temporal lo sube el teléfono mismo (`File.upload`, que lee del disco),
 * con su avance; después se borra. Así, lo más que ocupa en memoria es un trozo, y en disco, una
 * parte. Mandar los bytes con `fetch` no sirve: React Native pasa un `ArrayBuffer` a texto en
 * base64 para cruzarlo a la parte nativa, y 64 MB se vuelven 85 en memoria.
 *
 * En la web, `archivo-local.web.ts`.
 */

export type Fuente = { uri: string; web?: Blob | null }

/**
 * Donde se guarda lo recién grabado hasta que termina de subir. La cámara del teléfono lo deja en
 * la caché de la app —no en la galería—, y el sistema puede limpiarla: si la subida se corta y la
 * app se cierra, el video se perdería. Acá no se limpia solo; lo borra la app al terminar de subir,
 * al quitarlo, o al abrir La Cocina si ya nadie lo espera.
 */
function carpeta(): Directory {
  return new Directory(Paths.document, 'cocina')
}

/** Pasa lo grabado de la caché a la carpeta que no se limpia sola, y devuelve dónde quedó. */
export async function conservar(uri: string): Promise<string> {
  const destino = carpeta()
  if (!destino.exists) destino.create({ intermediates: true })
  const archivo = new File(uri)
  await archivo.move(destino)
  return archivo.uri
}

/** Si el archivo sigue en el teléfono. */
export async function existe(fuente: Fuente): Promise<boolean> {
  try {
    return new File(fuente.uri).exists
  } catch {
    return false
  }
}

/** Borra la copia que se guardó de lo grabado; lo que no es de esa carpeta no se toca. */
export async function soltarCopia(uri: string): Promise<void> {
  try {
    if (uri.startsWith(carpeta().uri)) new File(uri).delete()
  } catch {
    // Si no se pudo, la barre la próxima vez que se abra La Cocina.
  }
}

/** Borra de la carpeta lo que ya nadie espera subir: lo de una sesión cerrada, o lo que quedó suelto. */
export async function barrerCopias(esperadas: readonly string[]): Promise<void> {
  try {
    const dir = carpeta()
    if (!dir.exists) return
    for (const cosa of dir.list()) {
      if (cosa instanceof File && !esperadas.includes(cosa.uri)) cosa.delete()
    }
  } catch {
    // Barrer es limpieza: si falla, se intenta la próxima vez.
  }
}

/** Lo que se copia de una vez: 4 MB. */
const TROZO = 4 * 1024 * 1024

/** Lo que pesa de verdad, del disco: el servidor exige el peso exacto, y el selector no siempre lo dice. */
export async function pesoDe(fuente: Fuente): Promise<number> {
  return new File(fuente.uri).size
}

/** Copia `[desde, hasta)` del archivo a un temporal, de a trozos, cediendo el hilo entre uno y otro. */
async function copiarTramo(uri: string, desde: number, hasta: number, destino: File, senal: AbortSignal): Promise<void> {
  let origen: FileHandle | null = null
  let escritura: FileHandle | null = null
  try {
    destino.create({ overwrite: true })
    origen = new File(uri).open(FileMode.ReadOnly)
    escritura = destino.open(FileMode.WriteOnly)
    origen.offset = desde
    for (let quedan = hasta - desde; quedan > 0; ) {
      if (senal.aborted) throw new Error('Abortada')
      const bytes = origen.readBytes(Math.min(TROZO, quedan))
      if (bytes.length === 0) throw new Error('El archivo terminó antes de lo que pesaba')
      escritura.writeBytes(bytes)
      quedan -= bytes.length
      // Que la pantalla alcance a dibujarse entre un trozo y el siguiente.
      await new Promise((listo) => setTimeout(listo, 0))
    }
  } finally {
    origen?.close()
    escritura?.close()
  }
}

/** Sube `[desde, hasta)` del archivo a la URL firmada de una parte, avisando cuántos bytes van. */
export async function subirTramo(
  fuente: Fuente,
  url: string,
  desde: number,
  hasta: number,
  alAvanzar: (bytes: number) => void,
  senal: AbortSignal,
): Promise<void> {
  const temporal = new File(Paths.cache, `cocina-parte-${Date.now()}-${Math.floor(Math.random() * 1e9)}.bin`)
  try {
    await copiarTramo(fuente.uri, desde, hasta, temporal, senal)
    // Sin cabeceras: ninguna va en la firma de la parte.
    const r = await temporal.upload(url, {
      httpMethod: 'PUT',
      onProgress: ({ bytesSent }) => alAvanzar(Math.min(bytesSent, hasta - desde)),
      signal: senal,
    })
    if (r.status < 200 || r.status >= 300) {
      console.warn('PUT de una parte:', r.status, r.body.slice(0, 300))
      throw new Error(`HTTP ${r.status}`)
    }
  } finally {
    try {
      if (temporal.exists) temporal.delete()
    } catch {
      // La caché la limpia el sistema: un temporal que no se pudo borrar no detiene la subida.
    }
  }
}
