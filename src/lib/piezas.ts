import 'server-only'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets, socialAccounts, socialPosts } from '@/db'
import { CLAVE_PIEZA, clavePieza, esTrialReel } from './pieza'
import type { Atributos } from './social/publish/atributos'

/** Una versión de la pieza: un destino de un post programado, o la publicación orgánica. */
export type VersionDePieza = {
  /** El id del destino, o el de la publicación cuando no salió de La Parrilla. */
  clave: string
  /** El post programado del que salió, para mandar a editarlo; null si es orgánica. */
  scheduledPostId: string | null
  accountId: string
  network: string
  handle: string | null
  trial: boolean
  /** El id que le dio la red: un borrador mandado a la bandeja de TikTok sale sin él. */
  externalId: string | null
  /** El estado del destino (`published`, `failed`…), o null si es orgánica. */
  status: string | null
  lastError: string | null
  opciones: unknown
  /** Cuándo estaba programada, o cuándo se publicó si es orgánica. */
  fecha: Date | null
  atributos: Atributos | null
  /** La publicación sincronizada que le corresponde, si la red ya la entregó. */
  socialPostId: string | null
}

export type Pieza = {
  /** La publicación por la que se entró. */
  abierta: { id: string; caption: string | null; campaign: string }
  /** El valor de `pieza` que junta varios posts programados, si lo hay. */
  clave: string | null
  versiones: VersionDePieza[]
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Un tope por si alguien usa `pieza` como si fuera `serie`: la pantalla compara versiones
// lado a lado, y cien filas ya no se comparan a ojo.
const MAX_DESTINOS = 100

/**
 * La pieza de una publicación del dueño: los destinos del post programado del que salió
 * —y, si sus atributos traen `pieza`, los de todos los posts programados con el mismo
 * valor—, cada uno unido a su publicación sincronizada por cuenta e id de la red. Null si
 * la publicación no existe o es de otro dueño.
 */
export async function getPieza(ownerId: string, socialPostId: string): Promise<Pieza | null> {
  if (!UUID.test(socialPostId)) return null
  const db = getDb()

  const [post] = await db
    .select({
      id: socialPosts.id,
      caption: socialPosts.caption,
      campaign: socialPosts.campaign,
      network: socialPosts.network,
      accountId: socialPosts.accountId,
      externalId: socialPosts.externalId,
      publishedAt: socialPosts.publishedAt,
      handle: socialAccounts.handle,
    })
    .from(socialPosts)
    .innerJoin(socialAccounts, eq(socialAccounts.id, socialPosts.accountId))
    .where(and(eq(socialPosts.id, socialPostId), eq(socialPosts.ownerId, ownerId)))
  if (!post) return null
  const abierta = { id: post.id, caption: post.caption, campaign: post.campaign }

  // El destino que la publicó. Puede haber más de uno con el mismo id (filas históricas,
  // ver el índice en el esquema): manda el más reciente.
  const [origen] = await db
    .select({ postId: scheduledPostTargets.postId, atributos: scheduledPosts.atributos })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPosts.id, scheduledPostTargets.postId))
    .where(
      and(
        eq(scheduledPostTargets.accountId, post.accountId),
        eq(scheduledPostTargets.externalId, post.externalId),
        eq(scheduledPosts.ownerId, ownerId),
      ),
    )
    .orderBy(desc(scheduledPosts.scheduledAt))
    .limit(1)

  if (!origen) {
    return {
      abierta,
      clave: null,
      versiones: [
        {
          clave: post.id,
          scheduledPostId: null,
          accountId: post.accountId,
          network: post.network,
          handle: post.handle,
          trial: false,
          externalId: post.externalId,
          status: null,
          lastError: null,
          opciones: null,
          fecha: post.publishedAt,
          atributos: null,
          socialPostId: post.id,
        },
      ],
    }
  }

  const clave = clavePieza((origen.atributos as Atributos | null) ?? null)
  const programados = clave
    ? (
        await db
          .select({ id: scheduledPosts.id })
          .from(scheduledPosts)
          .where(
            and(
              eq(scheduledPosts.ownerId, ownerId),
              sql`trim(${scheduledPosts.atributos} ->> ${CLAVE_PIEZA}) = ${clave}`,
            ),
          )
      ).map((p) => p.id)
    : [origen.postId]

  const destinos = await db
    .select({
      id: scheduledPostTargets.id,
      postId: scheduledPostTargets.postId,
      accountId: scheduledPostTargets.accountId,
      network: scheduledPostTargets.network,
      status: scheduledPostTargets.status,
      lastError: scheduledPostTargets.lastError,
      opciones: scheduledPostTargets.opciones,
      externalId: scheduledPostTargets.externalId,
      fecha: scheduledPosts.scheduledAt,
      atributos: scheduledPosts.atributos,
      handle: socialAccounts.handle,
    })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPosts.id, scheduledPostTargets.postId))
    .innerJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(and(inArray(scheduledPostTargets.postId, programados), eq(scheduledPosts.ownerId, ownerId)))
    // Los del post abierto primero: con más de cien, la publicación por la que se entró no
    // puede quedar fuera de su propia pieza.
    .orderBy(sql`${scheduledPostTargets.postId} = ${origen.postId} desc`, desc(scheduledPosts.scheduledAt))
    .limit(MAX_DESTINOS)

  const externos = destinos.map((d) => d.externalId).filter((e): e is string => e !== null)
  const publicadas =
    externos.length === 0
      ? []
      : await db
          .select({ id: socialPosts.id, accountId: socialPosts.accountId, externalId: socialPosts.externalId })
          .from(socialPosts)
          .where(and(eq(socialPosts.ownerId, ownerId), inArray(socialPosts.externalId, externos)))
  const publicadaDe = new Map(publicadas.map((p) => [`${p.accountId}:${p.externalId}`, p.id]))

  return {
    abierta,
    clave,
    versiones: destinos.map((d) => ({
      clave: d.id,
      scheduledPostId: d.postId,
      accountId: d.accountId,
      network: d.network,
      handle: d.handle,
      trial: esTrialReel(d.network, d.opciones),
      externalId: d.externalId,
      status: d.status,
      lastError: d.lastError,
      opciones: d.opciones,
      fecha: d.fecha,
      atributos: (d.atributos as Atributos | null) ?? null,
      socialPostId: d.externalId ? (publicadaDe.get(`${d.accountId}:${d.externalId}`) ?? null) : null,
    })),
  }
}
