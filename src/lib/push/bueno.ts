import 'server-only'
import { and, desc, eq, exists, gt, isNull, sql } from 'drizzle-orm'
import { getDb, hitos, postMetrics, pushTokens, scheduledPosts, scheduledPostTargets, socialPosts, users } from '@/db'
import { separarLosRaros } from '@/lib/hitos'
import { numeroDelIcono } from '@/lib/lo-que-trajo'
import { REDES_SIN_DERIVADAS } from '@/lib/social/politica-youtube'
import { corteDe } from '@/lib/social/publish/cortes'
import type { Tema } from '@/lib/tema'
import { toZonedInput } from '@/lib/utils'
import { avisoDeHito, avisoDelDia } from './avisos'
import { avisarAlTelefono, noSalio } from './enviar'
import type { AvisoAlTelefono } from './expo'

// El aviso de lo bueno de «Lo que trajo» (`docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`):
// uno al día como mucho, al teléfono y sin correo. Un hito raro apenas se alcanza o, si en el día no
// hubo, lo que trajeron los cortes, desde las 19:00. Corre en la lectura de cada hora, después de
// buscar los hitos (`/api/cron/numeros-recientes`).

/** Desde qué hora del dueño sale lo que trajo el día, si no hubo hito. */
export const HORA_DEL_DIA = 19

/** El horario de los avisos de lo bueno, en la hora del dueño: nada antes de las 9 ni desde las 22. */
export const DESDE_LA_HORA = 9
export const HASTA_LA_HORA = 22

/** Lo reciente que tiene que ser un hito para avisarlo: uno de anteayer ya no es noticia. */
const HORAS_DE_UN_HITO = 24

type ElAviso = { armar: (tema: Tema) => AvisoAlTelefono; esHito: boolean }

/**
 * Le manda a cada dueño con los avisos de lo bueno encendidos (`users.push_bueno`) y algún teléfono
 * el aviso del día, si le toca: dentro de su horario, si todavía no salió ninguno hoy en su zona
 * (`users.push_bueno_en`), y si hay algo que contar. Primero un hito raro (`esRaro`) de las últimas
 * 24 horas que no se haya celebrado; si no, desde las 19:00, lo que trajeron sus cortes hoy. El
 * aviso lleva el número del ícono (`badge`).
 *
 * La marca se toma antes de mandar, con el valor que se leyó, porque dos corridas pueden cruzarse;
 * si Expo no aceptó ninguno, se suelta para la hora siguiente. Avisado un hito, los demás que
 * esperaban quedan resueltos: el aviso es uno. Nunca lanza.
 */
export async function avisarLoBueno(ahora: Date = new Date()): Promise<{ avisados: number }> {
  let avisados = 0
  try {
    const db = getDb()
    const duenos = await db
      .select({ id: users.id, zona: users.zona, en: users.pushBuenoEn })
      .from(users)
      .where(
        and(
          eq(users.pushBueno, true),
          exists(db.select({ uno: sql`1` }).from(pushTokens).where(eq(pushTokens.ownerId, users.id))),
        ),
      )
    for (const dueno of duenos) {
      const local = toZonedInput(ahora, dueno.zona)
      const hoy = local.slice(0, 10)
      const hora = Number(local.slice(11, 13))
      if (hora < DESDE_LA_HORA || hora >= HASTA_LA_HORA) continue
      if (dueno.en && toZonedInput(dueno.en, dueno.zona).slice(0, 10) === hoy) continue

      const aviso = await elAvisoDe(dueno.id, ahora, hoy, hora)
      if (!aviso) continue
      const tomada = await db
        .update(users)
        .set({ pushBuenoEn: ahora })
        .where(and(eq(users.id, dueno.id), dueno.en ? eq(users.pushBuenoEn, dueno.en) : isNull(users.pushBuenoEn)))
        .returning({ id: users.id })
      if (tomada.length === 0) continue

      const badge = await numeroDelIcono(dueno.id, ahora)
      const enviado = await avisarAlTelefono(dueno.id, (tema) => ({ ...aviso.armar(tema), badge }))
      if (noSalio(enviado)) {
        await db
          .update(users)
          .set({ pushBuenoEn: dueno.en })
          .where(and(eq(users.id, dueno.id), eq(users.pushBuenoEn, ahora)))
        continue
      }
      if (enviado.aceptados > 0) avisados++
      if (aviso.esHito) {
        await db.update(hitos).set({ avisadoEn: ahora }).where(and(isNull(hitos.avisadoEn), eq(hitos.ownerId, dueno.id)))
      }
    }
  } catch (error) {
    console.error('[push] Falló el aviso de lo bueno:', String(error).slice(0, 300))
  }
  return { avisados }
}

/** Lo que le toca a un dueño ahora: su hito raro más alto, o lo del día desde las 19:00, o nada. */
async function elAvisoDe(ownerId: string, ahora: Date, hoy: string, hora: number): Promise<ElAviso | null> {
  const desde = new Date(ahora.getTime() - HORAS_DE_UN_HITO * 3600e3)
  // Los de antes del estreno no tienen fecha, y los que la app ya celebró ya se vieron.
  const pendientes = await getDb()
    .select({ postId: hitos.postId, umbral: hitos.umbral })
    .from(hitos)
    .where(and(isNull(hitos.avisadoEn), isNull(hitos.celebradoEn), gt(hitos.alcanzadoEn, desde), eq(hitos.ownerId, ownerId)))
    .orderBy(desc(hitos.umbral), desc(hitos.alcanzadoEn))
  if (pendientes.length > 0) {
    const [hito] = (await separarLosRaros(ownerId, ahora, pendientes)).raros
    if (hito) {
      const [corte] = await corteDe(ownerId, hito.postId)
      const texto = corte?.post.caption ?? ''
      return { esHito: true, armar: (tema) => avisoDeHito({ postId: hito.postId, umbral: hito.umbral, texto }, tema) }
    }
  }
  if (hora < HORA_DEL_DIA) return null
  const dia = await loDeHoy(ownerId, hoy)
  if (dia.meGusta + dia.comentarios === 0) return null
  return { esHito: false, armar: (tema) => avisoDelDia(dia, tema) }
}

/**
 * Lo que trajeron hoy los cortes del dueño: los «me gusta» y comentarios de la lectura de hoy
 * (`post_metrics`, que guarda una por publicación por día, en la zona del dueño) menos los de la
 * lectura anterior, sin bajar de cero; una publicación leída por primera vez hoy cuenta entera.
 * Solo lo que salió desde Tu Parrilla, y sin YouTube, que no deja restar sus números.
 */
export async function loDeHoy(ownerId: string, hoy: string): Promise<{ meGusta: number; comentarios: number }> {
  const db = getDb()
  const [fila] = (await db.execute(sql`
    select coalesce(sum(greatest(coalesce(h.likes, 0) - coalesce(a.likes, 0), 0)), 0)::int as me_gusta,
           coalesce(sum(greatest(coalesce(h.comments, 0) - coalesce(a.comments, 0), 0)), 0)::int as comentarios
    from ${postMetrics} h
    left join lateral (
      select ${postMetrics.likes} as likes, ${postMetrics.comments} as comments from ${postMetrics}
      where ${postMetrics.postId} = h.post_id and ${postMetrics.day} < h.day
      order by ${postMetrics.day} desc
      limit 1
    ) a on true
    where h.day = ${hoy}::date
      and h.post_id in (
        select distinct ${socialPosts.id} from ${scheduledPostTargets}
        join ${scheduledPosts} on ${scheduledPosts.id} = ${scheduledPostTargets.postId}
        join ${socialPosts} on ${socialPosts.accountId} = ${scheduledPostTargets.accountId}
          and ${socialPosts.externalId} = ${scheduledPostTargets.externalId}
        where ${scheduledPostTargets.status} = 'published'
          and not (${scheduledPostTargets.network} = any(${sql.param([...REDES_SIN_DERIVADAS])}::text[]))
          and ${socialPosts.ownerId} = ${ownerId}
          and ${scheduledPosts.ownerId} = ${ownerId}
      )
  `)) as unknown as Array<{ me_gusta: number; comentarios: number }>
  return { meGusta: Number(fila?.me_gusta ?? 0), comentarios: Number(fila?.comentarios ?? 0) }
}
