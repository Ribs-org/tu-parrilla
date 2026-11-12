import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Mover un post programado a otra fecha, contra una Postgres de verdad (issue #375): cambia solo
// la hora —el id, el texto, la media guardada, la ref y las opciones quedan—, no toca lo que ya
// salió ni lo que está saliendo, no acepta una hora pasada ni una que no se entiende, no ve los
// posts de otro, y un destino quemado vuelve a la cola con la hora nueva.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { cambiarFecha, FECHA_YA_PUBLICADO, POST_NO_EXISTE_API } = await import('./cambiar-fecha')
const { EN_CURSO } = await import('./editar')

const ZONA = 'America/Santiago'
// La regla del editor mira la hora real (`validateScheduleDraft`): las fechas van lejos, en 2030.
const AHORA = new Date()

async function dueno(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `f-${crypto.randomUUID()}@ejemplo.cl`, zona: ZONA }).returning()
  return u!.id
}

async function cuenta(ownerId: string) {
  const { socialAccounts } = await esquema()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId, network: 'instagram', handle: '@prueba', externalId: crypto.randomUUID(), accessToken: 'x' })
    .returning()
  return c!
}

type Estado = 'scheduled' | 'publishing' | 'published' | 'failed'

/** Un post de Instagram con una foto ya guardada, para el 20 de noviembre de 2030 a las 10:00 de Santiago. */
async function post(ownerId: string, estados: Estado[] = ['scheduled']) {
  const { scheduledPosts, scheduledPostTargets, scheduledPostMedia } = await esquema()
  const [p] = await (await db())
    .insert(scheduledPosts)
    .values({ ownerId, caption: 'La noticia de la semana', scheduledAt: new Date('2030-11-20T13:00:00Z'), ref: `r-${crypto.randomUUID()}` })
    .returning()
  await (await db()).insert(scheduledPostMedia).values({ postId: p!.id, blobUrl: 'https://media.ejemplo.cl/u/foto.jpg', mediaType: 'image', position: 0 })
  for (const status of estados) {
    const c = await cuenta(ownerId)
    await (await db())
      .insert(scheduledPostTargets)
      .values({ postId: p!.id, accountId: c.id, network: 'instagram', status, ...(status === 'failed' ? { attemptCount: 3, lastError: 'se quemó' } : {}) })
  }
  return p!
}

async function leer(postId: string) {
  const { scheduledPosts, scheduledPostTargets, scheduledPostMedia } = await esquema()
  const [p] = await (await db()).select().from(scheduledPosts).where(eq(scheduledPosts.id, postId))
  const destinos = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.postId, postId))
  const media = await (await db()).select().from(scheduledPostMedia).where(eq(scheduledPostMedia.postId, postId))
  return { post: p!, destinos, media }
}

describe.skipIf(!URL_PRUEBAS)('cambiar la fecha de un post programado, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_cambiar_fecha')
  }, 60_000)

  it('mueve la hora en la zona del dueño y conserva el id, el texto, la media y la ref', async () => {
    const d = await dueno()
    const p = await post(d)
    const antes = await leer(p.id)

    expect(await cambiarFecha(d, p.id, '2030-11-25 10:00', ZONA, AHORA)).toEqual({ ok: true })
    const despues = await leer(p.id)
    // 10:00 en Santiago (UTC−3 en noviembre).
    expect(despues.post.scheduledAt.toISOString()).toBe('2030-11-25T13:00:00.000Z')
    expect(despues.post).toMatchObject({ id: p.id, caption: antes.post.caption, ref: antes.post.ref })
    expect(despues.media).toEqual(antes.media)
    expect(despues.destinos.map((t) => [t.id, t.status])).toEqual(antes.destinos.map((t) => [t.id, t.status]))
    // Con «T», como lo escribe el issue, también.
    expect(await cambiarFecha(d, p.id, '2030-11-26T09:30', ZONA, AHORA)).toEqual({ ok: true })
    expect((await leer(p.id)).post.scheduledAt.toISOString()).toBe('2030-11-26T12:30:00.000Z')
  })

  it('lo que ya salió en alguna cuenta, o está saliendo, no se mueve', async () => {
    const d = await dueno()
    const publicado = await post(d, ['published', 'scheduled'])
    expect(await cambiarFecha(d, publicado.id, '2030-11-25 10:00', ZONA, AHORA)).toEqual({ error: FECHA_YA_PUBLICADO, status: 409 })
    const saliendo = await post(d, ['publishing'])
    expect(await cambiarFecha(d, saliendo.id, '2030-11-25 10:00', ZONA, AHORA)).toEqual({ error: EN_CURSO, status: 409 })
    for (const { id } of [publicado, saliendo]) {
      expect((await leer(id)).post.scheduledAt.toISOString()).toBe('2030-11-20T13:00:00.000Z')
    }
  })

  it('una hora pasada, o una que no se entiende, no mueve nada', async () => {
    const d = await dueno()
    const p = await post(d)
    expect(await cambiarFecha(d, p.id, '2026-11-01 10:00', ZONA, AHORA)).toMatchObject({ status: 400, error: 'La hora debe estar en el futuro.' })
    // La misma fecha que ya tenía, ya pasada, tampoco: volvería a la cola un quemado para ya.
    expect(await cambiarFecha(d, p.id, '2030-11-20 10:00', ZONA, new Date('2030-11-21T00:00:00Z'))).toMatchObject({ status: 400 })
    for (const mala of ['25/11/2026 10:00', '2030-11-25T10:00:00Z', '', 7, null]) {
      expect(await cambiarFecha(d, p.id, mala, ZONA, AHORA)).toMatchObject({ status: 400, error: 'La fecha no se entendió (usa YYYY-MM-DD HH:MM).' })
    }
    expect((await leer(p.id)).post.scheduledAt.toISOString()).toBe('2030-11-20T13:00:00.000Z')
  })

  it('el post de otro dueño, o uno que no existe, es «Ese post no existe.»', async () => {
    const [ana, bea] = [await dueno(), await dueno()]
    const deAna = await post(ana)
    expect(await cambiarFecha(bea, deAna.id, '2030-11-25 10:00', ZONA, AHORA)).toEqual({ error: POST_NO_EXISTE_API, status: 404 })
    expect(await cambiarFecha(bea, crypto.randomUUID(), '2030-11-25 10:00', ZONA, AHORA)).toEqual({ error: POST_NO_EXISTE_API, status: 404 })
    expect(await cambiarFecha(bea, 'no-es-un-id', '2030-11-25 10:00', ZONA, AHORA)).toEqual({ error: POST_NO_EXISTE_API, status: 404 })
    expect((await leer(deAna.id)).post.scheduledAt.toISOString()).toBe('2030-11-20T13:00:00.000Z')
  })

  it('un destino que se quemó vuelve a la cola con la hora nueva, como en el editor', async () => {
    const d = await dueno()
    const p = await post(d, ['failed'])
    expect(await cambiarFecha(d, p.id, '2030-11-25 10:00', ZONA, AHORA)).toEqual({ ok: true })
    const [destino] = (await leer(p.id)).destinos
    expect(destino).toMatchObject({ status: 'scheduled', attemptCount: 0, lastError: null })
  })
})
