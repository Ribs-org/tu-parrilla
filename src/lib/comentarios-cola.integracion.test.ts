import { beforeAll, describe, expect, it, vi } from 'vitest'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El aviso de La Mesa contra una Postgres de verdad: las subconsultas que cuentan lo que llegó
// y la última lectura del sync, y que cada dueño vea solo lo suyo, son cosas de la base.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { getComentariosQueFaltan } = await import('./comentarios-cola')

const AHORA = new Date('2026-11-07T15:00:00Z')
const HACE = (horas: number) => new Date(AHORA.getTime() - horas * 3600_000)

async function persona(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl` }).returning()
  return u!.id
}

async function cuenta(ownerId: string, opciones: { network?: string; conectada?: boolean } = {}) {
  const { socialAccounts } = await esquema()
  const [c] = await (await db())
    .insert(socialAccounts)
    .values({
      ownerId,
      network: opciones.network ?? 'instagram',
      handle: '@prueba',
      externalId: crypto.randomUUID(),
      accessToken: opciones.conectada === false ? null : 'token',
    })
    .returning()
  return c!
}

/** Una publicación con lo que Instagram cuenta y los comentarios que llegaron (y cuántos respondió la dueña). */
async function publicacion(
  cuentaDe: { id: string; ownerId: string | null; network: string },
  o: { contados: number | null; llegaron: number; respondidos?: number; publicadaHace?: number; leidaHace?: number },
) {
  const { socialPosts, postMetrics, postComments } = await esquema()
  const [p] = await (await db())
    .insert(socialPosts)
    .values({
      ownerId: cuentaDe.ownerId,
      accountId: cuentaDe.id,
      network: cuentaDe.network,
      campaign: crypto.randomUUID(),
      externalId: crypto.randomUUID(),
      caption: 'Comenta GUIA y te la mando',
      publishedAt: HACE(o.publicadaHace ?? 24),
    })
    .returning()
  await (await db())
    .insert(postMetrics)
    .values({ postId: p!.id, day: '2026-11-07', comments: o.contados, capturedAt: HACE(o.leidaHace ?? 2) })
  for (let i = 0; i < o.llegaron; i++) {
    await (await db()).insert(postComments).values({
      accountId: cuentaDe.id,
      network: cuentaDe.network,
      postExternalId: p!.externalId,
      externalId: crypto.randomUUID(),
      text: 'Hola, ¿me la mandas? GUIA',
      publishedAt: HACE(1),
      state: i < (o.respondidos ?? 0) ? 'enviado' : 'pendiente',
      replyExternalId: i < (o.respondidos ?? 0) ? crypto.randomUUID() : null,
    })
  }
  return p!
}

describe.skipIf(!URL_PRUEBAS)('comentarios que Instagram cuenta y no entrega, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_comentarios_faltantes')
  }, 60_000)

  it('avisa por la publicación a la que le faltan, con lo que cuenta Instagram y lo que llegó', async () => {
    const ana = await persona()
    const ig = await cuenta(ana)
    const conFaltantes = await publicacion(ig, { contados: 6, llegaron: 2, respondidos: 1 })
    await publicacion(ig, { contados: 4, llegaron: 2, respondidos: 2 }) // llegó todo: dos y sus dos respuestas

    const avisos = await getComentariosQueFaltan(ana, AHORA)
    expect(avisos).toHaveLength(1)
    expect(avisos[0]).toMatchObject({ id: conFaltantes.id, accountHandle: '@prueba', contados: 6, entregados: 3 })
  })

  it('también la publicación de la que no llegó ninguno, si de la cuenta sí llegan', async () => {
    const ana = await persona()
    const ig = await cuenta(ana)
    await publicacion(ig, { contados: 1, llegaron: 1 })
    const vacia = await publicacion(ig, { contados: 3, llegaron: 0 })

    expect((await getComentariosQueFaltan(ana, AHORA)).map((a) => a.id)).toEqual([vacia.id])
  })

  it('no avisa de una cuenta de la que nunca llegó un comentario: es el permiso, no Instagram', async () => {
    const ana = await persona()
    const ig = await cuenta(ana)
    await publicacion(ig, { contados: 8, llegaron: 0 })

    expect(await getComentariosQueFaltan(ana, AHORA)).toEqual([])
  })

  it('solo Instagram, solo conectada, solo dentro de la ventana del sondeo y con la lectura ya sondeada', async () => {
    const ana = await persona()
    const fb = await cuenta(ana, { network: 'facebook' })
    await publicacion(fb, { contados: 9, llegaron: 1 })
    const desconectada = await cuenta(ana, { conectada: false })
    await publicacion(desconectada, { contados: 9, llegaron: 1 })
    const ig = await cuenta(ana)
    await publicacion(ig, { contados: 9, llegaron: 1, publicadaHace: 8 * 24 }) // fuera de los siete días
    await publicacion(ig, { contados: 9, llegaron: 1, leidaHace: 0.1 }) // el sync recién la trajo

    expect(await getComentariosQueFaltan(ana, AHORA)).toEqual([])
  })

  it('cada dueño ve solo lo suyo', async () => {
    const [ana, bea] = [await persona(), await persona()]
    await publicacion(await cuenta(ana), { contados: 5, llegaron: 1 })

    expect(await getComentariosQueFaltan(bea, AHORA)).toEqual([])
    expect(await getComentariosQueFaltan(ana, AHORA)).toHaveLength(1)
  })
})
