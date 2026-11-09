import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Los planes contra una Postgres de verdad: que la migración siembre los dos, que los topes cuenten
// solo lo del dueño y frenen en el número justo, que una cortesía suba los topes y al vencer los
// baje sola, y que los tokens se sumen por mes y corten la llamada siguiente.

vi.mock('server-only', () => ({}))
vi.stubEnv('AUTH_SECRET', 'secreto-de-prueba-con-largo-suficiente')

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { leerPlanes, planDe, darCortesia, pasarAlGratis, guardarPlan } = await import('./planes')
const { TopeDelPlan } = await import('./topes')
const { SinTokens, conTokens } = await import('./tokens')
const { crearVariosProgramados } = await import('@/lib/social/publish/crear')
const { guardarCuenta } = await import('@/lib/social/conectar')

async function persona(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  return u!.id
}

async function cuentaConectada(ownerId: string) {
  const { socialAccounts } = await esquema()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId, network: 'facebook', externalId: crypto.randomUUID(), handle: 'pagina', accessToken: 'cifrado' })
    .returning()
  return { id: c!.id, network: c!.network, handle: c!.handle }
}

const enUnaHora = () => new Date(Date.now() + 3_600_000)
const post = (cuentas: { id: string; network: string; handle: string | null }[]) => ({
  caption: 'Un asado',
  scheduledAt: enUnaHora(),
  media: [],
  cuentas,
})

const conectar = (ownerId: string, externalId = crypto.randomUUID()) =>
  guardarCuenta(ownerId, 'tiktok', { externalId, handle: '@c', accessToken: 't', refreshToken: null, expiresAt: null })

describe.skipIf(!URL_PRUEBAS)('los planes, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_planes')
  }, 60_000)

  it('la migración siembra los dos planes, y toda persona nace en el gratis', async () => {
    const planes = await leerPlanes()
    expect(planes.gratis).toMatchObject({ nombre: 'Gratis', precioClp: 0, cuentasMax: 7, enLaParrillaMax: 50, prioridad: 0 })
    expect(planes.pagado).toMatchObject({ nombre: 'Maestro Parrillero', precioClp: 34990, diasDePrueba: 7, enLaParrillaMax: null, prioridad: 1 })
    const ana = await persona()
    expect((await planDe(ana)).plan.clave).toBe('gratis')
  })

  it('en la parrilla: las del tope esperando entran, la siguiente no; una que sale a dos redes es una', async () => {
    const tope = (await leerPlanes()).gratis.enLaParrillaMax!
    const ana = await persona()
    const [a, b] = [await cuentaConectada(ana), await cuentaConectada(ana)]
    await crearVariosProgramados(ana, [post([a, b])], null)
    for (let i = 1; i < tope; i++) await crearVariosProgramados(ana, [post([a])], null)
    await expect(crearVariosProgramados(ana, [post([a])], null)).rejects.toBeInstanceOf(TopeDelPlan)
    // Una secuencia entera tampoco entra a medias.
    await expect(crearVariosProgramados(ana, [post([a]), post([a])], null)).rejects.toThrow(
      `Tu plan Gratis deja hasta ${tope} publicaciones esperando a la vez`,
    )
  })

  it('en la parrilla: lo publicado no cuenta, y lo de otro dueño tampoco', async () => {
    const { scheduledPostTargets } = await esquema()
    const [ana, bea] = [await persona(), await persona()]
    const [deAna, deBea] = [await cuentaConectada(ana), await cuentaConectada(bea)]
    const tope = (await leerPlanes()).gratis.enLaParrillaMax!
    for (let i = 0; i < tope; i++) await crearVariosProgramados(bea, [post([deBea])], null)
    const ids = []
    for (let i = 0; i < tope; i++) ids.push(...(await crearVariosProgramados(ana, [post([deAna])], null)))
    // Sale una: deja lugar a otra.
    await (await db()).update(scheduledPostTargets).set({ status: 'published' }).where(eq(scheduledPostTargets.postId, ids[0]!))
    await expect(crearVariosProgramados(ana, [post([deAna])], null)).resolves.toHaveLength(1)
  })

  it('las cuentas: las del tope conectadas entran, la siguiente no; renovar una conectada no suma', async () => {
    const tope = (await leerPlanes()).gratis.cuentasMax!
    const ana = await persona()
    const primera = crypto.randomUUID()
    await conectar(ana, primera)
    for (let i = 1; i < tope; i++) await conectar(ana)
    await expect(conectar(ana)).rejects.toBeInstanceOf(TopeDelPlan)
    await expect(conectar(ana, primera)).resolves.toBe('renovada')
  })

  it('las cuentas: reconectar una propia desconectada vuelve a sumar', async () => {
    const { socialAccounts } = await esquema()
    const tope = (await leerPlanes()).gratis.cuentasMax!
    const ana = await persona()
    const primera = crypto.randomUUID()
    await conectar(ana, primera)
    for (let i = 1; i < tope; i++) await conectar(ana)
    await (await db()).update(socialAccounts).set({ accessToken: null }).where(eq(socialAccounts.externalId, primera))
    await conectar(ana) // quedó lugar: entra otra
    await expect(conectar(ana, primera)).rejects.toBeInstanceOf(TopeDelPlan)
  })

  it('una cortesía sube los topes, y al vencer vuelve sola al gratis', async () => {
    const ana = await persona()
    for (let i = 0; i < (await leerPlanes()).gratis.cuentasMax!; i++) await conectar(ana)
    await darCortesia(ana, null)
    expect((await planDe(ana)).plan.clave).toBe('pagado')
    await expect(conectar(ana)).resolves.toBe('nueva')

    await darCortesia(ana, new Date(Date.now() - 1000))
    const vencida = await planDe(ana)
    expect(vencida.plan.clave).toBe('gratis')
    expect(vencida.persona).toMatchObject({ plan: 'pagado', planOrigen: 'cortesia' })
    // Nada se desconecta al bajar: solo no entra otra.
    await expect(conectar(ana)).rejects.toBeInstanceOf(TopeDelPlan)

    await pasarAlGratis(ana)
    expect((await planDe(ana)).persona).toMatchObject({ plan: 'gratis', planHasta: null, planOrigen: null })
  })

  it('los tokens se suman por mes y cortan la llamada siguiente al llegar al tope', async () => {
    const planes = await leerPlanes()
    await guardarPlan('gratis', { ...planes.gratis, tokensMes: 1000 })
    try {
      const ana = await persona()
      const ahora = new Date('2026-11-08T12:00:00Z')
      const llamar = vi.fn(async () => ({ valor: 'hola', tokens: 600 }))
      await expect(conTokens(ana, llamar, ahora)).resolves.toBe('hola')
      await expect(conTokens(ana, llamar, ahora)).resolves.toBe('hola') // 600 < 1000: todavía entra
      await expect(conTokens(ana, llamar, ahora)).rejects.toBeInstanceOf(SinTokens)
      expect(llamar).toHaveBeenCalledTimes(2)
      // El mes siguiente parte de cero.
      await expect(conTokens(ana, llamar, new Date('2026-12-08T12:00:00Z'))).resolves.toBe('hola')
    } finally {
      await guardarPlan('gratis', planes.gratis)
    }
  })
})
