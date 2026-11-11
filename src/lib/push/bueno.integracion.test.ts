import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El aviso de lo bueno contra una Postgres de verdad, con Expo de mentira: un hito raro sale apenas
// se alcanza, uno al día como mucho; si no hubo hito, desde las 19:00 sale lo que trajo el día; nada
// de noche, nada con los avisos de lo bueno apagados, y si Expo no lo acepta se reintenta.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { avisarLoBueno, loDeHoy } = await import('./bueno')
const { detectarHitos } = await import('@/lib/hitos')
const { sesionDelTelefono } = await import('@/lib/mobile-token')

type Mensaje = { to: string; title: string; body: string; data: { tipo: string; id?: string }; badge?: number }
const mensajes: Mensaje[] = []
let rechazar = false

function expoDeMentira() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const lote = JSON.parse(String(init.body)) as Mensaje[]
      if (!rechazar) mensajes.push(...lote)
      const ticket = rechazar ? { status: 'error', message: 'caído', details: { error: 'MessageRateExceeded' } } : { status: 'ok', id: 'r' }
      return new Response(JSON.stringify({ data: lote.map(() => ticket) }), { status: 200 })
    }),
  )
}

/** A qué hora de Santiago (UTC−3 en noviembre) del 11 o del 12 de noviembre. */
const santiago = (dia: 11 | 12, hora: number, minuto = 30) => new Date(Date.UTC(2026, 10, dia, hora + 3, minuto))

/** Un dueño en Santiago con un teléfono y una cuenta de Instagram. */
async function dueno() {
  const { users, socialAccounts, pushTokens } = await esquema()
  const [u] = await (await db())
    .insert(users)
    .values({ correo: `b-${crypto.randomUUID()}@ejemplo.cl`, zona: 'America/Santiago' })
    .returning()
  const [ig] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId: u!.id, network: 'instagram', handle: '@prueba', externalId: `ig-${u!.id}`, accessToken: 'x' })
    .returning()
  const token = `ExponentPushToken[${crypto.randomUUID().replaceAll('-', '')}]`
  await (await db()).insert(pushTokens).values({ ownerId: u!.id, token, plataforma: 'android', sesion: sesionDelTelefono(u!.sesionVersion) })
  return { id: u!.id, ig: ig!.id, token }
}

/** Un corte servido en Instagram con su publicación y sus lecturas: `[día, vistas, me gusta, comentarios]`. */
async function corte(ownerId: string, cuenta: string, externo: string, texto: string, lecturas: Array<[string, number, number, number]>) {
  const { scheduledPosts, scheduledPostTargets, socialPosts, postMetrics } = await esquema()
  const [post] = await (await db())
    .insert(scheduledPosts)
    .values({ ownerId, caption: texto, scheduledAt: santiago(11, 8) })
    .returning()
  await (await db())
    .insert(scheduledPostTargets)
    .values({ postId: post!.id, accountId: cuenta, network: 'instagram', status: 'published', externalId: externo })
  const [p] = await (await db())
    .insert(socialPosts)
    .values({ ownerId, accountId: cuenta, network: 'instagram', externalId: externo, publishedAt: santiago(11, 8), campaign: `c-${externo}` })
    .returning()
  await (await db())
    .insert(postMetrics)
    .values(lecturas.map(([day, views, likes, comments]) => ({ postId: p!.id, day, views, likes, comments })))
  return { id: post!.id, publicacion: p!.id }
}

const delDueno = (token: string) => mensajes.filter((m) => m.to === token)

describe.skipIf(!URL_PRUEBAS)('el aviso de lo bueno, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_bueno')
  }, 60_000)

  afterEach(() => {
    mensajes.length = 0
    rechazar = false
    vi.unstubAllGlobals()
  })

  it('un hito raro sale apenas se alcanza, con el número del ícono; y no sale otro ese día', async () => {
    expoDeMentira()
    const d = await dueno()
    const c = await corte(d.id, d.ig, 'ig-h1', 'El asado del domingo', [['2026-11-11', 1500, 40, 3]])
    await detectarHitos(santiago(11, 11))

    await avisarLoBueno(santiago(11, 12))
    const [aviso, ...otros] = delDueno(d.token)
    expect(otros).toEqual([])
    expect(aviso).toMatchObject({ title: 'Tu corte pasó las 1.000 vistas', data: { tipo: 'hito', id: c.id } })
    expect(aviso!.body).toContain('El asado del domingo')
    expect(typeof aviso!.badge).toBe('number')
    const { hitos } = await esquema()
    expect((await (await db()).select().from(hitos).where(eq(hitos.postId, c.id))).every((h) => h.avisadoEn !== null)).toBe(true)

    // Otro hito el mismo día: no sale, ni lo del día a las 20:30.
    await corte(d.id, d.ig, 'ig-h2', 'Otro', [['2026-11-11', 300, 5, 0]])
    await detectarHitos(santiago(11, 13))
    await avisarLoBueno(santiago(11, 14))
    await avisarLoBueno(santiago(11, 20))
    expect(delDueno(d.token)).toHaveLength(1)
  })

  it('sin hito, desde las 19:00 sale lo que trajo el día; antes no, ni de noche, ni apagados', async () => {
    expoDeMentira()
    const d = await dueno()
    // Ayer 30 «me gusta» y 2 comentarios; hoy 45 y 3. Vistas bajo 100: sin hitos.
    await corte(d.id, d.ig, 'ig-d1', 'Un corte', [
      ['2026-11-11', 50, 30, 2],
      ['2026-11-12', 80, 45, 3],
    ])
    expect(await loDeHoy(d.id, '2026-11-12')).toEqual({ meGusta: 15, comentarios: 1 })

    await avisarLoBueno(santiago(12, 15))
    expect(delDueno(d.token)).toEqual([])
    await avisarLoBueno(santiago(12, 23))
    expect(delDueno(d.token)).toEqual([])

    const { users } = await esquema()
    await (await db()).update(users).set({ pushBueno: false }).where(eq(users.id, d.id))
    await avisarLoBueno(santiago(12, 19))
    expect(delDueno(d.token)).toEqual([])

    await (await db()).update(users).set({ pushBueno: true }).where(eq(users.id, d.id))
    await avisarLoBueno(santiago(12, 19))
    expect(delDueno(d.token).map((m) => [m.title, m.body, m.data.tipo])).toEqual([
      ['Lo que trajo hoy', 'Hoy: +15 me gusta y +1 comentario en tus cortes.', 'bueno'],
    ])
  })

  it('si Expo no lo acepta, la marca se suelta y la hora siguiente lo intenta otra vez', async () => {
    expoDeMentira()
    const d = await dueno()
    await corte(d.id, d.ig, 'ig-r1', 'Un corte', [['2026-11-12', 50, 12, 0]])
    rechazar = true
    await avisarLoBueno(santiago(12, 19))
    const { users } = await esquema()
    const [u] = await (await db()).select().from(users).where(eq(users.id, d.id))
    expect(u!.pushBuenoEn).toBeNull()

    rechazar = false
    await avisarLoBueno(santiago(12, 20))
    expect(delDueno(d.token).map((m) => m.body)).toEqual(['Hoy: +12 me gusta en tus cortes.'])
  })
})
