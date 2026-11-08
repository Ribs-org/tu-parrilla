import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Desconectar contra una Postgres de verdad: que en YouTube se borre en el acto lo que vino de
// su API, que lo propio de Tu Parrilla se quede, que las demás redes conserven su historial y
// que nadie desconecte —ni borre— la cuenta de otro.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { desconectarCuenta } = await import('./desconectar')

async function persona(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  return u!.id
}

/** Una cuenta conectada con un video, su lectura, la del canal, un comentario y algo programado. */
async function cuentaConHistoria(ownerId: string, network: string) {
  const { socialAccounts, socialPosts, postMetrics, accountMetrics, postComments, scheduledPosts, scheduledPostTargets } =
    await esquema()
  const d = await db()
  const [cuenta] = await d
    .insert(socialAccounts)
    .values({
      ownerId,
      network,
      handle: 'Mi canal',
      externalId: crypto.randomUUID(),
      accessToken: 'acceso',
      refreshToken: 'refresco',
      expiresAt: new Date(),
    })
    .returning()
  const [post] = await d
    .insert(socialPosts)
    .values({
      ownerId,
      accountId: cuenta!.id,
      network,
      campaign: crypto.randomUUID(),
      externalId: crypto.randomUUID(),
      permalink: 'https://www.youtube.com/watch?v=abc',
      caption: 'Cómo hacer un asado',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc/hq.jpg',
      publishedAt: new Date(),
    })
    .returning()
  await d.insert(postMetrics).values({ postId: post!.id, day: '2026-11-07', views: 120, comments: 1 })
  await d.insert(accountMetrics).values({ network, accountId: cuenta!.id, day: '2026-11-07', followers: 40 })
  await d.insert(postComments).values({
    accountId: cuenta!.id,
    network,
    postExternalId: post!.externalId,
    externalId: crypto.randomUUID(),
    text: '¡Buenísimo!',
    publishedAt: new Date(),
  })
  const [corte] = await d.insert(scheduledPosts).values({ ownerId, caption: 'Cómo hacer un asado', scheduledAt: new Date() }).returning()
  await d
    .insert(scheduledPostTargets)
    .values({ postId: corte!.id, accountId: cuenta!.id, network, status: 'published', externalId: post!.externalId })
  return { cuenta: cuenta!, post: post!, corte: corte! }
}

async function loQueQueda(accountId: string, postId: string) {
  const { socialAccounts, socialPosts, postMetrics, accountMetrics, postComments, scheduledPostTargets } = await esquema()
  const d = await db()
  const [cuenta] = await d.select().from(socialAccounts).where(eq(socialAccounts.id, accountId))
  const [post] = await d.select().from(socialPosts).where(eq(socialPosts.id, postId))
  return {
    cuenta,
    post,
    lecturas: (await d.select().from(postMetrics).where(eq(postMetrics.postId, postId))).length,
    delCanal: (await d.select().from(accountMetrics).where(eq(accountMetrics.accountId, accountId))).length,
    comentarios: (await d.select().from(postComments).where(eq(postComments.accountId, accountId))).length,
    destinos: (await d.select().from(scheduledPostTargets).where(eq(scheduledPostTargets.accountId, accountId))).length,
  }
}

describe.skipIf(!URL_PRUEBAS)('desconectar una cuenta, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_desconectar')
  }, 60_000)

  it('YouTube: borra en el acto lo que vino de su API y deja lo de Tu Parrilla', async () => {
    const ana = await persona()
    const { cuenta, post } = await cuentaConHistoria(ana, 'youtube')

    expect(await desconectarCuenta(ana, cuenta.id)).toBe(true)

    const queda = await loQueQueda(cuenta.id, post.id)
    expect(queda.cuenta).toMatchObject({ accessToken: null, refreshToken: null, expiresAt: null, handle: 'Mi canal' })
    expect(queda).toMatchObject({ lecturas: 0, delCanal: 0, comentarios: 0, destinos: 1 })
    // La fila del video se queda: une las visitas a su etiqueta. Sin título ni miniatura.
    expect(queda.post).toMatchObject({ campaign: post.campaign, caption: null, thumbnailUrl: null })
  })

  it('las demás redes conservan su historial', async () => {
    const ana = await persona()
    const { cuenta, post } = await cuentaConHistoria(ana, 'instagram')

    expect(await desconectarCuenta(ana, cuenta.id)).toBe(true)

    const queda = await loQueQueda(cuenta.id, post.id)
    expect(queda.cuenta?.accessToken).toBeNull()
    expect(queda).toMatchObject({ lecturas: 1, delCanal: 1, comentarios: 1, destinos: 1 })
    expect(queda.post?.caption).toBe('Cómo hacer un asado')
  })

  it('YouTube revocado desde Google: borra lo mismo y deja el motivo en la tarjeta', async () => {
    const ana = await persona()
    const { cuenta, post } = await cuentaConHistoria(ana, 'youtube')

    expect(
      await desconectarCuenta(ana, cuenta.id, { motivo: 'Google dejó de dar acceso…', refreshToken: 'refresco' }),
    ).toBe(true)

    const queda = await loQueQueda(cuenta.id, post.id)
    expect(queda.cuenta).toMatchObject({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      lastSyncError: 'Google dejó de dar acceso…',
    })
    expect(queda).toMatchObject({ lecturas: 0, delCanal: 0, comentarios: 0, destinos: 1 })
    expect(queda.post).toMatchObject({ caption: null, thumbnailUrl: null })
  })

  it('YouTube revocado, pero reconectado entre medio: la conexión nueva no se toca', async () => {
    const ana = await persona()
    const { cuenta, post } = await cuentaConHistoria(ana, 'youtube')

    // Google rechazó un refresh token que la fila ya no tiene: el dueño reconectó y hay otro.
    expect(
      await desconectarCuenta(ana, cuenta.id, { motivo: 'Google dejó de dar acceso…', refreshToken: 'el-de-antes' }),
    ).toBe(false)

    const queda = await loQueQueda(cuenta.id, post.id)
    expect(queda.cuenta).toMatchObject({ accessToken: 'acceso', refreshToken: 'refresco', lastSyncError: null })
    expect(queda).toMatchObject({ lecturas: 1, delCanal: 1, comentarios: 1 })
    expect(queda.post?.caption).toBe('Cómo hacer un asado')
  })

  it('el canal de otro dueño no se desconecta ni se borra, y el YouTube propio de al lado tampoco', async () => {
    const [ana, bea] = [await persona(), await persona()]
    const deAna = await cuentaConHistoria(ana, 'youtube')
    const otroDeAna = await cuentaConHistoria(ana, 'youtube')

    expect(await desconectarCuenta(bea, deAna.cuenta.id)).toBe(false)
    expect(await desconectarCuenta(bea, 'no-es-un-uuid')).toBe(false)

    const queda = await loQueQueda(deAna.cuenta.id, deAna.post.id)
    expect(queda.cuenta?.accessToken).toBe('acceso')
    expect(queda).toMatchObject({ lecturas: 1, delCanal: 1, comentarios: 1 })
    expect(queda.post?.caption).toBe('Cómo hacer un asado')

    // Desconectar uno de los canales de Ana no toca el otro.
    await desconectarCuenta(ana, deAna.cuenta.id)
    const elOtro = await loQueQueda(otroDeAna.cuenta.id, otroDeAna.post.id)
    expect(elOtro.cuenta?.accessToken).toBe('acceso')
    expect(elOtro).toMatchObject({ lecturas: 1, delCanal: 1, comentarios: 1 })
  })
})
