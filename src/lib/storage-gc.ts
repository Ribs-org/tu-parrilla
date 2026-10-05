import { getDb, links, profiles, reglasClave, scheduledPostMedia, scheduledPosts } from '@/db'
import { basePublica, borrar, keyDesdeUrl, listar, type ObjetoAlmacenado } from '@/lib/storage'

/**
 * Entre el `guardar()` y el `insert()` de la fila hay una ventana real. Una hora es
 * holgadísima para la más lenta de esas escrituras; el barrido corre en cada pasada del
 * cron de publicación, así que lo que quede pasada la hora se va en minutos.
 */
export const GRACIA_MS = 60 * 60 * 1000

export type Barrido = { borrados: number; bytes: number; error?: string }

/** Lo más que puede tardar cada lectura del barrido antes de rendirse hasta la pasada siguiente. */
const PLAZO_MS = 60_000

function conPlazo<T>(promesa: Promise<T>, ms: number, que: string): Promise<T> {
  let reloj: ReturnType<typeof setTimeout> | undefined
  const vencida = new Promise<never>((_, rechazar) => {
    reloj = setTimeout(() => rechazar(new Error(`${que} no terminó en ${ms} ms`)), ms)
  })
  return Promise.race([promesa, vencida]).finally(() => clearTimeout(reloj))
}

/**
 * La regla: se va lo que ninguna fila referencia y lleva más de `graciaMs` subido.
 *
 * `referenciadas` son keys del almacén, no URLs completas —comparar por key es lo
 * que hace que un cambio en la base pública (R2_PUBLIC_BASE) no vacíe el bucket: si
 * la base con la que se compuso una URL guardada ya no coincide con la actual,
 * `keyDesdeUrl` la resuelve a null en vez de a una key que nunca va a calzar, y
 * `keysReferenciadas` la descarta antes de llegar acá.
 *
 * El conjunto vacío es el caso peligroso y se trata aparte. Un bucket con objetos y
 * cero referencias no es un estado que esta app produzca —cada archivo nace junto a
 * la fila que lo apunta—, así que es mucho más probable una lectura fallida (o, ahora,
 * un cambio de base) que un bucket legítimamente huérfano. Ante la duda no se borra:
 * postergar el barrido un día no cuesta nada, vaciar el bucket no tiene vuelta.
 */
export function objetosABorrar(
  objetos: ObjetoAlmacenado[],
  referenciadas: Set<string>,
  ahora: Date,
  graciaMs: number = GRACIA_MS,
): ObjetoAlmacenado[] {
  if (referenciadas.size === 0) return []
  const limite = ahora.getTime() - graciaMs
  return objetos.filter((o) => !referenciadas.has(o.key) && o.uploadedAt.getTime() < limite)
}

/**
 * Resuelve URLs guardadas en la base de datos a keys del almacén actual. Una URL que
 * no resuelve —de otra base, o de un host ajeno como una miniatura de Instagram—
 * devuelve null y se descarta: exactamente las URLs que no deben proteger ningún
 * objeto.
 */
export function keysReferenciadas(urls: Set<string>, base: string): Set<string> {
  const keys = new Set<string>()
  for (const url of urls) {
    const key = keyDesdeUrl(base, url)
    if (key) keys.add(key)
  }
  return keys
}

/**
 * Toda columna que puede guardar una URL de nuestro almacén. Es la fuente de verdad del
 * barrido: las consultas se generan de acá, así que una columna nueva sin registrar no
 * «se olvida en el barrido», simplemente no existe para él.
 *
 * Lo que falta a propósito, con su motivo (y lo que hace que un test —no la memoria de
 * quien lea esto— note una séptima columna que nadie registre): `social_posts.
 * thumbnail_url` es el CDN de la red, no algo que copiamos; `source_posts.url` es el
 * tuit ajeno, otra red también; `links.url` es el destino que escribe el dueño del
 * link, no un archivo. Ver `storage-gc.test.ts`, que deriva esta lista del esquema real
 * en vez de repetirla a mano.
 */
export const COLUMNAS_DE_ARCHIVO = [
  { tabla: 'profiles', columna: 'avatar_url', ref: profiles.avatarUrl },
  { tabla: 'profiles', columna: 'og_image_url', ref: profiles.ogImageUrl },
  { tabla: 'links', columna: 'image_url', ref: links.imageUrl },
  { tabla: 'scheduled_posts', columna: 'cover_url', ref: scheduledPosts.coverUrl },
  { tabla: 'scheduled_post_media', columna: 'blob_url', ref: scheduledPostMedia.blobUrl },
  { tabla: 'reglas_clave', columna: 'documento_url', ref: reglasClave.documentoUrl },
] as const

export async function urlsReferenciadas(): Promise<Set<string>> {
  // A propósito sin dueño: el bucket es uno solo, así que lo referenciado por cualquier
  // usuario protege el archivo. Filtrar por dueño aquí borraría los archivos de los demás.
  const db = getDb()
  const filas = await Promise.all(
    COLUMNAS_DE_ARCHIVO.map((c) => db.select({ valor: c.ref }).from(c.ref.table)),
  )
  const urls = new Set<string>()
  for (const grupo of filas) for (const f of grupo) if (f.valor) urls.add(f.valor)
  return urls
}

/**
 * Un barrido. Cierra la fuga como regla en vez de como parche: cualquier camino que
 * borre una fila y olvide el archivo queda cubierto al día siguiente.
 *
 * Nunca lanza. Un barrido que falla no puede ensuciar una publicación que funcionó,
 * que es el trabajo real del cron que lo llama.
 */
export async function barrerHuerfanos(ahora: Date = new Date()): Promise<Barrido> {
  const inicio = Date.now()
  try {
    // Cada lectura con su línea y su plazo: la corrida que lo llama muere a los 240 s, y un
    // barrido que no termina se la llevaba entera (los 504 de octubre de 2026).
    const [objetos, urls] = await Promise.all([
      listar(inicio + PLAZO_MS).then((o) => {
        console.log(`[barrido] R2: ${o.length} objetos en ${Date.now() - inicio} ms`)
        return o
      }),
      conPlazo(urlsReferenciadas(), PLAZO_MS, 'la lectura de la base').then((u) => {
        console.log(`[barrido] base: ${u.size} URLs en ${Date.now() - inicio} ms`)
        return u
      }),
    ])
    // listar() ya lanzó SIN_ALMACEN si no hay base configurada, así que en la
    // práctica esto siempre es no-null acá. El `?? new Set()` es solo para que el
    // tipo cierre sin forzar un throw redundante.
    const base = basePublica()
    const referenciadas = base ? keysReferenciadas(urls, base) : new Set<string>()
    let borrados = 0
    let bytes = 0
    const aBorrar = objetosABorrar(objetos, referenciadas, ahora)
    if (aBorrar.length > 0) console.log(`[barrido] ${aBorrar.length} huérfanos por borrar`)
    for (const objeto of aBorrar) {
      await borrar(objeto.url)
      borrados += 1
      bytes += objeto.size
    }
    return { borrados, bytes }
  } catch (error) {
    console.error('El barrido de huérfanos falló:', String(error).slice(0, 300))
    return { borrados: 0, bytes: 0, error: 'El barrido falló.' }
  }
}
