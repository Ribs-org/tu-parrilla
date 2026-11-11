import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Los hitos y la racha de «Lo que trajo» contra una Postgres de verdad: la detección suma la última
// lectura de cada red del corte sin YouTube y no repite lo puesto; la app celebra uno por corte, el
// más alto, y celebrarlo deja celebrados los de abajo; la racha cuenta días seguidos en la zona del
// dueño, sin los borradores de la bandeja de TikTok.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { celebrar, detectarHitos, hitosDeLosCortes, porCelebrar } = await import('./hitos')
const { leerRacha } = await import('./racha')

/** Un dueño con una cuenta de Instagram, una de TikTok y una de YouTube. */
async function dueno() {
  const { users, socialAccounts } = await esquema()
  const [u] = await (await db())
    .insert(users)
    .values({ correo: `h-${crypto.randomUUID()}@ejemplo.cl`, zona: 'America/Santiago' })
    .returning()
  const [ig, tt, yt] = await (await db())
    .insert(socialAccounts)
    .values([
      { ownerId: u!.id, network: 'instagram', handle: '@prueba', externalId: `ig-${u!.id}`, accessToken: 'x' },
      { ownerId: u!.id, network: 'tiktok', handle: '@prueba', externalId: `tt-${u!.id}`, accessToken: 'x' },
      { ownerId: u!.id, network: 'youtube', handle: 'Prueba', externalId: `yt-${u!.id}`, accessToken: 'x' },
    ])
    .returning()
  return { id: u!.id, ig: ig!.id, tt: tt!.id, yt: yt!.id }
}

type Destino = [cuenta: string, red: string, estado: 'published' | 'failed', idEnLaRed: string | null, opciones?: unknown]

async function corte(ownerId: string, scheduledAt: Date, destinos: Destino[]) {
  const { scheduledPosts, scheduledPostTargets } = await esquema()
  const [post] = await (await db()).insert(scheduledPosts).values({ ownerId, caption: 'un corte', scheduledAt }).returning()
  await (await db())
    .insert(scheduledPostTargets)
    .values(
      destinos.map(([accountId, network, status, externalId, opciones]) => ({ postId: post!.id, accountId, network, status, externalId, opciones })),
    )
  return post!.id
}

/** La publicación que la sincronización encontró, con sus lecturas: `[día, vistas]`. */
async function publicada(ownerId: string, accountId: string, network: string, externalId: string, lecturas: Array<[string, number]>) {
  const { socialPosts, postMetrics } = await esquema()
  const [p] = await (await db())
    .insert(socialPosts)
    .values({ ownerId, accountId, network, externalId, publishedAt: new Date(), campaign: `${network}-${externalId}-${crypto.randomUUID().slice(0, 6)}` })
    .returning()
  await (await db()).insert(postMetrics).values(lecturas.map(([day, views]) => ({ postId: p!.id, day, views })))
  return p!
}

async function umbralesDe(postId: string) {
  const { hitos } = await esquema()
  const filas = await (await db()).select().from(hitos).where(eq(hitos.postId, postId)).orderBy(hitos.umbral)
  return filas.map((h) => h.umbral)
}

describe.skipIf(!URL_PRUEBAS)('Los hitos y la racha, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_hitos')
  }, 60_000)

  it('suma la última lectura de cada red sin YouTube, y no repite lo que ya puso', async () => {
    const d = await dueno()
    const otro = await dueno()
    const ahora = new Date()
    // Instagram 800 (la lectura de antes no cuenta) + TikTok 300 = 1.100. YouTube, aunque tenga
    // 50.000, no entra: no se suman sus números con los de otra red.
    const id = await corte(d.id, new Date(ahora.getTime() - 864e5), [
      [d.ig, 'instagram', 'published', 'ig-a'],
      [d.tt, 'tiktok', 'published', 'tt-a'],
      [d.yt, 'youtube', 'published', 'yt-a'],
    ])
    await publicada(d.id, d.ig, 'instagram', 'ig-a', [['2026-11-09', 50], ['2026-11-10', 800]])
    await publicada(d.id, d.tt, 'tiktok', 'tt-a', [['2026-11-10', 300]])
    await publicada(d.id, d.yt, 'youtube', 'yt-a', [['2026-11-10', 50_000]])
    // Solo en YouTube: sin hitos. Uno que se quemó: tampoco.
    const soloYoutube = await corte(d.id, ahora, [[d.yt, 'youtube', 'published', 'yt-b']])
    await publicada(d.id, d.yt, 'youtube', 'yt-b', [['2026-11-10', 5000]])
    const quemado = await corte(d.id, ahora, [[d.ig, 'instagram', 'failed', null]])
    // El de otro dueño: sus hitos son suyos.
    const ajeno = await corte(otro.id, ahora, [[otro.ig, 'instagram', 'published', 'ig-b']])
    await publicada(otro.id, otro.ig, 'instagram', 'ig-b', [['2026-11-10', 150]])

    expect(await detectarHitos(ahora)).toBeGreaterThanOrEqual(3)
    expect(await umbralesDe(id)).toEqual([100, 1000])
    expect(await umbralesDe(soloYoutube)).toEqual([])
    expect(await umbralesDe(quemado)).toEqual([])
    expect(await umbralesDe(ajeno)).toEqual([100])
    const { hitos } = await esquema()
    const [delAjeno] = await (await db()).select().from(hitos).where(eq(hitos.postId, ajeno))
    expect(delAjeno!.ownerId).toBe(otro.id)
    expect(delAjeno!.alcanzadoEn).toEqual(ahora)
    expect(delAjeno!.celebradoEn).toBeNull()

    // La corrida siguiente no repite nada.
    await detectarHitos(new Date(ahora.getTime() + 3600e3))
    const filas = await (await db()).select().from(hitos).where(inArray(hitos.postId, [id, ajeno]))
    expect(filas).toHaveLength(3)
    expect(filas.every((h) => h.alcanzadoEn!.getTime() === ahora.getTime())).toBe(true)

    expect((await hitosDeLosCortes(d.id, [id, ajeno])).get(id)!.map((h) => h.umbral)).toEqual([100, 1000])
    expect((await hitosDeLosCortes(d.id, [ajeno])).size).toBe(0)
  })

  it('celebra el más alto de cada corte; celebrarlo deja celebrados los de abajo, y el de otro no se toca', async () => {
    const d = await dueno()
    const otro = await dueno()
    const ahora = new Date()
    const id = await corte(d.id, ahora, [[d.ig, 'instagram', 'published', 'ig-c']])
    await publicada(d.id, d.ig, 'instagram', 'ig-c', [['2026-11-10', 1500]])
    await detectarHitos(ahora)

    const celebraciones = await porCelebrar(d.id)
    expect(celebraciones.map((c) => [c.corte.post.id, c.umbral])).toEqual([[id, 1000]])
    expect(await porCelebrar(otro.id)).toEqual([])

    expect(await celebrar(otro.id, celebraciones[0]!.id, ahora)).toBe(false)
    expect(await celebrar(d.id, 'no-es-un-id', ahora)).toBe(false)
    expect(await porCelebrar(d.id)).toHaveLength(1)

    expect(await celebrar(d.id, celebraciones[0]!.id, ahora)).toBe(true)
    expect(await porCelebrar(d.id)).toEqual([])
    const { hitos } = await esquema()
    const filas = await (await db()).select().from(hitos).where(eq(hitos.postId, id))
    expect(filas.map((h) => h.celebradoEn)).toEqual([ahora, ahora])
  })

  it('la racha: días seguidos en la zona del dueño, sin los borradores de la bandeja de TikTok', async () => {
    const d = await dueno()
    // El mediodía del 11 en Santiago (UTC−3).
    const ahora = new Date('2026-11-11T15:00:00Z')
    await corte(d.id, new Date('2026-11-09T13:00:00Z'), [[d.ig, 'instagram', 'published', 'ig-r1']])
    // A las 23:30 del 10 en Santiago: ya es el 11 en UTC, pero cuenta para el 10.
    await corte(d.id, new Date('2026-11-11T02:30:00Z'), [[d.ig, 'instagram', 'published', 'ig-r2']])
    await corte(d.id, new Date('2026-11-07T13:00:00Z'), [[d.ig, 'instagram', 'published', 'ig-r3']])
    expect(await leerRacha(d.id, ahora, 'America/Santiago')).toEqual({ dias: 2, hoy: false })

    // Un borrador en la bandeja de TikTok todavía no salió; uno que se quemó, tampoco.
    await corte(d.id, new Date('2026-11-11T13:00:00Z'), [[d.tt, 'tiktok', 'published', null, { modo: 'borrador' }]])
    await corte(d.id, new Date('2026-11-11T13:30:00Z'), [[d.ig, 'instagram', 'failed', null]])
    expect(await leerRacha(d.id, ahora, 'America/Santiago')).toEqual({ dias: 2, hoy: false })

    // YouTube cuenta como las demás: es lo que Tu Parrilla publicó.
    await corte(d.id, new Date('2026-11-11T14:00:00Z'), [[d.yt, 'youtube', 'published', 'yt-r']])
    expect(await leerRacha(d.id, ahora, 'America/Santiago')).toEqual({ dias: 3, hoy: true })
  })
})
