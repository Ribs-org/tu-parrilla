import 'server-only'
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { getDb, postComments, reglasClave, scheduledPostTargets, socialAccounts, socialPosts } from '@/db'
import type { CommentState, DmState } from '@/db/schema'
import { proximamentePara, tiktokComentariosAbiertoPara } from '@/lib/redes-abiertas'
import { permisosExtraDeThreads } from '@/lib/social/threads'

const int = (fragment: SQL) => sql<number>`${fragment}`.mapWith(Number)

export const ESTADOS_COLA = ['pendientes', 'enviados', 'automaticas', 'descartados', 'todos'] as const
export type EstadoCola = (typeof ESTADOS_COLA)[number]

const REDES = ['instagram', 'facebook', 'youtube'] as const

/**
 * Los botones de red de La Mesa para este dueño, en el panel y en el teléfono. Threads solo
 * aparece donde ya trae respuestas: abierta para él (`proximamentePara`, la cuenta del revisor de
 * Meta) y con sus permisos de lectura pedidos (`permisosExtraDeThreads`). Para los demás está en
 * «Próximamente» y su botón no filtraría nada. TikTok, igual: solo para quien tiene abiertos sus
 * comentarios (`tiktokComentariosAbiertoPara`, `social/tiktok-business.ts`).
 */
export function redesDeLaMesa(ownerId: string): readonly string[] {
  const conThreads = permisosExtraDeThreads() && !proximamentePara(ownerId).has('threads')
  return [...REDES, ...(conThreads ? ['threads'] : []), ...(tiktokComentariosAbiertoPara(ownerId) ? ['tiktok'] : [])]
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
