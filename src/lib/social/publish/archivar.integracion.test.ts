import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Archivar lo quemado contra una Postgres de verdad: lo que importa —que solo se archive lo
// quemado, que repetirlo no haga nada, que el rearme lo devuelva a «Se quemó», que el resumen y
// el filtro de la API lo vean igual— lo decide el SQL, no la función.

vi.mock('server-only', () => ({}))
vi.mock('@/lib/social/publish/alert', () => ({ destinatario: vi.fn(), enviarAviso: vi.fn(async () => {}) }))
const { duenoDeLaLlave } = vi.hoisted(() => ({ duenoDeLaLlave: vi.fn<(r: Request) => Promise<string | null>>() }))
vi.mock('@/lib/llaves', () => ({ duenoDeLaLlave }))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let duenoId = ''
let otroId = ''
let instagram = ''
let facebook = ''
let ajena = ''

/** Un post del dueño con un destino por cuenta, cada uno con el estado que la prueba pida. */
async function post(
  destinos: Array<{ cuenta: string; red: string; status: string }>,
  ownerId = duenoId,
  scheduledAt = new Date(Date.now() - 3_600_000),
) {
  const { scheduledPosts, scheduledPostTargets } = await esquema()
  const [fila] = await (await db())
    .insert(scheduledPosts)
    .values({ ownerId, caption: 'hola', scheduledAt })
    .returning()
  const targets = await (await db())
    .insert(scheduledPostTargets)
    .values(
      destinos.map((d) => ({
        postId: fila!.id,
        network: d.red,
        accountId: d.cuenta,
        status: d.status as 'failed',
        lastError: d.status === 'failed' ? 'Instagram rechazó la publicación.' : null,
      })),
    )
    .returning()
  return { postId: fila!.id, targets }
}

async function leer(id: string) {
  const { scheduledPostTargets } = await esquema()
  const [fila] = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.id, id))
  return fila!
}

describe.skipIf(!URL_PRUEBAS)('archivar lo quemado, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_archivar')
    const { users, socialAccounts } = await esquema()
    const [dueno, otro] = await (await db())
      .insert(users)
      .values([{ correo: 'duena@ejemplo.cl' }, { correo: 'otro@ejemplo.cl' }])
      .returning()
    duenoId = dueno!.id
    otroId = otro!.id
    const cuentas = await (await db())
      .insert(socialAccounts)
      .values([
        { ownerId: duenoId, network: 'instagram', handle: '@duena', externalId: 'ig-1', accessToken: 'x' },
        { ownerId: duenoId, network: 'facebook', handle: 'Duena', externalId: 'fb-1', accessToken: 'x' },
        { ownerId: otroId, network: 'instagram', handle: '@otro', externalId: 'ig-2', accessToken: 'x' },
      ])
      .returning()
    instagram = cuentas[0]!.id
    facebook = cuentas[1]!.id
    ajena = cuentas[2]!.id
  }, 60_000)

  beforeEach(async () => {
    const { scheduledPosts } = await esquema()
    await (await db()).delete(scheduledPosts)
    duenoDeLaLlave.mockReset().mockResolvedValue(duenoId)
  })


  describe('archivarQuemados', () => {
    it('sin cuenta, archiva todos los quemados del post, y nada más', async () => {
      const { archivarQuemados } = await import('./archivar')
      const { postId, targets } = await post([
        { cuenta: instagram, red: 'instagram', status: 'failed' },
        { cuenta: facebook, red: 'facebook', status: 'published' },
      ])
      const antes = await leer(targets[0]!.id)

      expect(await archivarQuemados(duenoId, postId, { archivar: true })).toEqual({ cambiados: 1, postId })

      const quemado = await leer(targets[0]!.id)
      expect(quemado.archivadoEn).not.toBeNull()
      // Sigue quemado y con su error: archivar no cambia lo que pasó.
      expect(quemado.status).toBe('failed')
      expect(quemado.lastError).toBe('Instagram rechazó la publicación.')
      // Ni toca `updatedAt`, que es lo que comparan el reclamo del cron y las guardas del editor.
      expect(quemado.updatedAt.getTime()).toBe(antes.updatedAt.getTime())
      expect((await leer(targets[1]!.id)).archivadoEn).toBeNull()
    })

    it('con cuenta, solo ese destino', async () => {
      const { archivarQuemados } = await import('./archivar')
      const { postId, targets } = await post([
        { cuenta: instagram, red: 'instagram', status: 'failed' },
        { cuenta: facebook, red: 'facebook', status: 'failed' },
      ])
      expect(await archivarQuemados(duenoId, postId, { cuentaId: facebook, archivar: true })).toEqual({ cambiados: 1, postId })
      expect((await leer(targets[0]!.id)).archivadoEn).toBeNull()
      expect((await leer(targets[1]!.id)).archivadoEn).not.toBeNull()
    })

    it('repetirlo no hace nada, y conserva la hora del primero', async () => {
      const { archivarQuemados } = await import('./archivar')
      const { postId, targets } = await post([{ cuenta: instagram, red: 'instagram', status: 'failed' }])
      await archivarQuemados(duenoId, postId, { archivar: true, ahora: new Date('2026-10-22T10:00:00Z') })
      expect(await archivarQuemados(duenoId, postId, { archivar: true, ahora: new Date('2026-10-22T11:00:00Z') })).toEqual({
        cambiados: 0,
        postId,
      })
      expect((await leer(targets[0]!.id)).archivadoEn).toEqual(new Date('2026-10-22T10:00:00Z'))
    })

    it('desarchivar lo devuelve, y repetirlo tampoco hace nada', async () => {
      const { archivarQuemados } = await import('./archivar')
      const { postId, targets } = await post([{ cuenta: instagram, red: 'instagram', status: 'failed' }])
      await archivarQuemados(duenoId, postId, { archivar: true })
      expect(await archivarQuemados(duenoId, postId, { archivar: false })).toEqual({ cambiados: 1, postId })
      expect((await leer(targets[0]!.id)).archivadoEn).toBeNull()
      expect(await archivarQuemados(duenoId, postId, { archivar: false })).toEqual({ cambiados: 0, postId })
    })

    it('lo que no está quemado no se archiva, y dice por qué', async () => {
      const { archivarQuemados } = await import('./archivar')
      const sano = await post([{ cuenta: instagram, red: 'instagram', status: 'published' }])
      expect(await archivarQuemados(duenoId, sano.postId, { archivar: true })).toEqual({ falla: 'nada-quemado' })
      expect(await archivarQuemados(duenoId, sano.postId, { cuentaId: instagram, archivar: true })).toEqual({
        falla: 'no-quemado',
      })
      expect(await archivarQuemados(duenoId, sano.postId, { cuentaId: facebook, archivar: true })).toEqual({
        falla: 'sin-destino',
      })
      expect((await leer(sano.targets[0]!.id)).archivadoEn).toBeNull()
    })

    it('el post de otro dueño no existe, igual que uno que no existe', async () => {
      const { archivarQuemados } = await import('./archivar')
      const ajeno = await post([{ cuenta: ajena, red: 'instagram', status: 'failed' }], otroId)
      expect(await archivarQuemados(duenoId, ajeno.postId, { archivar: true })).toEqual({ falla: 'no-existe' })
      expect(await archivarQuemados(duenoId, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab', { archivar: true })).toEqual({
        falla: 'no-existe',
      })
      expect(await archivarQuemados(duenoId, 'no-es-un-id', { archivar: true })).toEqual({ falla: 'no-existe' })
      expect((await leer(ajeno.targets[0]!.id)).archivadoEn).toBeNull()
    })

    it('por id de destino, para el panel: el de otro dueño no existe', async () => {
      const { archivarDestino } = await import('./archivar')
      const propio = await post([{ cuenta: instagram, red: 'instagram', status: 'failed' }])
      const ajeno = await post([{ cuenta: ajena, red: 'instagram', status: 'failed' }], otroId)
      expect(await archivarDestino(duenoId, propio.targets[0]!.id, true)).toEqual({ cambiados: 1, postId: propio.postId })
      expect(await archivarDestino(duenoId, ajeno.targets[0]!.id, true)).toEqual({ falla: 'no-existe' })
    })
  })

  it('«Reprogramar» lo desarchiva: si se vuelve a quemar, vuelve a pedir una acción', async () => {
    const { archivarQuemados } = await import('./archivar')
    const { reprogramarDestino } = await import('./reprogramar')
    const { postId, targets } = await post([{ cuenta: instagram, red: 'instagram', status: 'failed' }])
    await archivarQuemados(duenoId, postId, { archivar: true })
    await reprogramarDestino(duenoId, targets[0]!.id, new Date(Date.now() + 86_400_000))
    const destino = await leer(targets[0]!.id)
    expect(destino.status).toBe('scheduled')
    expect(destino.archivadoEn).toBeNull()
  })

  it('«Se quemó» del panel y el resumen del día no cuentan lo archivado', async () => {
    const { archivarQuemados } = await import('./archivar')
    const { cortesQuemados } = await import('./cortes')
    const { quemados } = await import('@/lib/fuego')
    const { leerResumen } = await import('@/lib/avisos/run')
    const archivado = await post([{ cuenta: instagram, red: 'instagram', status: 'failed' }])
    const pendiente = await post([{ cuenta: facebook, red: 'facebook', status: 'failed' }])
    await archivarQuemados(duenoId, archivado.postId, { archivar: true })

    const cortes = await cortesQuemados(duenoId)
    expect(cortes.map((c) => c.post.id)).toEqual([pendiente.postId])
    expect(quemados(cortes).map((q) => q.destino.id)).toEqual([pendiente.targets[0]!.id])

    const resumen = await leerResumen(duenoId, new Date())
    expect(resumen.fallidos.map((f) => f.postId)).toEqual([pendiente.postId])
  })

  describe('la API', () => {
    it('GET /api/schedule/posts?estado=failed trae lo quemado de cualquier día, con su marca de archivado', async () => {
      const { archivarQuemados } = await import('./archivar')
      const { GET } = await import('@/app/api/schedule/posts/route')
      // De hace dos meses: fuera de la ventana por defecto (de hoy a 30 días), que con `estado` y
      // sin fechas no se aplica.
      const quemado = await post(
        [
          { cuenta: instagram, red: 'instagram', status: 'failed' },
          { cuenta: facebook, red: 'facebook', status: 'published' },
        ],
        duenoId,
        new Date(Date.now() - 60 * 86_400_000),
      )
      await post([{ cuenta: instagram, red: 'instagram', status: 'published' }])
      await archivarQuemados(duenoId, quemado.postId, { archivar: true })

      const respuesta = await GET(new Request('https://tu-parrilla.cl/api/schedule/posts?estado=failed'))
      expect(respuesta.status).toBe(200)
      const cuerpo = await respuesta.json()
      expect(cuerpo.desde).toBeNull()
      expect(cuerpo.hasta).toBeNull()
      expect(cuerpo.estado).toBe('failed')
      expect(cuerpo.posts.map((p: { id: string }) => p.id)).toEqual([quemado.postId])
      // Con todos sus destinos: el publicado viene también, sin archivar.
      const redes = cuerpo.posts[0].redes as Array<{ red: string; estado: string; archivado: boolean }>
      expect(redes.map((r) => [r.red, r.estado, r.archivado])).toEqual([
        ['facebook', 'published', false],
        ['instagram', 'failed', true],
      ])
    })

    it('un estado que no existe es 400', async () => {
      const { GET } = await import('@/app/api/schedule/posts/route')
      const respuesta = await GET(new Request('https://tu-parrilla.cl/api/schedule/posts?estado=quemado'))
      expect(respuesta.status).toBe(400)
    })

    it('POST …/archivar y …/desarchivar, con la llave del dueño', async () => {
      const archivar = await import('@/app/api/schedule/posts/[id]/archivar/route')
      const desarchivar = await import('@/app/api/schedule/posts/[id]/desarchivar/route')
      const { postId, targets } = await post([{ cuenta: instagram, red: 'instagram', status: 'failed' }])
      const pedido = () => new Request(`https://tu-parrilla.cl/api/schedule/posts/${postId}/archivar`, { method: 'POST' })
      const params = () => ({ params: Promise.resolve({ id: postId }) })

      const r1 = await archivar.POST(pedido(), params())
      expect(await r1.json()).toEqual({ ok: true, id: postId, archivados: 1 })
      expect((await leer(targets[0]!.id)).archivadoEn).not.toBeNull()

      const r2 = await desarchivar.POST(pedido(), params())
      expect(await r2.json()).toEqual({ ok: true, id: postId, desarchivados: 1 })
      expect((await leer(targets[0]!.id)).archivadoEn).toBeNull()

      // La llave de otro dueño no ve el post.
      duenoDeLaLlave.mockResolvedValue(otroId)
      const r3 = await archivar.POST(pedido(), params())
      expect(r3.status).toBe(404)
      expect((await leer(targets[0]!.id)).archivadoEn).toBeNull()
    })
  })
})
