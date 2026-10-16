/**
 * Sube los archivos del panel directo a R2, sin que crucen la función.
 *
 * Vercel corta los cuerpos de petición en ~4,5 MB (medido contra producción el
 * 2026-09-23), así que mandar un video dentro del formulario de una acción de servidor
 * devuelve `413` sin importar qué diga `serverActions.bodySizeLimit`: la plataforma
 * rechaza antes de que Next mire. Acá el navegador pide una URL firmada y hace el PUT él
 * mismo; a la acción solo le llega la URL pública.
 *
 * Este módulo corre en el navegador: nada de `server-only`, ni de `@/db`, ni de `node:`.
 */
export type MediaSubida = { url: string; mediaType: 'image' | 'video'; nombre: string }

/** Lo que se le muestra a quien está mirando el compositor, no lo que se registra. */
const FALLO_FIRMA = 'No se pudo preparar la subida.'
const FALLO_PUT = 'No se pudo subir el archivo.'

/**
 * El PUT a la URL firmada. Con `alAvanzar`, en el navegador va por `XMLHttpRequest`, que es lo
 * único que informa los bytes enviados (`fetch` no cuenta lo que sube): el compositor llena la
 * carne del corte con eso, y un video de 300 MB ya no es un «Subiendo…» quieto que parece
 * colgado. Sin `alAvanzar`, o donde no hay `XMLHttpRequest` (los tests), va por `fetch`.
 *
 * `senal` cancela: quitar un archivo mientras sube corta su PUT.
 */
function poner(url: string, tipo: string, file: File, alAvanzar?: (fraccion: number) => void, senal?: AbortSignal): Promise<void> {
  if (!alAvanzar || typeof XMLHttpRequest === 'undefined') {
    return fetch(url, { method: 'PUT', headers: { 'Content-Type': tipo }, body: file, signal: senal }).then((r) => {
      if (!r.ok) throw new Error(`${FALLO_PUT} (${r.status})`)
    })
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', tipo)
    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable && evento.total > 0) alAvanzar(evento.loaded / evento.total)
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`${FALLO_PUT} (${xhr.status})`)))
    xhr.onerror = () => reject(new Error(FALLO_PUT))
    xhr.onabort = () => reject(new DOMException('Subida cancelada.', 'AbortError'))
    if (senal) {
      if (senal.aborted) {
        reject(new DOMException('Subida cancelada.', 'AbortError'))
        return
      }
      senal.addEventListener('abort', () => xhr.abort(), { once: true })
    }
    xhr.send(file)
  })
}

/**
 * Un archivo, firmado y subido. `alAvanzar` recibe cuánto lleva, de 0 a 1; `senal` lo cancela,
 * y entonces revienta con un `AbortError` que quien llama distingue por el nombre.
 */
export async function subirUno(file: File, alAvanzar?: (fraccion: number) => void, senal?: AbortSignal): Promise<MediaSubida> {
  const firma = await fetch('/api/admin/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: file.name, tipo: file.type, bytes: file.size }),
    signal: senal,
  })
  if (!firma.ok) {
    // La ruta explica en español qué pasó (tipo no publicable, archivo muy grande): esa
    // frase vale más que un código, así que se usa si vino.
    const detalle = await firma.json().catch(() => null)
    throw new Error(detalle?.error || `${FALLO_FIRMA} (${firma.status})`)
  }
  const { subir, publica, mediaType, tipo } = (await firma.json()) as {
    subir: string
    publica: string
    mediaType: 'image' | 'video'
    tipo: string
  }

  // El content-type tiene que ser exactamente el que se firmó o R2 rechaza la firma, así
  // que se usa el que devolvió la ruta y no el del File, que para un .mov puede venir vacío.
  await poner(subir, tipo, file, alAvanzar, senal)

  return { url: publica, mediaType, nombre: file.name }
}

/**
 * De a uno y en orden: son pocos archivos por post, el orden importa para el carrusel, y
 * en paralelo un fallo a la mitad deja más basura suelta en el bucket.
 */
export async function subirArchivos(
  files: File[],
  alProgresar?: (hechos: number, total: number) => void,
): Promise<MediaSubida[]> {
  const subidos: MediaSubida[] = []
  for (const file of files) {
    subidos.push(await subirUno(file))
    alProgresar?.(subidos.length, files.length)
  }
  return subidos
}
