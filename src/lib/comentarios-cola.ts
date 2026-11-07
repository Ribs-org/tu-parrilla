import 'server-only'
import { and, desc, eq, gte, inArray, isNotNull, isNull, sql, type SQL } from 'drizzle-orm'
import { getDb, postComments, reglasClave, scheduledPostTargets, socialAccounts, socialPosts } from '@/db'
import type { CommentState, DmState } from '@/db/schema'
import { proximamentePara } from '@/lib/redes-abiertas'
import { comentariosQueFaltan } from '@/lib/social/comentarios/faltantes'
import { DIAS_VENTANA } from '@/lib/social/comentarios/ventana'
import { permisosExtraDeThreads } from '@/lib/social/threads'

const int = (fragment: SQL) => sql<number>`${fragment}`.mapWith(Number)

export const ESTADOS_COLA = ['pendientes', 'enviados', 'automaticas', 'descartados', 'todos'] as const
export type EstadoCola = (typeof ESTADOS_COLA)[number]

const REDES = ['instagram', 'facebook', 'youtube'] as const

/**
 * Los botones de red de La Mesa para este dueño, en el panel y en el teléfono. Threads solo
 * aparece donde ya trae respuestas: abierta para él (`proximamentePara`, la cuenta del revisor de
 * Meta) y con sus permisos de lectura pedidos (`permisosExtraDeThreads`). Para los demás está en
 * «Próximamente» y su botón no filtraría nada.
 */
export function redesDeLaMesa(ownerId: string): readonly string[] {
  const conThreads = permisosExtraDeThreads() && !proximamentePara(ownerId).has('threads')
  return conThreads ? [...REDES, 'threads'] : REDES
}

/** Lo pendiente incluye lo fallido: las dos cosas esperan un toque del dueño. */
const POR_ESTADO: Record<EstadoCola, CommentState[]> = {
  pendientes: ['pendiente', 'fallido'],
  // Lo que el dueño respondió desde la app de la red también está respondido.
  enviados: ['enviado', 'en_la_red'],
  automaticas: ['pendiente', 'fallido', 'enviado', 'descartado'],
  descartados: ['descartado'],
  todos: ['pendiente', 'fallido', 'enviado', 'descartado', 'en_la_red'],
}

/** Tope de la cola en pantalla: más que esto no se revisa de una sentada. */
const MAX_FILAS = 200

export type ComentarioFila = {
  id: string
  network: string
  accountHandle: string | null
  author: string | null
  text: string
  publishedAt: Date
  draft: string | null
  draftError: string | null
  state: CommentState
  error: string | null
  replyExternalId: string | null
  dmState: DmState
  dmError: string | null
  postExternalId: string
  postCaption: string | null
  postThumbnailUrl: string | null
  postPermalink: string | null
  automatico: boolean
  reglaPalabra: string | null
}

export async function getCola(
  ownerId: string,
  filtro: { estado: EstadoCola; red: string | null },
): Promise<ComentarioFila[]> {
  const condiciones = [inArray(postComments.state, POR_ESTADO[filtro.estado]), eq(socialAccounts.ownerId, ownerId)]
  if (filtro.red) condiciones.push(eq(postComments.network, filtro.red))
  if (filtro.estado === 'automaticas') condiciones.push(eq(postComments.automatico, true))
  const filas = await getDb()
    .select({
      id: postComments.id,
      network: postComments.network,
      accountHandle: socialAccounts.handle,
      author: postComments.author,
      text: postComments.text,
      publishedAt: postComments.publishedAt,
      draft: postComments.draft,
      draftError: postComments.draftError,
      state: postComments.state,
      error: postComments.error,
      replyExternalId: postComments.replyExternalId,
      dmState: postComments.dmState,
      dmError: postComments.dmError,
      postExternalId: postComments.postExternalId,
      postCaption: socialPosts.caption,
      postThumbnailUrl: socialPosts.thumbnailUrl,
      postPermalink: socialPosts.permalink,
      automatico: postComments.automatico,
      reglaPalabra: reglasClave.palabra,
    })
    .from(postComments)
    .leftJoin(socialAccounts, eq(socialAccounts.id, postComments.accountId))
    .leftJoin(
      socialPosts,
      and(eq(socialPosts.accountId, postComments.accountId), eq(socialPosts.externalId, postComments.postExternalId)),
    )
    .leftJoin(
      scheduledPostTargets,
      and(eq(scheduledPostTargets.accountId, postComments.accountId), eq(scheduledPostTargets.externalId, postComments.postExternalId)),
    )
    .leftJoin(reglasClave, eq(reglasClave.postId, scheduledPostTargets.postId))
    .where(and(...condiciones))
    .orderBy(desc(postComments.publishedAt))
    .limit(MAX_FILAS)
  return filas
}

export async function contarPendientes(ownerId: string, red: string | null): Promise<number> {
  const condiciones = [
    inArray(postComments.state, POR_ESTADO.pendientes),
    inArray(
      postComments.accountId,
      getDb().select({ id: socialAccounts.id }).from(socialAccounts).where(eq(socialAccounts.ownerId, ownerId)),
    ),
  ]
  if (red) condiciones.push(eq(postComments.network, red))
  const [fila] = await getDb()
    .select({ total: int(sql`count(*)`) })
    .from(postComments)
    .where(and(...condiciones))
  return fila?.total ?? 0
}

/** Una publicación de Instagram del aviso de La Mesa: Instagram cuenta comentarios que no entregó. */
export type PublicacionConFaltantes = {
  id: string
  accountHandle: string | null
  caption: string | null
  thumbnailUrl: string | null
  permalink: string | null
  /** Lo que Instagram cuenta, contando las respuestas. */
  contados: number
  /** Lo que llegó: los comentarios guardados más las respuestas de la dueña que Tu Parrilla conoce. */
  entregados: number
}

/** Más que esto no se lee de una vez; son las más nuevas. */
const MAX_AVISOS = 5
/**
 * La lectura del sync tiene que ser más vieja que esto: una publicación que el sync acaba de
 * traer todavía no pasó por el sondeo, que corre cada cinco minutos, y le faltaría todo.
 */
const MARGEN_DEL_SONDEO_MS = 15 * 60_000

/**
 * Las publicaciones de Instagram del dueño en las que Instagram cuenta más comentarios de los
 * que entregó (`faltantes.ts`). Solo las que el sondeo de verdad lee: de una cuenta conectada,
 * sin archivar y dentro de la ventana del sondeo (después nadie la vuelve a leer, y lo nuevo
 * faltaría por eso). Y de una cuenta de la que alguna vez llegó un comentario: a una cuenta
 * sin el permiso de leerlos le faltarían todos, en todas.
 */
export async function getComentariosQueFaltan(
  ownerId: string,
  ahora: Date = new Date(),
): Promise<PublicacionConFaltantes[]> {
  const desde = new Date(ahora.getTime() - DIAS_VENTANA * 864e5)
  // Como texto ISO: el driver no serializa un `Date` interpolado en SQL crudo.
  const leidaAntesDe = new Date(ahora.getTime() - MARGEN_DEL_SONDEO_MS).toISOString()
  const filas = await getDb()
    .select({
      id: socialPosts.id,
      accountHandle: socialAccounts.handle,
      caption: socialPosts.caption,
      thumbnailUrl: socialPosts.thumbnailUrl,
      permalink: socialPosts.permalink,
      contados: sql<number | null>`(select m.comments from post_metrics m where m.post_id = ${socialPosts.id} and m.captured_at < ${leidaAntesDe} order by m.day desc limit 1)`,
      llegaron: int(
        sql`(select count(*) from post_comments c where c.account_id = ${socialPosts.accountId} and c.post_external_id = ${socialPosts.externalId})`,
      ),
      respuestasPropias: int(
        sql`(select count(*) from post_comments c where c.account_id = ${socialPosts.accountId} and c.post_external_id = ${socialPosts.externalId} and c.reply_external_id is not null)`,
      ),
    })
    .from(socialPosts)
    .innerJoin(socialAccounts, eq(socialAccounts.id, socialPosts.accountId))
    .where(
      and(
        eq(socialAccounts.ownerId, ownerId),
        eq(socialPosts.network, 'instagram'),
        isNotNull(socialAccounts.accessToken),
        isNull(socialPosts.archivedAt),
        gte(socialPosts.publishedAt, desde),
        sql`exists (select 1 from post_comments c where c.account_id = ${socialAccounts.id})`,
      ),
    )
    .orderBy(desc(socialPosts.publishedAt))
  return filas
    .flatMap((f) => {
      const contados = f.contados === null ? null : Number(f.contados)
      const faltan = comentariosQueFaltan({ contados, llegaron: f.llegaron, respuestasPropias: f.respuestasPropias })
      if (faltan === null || contados === null) return []
      const { llegaron, respuestasPropias, ...publicacion } = f
      return [{ ...publicacion, contados, entregados: llegaron + respuestasPropias }]
    })
    .slice(0, MAX_AVISOS)
}
