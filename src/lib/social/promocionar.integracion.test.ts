import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'
import type { EntradaPromocion } from './promocionar'

// Promocionar contra una Postgres de verdad, con Meta doblada: el orden de lo que se crea, que la
// campaña nazca en pausa y se encienda solo si se pidió, que un rechazo a medio camino borre lo
// creado y no deje fila, que nada salga sin la confirmación, y que pausar y detener sean solo del
// dueño.

vi.mock('server-only', () => ({}))
vi.mock('./crypto', () => ({ decryptToken: (t: string) => t }))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const ZONA = 'America/Santiago'
const AHORA = new Date('2026-11-05T15:00:00Z')

type Llamada = { metodo: string; ruta: string; params: URLSearchParams }

/** Meta: una cuenta publicitaria en CLP con medio de pago, y lo que se le cree. `fallaEn` hace fallar ese paso. */
function meta(igExternalId: string, fallaEn?: string) {
  const llamadas: Llamada[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada: string | URL, init?: RequestInit) => {
      const url = new URL(String(entrada))
      const metodo = init?.method ?? 'GET'
      const params = metodo === 'GET' ? url.searchParams : new URLSearchParams(String(init?.body ?? ''))
      const ruta = url.pathname.replace('/v23.0/', '')
      llamadas.push({ metodo, ruta, params })
      if (fallaEn && ruta === fallaEn) {
        return Response.json(
          { error: { code: 100, message: 'Invalid', error_user_title: 'Presupuesto muy bajo', error_user_msg: 'Sube el presupuesto diario.' } },
          { status: 400 },
        )
      }
      if (ruta === 'me/adaccounts') {
        return Response.json({ data: [{ id: 'act_9', name: 'Mi cuenta', currency: 'CLP', account_status: 1, funding_source: 'f1', user_tasks: ['ADVERTISE'] }] })
      }
      if (ruta === 'act_9/minimum_budgets') return Response.json({ data: [{ min_daily_budget_imp: 1000 }] })
      if (ruta === 'me/accounts') return Response.json({ data: [{ id: 'PAGE', access_token: 'pt', instagram_business_account: { id: igExternalId } }] })
      if (ruta === 'act_9/campaigns') return Response.json({ id: 'CAMP' })
      if (ruta === 'act_9/adsets') return Response.json({ id: 'SET' })
      if (ruta === 'act_9/adcreatives') return Response.json({ id: 'CRE' })
      if (ruta === 'act_9/ads') return Response.json({ id: 'AD' })
      if (ruta === 'CAMP') return Response.json({ success: true })
      if (ruta === '') return Response.json({ AD: { effective_status: 'PENDING_REVIEW' } })
      return Response.json({ error: { code: 100, message: `sin respuesta para ${ruta}` } }, { status: 400 })
    }),
  )
  return llamadas
}

async function escena() {
  const { users, socialAccounts, socialPosts } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `d-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  const [otro] = await (await db()).insert(users).values({ correo: `o-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  const igId = `IGU_${crypto.randomUUID()}`
  const [ig] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId: u!.id, network: 'instagram', handle: '@juan', externalId: igId, accessToken: 'tok-ig' })
    .returning()
  const [post] = await (await db())
    .insert(socialPosts)
    .values({ ownerId: u!.id, accountId: ig!.id, network: 'instagram', externalId: `IGM_${crypto.randomUUID()}`, publishedAt: AHORA, campaign: `c-${crypto.randomUUID()}`, caption: 'el reel' })
    .returning()
  return { owner: u!.id, otro: otro!.id, igId, post: post! }
}

function entrada(extra: Partial<EntradaPromocion> = {}): EntradaPromocion {
  return {
    cuentaPublicitariaId: 'act_9',
    objetivo: 'alcance',
    tipoPresupuesto: 'diario',
    monto: 5000,
    desde: '2026-11-05',
    hasta: '2026-11-11',
    paises: ['CL'],
    edadMin: 18,
    edadMax: 65,
    advantage: false,
    categorias: true,
    activar: false,
    gastoConfirmado: 35000,
    ...extra,
  }
}

const posts = (ll: Llamada[]) => ll.filter((l) => l.metodo !== 'GET').map((l) => `${l.metodo} ${l.ruta}`)

describe.skipIf(!URL_PRUEBAS)('promocionar contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_promocionar')
  }, 60_000)

  afterEach(() => vi.unstubAllGlobals())

  it('en pausa: crea las cuatro piezas en orden, no la enciende, y la guarda', async () => {
    const { promociones } = await esquema()
    const { crearPromocion } = await import('./promocionar-meta')
    const { owner, igId, post } = await escena()
    const ll = meta(igId)

    const r = await crearPromocion({ ownerId: owner, postId: post.id, entrada: entrada(), zona: ZONA, enlace: null, ahora: AHORA })
    expect(r).toMatchObject({ estado: 'pausada' })
    expect(posts(ll)).toEqual(['POST act_9/campaigns', 'POST act_9/adsets', 'POST act_9/adcreatives', 'POST act_9/ads'])

    const campana = ll.find((l) => l.ruta === 'act_9/campaigns')!.params
    expect(campana.get('status')).toBe('PAUSED')
    expect(campana.get('special_ad_categories')).toBe('[]')
    expect(campana.get('locale')).toBe('es_LA')
    const conjunto = ll.find((l) => l.ruta === 'act_9/adsets')!.params
    expect(conjunto.get('daily_budget')).toBe('5000')
    expect(JSON.parse(conjunto.get('targeting')!)).toMatchObject({ geo_locations: { countries: ['CL'] }, publisher_platforms: ['instagram'] })
    const creativo = ll.find((l) => l.ruta === 'act_9/adcreatives')!.params
    expect([creativo.get('object_id'), creativo.get('instagram_user_id'), creativo.get('source_instagram_media_id')]).toEqual(['PAGE', igId, post.externalId])

    const [fila] = await (await db()).select().from(promociones).where(eq(promociones.postId, post.id))
    expect(fila).toMatchObject({ campanaId: 'CAMP', anuncioId: 'AD', estado: 'pausada', presupuesto: 5000, gastoMaximo: 35000, moneda: 'CLP' })
  })

  it('activa: la enciende al final, después de crear el anuncio', async () => {
    const { crearPromocion } = await import('./promocionar-meta')
    const { owner, igId, post } = await escena()
    const ll = meta(igId)
    const r = await crearPromocion({ ownerId: owner, postId: post.id, entrada: entrada({ activar: true }), zona: ZONA, enlace: null, ahora: AHORA })
    expect(r).toMatchObject({ estado: 'activa' })
    expect(posts(ll).at(-1)).toBe('POST CAMP')
    expect(ll.at(-1)!.params.get('status')).toBe('ACTIVE')
  })

  it('si Meta rechaza a medio camino, dice su frase, borra la campaña y no deja fila', async () => {
    const { promociones } = await esquema()
    const { crearPromocion } = await import('./promocionar-meta')
    const { owner, igId, post } = await escena()
    const ll = meta(igId, 'act_9/adsets')
    const r = await crearPromocion({ ownerId: owner, postId: post.id, entrada: entrada(), zona: ZONA, enlace: null, ahora: AHORA })
    expect(r).toEqual({ error: 'Meta no lo aceptó: Presupuesto muy bajo: Sube el presupuesto diario.' })
    expect(posts(ll)).toEqual(['POST act_9/campaigns', 'POST act_9/adsets', 'DELETE CAMP'])
    expect(await (await db()).select().from(promociones).where(eq(promociones.postId, post.id))).toHaveLength(0)
  })

  it('sin la confirmación, o con otro gasto máximo, no le pide nada a Meta que cueste', async () => {
    const { crearPromocion } = await import('./promocionar-meta')
    const { owner, igId, post } = await escena()
    const ll = meta(igId)
    expect(await crearPromocion({ ownerId: owner, postId: post.id, entrada: entrada({ categorias: false }), zona: ZONA, enlace: null, ahora: AHORA })).toHaveProperty('error')
    expect(await crearPromocion({ ownerId: owner, postId: post.id, entrada: entrada({ gastoConfirmado: 5000 }), zona: ZONA, enlace: null, ahora: AHORA })).toHaveProperty('error')
    expect(posts(ll)).toEqual([])
  })

  it('una publicación de otro dueño no se promociona', async () => {
    const { crearPromocion } = await import('./promocionar-meta')
    const { otro, igId, post } = await escena()
    const ll = meta(igId)
    expect(await crearPromocion({ ownerId: otro, postId: post.id, entrada: entrada(), zona: ZONA, enlace: null, ahora: AHORA })).toEqual({
      error: 'Esa publicación no está entre las tuyas de Instagram o Facebook.',
    })
    expect(ll).toHaveLength(0)
  })

  it('pausar, detener y leer cómo va: solo el dueño, y detenida no tiene vuelta', async () => {
    const { promociones } = await esquema()
    const { cambiarPromocion, crearPromocion, promocionesDe } = await import('./promocionar-meta')
    const { owner, otro, igId, post } = await escena()
    let ll = meta(igId)
    const r = await crearPromocion({ ownerId: owner, postId: post.id, entrada: entrada({ activar: true }), zona: ZONA, enlace: null, ahora: AHORA })
    if ('error' in r) throw new Error(r.error)

    const [viva] = await promocionesDe(owner, [post.id])
    expect(viva).toMatchObject({ id: r.id, efectivo: 'PENDING_REVIEW', caption: 'el reel' })
    expect(await promocionesDe(otro)).toEqual([])

    expect(await cambiarPromocion(otro, r.id, 'pausar')).toEqual({ error: 'Esa promoción no está entre las tuyas.' })
    ll = meta(igId)
    expect(await cambiarPromocion(owner, r.id, 'pausar')).toEqual({})
    expect(ll.at(-1)).toMatchObject({ metodo: 'POST', ruta: 'CAMP' })
    expect(ll.at(-1)!.params.get('status')).toBe('PAUSED')
    expect(await cambiarPromocion(owner, r.id, 'detener')).toEqual({})
    expect(ll.at(-1)!.params.get('status')).toBe('ARCHIVED')
    expect((await (await db()).select().from(promociones).where(eq(promociones.id, r.id)))[0]!.estado).toBe('detenida')
    expect(await cambiarPromocion(owner, r.id, 'reanudar')).toEqual({ error: 'Esa promoción ya está detenida.' })
  })
})
