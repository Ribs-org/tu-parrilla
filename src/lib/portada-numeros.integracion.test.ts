import { beforeAll, describe, expect, it, vi } from 'vitest'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El contador de la portada contra una Postgres de verdad: que tome la última lectura de cada
// publicación y no la suma de todas, que YouTube, lo desconectado y lo borrado en la red no entren,
// y que un total más grande que un entero de 32 bits llegue entero.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { leerNumerosDeLaPortada } = await import('./portada-numeros')

async function cuenta(network: string, conectada = true) {
  const { users, socialAccounts } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId: u!.id, network, handle: '@prueba', externalId: crypto.randomUUID(), accessToken: conectada ? 'token' : null })
    .returning()
  return c!
}

type Lectura = { day: string; views: number | null; likes: number | null }

async function publicacion(c: { id: string; ownerId: string | null; network: string }, lecturas: Lectura[], borrada = false) {
  const { socialPosts, postMetrics } = await esquema()
  const [p] = await (await db())
    .insert(socialPosts)
    .values({
      ownerId: c.ownerId,
      accountId: c.id,
      network: c.network,
      campaign: crypto.randomUUID(),
      externalId: crypto.randomUUID(),
      publishedAt: new Date('2026-11-01T12:00:00Z'),
      archivedAt: borrada ? new Date('2026-11-05T12:00:00Z') : null,
    })
    .returning()
  for (const l of lecturas) await (await db()).insert(postMetrics).values({ postId: p!.id, ...l })
}

describe.skipIf(!URL_PRUEBAS)('el contador de la portada, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_portada_numeros')
  }, 60_000)

  it('suma la última lectura de cada publicación, sin YouTube, sin lo desconectado y sin lo borrado', async () => {
    expect(await leerNumerosDeLaPortada()).toEqual({ vistas: 0, meGusta: 0 })

    const instagram = await cuenta('instagram')
    // Dos lecturas de la misma: cuenta la del último día, no las dos.
    await publicacion(instagram, [
      { day: '2026-11-07', views: 250, likes: 30 },
      { day: '2026-11-06', views: 100, likes: 10 },
    ])
    // Una red que no da un contador lo deja en null: suma lo que hay.
    await publicacion(await cuenta('facebook'), [{ day: '2026-11-07', views: 50, likes: null }])
    await publicacion(await cuenta('tiktok'), [{ day: '2026-11-07', views: null, likes: 5 }])
    await publicacion(await cuenta('youtube'), [{ day: '2026-11-07', views: 9999, likes: 999 }])
    await publicacion(await cuenta('instagram', false), [{ day: '2026-11-07', views: 7777, likes: 777 }])
    await publicacion(instagram, [{ day: '2026-11-07', views: 5555, likes: 555 }], true)

    expect(await leerNumerosDeLaPortada()).toEqual({ vistas: 300, meGusta: 35 })
  })

  it('un total más grande que un entero de 32 bits llega entero', async () => {
    const antes = await leerNumerosDeLaPortada()
    const c = await cuenta('instagram')
    await publicacion(c, [{ day: '2026-11-07', views: 2_000_000_000, likes: 1 }])
    await publicacion(c, [{ day: '2026-11-07', views: 2_000_000_000, likes: 1 }])
    expect(await leerNumerosDeLaPortada()).toEqual({ vistas: antes.vistas + 4_000_000_000, meGusta: antes.meGusta + 2 })
  })
})
