import 'server-only'
import { and, desc, eq, gte, isNull, lte, sql, type SQL } from 'drizzle-orm'
import { enIds, getDb, hitos, postMetrics, scheduledPosts, scheduledPostTargets, socialPosts } from '@/db'
import { REDES_SIN_DERIVADAS } from './social/politica-youtube'
import { cortesPorIds, type CorteCargado } from './social/publish/cortes'
import { esUuid } from './uuid'

// Los hitos de «Lo que trajo» (`docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`): cuando
// las vistas de un corte, sumadas en sus redes sin YouTube, pasan un umbral, el corte gana ese hito
// y la app o el panel lo celebran una vez, donde se vea primero, si es raro para el dueño (`esRaro`). Las lecturas del dueño van con él en el `where`, como pide el arnés
// de aislamiento (`aislamiento.test.ts`); la detección es de todos, como la sincronización.

/** Las vistas que hacen un hito. */
export const UMBRALES = [100, 1_000, 10_000, 100_000, 1_000_000] as const

export const HITO_NO_ESTA = 'Ese hito no está.'

/**
 * Cuántas celebraciones trae la app por vez: la de cada corte, del umbral más alto al más bajo. Las
 * que no entran esperan a la vuelta siguiente; una app que no se abrió en semanas no encadena diez.
 */
export const CELEBRACIONES_POR_VEZ = 3

/** Contra qué se mide si un hito es raro: los otros cortes del dueño de estos últimos días. */
export const DIAS_PARA_COMPARAR = 30

/** Con menos otros cortes que estos en el mes no hay con qué comparar, y todo hito se celebra. */
export const MINIMO_PARA_COMPARAR = 3

/**
 * Si un hito merece celebración: solo si menos de la mitad de los otros cortes del mes llegó a
 * ese número. A quien sus cortes suelen pasar las 1.000 no se le celebran ni las 100 ni las 1.000,
 * y sí las 10.000: celebrar lo de siempre, varias veces al día, dejaba de ser una celebración. Lo
 * pidió el dueño el 2026-11-11. Con pocos cortes para comparar, se celebra.
 */
export function esRaro(umbral: number, vistasDeLosOtros: readonly number[]): boolean {
  if (vistasDeLosOtros.length < MINIMO_PARA_COMPARAR) return true
  const llegan = vistasDeLosOtros.filter((v) => v >= umbral).length
  return llegan * 2 < vistasDeLosOtros.length
}

/**
 * Las vistas de cada corte que salió: la última lectura (`post_metrics`) de cada publicación que
 * salió desde Tu Parrilla, sumadas sin YouTube —sus políticas no dejan sumar sus números con los de
 * otra red (§III.E.4.h, `politica-youtube.ts`)—. La lectura de cada red se cruza con su publicación
 * por cuenta e id de la red, como `numerosDeLosCortes`. `filtro` acota los cortes; un corte sin
 * ninguna lectura fuera de YouTube no sale.
 */
function vistasPorCorte(filtro: SQL) {
  return sql`
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
      and ${filtro}
    group by ${scheduledPostTargets.postId}, ${scheduledPosts.ownerId}
  `
}

/**
 * Unos hitos del dueño, separados en los raros para él (`esRaro`, contra las vistas de sus otros
 * cortes del mes) y los de siempre, en el mismo orden en que vinieron. Lo usan la celebración
 * (`porCelebrar`) y el aviso de lo bueno (`push/bueno.ts`).
 */
export async function separarLosRaros<H extends { postId: string; umbral: number }>(
  ownerId: string,
  ahora: Date,
  lista: readonly H[],
): Promise<{ raros: H[]; comunes: H[] }> {
  const vistas = [...(await vistasDelMes(ownerId, ahora)).entries()]
  const raros: H[] = []
  const comunes: H[] = []
  for (const hito of lista) {
    const otros = vistas.filter(([id]) => id !== hito.postId).map(([, v]) => v)
    ;(esRaro(hito.umbral, otros) ? raros : comunes).push(hito)
  }
  return { raros, comunes }
}

/** Las vistas de los cortes del dueño que salieron en los últimos `DIAS_PARA_COMPARAR` días, por corte. */
async function vistasDelMes(ownerId: string, ahora: Date): Promise<Map<string, number>> {
  const desde = new Date(ahora.getTime() - DIAS_PARA_COMPARAR * 864e5)
  const filas = (await getDb().execute(
    vistasPorCorte(and(gte(scheduledPosts.scheduledAt, desde), eq(scheduledPosts.ownerId, ownerId))!),
  )) as unknown as Array<{ post_id: string; vistas: string | number }>
  return new Map(filas.map((f) => [f.post_id, Number(f.vistas)]))
}

/**
 * Busca los hitos nuevos de todos los cortes (`vistasPorCorte`) y los deja puestos, con `ahora`
 * como la hora en que se alcanzaron. Un hito ya puesto no se toca. La llaman las dos lecturas de
 * los números, la de cada hora y la del día. Devuelve cuántos puso.
 *
 * La migración 0041 corrió esta misma consulta una vez, al estrenar, con los hitos ya celebrados.
 */
export async function detectarHitos(ahora: Date): Promise<number> {
  const filas = (await getDb().execute(sql`
    insert into ${hitos} (post_id, owner_id, umbral, alcanzado_en)
    select v.post_id, v.owner_id, u.umbral, ${ahora.toISOString()}::timestamptz
    from (${vistasPorCorte(sql`true`)}) v
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
 * Lo que la app o el panel tienen que celebrar: de cada corte con hitos sin celebrar y raros para el dueño
 * (`esRaro`, contra sus otros cortes del mes), el más alto —un corte que pasó 100 y 1.000 entre dos
 * lecturas celebra las 1.000—, hasta `CELEBRACIONES_POR_VEZ`, del umbral más alto al más bajo. Los
 * que no son raros quedan resueltos sin celebración (`celebrado_en` con `ahora`): no se vuelven a
 * mirar, y la llamita y el detalle los siguen mostrando.
 */
export async function porCelebrar(ownerId: string, ahora: Date): Promise<PorCelebrar[]> {
  const db = getDb()
  const filas = await db
    .select({ id: hitos.id, postId: hitos.postId, umbral: hitos.umbral })
    .from(hitos)
    .where(and(isNull(hitos.celebradoEn), eq(hitos.ownerId, ownerId)))
    .orderBy(desc(hitos.umbral), desc(hitos.alcanzadoEn))
  if (filas.length === 0) return []

  const { raros, comunes } = await separarLosRaros(ownerId, ahora, filas)
  const pasados = comunes.map((h) => h.id)
  const delCorte = new Map<string, { id: string; umbral: number }>()
  for (const { postId, ...hito } of raros) if (!delCorte.has(postId)) delCorte.set(postId, hito)
  if (pasados.length > 0) {
    await db
      .update(hitos)
      .set({ celebradoEn: ahora })
      .where(and(enIds(hitos.id, pasados), isNull(hitos.celebradoEn), eq(hitos.ownerId, ownerId)))
  }
  const elegidos = [...delCorte.entries()].slice(0, CELEBRACIONES_POR_VEZ)
  const cortes = new Map((await cortesPorIds(ownerId, elegidos.map(([postId]) => postId))).map((c) => [c.post.id, c]))
  return elegidos.flatMap(([postId, hito]) => {
    const corte = cortes.get(postId)
    return corte ? [{ ...hito, corte }] : []
  })
}

/**
 * La app o el panel celebró un hito: queda celebrado, con los más bajos del mismo corte que esperaban, que ya
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
