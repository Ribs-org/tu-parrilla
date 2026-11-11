import { beforeAll, describe, expect, it, vi } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// «Lo que trajo» contra una Postgres de verdad: lo nuevo de un corte desde que se miró —los «me
// gusta» y comentarios sin YouTube, sus comentarios de La Mesa, las visitas a páginas del dueño—,
// la marca que lo deja en cero, y que la fila solo trae lo del dueño que salió esta semana.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { leerCorte, leerLoQueTrajo, marcarVisto } = await import('./lo-que-trajo')
const { contarPendientes } = await import('./comentarios-cola')

const HORA = 3600e3

/** Un dueño con su página y una cuenta de Instagram y otra de YouTube. */
async function dueno() {
  const { users, profiles, socialAccounts } = await esquema()
  const [u] = await (await db())
    .insert(users)
    .values({ correo: `l-${crypto.randomUUID()}@ejemplo.cl`, zona: 'America/Santiago' })
    .returning()
  const [pagina] = await (await db())
    .insert(profiles)
    .values({ ownerId: u!.id, slug: `p-${crypto.randomUUID().slice(0, 8)}`, displayName: 'Prueba', isDefault: true })
    .returning()
  const [ig, yt] = await (await db())
    .insert(socialAccounts)
    .values([
      { ownerId: u!.id, network: 'instagram', handle: '@prueba', externalId: `ig-${u!.id}`, accessToken: 'x' },
      { ownerId: u!.id, network: 'youtube', handle: 'Prueba', externalId: `yt-${u!.id}`, accessToken: 'x' },
    ])
    .returning()
  return { id: u!.id, pagina: pagina!.id, ig: ig!.id, yt: yt!.id }
}

/** Un corte con estos destinos: `[cuenta, red, estado, id en la red]`. */
async function corte(ownerId: string, scheduledAt: Date, destinos: Array<[string, string, 'published' | 'failed' | 'scheduled', string | null]>) {
  const { scheduledPosts, scheduledPostTargets } = await esquema()
  const [post] = await (await db()).insert(scheduledPosts).values({ ownerId, caption: 'un corte', scheduledAt }).returning()
  await (await db())
    .insert(scheduledPostTargets)
    .values(destinos.map(([accountId, network, status, externalId]) => ({ postId: post!.id, accountId, network, status, externalId })))
  return post!.id
}

/** La publicación que la sincronización encontró, con su etiqueta `?s=`. */
async function publicada(ownerId: string, accountId: string, network: string, externalId: string) {
  const { socialPosts } = await esquema()
  const [p] = await (await db())
    .insert(socialPosts)
    .values({ ownerId, accountId, network, externalId, publishedAt: new Date(), campaign: `${network}-${externalId}-${crypto.randomUUID().slice(0, 6)}` })
    .returning()
  return p!
}

async function lectura(postId: string, day: string, likes: number, comments: number) {
  const { postMetrics } = await esquema()
  await (await db())
    .insert(postMetrics)
    .values({ postId, day, likes, comments, views: likes * 10 })
    .onConflictDoUpdate({ target: [postMetrics.postId, postMetrics.day], set: { likes, comments } })
}

async function visita(profileId: string, campaign: string, createdAt: Date, isBot = false) {
  const { visits } = await esquema()
  await (await db()).insert(visits).values({ profileId, campaign, createdAt, isBot, visitorHash: crypto.randomUUID() })
}

async function comentarioDeYoutube(accountId: string, postExternalId: string, createdAt: Date) {
  const { postComments } = await esquema()
  await (await db())
    .insert(postComments)
    .values({ accountId, network: 'youtube', postExternalId, externalId: crypto.randomUUID(), text: 'buenísimo', publishedAt: createdAt, createdAt })
}

describe.skipIf(!URL_PRUEBAS)('Lo que trajo, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_lo_que_trajo')
  }, 60_000)

  it('cuenta todo desde que salió; mirarlo lo deja en cero, y vuelve a subir con lo que llega después', async () => {
    const d = await dueno()
    const otro = await dueno()
    const t0 = new Date()
    const id = await corte(d.id, new Date(t0.getTime() - HORA), [
      [d.ig, 'instagram', 'published', 'ig-a'],
      [d.yt, 'youtube', 'published', 'yt-a'],
    ])
    const ig = await publicada(d.id, d.ig, 'instagram', 'ig-a')
    const yt = await publicada(d.id, d.yt, 'youtube', 'yt-a')
    // Manda la última lectura; los «me gusta» de YouTube no entran: no se restan (`politica-youtube.ts`).
    await lectura(ig.id, '2026-11-09', 3, 1)
    await lectura(ig.id, '2026-11-10', 10, 2)
    await lectura(yt.id, '2026-11-10', 50, 7)
    // Sus comentarios sí, los que entraron a La Mesa.
    await comentarioDeYoutube(d.yt, 'yt-a', new Date(t0.getTime() - HORA / 2))
    await comentarioDeYoutube(d.yt, 'yt-a', new Date(t0.getTime() - HORA / 2))
    // Visitas: dos por Instagram y una por YouTube a su página; ni el bot ni la de la página de otro.
    const antes = new Date(t0.getTime() - HORA / 2)
    await visita(d.pagina, ig.campaign, antes)
    await visita(d.pagina, ig.campaign, antes)
    await visita(d.pagina, yt.campaign, antes)
    await visita(d.pagina, ig.campaign, antes, true)
    await visita(otro.pagina, ig.campaign, antes)

    const pendientes = await contarPendientes(d.id, null)
    const fila = await leerLoQueTrajo(d.id, t0)
    expect(fila.cortes.map((c) => c.corte.post.id)).toEqual([id])
    expect(fila.cortes[0]!.nuevo).toEqual({ meGusta: 10, comentarios: 4, visitas: 3 })
    expect(fila.cortes[0]!.visitas).toBe(3)
    expect(fila.numero).toBe(1 + pendientes)

    expect(await marcarVisto(d.id, id, t0)).toBe(pendientes)
    const visto = await leerCorte(d.id, id)
    expect(visto!.nuevo).toEqual({ meGusta: 0, comentarios: 0, visitas: 0 })
    expect(visto!.marca).toMatchObject({ meGusta: 10, comentarios: 2 })

    // Lo que llega después de mirarlo.
    const despues = new Date(t0.getTime() + 60_000)
    await lectura(ig.id, '2026-11-10', 15, 3)
    await comentarioDeYoutube(d.yt, 'yt-a', despues)
    await visita(d.pagina, ig.campaign, despues)
    expect((await leerCorte(d.id, id))!.nuevo).toEqual({ meGusta: 5, comentarios: 2, visitas: 1 })

    // Alguien quitó su «me gusta»: no resta.
    await lectura(ig.id, '2026-11-10', 8, 3)
    expect((await leerCorte(d.id, id))!.nuevo.meGusta).toBe(0)

    // Mirarlo otra vez pisa la marca: una sola fila por corte.
    await marcarVisto(d.id, id, new Date(t0.getTime() + 2 * 60_000))
    const { cortesVistos } = await esquema()
    expect(await (await db()).select().from(cortesVistos).where(eq(cortesVistos.postId, id))).toHaveLength(1)
  })

  it('la fila: lo de la semana del dueño que salió, del más nuevo al más viejo', async () => {
    const d = await dueno()
    const otro = await dueno()
    const t0 = new Date()
    const hace = (horas: number) => new Date(t0.getTime() - horas * HORA)
    const ayer = await corte(d.id, hace(24), [[d.ig, 'instagram', 'published', 'ig-ayer']])
    // Salió en Instagram aunque YouTube se quemó: va, con lo de Instagram.
    const anteayer = await corte(d.id, hace(48), [
      [d.ig, 'instagram', 'published', 'ig-anteayer'],
      [d.yt, 'youtube', 'failed', null],
    ])
    await corte(d.id, hace(8 * 24), [[d.ig, 'instagram', 'published', 'ig-viejo']])
    await corte(d.id, hace(2), [[d.ig, 'instagram', 'failed', null]])
    await corte(d.id, hace(1), [[d.ig, 'instagram', 'scheduled', null]])
    await corte(otro.id, hace(3), [[otro.ig, 'instagram', 'published', 'ig-ajeno']])

    const fila = await leerLoQueTrajo(d.id, t0)
    expect(fila.cortes.map((c) => c.corte.post.id)).toEqual([ayer, anteayer])
    expect(fila.cortes[1]!.servidos.map((s) => s.red)).toEqual(['instagram'])
    // Sin la publicación sincronizada todavía, no hay nada nuevo que contar.
    expect(fila.cortes[0]!.nuevo).toEqual({ meGusta: 0, comentarios: 0, visitas: 0 })
    expect(fila.numero).toBe(0)
  })

  it('el corte de otro no se lee ni se marca', async () => {
    const d = await dueno()
    const otro = await dueno()
    const ajeno = await corte(otro.id, new Date(Date.now() - HORA), [[otro.ig, 'instagram', 'published', 'ig-x']])
    expect(await leerCorte(d.id, ajeno)).toBeNull()
    expect(await marcarVisto(d.id, ajeno, new Date())).toBeNull()
    expect(await leerCorte(d.id, 'no-es-un-id')).toBeNull()
    const { cortesVistos } = await esquema()
    expect(
      await (await db()).select().from(cortesVistos).where(and(eq(cortesVistos.postId, ajeno), eq(cortesVistos.ownerId, d.id))),
    ).toHaveLength(0)
  })
})
