import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Los anuncios contra una Postgres de verdad: que el upsert sea idempotente y reescriba los
// totales, que el cruce con las publicaciones quede guardado, que «Lo pagado» lea solo lo del
// dueño y del período con un anuncio repetido una sola vez, y que el borrado de Meta y la
// cascada se los lleven. Meta sí va doblada: un `fetch` que contesta lo justo.

vi.mock('server-only', () => ({}))
// El token guardado es el texto mismo: así no hace falta `AUTH_SECRET` para cifrarlo.
vi.mock('./crypto', () => ({ decryptToken: (t: string) => t }))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

async function dueno(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `d-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  return u!.id
}

async function cuenta(ownerId: string, network: string, metaUserId: string | null = null) {
  const { socialAccounts } = await esquema()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId, network, handle: '@prueba', externalId: crypto.randomUUID(), accessToken: `tok-${network}`, metaUserId })
    .returning()
  return c!
}

async function publicacion(ownerId: string, accountId: string, network: string, externalId: string) {
  const { socialPosts } = await esquema()
  const [p] = await (await db())
    .insert(socialPosts)
    .values({ ownerId, accountId, network, externalId, publishedAt: new Date('2026-10-01'), campaign: `c-${crypto.randomUUID()}`, caption: 'el reel' })
    .returning()
  return p!
}

/** Meta con una cuenta publicitaria y los anuncios que se le pasen. */
function meta(anuncios: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (texto: string) => {
      const url = new URL(texto)
      if (url.pathname.endsWith('/me/adaccounts')) return Response.json({ data: [{ id: 'act_9', name: 'Mi cuenta', currency: 'CLP' }] })
      return Response.json({ data: anuncios })
    }),
  )
}

function anuncio(id: string, gasto: string, creativo: Record<string, string>, desde = '2026-10-02', hasta = '2026-10-09') {
  return { id, creative: creativo, insights: { data: [{ spend: gasto, reach: '100', impressions: '300', clicks: '7', date_start: desde, date_stop: hasta }] } }
}

describe.skipIf(!URL_PRUEBAS)('los anuncios contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_anuncios')
  }, 60_000)

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('guarda, cruza con la publicación, reescribe los totales y «Lo pagado» lee solo lo del dueño y del período', async () => {
    const { anuncios } = await esquema()
    const { sincronizarAnuncios } = await import('./anuncios-sync')
    const { leerLoPagado } = await import('@/lib/lo-pagado')
    const owner = await dueno()
    const otro = await dueno()
    const ig = await cuenta(owner, 'instagram')
    const fb = await cuenta(owner, 'facebook')
    const reel = await publicacion(owner, ig.id, 'instagram', `IG_${crypto.randomUUID()}`)
    const postFb = await publicacion(owner, fb.id, 'facebook', `PAGE_${crypto.randomUUID()}`)
    vi.stubEnv('ANUNCIOS_ABIERTO_PARA', owner)

    meta([
      anuncio('AD_REEL', '1000', { effective_instagram_media_id: reel.externalId, effective_object_story_id: 'PAGE_otra' }),
      anuncio('AD_FB', '500', { effective_object_story_id: postFb.externalId }),
      anuncio('AD_SUELTO', '200', {}, '2026-08-01', '2026-08-05'),
    ])
    expect(await sincronizarAnuncios(owner)).toBe(3)

    // El mismo anuncio leído un día con el token de Facebook, con otras fechas: la vuelta
    // siguiente lo deja en una sola cuenta, o «Lo pagado» lo mostraría en agosto.
    await (await db()).insert(anuncios).values({
      accountId: fb.id,
      externalId: 'AD_REEL',
      cuentaPublicitariaId: 'act_9',
      gasto: 1,
      desde: '2026-08-01',
      hasta: '2026-08-02',
    })

    // Otra vuelta, con más gasto: se reescribe, no se duplica.
    meta([anuncio('AD_REEL', '2500', { effective_instagram_media_id: reel.externalId })])
    await sincronizarAnuncios(owner)
    const filas = await (await db()).select().from(anuncios).where(eq(anuncios.accountId, ig.id))
    expect(filas).toHaveLength(3)
    const delReel = filas.find((f) => f.externalId === 'AD_REEL')!
    expect(delReel).toMatchObject({ postId: reel.id, gasto: 2500, moneda: 'CLP', desde: '2026-10-02', hasta: '2026-10-09' })
    expect(filas.find((f) => f.externalId === 'AD_FB')!.postId).toBe(postFb.id)
    expect(await (await db()).select().from(anuncios).where(eq(anuncios.accountId, fb.id))).toHaveLength(0)

    const octubre = await leerLoPagado(owner, '2026-10-01', '2026-10-31')
    expect(octubre.map((f) => f.externalId).sort()).toEqual(['AD_FB', 'AD_REEL'])
    expect(octubre.find((f) => f.externalId === 'AD_REEL')).toMatchObject({ gasto: 2500, postId: reel.id, caption: 'el reel' })
    expect((await leerLoPagado(owner, '2026-08-01', '2026-08-31')).map((f) => f.externalId)).toEqual(['AD_SUELTO'])
    expect(await leerLoPagado(otro, '2026-01-01', '2026-12-31')).toEqual([])
  })

  it('borrar la publicación deja el anuncio sin ella, y el borrado de Meta se lleva los anuncios', async () => {
    const { anuncios, socialPosts } = await esquema()
    const { borrarDatosDe } = await import('./meta-bajas')
    const owner = await dueno()
    const metaUser = `mu-${crypto.randomUUID()}`
    const ig = await cuenta(owner, 'instagram', metaUser)
    const reel = await publicacion(owner, ig.id, 'instagram', `IG_${crypto.randomUUID()}`)
    const [a] = await (await db())
      .insert(anuncios)
      .values({ accountId: ig.id, postId: reel.id, externalId: 'AD_X', cuentaPublicitariaId: 'act_9' })
      .returning()

    await (await db()).delete(socialPosts).where(eq(socialPosts.id, reel.id))
    expect((await (await db()).select().from(anuncios).where(eq(anuncios.id, a!.id)))[0]!.postId).toBeNull()

    expect((await borrarDatosDe(metaUser)).cuentas).toBe(1)
    expect(await (await db()).select().from(anuncios).where(eq(anuncios.id, a!.id))).toHaveLength(0)
  })
})
