import 'server-only'
import { and, desc, eq, isNull, lte, sql } from 'drizzle-orm'
import { enIds, getDb, hitos, postMetrics, scheduledPosts, scheduledPostTargets, socialPosts } from '@/db'
import { REDES_SIN_DERIVADAS } from './social/politica-youtube'
import { cortesPorIds, type CorteCargado } from './social/publish/cortes'
import { esUuid } from './uuid'

// Los hitos de «Lo que trajo» (`docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`): cuando
// las vistas de un corte, sumadas en sus redes sin YouTube, pasan un umbral, el corte gana ese hito
// y la app lo celebra una vez. Las lecturas del dueño van con él en el `where`, como pide el arnés
// de aislamiento (`aislamiento.test.ts`); la detección es de todos, como la sincronización.

/** Las vistas que hacen un hito. */
export const UMBRALES = [100, 1_000, 10_000, 100_000, 1_000_000] as const

export const HITO_NO_ESTA = 'Ese hito no está.'

/**
 * Cuántas celebraciones trae la app por vez: la de cada corte, del umbral más alto al más bajo. Las
 * que no entran esperan a la vuelta siguiente; una app que no se abrió en semanas no encadena diez.
 */
export const CELEBRACIONES_POR_VEZ = 3

/**
 * Busca los hitos nuevos de todos los cortes y los deja puestos, con `ahora` como la hora en que
 * se alcanzaron. Las vistas de un corte son la última lectura (`post_metrics`) de cada publicación
 * que salió desde Tu Parrilla, sumadas sin YouTube: sus políticas no dejan sumar sus números con
 * los de otra red (§III.E.4.h, `politica-youtube.ts`). La lectura de cada red se cruza con su
 * publicación por cuenta e id de la red, como `numerosDeLosCortes`. Un hito ya puesto no se toca.
 * La llaman las dos lecturas de los números, la de cada hora y la del día. Devuelve cuántos puso.
 *
 * La migración 0041 corrió esta misma consulta una vez, al estrenar, con los hitos ya celebrados.
 */
export async function detectarHitos(ahora: Date): Promise<number> {
  const filas = (await getDb().execute(sql`
    insert into ${hitos} (post_id, owner_id, umbral, alcanzado_en)
    select v.post_id, v.owner_id, u.umbral, ${ahora.toISOString()}::timestamptz
    from (
      select ${scheduledPostTargets.postId} as post_id, ${scheduledPosts.ownerId} as owner_id,
             sum(coalesce(m.views, 0)) as vistas
      from ${scheduledPostTargets}
      join ${scheduledPosts} on ${scheduledPosts.id} = ${scheduledPostTargets.postId}
      join ${socialPosts} on ${socialPosts.accountId} = ${scheduledPostTargets.accountId}
        and ${socialPosts.externalId} = ${scheduledPostTargets.externalId}
        and ${socialPosts.ownerId} = ${scheduledPosts.ownerId}
      join lateral (
        select ${postMetrics.views} as views from ${postMetrics}
        where ${postMetrics.postId} = ${socialPosts.id}
        order by ${postMetrics.day} desc
        limit 1
      ) m on true
      where ${scheduledPostTargets.status} = 'published'
        and ${scheduledPostTargets.externalId} is not null
        and not (${scheduledPostTargets.network} = any(${sql.param([...REDES_SIN_DERIVADAS])}::text[]))
      group by ${scheduledPostTargets.postId}, ${scheduledPosts.ownerId}
    ) v
    join unnest(${sql.param([...UMBRALES])}::int[]) as u(umbral) on v.vistas >= u.umbral
    on conflict (post_id, umbral) do nothing
    returning post_id
  `)) as unknown as Array<{ post_id: string }>
  return filas.length
}

/**
 * Para los crons, después de leer: si la detección falla, la lectura ya quedó escrita y la próxima
 * encuentra lo que esta no puso. El error va al log, no a la respuesta.
 */
export async function detectarHitosEnLaCorrida(ahora: Date): Promise<{ nuevos: number } | { error: string }> {
  try {
    return { nuevos: await detectarHitos(ahora) }
  } catch (error) {
    console.error('Falló la detección de los hitos:', String(error).slice(0, 300))
    return { error: 'La detección de los hitos falló; ver el log.' }
  }
}

export type HitoDeUnCorte = { umbral: number; alcanzadoEn: Date | null }

/** Los hitos de unos cortes del dueño, de menor a mayor, por corte. */
export async function hitosDeLosCortes(ownerId: string, postIds: readonly string[]): Promise<Map<string, HitoDeUnCorte[]>> {
  const deCadaCorte = new Map<string, HitoDeUnCorte[]>()
  if (postIds.length === 0) return deCadaCorte
  const filas = await getDb()
    .select({ postId: hitos.postId, umbral: hitos.umbral, alcanzadoEn: hitos.alcanzadoEn })
    .from(hitos)
    .where(and(enIds(hitos.postId, postIds), eq(hitos.ownerId, ownerId)))
    .orderBy(hitos.umbral)
  for (const { postId, ...hito } of filas) deCadaCorte.set(postId, [...(deCadaCorte.get(postId) ?? []), hito])
  return deCadaCorte
}

/** El umbral más alto que pasó un corte, o null si ninguno: lo que dice la llamita de su burbuja. */
export function hitoMasAlto(lista: readonly HitoDeUnCorte[] | undefined): number | null {
  if (!lista || lista.length === 0) return null
  return Math.max(...lista.map((h) => h.umbral))
}

export type PorCelebrar = { id: string; umbral: number; corte: CorteCargado }

/**
 * Lo que la app tiene que celebrar: de cada corte con hitos sin celebrar, el más alto —un corte que
 * pasó 100 y 1.000 entre dos lecturas celebra las 1.000—, hasta `CELEBRACIONES_POR_VEZ`, del umbral
 * más alto al más bajo.
 */
export async function porCelebrar(ownerId: string): Promise<PorCelebrar[]> {
  const filas = await getDb()
    .select({ id: hitos.id, postId: hitos.postId, umbral: hitos.umbral })
    .from(hitos)
    .where(and(isNull(hitos.celebradoEn), eq(hitos.ownerId, ownerId)))
    .orderBy(desc(hitos.umbral), desc(hitos.alcanzadoEn))
  const delCorte = new Map<string, { id: string; umbral: number }>()
  for (const { postId, ...hito } of filas) if (!delCorte.has(postId)) delCorte.set(postId, hito)
  const elegidos = [...delCorte.entries()].slice(0, CELEBRACIONES_POR_VEZ)
  const cortes = new Map((await cortesPorIds(ownerId, elegidos.map(([postId]) => postId))).map((c) => [c.post.id, c]))
  return elegidos.flatMap(([postId, hito]) => {
    const corte = cortes.get(postId)
    return corte ? [{ ...hito, corte }] : []
  })
}

/**
 * La app celebró un hito: queda celebrado, con los más bajos del mismo corte que esperaban, que ya
 * no se celebran solos. False si el hito no es del dueño o no existe.
 */
export async function celebrar(ownerId: string, hitoId: string, ahora: Date): Promise<boolean> {
  if (!esUuid(hitoId)) return false
  const db = getDb()
  const [hito] = await db
    .select({ postId: hitos.postId, umbral: hitos.umbral })
    .from(hitos)
    .where(and(eq(hitos.id, hitoId), eq(hitos.ownerId, ownerId)))
  if (!hito) return false
  await db
    .update(hitos)
    .set({ celebradoEn: ahora })
    .where(and(eq(hitos.postId, hito.postId), lte(hitos.umbral, hito.umbral), isNull(hitos.celebradoEn), eq(hitos.ownerId, ownerId)))
  return true
}
