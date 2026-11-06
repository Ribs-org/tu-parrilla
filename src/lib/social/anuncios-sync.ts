import 'server-only'
import { and, asc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm'
import { anuncios, getDb, socialAccounts, socialPosts } from '@/db'
import type { SocialAccount } from '@/db'
import { anunciosAbiertosPara } from '../redes-abiertas'
import { emparejar, idsPorCruzar, leerAnunciosDeMeta, type AnuncioLeido, type PedirGraph } from './anuncios'
import { decryptToken } from './crypto'

const REDES_CON_ANUNCIOS = ['instagram', 'facebook'] as const

/** Graph, con la frase de Meta en el error y nunca la URL: la URL lleva el token. */
const pedirGraph: PedirGraph = async (url) => {
  const response = await fetch(url)
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string; code?: number } }
  if (!response.ok) {
    const { message, code } = body.error ?? {}
    throw new Error(`Graph ${response.status}${code ? ` (#${code})` : ''}: ${message ?? 'sin detalle'}`)
  }
  return body
}

/**
 * En qué orden se prueban los tokens de un dueño: primero los de Instagram, que son de usuario
 * —el que la Marketing API acepta—; después los de Facebook, que son de página y puede que no
 * sirvan. Dentro de cada red, la cuenta más antigua primero, para que la fila que guarda cada
 * anuncio sea siempre la misma.
 */
export function ordenDeTokens<T extends Pick<SocialAccount, 'network' | 'createdAt'>>(cuentas: readonly T[]): T[] {
  const peso = (c: T) => (c.network === 'instagram' ? 0 : 1)
  return [...cuentas].sort((a, b) => peso(a) - peso(b) || a.createdAt.getTime() - b.createdAt.getTime())
}

/**
 * Guarda lo leído en la cuenta cuyo token lo leyó, y lo saca de las demás cuentas del dueño:
 * un anuncio es una sola fila por dueño. Si un día contestó otro token —el de Instagram se
 * desconectó y leyó el de Facebook—, la fila vieja de la otra cuenta se quedaría con totales
 * congelados y con sus propias fechas, y «Lo pagado» podría mostrarla en un período donde la
 * nueva ya no entra.
 */
async function escribir(cuenta: SocialAccount, leidos: readonly AnuncioLeido[], ownerId: string): Promise<void> {
  if (leidos.length === 0) return
  const ids = idsPorCruzar(leidos)
  const publicaciones = ids.length
    ? await getDb()
        .select({ id: socialPosts.id, network: socialPosts.network, externalId: socialPosts.externalId })
        .from(socialPosts)
        .where(
          and(
            eq(socialPosts.ownerId, ownerId),
            inArray(socialPosts.network, [...REDES_CON_ANUNCIOS]),
            inArray(socialPosts.externalId, ids),
          ),
        )
    : []
  const pares = emparejar(leidos, publicaciones)
  // Un anuncio repetido en el lote haría fallar el insert entero («cannot affect row a second
  // time»); el mismo motivo que `lecturasSinRepetir`.
  const unicos = [...new Map(leidos.map((a) => [a.externalId, a])).values()]
  await getDb()
    .delete(anuncios)
    .where(
      and(
        inArray(
          anuncios.accountId,
          getDb().select({ id: socialAccounts.id }).from(socialAccounts).where(eq(socialAccounts.ownerId, ownerId)),
        ),
        ne(anuncios.accountId, cuenta.id),
        inArray(anuncios.externalId, unicos.map((a) => a.externalId)),
      ),
    )
  await getDb()
    .insert(anuncios)
    .values(unicos.map((a) => ({ ...a, accountId: cuenta.id, postId: pares.get(a.externalId) ?? null })))
    .onConflictDoUpdate({
      target: [anuncios.accountId, anuncios.externalId],
      set: {
        postId: sql`excluded.post_id`,
        nombre: sql`excluded.nombre`,
        estado: sql`excluded.estado`,
        cuentaPublicitariaId: sql`excluded.cuenta_publicitaria_id`,
        cuentaPublicitariaNombre: sql`excluded.cuenta_publicitaria_nombre`,
        moneda: sql`excluded.moneda`,
        storyId: sql`excluded.story_id`,
        instagramMediaId: sql`excluded.instagram_media_id`,
        gasto: sql`excluded.gasto`,
        alcance: sql`excluded.alcance`,
        impresiones: sql`excluded.impresiones`,
        clics: sql`excluded.clics`,
        desde: sql`excluded.desde`,
        hasta: sql`excluded.hasta`,
        leidoEn: new Date(),
      },
    })
}

/**
 * Lee los anuncios de cada dueño con «Lo pagado» abierto (`anunciosAbiertosPara`) y los guarda.
 * Una vez por dueño, no por cuenta: sus cuentas de Instagram y Facebook ven las mismas cuentas
 * publicitarias, y leerlas dos veces sería gastar la cuota de Meta en lo mismo. Se prueba con un
 * token tras otro (`ordenDeTokens`) hasta que uno contesta.
 *
 * Nunca lanza: corre después de la sincronización de lo orgánico, que ya guardó lo suyo, y un
 * permiso que falta —lo normal mientras `ads_read` no esté concedido— no debe pintar de rojo una
 * cuenta que sí se leyó. Devuelve cuántos anuncios guardó.
 */
export async function sincronizarAnuncios(ownerId?: string): Promise<number> {
  const cuentas = await getDb()
    .select()
    .from(socialAccounts)
    .where(
      and(
        inArray(socialAccounts.network, [...REDES_CON_ANUNCIOS]),
        isNotNull(socialAccounts.accessToken),
        ownerId ? eq(socialAccounts.ownerId, ownerId) : undefined,
      ),
    )
    .orderBy(asc(socialAccounts.createdAt))

  const porDueno = new Map<string, SocialAccount[]>()
  for (const c of cuentas) {
    if (!c.ownerId || !anunciosAbiertosPara(c.ownerId)) continue
    porDueno.set(c.ownerId, [...(porDueno.get(c.ownerId) ?? []), c])
  }

  let guardados = 0
  for (const [dueno, suyas] of porDueno) {
    let ultimoError: unknown = null
    let leido = false
    for (const cuenta of ordenDeTokens(suyas)) {
      try {
        const { anuncios: leidos } = await leerAnunciosDeMeta(decryptToken(cuenta.accessToken!), pedirGraph)
        await escribir(cuenta, leidos, dueno)
        guardados += leidos.length
        leido = true
        break
      } catch (error) {
        ultimoError = error
      }
    }
    if (!leido) console.error(`[sync] anuncios del dueño ${dueno}:`, String(ultimoError).slice(0, 300))
  }
  return guardados
}
