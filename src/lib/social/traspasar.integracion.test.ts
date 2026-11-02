import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El traspaso contra una Postgres de verdad: que cada fila termine con el dueño que corresponde,
// que la `ref` no choque y que devolver la cuenta la deje como estaba son cosas de la base.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { listarCuentasTraspasables, traspasarCuenta, DESTINO_NO_ESTA, YA_ES_SUYA } = await import('./traspasar')
const { CUENTA_NO_ESTA } = await import('./quitar')

async function persona(): Promise<{ id: string; correo: string }> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  return { id: u!.id, correo: u!.correo }
}

async function cuenta(ownerId: string, handle = '@prueba') {
  const { socialAccounts } = await esquema()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({ ownerId, network: 'instagram', handle, externalId: crypto.randomUUID(), accessToken: 'token' })
    .returning()
  return c!
}

async function publicacion(ownerId: string, accountId: string) {
  const { socialPosts } = await esquema()
  const [p] = await (await db())
    .insert(socialPosts)
    .values({ ownerId, accountId, network: 'instagram', campaign: crypto.randomUUID(), externalId: crypto.randomUUID(), publishedAt: new Date() })
    .returning()
  return p!
}

async function corte(ownerId: string, destinos: string[], ref: string | null = null) {
  const { scheduledPosts, scheduledPostTargets } = await esquema()
  const [p] = await (await db())
    .insert(scheduledPosts)
    .values({ ownerId, caption: 'hola', scheduledAt: new Date(), ref })
    .returning()
  for (const accountId of destinos) {
    await (await db()).insert(scheduledPostTargets).values({ postId: p!.id, accountId, network: 'instagram' })
  }
  return p!
}

async function comentario(accountId: string) {
  const { postComments } = await esquema()
  const [c] = await (await db())
    .insert(postComments)
    .values({
      accountId,
      network: 'instagram',
      postExternalId: 'post',
      externalId: crypto.randomUUID(),
      text: 'GUIA',
      publishedAt: new Date(),
    })
    .returning()
  return c!
}

async function duenoDe(tabla: 'cuenta' | 'publicacion' | 'corte', id: string) {
  const { scheduledPosts, socialAccounts, socialPosts } = await esquema()
  const t = { cuenta: socialAccounts, publicacion: socialPosts, corte: scheduledPosts }[tabla]
  const [fila] = await (await db()).select({ ownerId: t.ownerId }).from(t).where(eq(t.id, id))
  return fila?.ownerId
}

describe.skipIf(!URL_PRUEBAS)('traspasar una cuenta, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_traspasar')
  }, 60_000)

  it('la cuenta se lleva sus publicaciones, sus comentarios y los cortes que salen solo a ella', async () => {
    const [ana, bea] = [await persona(), await persona()]
    const c = await cuenta(ana.id)
    const pub = await publicacion(ana.id, c.id)
    const solo = await corte(ana.id, [c.id])
    const com = await comentario(c.id)

    expect(await traspasarCuenta(c.id, bea.id)).toEqual({ nombre: '@prueba', correo: bea.correo })

    expect(await duenoDe('cuenta', c.id)).toBe(bea.id)
    expect(await duenoDe('publicacion', pub.id)).toBe(bea.id)
    expect(await duenoDe('corte', solo.id)).toBe(bea.id)
    const { postComments, socialAccounts } = await esquema()
    const [sigue] = await (await db()).select().from(postComments).where(eq(postComments.id, com.id))
    expect(sigue?.accountId).toBe(c.id)
    const [conectada] = await (await db()).select().from(socialAccounts).where(eq(socialAccounts.id, c.id))
    expect(conectada?.accessToken).toBe('token')
  })

  it('un corte que sale también a otra cuenta se queda con quien lo programó, con sus dos destinos', async () => {
    const [ana, bea] = [await persona(), await persona()]
    const [c, otra] = [await cuenta(ana.id), await cuenta(ana.id, '@otra')]
    const compartido = await corte(ana.id, [c.id, otra.id])

    await traspasarCuenta(c.id, bea.id)

    expect(await duenoDe('corte', compartido.id)).toBe(ana.id)
    expect(await duenoDe('cuenta', otra.id)).toBe(ana.id)
    const { scheduledPostTargets } = await esquema()
    const destinos = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.postId, compartido.id))
    expect(destinos.map((d) => d.accountId).sort()).toEqual([c.id, otra.id].sort())
  })

  it('no toca lo que no es de la cuenta', async () => {
    const [ana, bea] = [await persona(), await persona()]
    const [c, otra] = [await cuenta(ana.id), await cuenta(ana.id, '@otra')]
    const ajena = await publicacion(ana.id, otra.id)
    const corteAjeno = await corte(ana.id, [otra.id])

    await traspasarCuenta(c.id, bea.id)

    expect(await duenoDe('publicacion', ajena.id)).toBe(ana.id)
    expect(await duenoDe('corte', corteAjeno.id)).toBe(ana.id)
  })

  it('una `ref` que quien recibe ya usó se borra en el corte que llega, y el traspaso sale igual', async () => {
    const [ana, bea] = [await persona(), await persona()]
    const c = await cuenta(ana.id)
    const llega = await corte(ana.id, [c.id], 'lote-1')
    const libre = await corte(ana.id, [c.id], 'lote-2')
    const suyo = await corte(bea.id, [(await cuenta(bea.id, '@bea')).id], 'lote-1')

    expect(await traspasarCuenta(c.id, bea.id)).toMatchObject({ correo: bea.correo })

    const { scheduledPosts } = await esquema()
    const ref = async (id: string) =>
      (await (await db()).select({ ref: scheduledPosts.ref }).from(scheduledPosts).where(eq(scheduledPosts.id, id)))[0]?.ref
    expect(await ref(llega.id)).toBeNull()
    expect(await ref(libre.id)).toBe('lote-2')
    expect(await ref(suyo.id)).toBe('lote-1')
  })

  it('se devuelve con otro traspaso, y todo vuelve a quien la tenía', async () => {
    const [ana, bea] = [await persona(), await persona()]
    const c = await cuenta(ana.id)
    const pub = await publicacion(ana.id, c.id)
    const solo = await corte(ana.id, [c.id])

    await traspasarCuenta(c.id, bea.id)
    await traspasarCuenta(c.id, ana.id)

    expect(await duenoDe('cuenta', c.id)).toBe(ana.id)
    expect(await duenoDe('publicacion', pub.id)).toBe(ana.id)
    expect(await duenoDe('corte', solo.id)).toBe(ana.id)
  })

  it('dice por qué no se pudo, y no cambia nada', async () => {
    const ana = await persona()
    const c = await cuenta(ana.id)

    expect(await traspasarCuenta(c.id, ana.id)).toEqual({ error: YA_ES_SUYA })
    expect(await traspasarCuenta(c.id, crypto.randomUUID())).toEqual({ error: DESTINO_NO_ESTA })
    expect(await traspasarCuenta(crypto.randomUUID(), ana.id)).toEqual({ error: CUENTA_NO_ESTA })
    expect(await duenoDe('cuenta', c.id)).toBe(ana.id)
  })

  it('la lista cuenta lo que se lleva cada cuenta y lo que tiene por salir', async () => {
    const ana = await persona()
    const c = await cuenta(ana.id, '@lista')
    await publicacion(ana.id, c.id)
    await corte(ana.id, [c.id])

    const fila = (await listarCuentasTraspasables()).find((f) => f.id === c.id)

    expect(fila).toMatchObject({ nombre: '@lista', dueno: ana.correo, duenoId: ana.id, publicaciones: 1, porSalir: 1 })
  })
})
