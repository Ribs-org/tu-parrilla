import 'server-only'
import { unstable_cache } from 'next/cache'
import { sql } from 'drizzle-orm'
import { getDb, postMetrics, socialAccounts, socialPosts } from '@/db'
import { REDES_SIN_DERIVADAS } from './social/politica-youtube'

// El contador de la portada: cuántas vistas y cuántos «me gusta» llevan, entre todas, las
// publicaciones de las cuentas conectadas a Tu Parrilla. Es un total sin nombres: no dice de qué
// cuenta ni de quién viene cada parte, y así lo cuenta `/privacidad`.
//
// Lo que entra y lo que no:
// - De cada publicación, su última lectura: los contadores de `post_metrics` son acumulados, así
//   que sumar todas las lecturas contaría la misma vista una vez por día.
// - YouTube no entra (`REDES_SIN_DERIVADAS`): sus políticas no dejan crear métricas con sus datos
//   (§III.E.4.h), y una suma entre canales es eso. Ver `social/politica-youtube.ts`.
// - Solo las cuentas conectadas hoy: quien desconecta deja de sumar, aunque su historial se quede
//   en la base. Por eso el total puede bajar.
// - Lo borrado en la red (`archived_at`) tampoco: allá ya no existe.

export type NumerosDeLaPortada = { vistas: number; meGusta: number }

/** La suma, leída de la base sin caché. La portada usa `numerosDeLaPortada`. */
export async function leerNumerosDeLaPortada(): Promise<NumerosDeLaPortada> {
  const filas = (await getDb().execute(sql`
    with ultima as (
      select distinct on (m.post_id) m.views, m.likes
      from ${postMetrics} m
      join ${socialPosts} p on p.id = m.post_id
      join ${socialAccounts} c on c.id = p.account_id
      where c.access_token is not null
        and p.archived_at is null
        ${sql.join(REDES_SIN_DERIVADAS.map((red) => sql`and p.network <> ${red}`), sql` `)}
      order by m.post_id, m.day desc
    )
    select coalesce(sum(views), 0)::bigint::text as vistas, coalesce(sum(likes), 0)::bigint::text as me_gusta
    from ultima
  `)) as unknown as Array<{ vistas: string; me_gusta: string }>
  // La suma pasa de un entero de 32 bits sin mucho esfuerzo: viaja como texto y se lee acá.
  const fila = filas[0]
  return { vistas: Number(fila?.vistas ?? 0), meGusta: Number(fila?.me_gusta ?? 0) }
}

/**
 * La misma suma, guardada un cuarto de hora: la portada se sirve en cada visita y la cifra solo
 * cambia cuando la sincronización trae lecturas nuevas, una vez al día.
 */
const enCache = unstable_cache(leerNumerosDeLaPortada, ['portada-numeros'], { revalidate: 900 })

/**
 * Lo que dibuja la portada, o `null` si no hay nada que mostrar. Si la base falla, también `null`:
 * la portada es lo que miran Google y Meta para verificar la app, y no se cae por un contador. El
 * fallo no queda en la caché, porque se atrapa afuera.
 */
export async function numerosDeLaPortada(): Promise<NumerosDeLaPortada | null> {
  try {
    const numeros = await enCache()
    return numeros.vistas > 0 || numeros.meGusta > 0 ? numeros : null
  } catch (error) {
    console.error('[portada] no se pudo leer el contador', error)
    return null
  }
}
