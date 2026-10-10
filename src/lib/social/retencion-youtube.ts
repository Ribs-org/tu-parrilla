import 'server-only'
import { sql, type SQL } from 'drizzle-orm'
import { getDb } from '@/db'
import { DIAS_RETENCION_YOUTUBE } from './politica-youtube'

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
//   miniatura de un video que dejó de llegar —borrado, fuera de los 200 más nuevos, o de
//   un canal desconectado— se vacían; la fila queda, porque es la que une las visitas a
//   su etiqueta `?s=`, y esas visitas son de Tu Parrilla.

export type ReporteRetencion = {
  lecturasDePosts: number
  lecturasDeCuenta: number
  comentarios: number
  videosSinTitulo: number
}

type Paso = { clave: keyof ReporteRetencion; sql: SQL }

/** Desde cuándo un dato de YouTube ya se pasó del plazo. */
export function corteDeRetencion(now: Date): Date {
  return new Date(now.getTime() - DIAS_RETENCION_YOUTUBE * 864e5)
}

/**
 * Los cuatro pasos, puros para que el test los renderice sin base —mismo criterio que
 * `pasosDeBorrado` en `meta-bajas`—. La red va literal en el texto: es una sola, y así la
 * condición se lee en cada paso. La fecha va como texto ISO porque el driver no serializa
 * un `Date` interpolado en SQL crudo (ver `getPostSeries`).
 */
export function pasosDeRetencion(corte: Date): Paso[] {
  const antes = corte.toISOString()
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
  ]
}

/**
 * Corre los pasos y devuelve cuántas filas tocó cada uno. En serie y no con
 * `Promise.all`: varias consultas a la vez contra el pooler ya se colgaron una vez sin
 * explicación (ver `docs/pendientes.md`), y aquí no hay apuro.
 */
export async function purgarYoutubeViejo(now: Date = new Date()): Promise<ReporteRetencion> {
  const db = getDb()
  const reporte: ReporteRetencion = { lecturasDePosts: 0, lecturasDeCuenta: 0, comentarios: 0, videosSinTitulo: 0 }
  for (const paso of pasosDeRetencion(corteDeRetencion(now))) {
    const resultado = await db.execute(paso.sql)
    // postgres-js deja en `count` las filas que tocó un delete o un update.
    reporte[paso.clave] = (resultado as unknown as { count?: number }).count ?? 0
  }
  return reporte
}
