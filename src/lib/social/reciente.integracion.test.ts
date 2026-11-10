import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'
import type { FetchedPost } from './connector'

// La lectura de cada hora contra una Postgres de verdad: que guarde lo nuevo con su `?s=`, que
// escriba la fila de hoy y la vuelva a escribir más al día, y que una lectura que no trae un
// número —la de cada hora no pasa por TikTok for Business— no borre el que ya tenía el día.

vi.mock('server-only', () => ({}))

const { red } = vi.hoisted(() => ({ red: { posts: [] as FetchedPost[] } }))
vi.mock('./index', () => ({
  connectorFor: () => ({
    ensureCredential: async () => 'token',
    fetchPosts: async () => ({ posts: red.posts, windowWasCapped: false }),
  }),
}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { leerLoRecienteDe } = await import('./reciente')
const { writeSnapshots } = await import('./sync')

async function cuentaDeTiktok() {
  const { users, socialAccounts } = await esquema()
  const [u] = await (await db())
    .insert(users)
    .values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl`, zona: 'America/Santiago' })
    .returning()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId: u!.id, network: 'tiktok', handle: '@prueba', externalId: crypto.randomUUID(), accessToken: 'token' })
    .returning()
  return c!
}

function video(externalId: string, publicada: Date, metrics: Partial<FetchedPost['metrics']>): FetchedPost {
  return {
    externalId,
    permalink: null,
    caption: 'Un corte',
    thumbnailUrl: null,
    mediaType: 'video',
    publishedAt: publicada,
    metrics: { views: null, likes: null, comments: null, shares: null, saves: null, reach: null, ...metrics },
  }
}

async function lecturasDe(externalId: string) {
  const { socialPosts, postMetrics } = await esquema()
  const [p] = await (await db()).select().from(socialPosts).where(eq(socialPosts.externalId, externalId))
  if (!p) return { post: null, filas: [] }
  return { post: p, filas: await (await db()).select().from(postMetrics).where(eq(postMetrics.postId, p.id)) }
}

describe.skipIf(!URL_PRUEBAS)('la lectura de cada hora, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_numeros_recientes')
  }, 60_000)

  it('guarda lo nuevo y escribe la fila de hoy; lo de más de 48 horas no se toca', async () => {
    const cuenta = await cuentaDeTiktok()
    const desde = new Date(Date.now() - 48 * 3_600_000)
    red.posts = [
      video('reciente', new Date(Date.now() - 3_600_000), { views: 100, likes: 10 }),
      video('vieja', new Date(desde.getTime() - 60_000), { views: 999 }),
    ]
    expect(await leerLoRecienteDe(cuenta, true, desde)).toBe(1)

    const { post, filas } = await lecturasDe('reciente')
    expect(post!.campaign).toBe('tt-reciente')
    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ views: 100, likes: 10 })
    expect((await lecturasDe('vieja')).post).toBeNull()

    // Una hora después: la misma fila, más al día.
    red.posts = [video('reciente', new Date(Date.now() - 3_600_000), { views: 180, likes: 15 })]
    await leerLoRecienteDe(cuenta, true, desde)
    const despues = await lecturasDe('reciente')
    expect(despues.filas).toHaveLength(1)
    expect(despues.filas[0]).toMatchObject({ views: 180, likes: 15 })
  })

  it('lo que la lectura nueva no trae se queda: los guardados y el alcance de Business, y los seguidores', async () => {
    const { socialPosts } = await esquema()
    const cuenta = await cuentaDeTiktok()
    const [p] = await (await db())
      .insert(socialPosts)
      .values({
        ownerId: cuenta.ownerId,
        accountId: cuenta.id,
        network: 'tiktok',
        campaign: crypto.randomUUID(),
        externalId: crypto.randomUUID(),
        publishedAt: new Date(),
      })
      .returning()
    const dia = '2026-11-10'
    const metricas = (m: Partial<FetchedPost['metrics']>) => ({ ...video('x', new Date(), m).metrics })

    // La del día, con Business.
    await writeSnapshots([{ postId: p!.id, metrics: metricas({ views: 100, saves: 12, reach: 80, seguidores: 3 }) }], dia)
    // La de cada hora, sin Business.
    await writeSnapshots([{ postId: p!.id, metrics: metricas({ views: 150, likes: 9 }) }], dia)

    const { postMetrics } = await esquema()
    const [fila] = await (await db()).select().from(postMetrics).where(eq(postMetrics.postId, p!.id))
    expect(fila).toMatchObject({ views: 150, likes: 9, saves: 12, reach: 80, seguidores: 3 })

    // Y un número que sí llega pisa el anterior, aunque sea más chico (un «me gusta» quitado).
    await writeSnapshots([{ postId: p!.id, metrics: metricas({ views: 160, likes: 8, seguidores: 4 }) }], dia)
    const [otra] = await (await db()).select().from(postMetrics).where(eq(postMetrics.postId, p!.id))
    expect(otra).toMatchObject({ views: 160, likes: 8, saves: 12, seguidores: 4 })
  })
})
