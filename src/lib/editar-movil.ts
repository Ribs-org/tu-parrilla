import { and, asc, eq } from 'drizzle-orm'
import { getDb, reglasClave, scheduledPostMedia, scheduledPostTargets, scheduledPosts, socialAccounts } from '@/db'
import { isoInZone } from './metrics-api'
import { networkLabel } from './networks'
import { EN_CURSO, YA_SALIO_EN_ALGUNA } from './social/publish/editar'
import { enVuelo } from './social/publish/publisher'
import { MAX_CAPTION_LENGTH, THREADS_CAPTION_LIMIT, X_CAPTION_LIMIT } from './social/publish/validate'
import { esUuid } from './uuid'

// Un post programado abierto en la app del teléfono para corregirlo: el texto, la hora y las
// cuentas. Lo que el teléfono no edita —los archivos, la portada, los atributos, la palabra
// clave, las opciones de cada red— se guarda como está (`editarPostProgramado` con
// `CONSERVAR`), y `seConserva` lo dice en la pantalla para que nadie crea que se perdió.

export type PostEditableMovil = {
  id: string
  texto: string
  /** El instante con la zona del dueño, como el `cuando` de La Parrilla. */
  cuando: string
  /** Cada destino con el largo máximo del texto en su red: el teléfono cuenta contra el menor. */
  destinos: Array<{ id: string; red: string; handle: string | null; estado: string; limite: number }>
  /** Lo que se guarda sin tocar, en una frase, o null si no hay nada. */
  seConserva: string | null
  /** Por qué este post no se edita desde el teléfono, o null si se puede. */
  bloqueo: string | null
}

/** El largo máximo del texto en una red: las mismas cifras que `validateScheduleDraft`. */
export function limiteDeTexto(red: string): number {
  if (red === 'x') return X_CAPTION_LIMIT
  if (red === 'threads') return THREADS_CAPTION_LIMIT
  return MAX_CAPTION_LENGTH
}

/** «a», «a y b», «a, b y c». */
function enLista(partes: string[]): string {
  if (partes.length <= 1) return partes.join('')
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
}

/**
 * La nota de lo que el teléfono no cambia y se guarda como está, o null si el post no tiene
 * nada de eso. `redesConOpciones` son las redes de los destinos con opciones propias (TikTok,
 * un trial reel, una historia).
 */
export function loQueSeConserva(p: {
  archivos: number
  portada: boolean
  atributos: boolean
  palabra: string | null
  redesConOpciones: string[]
}): string | null {
  const partes: string[] = []
  if (p.archivos === 1) partes.push('el archivo')
  if (p.archivos > 1) partes.push(`los ${p.archivos} archivos`)
  if (p.portada) partes.push('la portada')
  if (p.atributos) partes.push('los atributos')
  if (p.palabra) partes.push(`la palabra clave «${p.palabra}»`)
  const redes = [...new Set(p.redesConOpciones)].map(networkLabel)
  if (redes.length > 0) partes.push(`las opciones de ${enLista(redes)}`)
  if (partes.length === 0) return null
  return `Desde el teléfono no se cambia y queda como está: ${enLista(partes)}. Eso se cambia en el panel web.`
}

/**
 * Por qué no se edita desde el teléfono: lo que está saliendo ahora, o lo que ya salió en alguna
 * cuenta. Las dos son las frases con que `editarPostProgramado` rechazaría guardar.
 */
export function bloqueoDe(
  destinos: ReadonlyArray<{ status: string; reclamadoHasta?: Date | null }>,
  ahora: Date = new Date(),
): string | null {
  if (destinos.some((t) => t.status === 'publishing' || enVuelo(t, ahora))) return EN_CURSO
  if (destinos.some((t) => t.status === 'published')) return YA_SALIO_EN_ALGUNA
  return null
}

/**
 * El post para la pantalla de edición del teléfono, o null si no existe o es de otro —la misma
 * respuesta, a propósito—. La primera consulta lo ata al dueño; las demás van por el id que esa
 * ya confirmó.
 */
export async function postParaEditarEnElTelefono(
  ownerId: string,
  postId: string,
  zona: string,
): Promise<PostEditableMovil | null> {
  // Un id sin forma de uuid no existe: a la base le llegaría como un error, no como cero filas.
  if (!esUuid(postId)) return null
  const db = getDb()
  const [post] = await db
    .select()
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.ownerId, ownerId)))
  if (!post) return null

  const filas = await db
    .select({ target: scheduledPostTargets, handle: socialAccounts.handle })
    .from(scheduledPostTargets)
    // `leftJoin`: una cuenta borrada no hace desaparecer el destino, solo su nombre.
    .leftJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(eq(scheduledPostTargets.postId, post.id))
    // Por red, y dentro de una red siempre en el mismo orden: la lista no salta al recargar.
    .orderBy(asc(scheduledPostTargets.network), asc(scheduledPostTargets.id))
  const archivos = await db
    .select({ id: scheduledPostMedia.id })
    .from(scheduledPostMedia)
    .where(eq(scheduledPostMedia.postId, post.id))
  const [regla] = await db
    .select({ palabra: reglasClave.palabra })
    .from(reglasClave)
    .where(eq(reglasClave.postId, post.id))

  const atributos = post.atributos
  return {
    id: post.id,
    texto: post.caption,
    cuando: isoInZone(post.scheduledAt, zona),
    destinos: filas.map(({ target, handle }) => ({
      id: target.id,
      red: target.network,
      handle,
      estado: target.status,
      limite: limiteDeTexto(target.network),
    })),
    seConserva: loQueSeConserva({
      archivos: archivos.length,
      portada: Boolean(post.coverUrl),
      atributos: atributos !== null && typeof atributos === 'object' && Object.keys(atributos).length > 0,
      palabra: regla?.palabra.trim() || null,
      redesConOpciones: filas.flatMap(({ target }) => (target.opciones == null ? [] : [target.network])),
    }),
    bloqueo: bloqueoDe(filas.map(({ target }) => target)),
  }
}
