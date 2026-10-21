import { randomUUID } from 'node:crypto'
import { guardar } from '@/lib/storage'
import { MAX_DOCUMENTO_BYTES } from '../comentarios/reglas'
import { descargarSeguro, leerConTope, TOPE_POR_DEFECTO_MS } from './descarga-segura'

const TIPO = 'application/pdf'

/** Los cinco primeros bytes de un PDF real, sea cual sea su versión declarada. */
const CABECERA_PDF = '%PDF-'

/**
 * El PDF de una regla, copiado a R2. Devuelve su URL pública, o `null` si no se pudo —
 * nunca lanza: una fila mala del lote se rechaza con su frase, no revienta el lote.
 *
 * Se copia en vez de enlazar la URL del que llama por dos razones: un enlace de Drive
 * sirve una página HTML, no el PDF; y entre programar y comentar pasan días, en los que
 * esa URL puede morir.
 *
 * `hasta` es el instante en que la descarga se corta: el lote pasa uno más temprano cuando
 * ya le queda poco tiempo.
 */
export async function documentoToBlob(url: string, hasta: number = Date.now() + TOPE_POR_DEFECTO_MS): Promise<string | null> {
  // `descargarSeguro` es la comprobación de red interna compartida con `mediaToBlob`
  // (batch.ts): rechaza la URL antes de cada intento, incluida cada redirección.
  const descarga = await descargarSeguro(url, 'el documento', hasta)
  if (!descarga.ok) return null
  const response = descarga.response
  // El content-type manda sobre la extensión: es lo que atrapa la página intermedia de
  // Drive, que llegaría como `text/html` con una URL que termina en .pdf.
  const contentType = (response.headers.get('content-type') ?? '').split(';')[0]!.trim().toLowerCase()
  if (contentType !== TIPO) {
    console.error('El documento no es un PDF:', contentType, url.slice(0, 200))
    await response.body?.cancel().catch(() => {})
    return null
  }
  // Un `content-length` que ya declara de más ahorra abrir el streaming para nada, pero
  // no es la comprobación que protege: puede faltar (`Number(null) → 0`), venir `-1` o
  // `abc` (`NaN`, y `NaN > tope` es falso) o mentir hacia abajo — los cuatro pasan de
  // largo este chequeo. La que protege de verdad es `leerConTope`, más abajo, que corta
  // el streaming en cuanto se pasa del tope en vez de bufferear el cuerpo entero primero.
  const declarado = Number(response.headers.get('content-length') ?? '0')
  if (declarado > MAX_DOCUMENTO_BYTES) {
    console.error('El documento declara', declarado, 'bytes y el tope es', MAX_DOCUMENTO_BYTES)
    await response.body?.cancel().catch(() => {})
    return null
  }
  const leido = await leerConTope(response, MAX_DOCUMENTO_BYTES, url, 'el documento')
  if ('motivo' in leido) {
    // El motivo específico (cuerpo vacío, corte a mitad, tope superado por streaming)
    // ya quedó registrado dentro de `leerConTope`; este solo dice que la fila se rechaza.
    console.error('El documento: se rechazó el cuerpo descargado:', leido.motivo, url.slice(0, 200))
    return null
  }
  const blob = leido.blob
  // El `content-type` es la cabecera que manda un tercero, y miente: la spec dice que
  // atrapa la página intermedia de Drive, pero esa página también podría venir marcada
  // `application/pdf` a mano. Los cinco primeros bytes son el propio archivo, no lo que
  // alguien declaró sobre él — por eso se comprueban antes de guardar, no en vez del
  // content-type de arriba (que sigue rechazando de una vez lo que ni se anuncia PDF).
  // El `await` va envuelto no porque leer un Blob ya en memoria pueda fallar —no hay red
  // detrás—, sino porque esta función promete no lanzar y en esta rama esa promesa ya se
  // rompió tres veces por un `await` que parecía inofensivo. Barato de sostener.
  let cabecera: string
  try {
    cabecera = Buffer.from(await blob.slice(0, CABECERA_PDF.length).arrayBuffer()).toString('latin1')
  } catch (error) {
    console.error('El documento: no se pudo leer su cabecera:', String(error).slice(0, 200))
    return null
  }
  if (cabecera !== CABECERA_PDF) {
    console.error('El documento no empieza con la cabecera de un PDF:', url.slice(0, 200))
    return null
  }
  try {
    return await guardar(`reglas/${randomUUID()}.pdf`, blob, TIPO)
  } catch (error) {
    console.error('El documento: no se pudo guardar en el almacén:', String(error).slice(0, 200))
    return null
  }
}
