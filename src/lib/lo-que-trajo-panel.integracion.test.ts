import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// «Lo que trajo» en La Parrilla del panel, contra una Postgres de verdad: lo que anotan sus dos
// acciones (`src/app/admin/lo-que-trajo-actions.ts`) —mirar un corte y celebrar un hito— con el
// dueño de la sesión y nunca con lo que llega, y que la fila del panel es la misma del teléfono.

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }))

let quien: Usuario | null = null
vi.mock('@/lib/auth', () => ({
  requireUser: async () => {
    if (!quien) throw new Error('sin sesión')
    return quien
  },
}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

/** Un dueño con una cuenta de Instagram. */
async function dueno(): Promise<{ usuario: Usuario; ig: string }> {
  const { users, socialAccounts } = await esquema()
  const [u] = await (await db())
    .insert(users)
    .values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl`, zona: 'America/Santiago' })
    .returning()
  const [ig] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId: u!.id, network: 'instagram', handle: '@prueba', externalId: `ig-${u!.id}`, accessToken: 'x' })
    .returning()
  return { usuario: u!, ig: ig!.id }
}

/** Un corte que salió hace una hora en Instagram, con su publicación y una lectura. */
async function servido(ownerId: string, accountId: string, likes: number) {
  const { scheduledPosts, scheduledPostTargets, socialPosts, postMetrics } = await esquema()
  const externo = `ig-${crypto.randomUUID().slice(0, 8)}`
  const [post] = await (await db())
    .insert(scheduledPosts)
    .values({ ownerId, caption: 'un corte', scheduledAt: new Date(Date.now() - 3600e3) })
    .returning()
  await (await db())
    .insert(scheduledPostTargets)
    .values({ postId: post!.id, accountId, network: 'instagram', status: 'published', externalId: externo })
  const [publicada] = await (await db())
    .insert(socialPosts)
    .values({ ownerId, accountId, network: 'instagram', externalId: externo, publishedAt: new Date(), campaign: `instagram-${externo}` })
    .returning()
  await (await db()).insert(postMetrics).values({ postId: publicada!.id, day: '2026-11-11', likes, comments: 0, views: likes * 10 })
  return post!.id
}

async function hito(ownerId: string, postId: string, umbral: number) {
  const { hitos } = await esquema()
  const [h] = await (await db()).insert(hitos).values({ ownerId, postId, umbral, alcanzadoEn: new Date() }).returning()
  return h!.id
}

describe.skipIf(!URL_PRUEBAS)('Lo que trajo en el panel, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_lo_que_trajo_panel')
  }, 60_000)

  it('mirar un corte desde el panel lo deja en cero, solo si es del dueño de la sesión', async () => {
    const { mirarCortePropio } = await import('@/app/admin/lo-que-trajo-actions')
    const { leerCorte } = await import('./lo-que-trajo')
    const yo = await dueno()
    const otro = await dueno()
    const mio = await servido(yo.usuario.id, yo.ig, 12)
    const ajeno = await servido(otro.usuario.id, otro.ig, 30)
    quien = yo.usuario

    expect((await leerCorte(yo.usuario.id, mio))!.nuevo.meGusta).toBe(12)

    // Lo ajeno y lo que no es un id no anotan nada.
    await mirarCortePropio(ajeno)
    await mirarCortePropio('no-es-un-id')
    await mirarCortePropio(42)
    expect((await leerCorte(otro.usuario.id, ajeno))!.marca).toBeNull()

    await mirarCortePropio(mio)
    const despues = (await leerCorte(yo.usuario.id, mio))!
    expect(despues.marca).not.toBeNull()
    expect(despues.nuevo).toEqual({ meGusta: 0, comentarios: 0, visitas: 0 })
  })

  it('celebrar desde el panel deja el hito celebrado, también para el teléfono, y solo el propio', async () => {
    const { celebrarHitoPropio } = await import('@/app/admin/lo-que-trajo-actions')
    const { porCelebrar } = await import('./hitos')
    const { hitos } = await esquema()
    const yo = await dueno()
    const otro = await dueno()
    const mio = await hito(yo.usuario.id, await servido(yo.usuario.id, yo.ig, 20), 100)
    const ajeno = await hito(otro.usuario.id, await servido(otro.usuario.id, otro.ig, 20), 100)
    quien = yo.usuario

    // Con menos de tres cortes para comparar todo es raro: los dos están por celebrar.
    expect((await porCelebrar(yo.usuario.id, new Date())).map((h) => h.id)).toEqual([mio])

    await celebrarHitoPropio(ajeno)
    await celebrarHitoPropio('no-es-un-id')
    const [delOtro] = await (await db()).select().from(hitos).where(eq(hitos.id, ajeno))
    expect(delOtro!.celebradoEn).toBeNull()

    await celebrarHitoPropio(mio)
    expect(await porCelebrar(yo.usuario.id, new Date())).toEqual([])
    expect((await porCelebrar(otro.usuario.id, new Date())).map((h) => h.id)).toEqual([ajeno])
  })

  it('la fila del panel es la del teléfono, sin el número del ícono', async () => {
    const { filaDeLoQueTrajo, leerLoQueTrajo } = await import('./lo-que-trajo')
    const yo = await dueno()
    await servido(yo.usuario.id, yo.ig, 5)
    await servido(yo.usuario.id, yo.ig, 7)
    const ahora = new Date()
    const delPanel = await filaDeLoQueTrajo(yo.usuario.id, ahora)
    const delTelefono = await leerLoQueTrajo(yo.usuario.id, ahora)
    expect(delPanel.map((c) => c.corte.post.id)).toEqual(delTelefono.cortes.map((c) => c.corte.post.id))
    expect(delPanel).toHaveLength(2)
  })
})
