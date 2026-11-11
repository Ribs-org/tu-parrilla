import 'server-only'
import { and, eq, gte } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets } from '@/db'
import { selloDe } from './parrilla'
import { addDays, dayKey } from './schedule-week'

// La racha de «Lo que trajo» (`docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`): cuántos
// días seguidos salió al menos un corte, en la zona del dueño. Es dato propio —lo que Tu Parrilla
// publicó—, así que YouTube cuenta igual que las demás redes.

/** Hasta dónde se mira hacia atrás: una racha más larga que esto se muestra como de este largo. */
const DIAS_HACIA_ATRAS = 400

/** `dias`: los días seguidos con algo servido. `hoy`: si ya salió algo hoy; si no, la racha llega hasta ayer. */
export type Racha = { dias: number; hoy: boolean }

/**
 * La racha a partir de los días con algo servido (`AAAA-MM-DD`): desde hoy hacia atrás, o desde
 * ayer si hoy todavía no salió nada —la racha se apaga a medianoche, no en la mañana—.
 */
export function contarRacha(dias: ReadonlySet<string>, hoy: string): Racha {
  const salioHoy = dias.has(hoy)
  let dia = salioHoy ? hoy : addDays(hoy, -1)
  let seguidos = 0
  while (dias.has(dia)) {
    seguidos++
    dia = addDays(dia, -1)
  }
  return { dias: seguidos, hoy: salioHoy }
}

/**
 * La racha del dueño: los días, en su zona, de los cortes con al menos un destino servido —un
 * borrador en la bandeja de TikTok todavía no salió (`selloDe`)—, por la hora del corte, como el
 * pie de ayer de La Parrilla (`servidosAyer`).
 */
export async function leerRacha(ownerId: string, ahora: Date, zona: string): Promise<Racha> {
  const desde = new Date(ahora.getTime() - DIAS_HACIA_ATRAS * 864e5)
  const filas = await getDb()
    .select({
      scheduledAt: scheduledPosts.scheduledAt,
      network: scheduledPostTargets.network,
      status: scheduledPostTargets.status,
      opciones: scheduledPostTargets.opciones,
      externalId: scheduledPostTargets.externalId,
    })
    .from(scheduledPostTargets)
    .innerJoin(scheduledPosts, eq(scheduledPosts.id, scheduledPostTargets.postId))
    .where(and(eq(scheduledPostTargets.status, 'published'), gte(scheduledPosts.scheduledAt, desde), eq(scheduledPosts.ownerId, ownerId)))
  const dias = new Set(filas.filter((f) => selloDe(f) === 'servido').map((f) => dayKey(f.scheduledAt, zona)))
  return contarRacha(dias, dayKey(ahora, zona))
}
