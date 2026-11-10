import 'server-only'
import { asc, desc, inArray } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import type { SocialAccount } from '@/db'
import { prioridadDelDueno } from '@/lib/planes/prioridad'
import { localDay } from '../analytics'
import { HORAS_A_EDAD_TEMPRANA } from '../igual-edad'
import { buscarPorId } from '../usuarios'
import { ZONA_POR_DEFECTO } from '../zona'
import type { CuentaTag } from './campaign'
import { agruparPorRed, primariaDe } from './cuenta'
import { connectorFor } from './index'
import { upsertPost, writeSnapshots, type Lectura } from './sync'
import { vincularSinId } from './vincular-sin-id'

// Los números de cada hora. La sincronización de siempre lee una vez al día
// (`/api/cron/sync-social`), y con eso lo que trajo un corte se movía una vez al día. Esta lectura
// vuelve, cada hora, sobre lo publicado en las últimas 48 horas, que es lo que más se mueve, y
// escribe la lectura de hoy en `post_metrics`: la misma fila del día, más al día.
//
// Lo que no hace, a propósito:
// - **YouTube no**: su cupo de la Data API es de 10.000 unidades al día y la auditoría lo mira.
//   Threads y X tampoco: no se ofrecen todavía.
// - **Nada con más de 48 horas**: Los Números comparan la primera lectura entre las 48 y las 72
//   horas (`viewsA48h`, `igual-edad.ts`), y esta nunca escribe una con más edad que 48 horas. El
//   número es el mismo `HORAS_A_EDAD_TEMPRANA`: si esa edad cambia, esto la sigue.
// - **No toca el estado de la cuenta** (`lastSyncedAt`, `lastSyncError`): la tarjeta de Los
//   Fierros cuenta la sincronización entera, y un tropiezo de una hora se corrige solo a la
//   siguiente. El error va al log y al informe.
// - **No archiva, no lee la cuenta ni TikTok for Business**: eso es de la del día. Lo que la del
//   día completó con Business no se pierde (`writeSnapshots` no borra un número que la lectura
//   nueva no trae).

/** Las redes que se leen cada hora. */
export const REDES_DE_CADA_HORA = ['instagram', 'facebook', 'tiktok'] as const

/** Si lo reciente de esta red se lee cada hora: lo que dice la pieza mientras no llegan sus números. */
export function seLeeCadaHora(network: string): boolean {
  return (REDES_DE_CADA_HORA as readonly string[]).includes(network)
}

/** Hasta qué edad se lee una publicación cada hora. */
export const HORAS_DE_LO_RECIENTE = HORAS_A_EDAD_TEMPRANA

/**
 * Hasta cuándo se empieza una cuenta, contado desde que empieza la corrida. Deja 40 segundos
 * para que termine la que va, dentro de los 240 de la ruta. Lo que no alcanzó queda para la
 * hora siguiente.
 */
export const PLAZO_DE_LO_RECIENTE_MS = 200_000

export type InformeDeLoReciente = Array<{
  network: string
  handle: string | null
  ok: boolean
  posts: number
  error?: string
  /** No se alcanzó a empezar dentro del plazo. */
  saltada?: true
}>

/**
 * Lo de las últimas 48 horas de una cuenta: lo lista, guarda lo que no conocía y escribe la
 * lectura de hoy. Devuelve cuántas publicaciones leyó. Un error sube: lo atrapa
 * `leerLoReciente`, cuenta por cuenta.
 */
export async function leerLoRecienteDe(account: SocialAccount, primaria: boolean, desde: Date): Promise<number> {
  const connector = connectorFor(account.network)
  if (!connector) return 0
  const token = await connector.ensureCredential(account)
  if (token === null) return 0

  const { posts } = await connector.fetchPosts(account, token, { desde, soloDesde: true })
  // El conector ya recorta lo pedido; esto cuida que nada más viejo llegue a escribirse.
  const recientes = posts.filter((post) => post.publishedAt.getTime() >= desde.getTime())
  if (recientes.length === 0) return 0

  // El día del dueño, como en `syncAccount`: la fila de hoy es la de su zona.
  const dueno = account.ownerId ? await buscarPorId(account.ownerId) : null
  const day = localDay(new Date(), dueno?.zona ?? ZONA_POR_DEFECTO)
  const cuenta: CuentaTag = { primaria, handle: account.handle, externalId: account.externalId }
  const lecturas: Lectura[] = []
  for (const post of recientes) {
    lecturas.push({ postId: await upsertPost(post, account, cuenta), metrics: post.metrics })
  }
  await writeSnapshots(lecturas, day)

  // Lo que salió por Tu Parrilla sin su id lo recupera acá, una hora después y no al día
  // siguiente (`vincular-sin-id.ts`). Un fallo no tumba la lectura, que ya quedó guardada.
  if (account.network === 'tiktok' || account.network === 'instagram') {
    try {
      await vincularSinId(account, account.network)
    } catch (error) {
      console.error(`[reciente] vincular lo publicado sin id en ${account.network}:`, String(error).slice(0, 300))
    }
  }
  return recientes.length
}

/**
 * Todas las cuentas conectadas de las redes de cada hora, en el mismo orden que la del día: las
 * redes en paralelo, las cuentas de una red en serie y, dentro de cada red, las de los planes con
 * prioridad primero. Cada cuenta va por su cuenta: una que falla deja su error en el informe y
 * las demás siguen.
 */
export async function leerLoReciente(inicio: number = Date.now()): Promise<InformeDeLoReciente> {
  const desde = new Date(inicio - HORAS_DE_LO_RECIENTE * 3_600_000)
  const plazo = inicio + PLAZO_DE_LO_RECIENTE_MS

  const cuentas = await getDb()
    .select()
    .from(socialAccounts)
    .where(inArray(socialAccounts.network, [...REDES_DE_CADA_HORA]))
    .orderBy(desc(prioridadDelDueno(socialAccounts.ownerId)), asc(socialAccounts.createdAt))

  const porRed = await Promise.all(
    [...agruparPorRed(cuentas).values()].map(async (deLaRed) => {
      // Entre todas las de la red, conectadas o no, igual que la del día cuando la llama el cron:
      // una publicación nueva nace acá con el mismo `?s=` que le habría puesto aquella.
      const primaria = primariaDe(deLaRed)
      const informe: InformeDeLoReciente = []
      for (const cuenta of deLaRed) {
        if (!cuenta.accessToken) continue
        const fila = { network: cuenta.network, handle: cuenta.handle }
        if (Date.now() >= plazo) {
          informe.push({ ...fila, ok: true, posts: 0, saltada: true })
          continue
        }
        try {
          informe.push({ ...fila, ok: true, posts: await leerLoRecienteDe(cuenta, primaria === cuenta.id, desde) })
        } catch (error) {
          const mensaje = error instanceof Error ? error.message : String(error)
          console.error(`[reciente] ${cuenta.network} ${cuenta.handle ?? cuenta.id}:`, mensaje.slice(0, 300))
          informe.push({ ...fila, ok: false, posts: 0, error: mensaje.slice(0, 300) })
        }
      }
      return informe
    }),
  )
  const informe = porRed.flat()
  const saltadas = informe.filter((f) => f.saltada).length
  if (saltadas > 0) console.log(`[reciente] ${saltadas} cuentas quedan para la hora siguiente`)
  return informe
}
