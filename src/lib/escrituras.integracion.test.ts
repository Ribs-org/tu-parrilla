import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Las escrituras que van en una transacción y las lecturas acotadas, contra una Postgres de
// verdad. Que una transacción revierta, que un `FOR UPDATE` haga esperar al otro, que un
// arreglo viaje en un solo parámetro y que una ventana de fechas traiga lo que tiene que traer
// son cosas de la base: un doble del cliente no las puede probar.

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('next/navigation', () => ({
  redirect: (destino: string) => {
    throw Object.assign(new Error('redirect'), { destino })
  },
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
  headers: async () => new Headers(),
}))
const sesion = vi.hoisted(() => ({ usuario: { id: '', rol: 'usuario', zona: 'America/Santiago' } }))
vi.mock('@/lib/auth', () => ({
  requireUser: async () => sesion.usuario,
  requireAdmin: async () => sesion.usuario,
  destroySession: async () => {},
}))
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => sesion.usuario }))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const HORA = 60 * 60_000

/** Un dueño nuevo: cada prueba trabaja con lo suyo. */
async function dueno(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `d-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  return u!.id
}

async function cuenta(ownerId: string, network = 'instagram', metaUserId: string | null = null) {
  const { socialAccounts } = await esquema()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId, network, handle: '@prueba', externalId: crypto.randomUUID(), accessToken: 'x', metaUserId })
    .returning()
  return c!
}

async function post(ownerId: string, scheduledAt: Date, destinos: Array<{ accountId: string; network: string; status?: 'scheduled' | 'publishing' | 'published' | 'failed' }>) {
  const { scheduledPosts, scheduledPostTargets } = await esquema()
  const [p] = await (await db()).insert(scheduledPosts).values({ ownerId, caption: 'hola', scheduledAt }).returning()
  for (const d of destinos) {
    await (await db()).insert(scheduledPostTargets).values({ postId: p!.id, ...d })
  }
  return p!
}

async function pagina(ownerId: string) {
  const { profiles } = await esquema()
  const [p] = await (await db())
    .insert(profiles)
    .values({ ownerId, slug: `p-${crypto.randomUUID()}`, displayName: 'Página' })
    .returning()
  return p!
}

describe.skipIf(!URL_PRUEBAS)('escrituras y lecturas contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_escrituras')
  }, 60_000)

  describe('crearPostProgramado', () => {
    it('si una inserción falla no queda nada: ni el post a medias ni el borrador consumido', async () => {
      const { borradores, scheduledPosts } = await esquema()
      const { crearPostProgramado } = await import('@/lib/social/publish/crear')
      const owner = await dueno()
      const [borrador] = await (await db()).insert(borradores).values({ ownerId: owner }).returning()

      await expect(
        crearPostProgramado(owner, {
          caption: 'hola',
          scheduledAt: new Date(Date.now() + HORA),
          media: [],
          // Una cuenta que no existe: la base rechaza el destino, después de que el post y el
          // borrador ya se escribieron dentro de la transacción.
          cuentas: [{ id: crypto.randomUUID(), network: 'instagram', handle: null }],
          borradorId: borrador!.id,
        }),
      ).rejects.toThrow()

      expect(await (await db()).select().from(scheduledPosts).where(eq(scheduledPosts.ownerId, owner))).toHaveLength(0)
      expect(await (await db()).select().from(borradores).where(eq(borradores.id, borrador!.id))).toHaveLength(1)
    })

    it('dos envíos del mismo borrador a la vez: sale un solo post', async () => {
      const { borradores, scheduledPosts } = await esquema()
      const { crearPostProgramado, BorradorConsumido } = await import('@/lib/social/publish/crear')
      const owner = await dueno()
      const ig = await cuenta(owner)
      const [borrador] = await (await db()).insert(borradores).values({ ownerId: owner }).returning()
      const envio = () =>
        crearPostProgramado(owner, {
          caption: 'hola',
          scheduledAt: new Date(Date.now() + HORA),
          media: [],
          cuentas: [{ id: ig.id, network: 'instagram', handle: '@prueba' }],
          borradorId: borrador!.id,
        })

      const resultados = await Promise.allSettled([envio(), envio()])

      expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
      const rechazado = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult
      expect(rechazado.reason).toBeInstanceOf(BorradorConsumido)
      expect(await (await db()).select().from(scheduledPosts).where(eq(scheduledPosts.ownerId, owner))).toHaveLength(1)
    })
  })

  describe('reprogramarDestino', () => {
    it('si el destino ya no está quemado, la hora del post no se mueve', async () => {
      const { scheduledPosts, scheduledPostTargets } = await esquema()
      const { reprogramarDestino } = await import('@/lib/social/publish/reprogramar')
      const owner = await dueno()
      const ig = await cuenta(owner)
      const hora = new Date(Date.now() - HORA)
      const p = await post(owner, hora, [{ accountId: ig.id, network: 'instagram', status: 'published' }])
      const [destino] = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.postId, p.id))

      expect(await reprogramarDestino(owner, destino!.id, new Date(Date.now() + 24 * HORA))).toBe('reprogramado')

      const [despues] = await (await db()).select().from(scheduledPosts).where(eq(scheduledPosts.id, p.id))
      expect(despues!.scheduledAt.getTime()).toBe(hora.getTime())
      const [destinoDespues] = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.id, destino!.id))
      expect(destinoDespues!.status).toBe('published')
    })
  })

  describe('las acciones del panel', () => {
    it('deleteProfile: dos borrados a la vez de las dos últimas páginas dejan una', async () => {
      const { profiles } = await esquema()
      const { deleteProfile } = await import('@/app/admin/actions')
      const owner = await dueno()
      const una = await pagina(owner)
      const otra = await pagina(owner)
      sesion.usuario = { id: owner, rol: 'usuario', zona: 'America/Santiago' }

      const resultados = await Promise.allSettled([deleteProfile(una.id), deleteProfile(otra.id)])

      expect(await (await db()).select().from(profiles).where(eq(profiles.ownerId, owner))).toHaveLength(1)
      // Uno borró y redirigió; el otro esperó al primero, vio una sola página y se negó.
      expect(resultados.filter((r) => r.status === 'rejected')).toHaveLength(1)
      const negado = resultados.find((r) => r.status === 'fulfilled') as PromiseFulfilledResult<{ error?: string }>
      expect(negado.value.error).toMatch(/única página/)
    })

    it('reorderLinks: el orden entero en una sentencia, sin tocar los enlaces de otro dueño', async () => {
      const { links } = await esquema()
      const { reorderLinks } = await import('@/app/admin/actions')
      const owner = await dueno()
      const ajeno = await dueno()
      const pa = await pagina(owner)
      const pb = await pagina(ajeno)
      const nuevo = async (profileId: string, position: number) =>
        (await (await db()).insert(links).values({ profileId, label: 'x', url: 'https://ejemplo.cl', position }).returning())[0]!
      const l1 = await nuevo(pa.id, 0)
      const l2 = await nuevo(pa.id, 1)
      const l3 = await nuevo(pa.id, 2)
      const deOtro = await nuevo(pb.id, 0)
      sesion.usuario = { id: owner, rol: 'usuario', zona: 'America/Santiago' }

      await reorderLinks(pa.id, [l3.id, l1.id, 'no-es-uuid', l2.id, deOtro.id])

      const posicion = async (id: string) =>
        (await (await db()).select({ position: links.position }).from(links).where(eq(links.id, id)))[0]!.position
      expect([await posicion(l3.id), await posicion(l1.id), await posicion(l2.id)]).toEqual([0, 1, 2])
      expect(await posicion(deOtro.id)).toBe(0)
    })
  })

  describe('borrarDatosDe (la baja de Meta)', () => {
    it('se lleva lo de Meta, deja lo demás, y borra los cortes que quedaron sin destinos', async () => {
      const { postMetrics, scheduledPosts, scheduledPostTargets, socialAccounts, socialPosts, solicitudesBorrado } =
        await esquema()
      const { borrarDatosDe } = await import('@/lib/social/meta-bajas')
      const owner = await dueno()
      const metaUser = `mu-${crypto.randomUUID()}`
      const ig = await cuenta(owner, 'instagram', metaUser)
      const yt = await cuenta(owner, 'youtube')
      const [publicado] = await (await db())
        .insert(socialPosts)
        .values({
          ownerId: owner,
          accountId: ig.id,
          network: 'instagram',
          externalId: crypto.randomUUID(),
          publishedAt: new Date(Date.now() - 48 * HORA),
          campaign: `c-${crypto.randomUUID()}`,
        })
        .returning()
      await (await db()).insert(postMetrics).values({ postId: publicado!.id, day: '2026-10-19', views: 10 })
      const solo = await post(owner, new Date(Date.now() + HORA), [{ accountId: ig.id, network: 'instagram' }])
      const doble = await post(owner, new Date(Date.now() + HORA), [
        { accountId: ig.id, network: 'instagram' },
        { accountId: yt.id, network: 'youtube' },
      ])

      expect((await borrarDatosDe(metaUser)).cuentas).toBe(1)

      expect(await (await db()).select().from(socialAccounts).where(eq(socialAccounts.id, ig.id))).toHaveLength(0)
      expect(await (await db()).select().from(socialAccounts).where(eq(socialAccounts.id, yt.id))).toHaveLength(1)
      expect(await (await db()).select().from(socialPosts).where(eq(socialPosts.id, publicado!.id))).toHaveLength(0)
      expect(await (await db()).select().from(scheduledPosts).where(eq(scheduledPosts.id, solo.id))).toHaveLength(0)
      const quedan = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.postId, doble.id))
      expect(quedan.map((t) => t.network)).toEqual(['youtube'])
      expect(await (await db()).select().from(solicitudesBorrado).where(eq(solicitudesBorrado.metaUserId, metaUser))).toHaveLength(1)
    })
  })

  describe('las lecturas de La Parrilla', () => {
    it('la ventana trae lo suyo con su media; lo quemado, de cuando sea; lo que viene, solo con destinos', async () => {
      const { scheduledPostMedia } = await esquema()
      const { cortesEntre, cortesQuemados, horasPorVenir } = await import('@/lib/social/publish/cortes')
      const owner = await dueno()
      const ig = await cuenta(owner)
      const ahora = new Date()
      const viejo = await post(owner, new Date(ahora.getTime() - 30 * 24 * HORA), [
        { accountId: ig.id, network: 'instagram', status: 'failed' },
      ])
      const deLaSemana = await post(owner, new Date(ahora.getTime() + HORA), [{ accountId: ig.id, network: 'instagram' }])
      await (await db())
        .insert(scheduledPostMedia)
        .values({ postId: deLaSemana.id, blobUrl: 'https://cdn.ejemplo.cl/scheduled/a.jpg', mediaType: 'image', position: 0 })
      const lejano = await post(owner, new Date(ahora.getTime() + 10 * 24 * HORA), [{ accountId: ig.id, network: 'instagram' }])
      await post(owner, new Date(ahora.getTime() + 2 * HORA), [])

      const semana = await cortesEntre(owner, new Date(ahora.getTime() - 24 * HORA), new Date(ahora.getTime() + 2 * 24 * HORA))
      expect(semana.map((c) => c.post.id)).toEqual([deLaSemana.id])
      expect(semana[0]!.media).toHaveLength(1)

      const quemados = await cortesQuemados(owner)
      expect(quemados.map((c) => c.post.id)).toEqual([viejo.id])
      expect(quemados[0]!.targets.map((t) => t.status)).toEqual(['failed'])

      const horas = await horasPorVenir(owner, ahora)
      expect(horas.map((h) => h.scheduledAt.getTime()).sort()).toEqual(
        [deLaSemana.scheduledAt.getTime(), lejano.scheduledAt.getTime()].sort(),
      )
    })
  })

  describe('getPostSeries', () => {
    it('las visitas de una campaña cuentan solo en las páginas del dueño', async () => {
      const { socialPosts, visits } = await esquema()
      const { getPostSeries } = await import('@/lib/posts')
      const owner = await dueno()
      const ajeno = await dueno()
      const suya = await pagina(owner)
      const deOtro = await pagina(ajeno)
      const ig = await cuenta(owner)
      const campana = `c-${crypto.randomUUID()}`
      await (await db()).insert(socialPosts).values({
        ownerId: owner,
        accountId: ig.id,
        network: 'instagram',
        externalId: crypto.randomUUID(),
        publishedAt: new Date(Date.now() - 48 * HORA),
        campaign: campana,
      })
      const ayer = new Date(Date.now() - 24 * HORA)
      await (await db()).insert(visits).values([
        { profileId: suya.id, visitorHash: 'v1', campaign: campana, createdAt: ayer },
        // La misma campaña pegada en la página de otro dueño: no es tráfico de esta publicación.
        { profileId: deOtro.id, visitorHash: 'v2', campaign: campana, createdAt: ayer },
      ])

      const puntos = await getPostSeries({
        ownerId: owner,
        profileId: null,
        from: new Date(Date.now() - 3 * 24 * HORA),
        to: new Date(),
        includeBots: true,
        zone: 'America/Santiago',
      })

      expect(puntos.reduce((total, punto) => total + punto.visits, 0)).toBe(1)
    })
  })
})
