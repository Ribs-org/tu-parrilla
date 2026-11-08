import 'server-only'
import { sql, type SQL } from 'drizzle-orm'
import { getDb } from '@/db'
import { PERMISO_ANALITICA } from './analitica-youtube'
import { DIAS_PARA_COMPROBAR_AUTORIZACION, DIAS_RETENCION_YOUTUBE } from './politica-youtube'

// Lo que de YouTube ya no se puede guardar: todo dato que lleva más de 30 días sin
// refrescarse (`politica-youtube`, III.E.4.b–d). Corre una vez al día, al final del sync.
//
// La marca de «último refresco» es distinta en cada tabla, y por eso cada paso mira la
// suya:
//
// - `post_metrics` y `account_metrics`: `captured_at`, que el sync reescribe cada vez que
//   toma la lectura del día. Una lectura de hace 31 días nunca se vuelve a tomar.
// - `post_comments`: `created_at`. El sondeo solo mira videos de los últimos siete días
//   (`DIAS_VENTANA`), así que un comentario guardado hace 30 ya no vuelve a leerse, y
//   borrarlo no lo hace reaparecer como pendiente.
// - `social_posts`: `updated_at`, que solo toca el sync al traer el video. El título y la
//   miniatura de un video que dejó de llegar —borrado, o fuera de los 200 más nuevos— se
//   vacían; la fila queda, porque es la que une las visitas a su etiqueta `?s=`, y esas
//   visitas son de Tu Parrilla.
//
// Lo de YouTube Analytics (`analitica-youtube.ts`) sigue otra regla, porque es dato autorizado
// (§III.E.4.b): no vence por viejo, vence cuando falta la prueba de que el dueño sigue
// autorizando. Un canal sin el permiso, o sin una lectura de Analytics que haya contestado en
// 30 días (`analitica_verificada_en`), pierde sus días, sus desgloses y sus videos. Y la fila de
// un video que lleva 30 días sin refrescarse —borrado, privado, o fuera de los que se leen— se
// borra igual, como la de un video que el sync ya marcó borrado: las políticas piden comprobar
// en ese plazo que el video sigue ahí.
//
// Lo de un canal que su dueño desconecta no espera este plazo: «Desconectar» lo borra en el
// acto con los mismos pasos, acotados a esa cuenta (`desconectar.ts`). Aquí queda solo lo que
// una sincronización en curso alcanzó a escribir justo después.

export type ReporteRetencion = {
  lecturasDePosts: number
  lecturasDeCuenta: number
  comentarios: number
  videosSinTitulo: number
  analiticaDias: number
  analiticaDesgloses: number
  analiticaVideos: number
}

type Paso = { clave: keyof ReporteRetencion; sql: SQL }

/** Desde cuándo un dato de YouTube ya se pasó del plazo. */
export function corteDeRetencion(now: Date): Date {
  return new Date(now.getTime() - DIAS_RETENCION_YOUTUBE * 864e5)
}

/** Desde cuándo una comprobación de autorización de la analítica ya no vale. */
export function corteDeAutorizacion(now: Date): Date {
  return new Date(now.getTime() - DIAS_PARA_COMPROBAR_AUTORIZACION * 864e5)
}

/**
 * Los canales cuya analítica ya no se puede guardar: sin el permiso, o sin una comprobación de
 * autorización dentro del plazo. El permiso va literal —es una constante, no algo que llegue de
 * afuera— para que la fecha siga siendo el único parámetro de cada paso.
 */
function canalesSinAutorizacion(antes: string): SQL {
  const permiso = sql.raw(`'${PERMISO_ANALITICA}'`)
  return sql`select id from social_accounts where network = 'youtube' and (scopes is null or position(${permiso} in scopes) = 0 or analitica_verificada_en is null or analitica_verificada_en < ${antes})`
}

/**
 * Los pasos, puros para que el test los renderice sin base —mismo criterio que
 * `pasosDeBorrado` en `meta-bajas`—. La red va literal en el texto: es una sola, y así la
 * condición se lee en cada paso. La fecha va como texto ISO porque el driver no serializa
 * un `Date` interpolado en SQL crudo (ver `getPostSeries`).
 */
export function pasosDeRetencion(corte: Date, autorizacion: Date = corte): Paso[] {
  const antes = corte.toISOString()
  const sinAutorizar = canalesSinAutorizacion(autorizacion.toISOString())
  return [
    {
      clave: 'lecturasDePosts',
      sql: sql`delete from post_metrics m using social_posts p where p.id = m.post_id and p.network = 'youtube' and m.captured_at < ${antes}`,
    },
    {
      clave: 'lecturasDeCuenta',
      sql: sql`delete from account_metrics where network = 'youtube' and captured_at < ${antes}`,
    },
    {
      clave: 'comentarios',
      sql: sql`delete from post_comments where network = 'youtube' and created_at < ${antes}`,
    },
    {
      clave: 'videosSinTitulo',
      sql: sql`update social_posts set caption = null, thumbnail_url = null where network = 'youtube' and updated_at < ${antes} and (caption is not null or thumbnail_url is not null)`,
    },
    // Los tres de analítica, en el orden de `pasosParaBorrarAnalitica`.
    {
      clave: 'analiticaDias',
      sql: sql`delete from youtube_analitica_dias where account_id in (${sinAutorizar})`,
    },
    {
      clave: 'analiticaDesgloses',
      sql: sql`delete from youtube_analitica_desgloses where account_id in (${sinAutorizar})`,
    },
    {
      clave: 'analiticaVideos',
      sql: sql`delete from youtube_analitica_videos v using social_posts p where p.id = v.post_id and p.network = 'youtube' and (v.captured_at < ${antes} or p.archived_at is not null or p.account_id in (${sinAutorizar}))`,
    },
  ]
}

/**
 * Corre los pasos y devuelve cuántas filas tocó cada uno. En serie y no con
 * `Promise.all`: varias consultas a la vez contra el pooler ya se colgaron una vez sin
 * explicación (ver `docs/pendientes.md`), y aquí no hay apuro.
 */
export async function purgarYoutubeViejo(now: Date = new Date()): Promise<ReporteRetencion> {
  const db = getDb()
  const reporte: ReporteRetencion = {
    lecturasDePosts: 0,
    lecturasDeCuenta: 0,
    comentarios: 0,
    videosSinTitulo: 0,
    analiticaDias: 0,
    analiticaDesgloses: 0,
    analiticaVideos: 0,
  }
  for (const paso of pasosDeRetencion(corteDeRetencion(now), corteDeAutorizacion(now))) {
    const resultado = await db.execute(paso.sql)
    // postgres-js deja en `count` las filas que tocó un delete o un update.
    reporte[paso.clave] = (resultado as unknown as { count?: number }).count ?? 0
  }
  return reporte
}
