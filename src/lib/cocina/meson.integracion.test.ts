import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El mesón contra una Postgres de verdad: qué ve el dueño y cómo se agrupa, descartar con su
// motivo y sus archivos borrados, y la comanda que se sirve sola cuando no queda nada por decidir.

vi.mock('server-only', () => ({}))
const borradas: string[] = []
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  return { ...real, borrar: vi.fn(async (url: string) => void borradas.push(url)) }
})

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let duena: Usuario
let otra: Usuario

async function comanda(ownerId: string, cambios: Record<string, unknown> = {}) {
  const { comandas } = await esquema()
  const [c] = await (await db())
    .insert(comandas)
    .values({ ownerId, ref: crypto.randomUUID(), pedido: {}, receta: {}, estado: 'lista', ...cambios })
    .returning()
  return c!
}

async function creativo(ownerId: string, comandaId: string, cambios: Record<string, unknown> = {}) {
  const { creativoMedia, creativos } = await esquema()
  const ref = crypto.randomUUID()
  const [c] = await (await db())
    .insert(creativos)
    .values({
      ownerId,
      comandaId,
      ref,
      tipo: 'video',
      estado: 'mesa',
      texto: 'El texto',
      portadaUrl: `https://media.ej.cl/scheduled/${ref}.jpg`,
      ...cambios,
    })
    .returning()
  await (await db()).insert(creativoMedia).values([
    { creativoId: c!.id, url: `https://media.ej.cl/scheduled/${ref}.mp4`, mediaType: 'video', rol: 'media', nombre: 'v.mp4', tipoArchivo: 'video/mp4', bytes: 10, position: 0 },
    { creativoId: c!.id, url: `https://media.ej.cl/scheduled/${ref}.jpg`, mediaType: 'image', rol: 'portada', nombre: 'p.jpg', tipoArchivo: 'image/jpeg', bytes: 5, position: -1 },
  ])
  return c!
}

describe.skipIf(!URL_PRUEBAS)('el mesón, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_meson')
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([{ correo: 'duena@ejemplo.cl', cocinaDesde: new Date() }, { correo: 'otra@ejemplo.cl', cocinaDesde: new Date() }])
      .returning()
    ;[duena, otra] = filas as [Usuario, Usuario]
  }, 60_000)

  afterAll(() => vi.restoreAllMocks())

  beforeEach(async () => {
    const { comandas } = await esquema()
    await (await db()).delete(comandas)
    borradas.length = 0
  })

  it('lo propio en el mesón, por comanda y por pieza; sin lo de otros ni lo que no está en la mesa', async () => {
    const { mesonDelDueno } = await import('./meson')
    const { insumos } = await esquema()
    const vieja = await comanda(duena.id, { creadaEn: new Date('2026-10-20T12:00:00Z') })
    const nueva = await comanda(duena.id, { creadaEn: new Date('2026-10-22T12:00:00Z') })
    await (await db()).insert(insumos).values({
      ownerId: duena.id,
      comandaId: nueva.id,
      tipo: 'principal',
      nombre: 'video9.mp4',
      url: 'https://media.ej.cl/cocina/v9.mp4',
      bytes: 1,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
    })
    const golpes = await creativo(duena.id, nueva.id, { pieza: 'video9/08', estilo: 'golpes' })
    const cinetica = await creativo(duena.id, nueva.id, { pieza: 'video9/08', estilo: 'cinetica' })
    const sola = await creativo(duena.id, nueva.id, { pieza: null })
    await creativo(duena.id, nueva.id, { estado: 'subiendo' })
    await creativo(duena.id, vieja.id, { estado: 'descartado' })
    const deOtra = await comanda(otra.id)
    await creativo(otra.id, deOtra.id)

    const meson = await mesonDelDueno(duena.id)
    expect(meson.map((c) => c.id)).toEqual([nueva.id])
    expect(meson[0]!.principal).toBe('video9.mp4')
    expect(meson[0]!.piezas.map((p) => p.creativos.map((c) => c.id))).toEqual([[golpes.id, cinetica.id], [sola.id]])
    // La media sin la portada, que va aparte.
    expect(meson[0]!.piezas[0]!.creativos[0]!.media).toEqual([{ url: expect.stringMatching(/\.mp4$/), mediaType: 'video' }])
  })

  it('descartar: con su motivo, sus archivos borrados, y la comanda servida si era lo último', async () => {
    const { descartarCreativo } = await import('./meson')
    const { comandaEventos, comandas, creativos, insumos } = await esquema()
    const c = await comanda(duena.id)
    await (await db()).insert(insumos).values({
      ownerId: duena.id,
      comandaId: c.id,
      tipo: 'principal',
      nombre: 'v.mp4',
      url: 'https://media.ej.cl/cocina/v.mp4',
      bytes: 1,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
    })
    const uno = await creativo(duena.id, c.id)
    const dos = await creativo(duena.id, c.id)
    const ahora = new Date('2026-10-23T12:00:00Z')

    expect(await descartarCreativo(otra.id, uno.id, 'corte', null, ahora)).toEqual({ falla: 'no-esta' })
    expect(await descartarCreativo(duena.id, uno.id, 'letra', '  la letra se ve chica ', ahora)).toEqual({ ok: true })
    const [fila] = await (await db()).select().from(creativos).where(eq(creativos.id, uno.id))
    expect(fila).toMatchObject({ estado: 'descartado', descarteMotivo: 'letra', descarteNota: 'la letra se ve chica' })
    expect(borradas.sort()).toEqual([`https://media.ej.cl/scheduled/${uno.ref}.jpg`, `https://media.ej.cl/scheduled/${uno.ref}.mp4`])
    // Queda otro en la mesa: la comanda sigue lista.
    expect((await (await db()).select().from(comandas).where(eq(comandas.id, c.id)))[0]!.estado).toBe('lista')

    expect(await descartarCreativo(duena.id, uno.id, 'letra', null, ahora)).toEqual({ falla: 'no-esta' })
    await descartarCreativo(duena.id, dos.id, 'tema', null, ahora)
    const [servida] = await (await db()).select().from(comandas).where(eq(comandas.id, c.id))
    expect(servida).toMatchObject({ estado: 'servida', servidaEn: ahora })
    const eventos = await (await db()).select().from(comandaEventos).where(eq(comandaEventos.comandaId, c.id))
    expect(eventos.map((e) => e.estado)).toEqual(['servida'])
    const [crudo] = await (await db()).select().from(insumos).where(eq(insumos.comandaId, c.id))
    expect(crudo!.expiraEn).toEqual(new Date('2026-11-06T12:00:00Z'))
  })

  it('una comanda que sigue sirviendo no se sirve sola, aunque el mesón quede vacío', async () => {
    const { descartarCreativo } = await import('./meson')
    const { comandas } = await esquema()
    const c = await comanda(duena.id, { estado: 'sirviendo' })
    const uno = await creativo(duena.id, c.id)
    await descartarCreativo(duena.id, uno.id, 'audio', null, new Date())
    expect((await (await db()).select().from(comandas).where(eq(comandas.id, c.id)))[0]!.estado).toBe('sirviendo')
  })

  it('el motivo es uno de los cuatro, y la nota es corta', async () => {
    const { MOTIVO_DESCARTE_FALTA, NOTA_LARGA, leerDescarte } = await import('./meson')
    expect(leerDescarte('corte', '')).toEqual({ motivo: 'corte', nota: null })
    expect(leerDescarte('el color', null)).toEqual({ error: MOTIVO_DESCARTE_FALTA })
    expect(leerDescarte('tema', 'x'.repeat(501))).toEqual({ error: NOTA_LARGA })
  })

  it('programar: pasa a un borrador con su texto, su título y su media, y sale del mesón', async () => {
    const { programarCreativo } = await import('./meson')
    const { borradorMedia, borradores, creativos } = await esquema()
    const c = await comanda(duena.id)
    const cr = await creativo(duena.id, c.id, { texto: 'El texto', tituloYoutube: 'El título' })

    const r = await programarCreativo(duena.id, cr.id, new Date())
    if (!('borradorId' in r)) throw new Error('no abrió el borrador')
    const [b] = await (await db()).select().from(borradores).where(eq(borradores.id, r.borradorId))
    expect(b).toMatchObject({ ownerId: duena.id, creativoId: cr.id, campos: { caption: ['El texto'], tituloYoutube: ['El título'] } })
    const media = await (await db()).select().from(borradorMedia).where(eq(borradorMedia.borradorId, r.borradorId))
    // La media sin la portada: la portada la pone el post al programarse.
    expect(media.map((m) => [m.mediaType, m.blobUrl])).toEqual([['video', `https://media.ej.cl/scheduled/${cr.ref}.mp4`]])
    expect((await (await db()).select().from(creativos).where(eq(creativos.id, cr.id)))[0]!.estado).toBe('borrador')

    // Dos clics no abren dos borradores, y lo de otra no se programa.
    expect(await programarCreativo(duena.id, cr.id, new Date())).toEqual({ falla: 'no-esta' })
    const ajeno = await creativo(otra.id, (await comanda(otra.id)).id)
    expect(await programarCreativo(duena.id, ajeno.id, new Date())).toEqual({ falla: 'no-esta' })
  })

  it('descartar el borrador devuelve el creativo al mesón', async () => {
    const { programarCreativo } = await import('./meson')
    const { borrarBorrador } = await import('@/lib/borradores')
    const { creativos } = await esquema()
    const cr = await creativo(duena.id, (await comanda(duena.id)).id)
    const r = await programarCreativo(duena.id, cr.id, new Date())
    await borrarBorrador(duena.id, 'borradorId' in r ? r.borradorId : '')
    expect((await (await db()).select().from(creativos).where(eq(creativos.id, cr.id)))[0]!.estado).toBe('mesa')
  })

  it('programar el borrador: el post lleva la portada, los atributos y el título en YouTube, y la comanda se sirve', async () => {
    const { programarCreativo } = await import('./meson')
    const { crearPostProgramado } = await import('@/lib/social/publish/crear')
    const { comandas, creativos, scheduledPostTargets, scheduledPosts, socialAccounts } = await esquema()
    const [yt, ig] = await (await db())
      .insert(socialAccounts)
      .values([
        { ownerId: duena.id, network: 'youtube', handle: 'yt' },
        { ownerId: duena.id, network: 'instagram', handle: 'ig' },
      ])
      .returning()
    const c = await comanda(duena.id)
    const cr = await creativo(duena.id, c.id, {
      texto: 'El texto',
      tituloYoutube: 'El título del chef',
      pieza: 'video9/08',
      estilo: 'golpes',
      atributos: { fuentes: 'revista' },
    })
    const r = await programarCreativo(duena.id, cr.id, new Date())
    const postId = await crearPostProgramado(duena.id, {
      caption: 'El texto corregido',
      scheduledAt: new Date('2026-10-24T13:00:00Z'),
      media: [{ url: `https://media.ej.cl/scheduled/${cr.ref}.mp4`, mediaType: 'video' }],
      cuentas: [
        { id: yt!.id, network: 'youtube', handle: 'yt' },
        { id: ig!.id, network: 'instagram', handle: 'ig' },
      ],
      borradorId: 'borradorId' in r ? r.borradorId : null,
      tituloYoutube: 'El título corregido',
    })

    const [post] = await (await db()).select().from(scheduledPosts).where(eq(scheduledPosts.id, postId))
    expect(post).toMatchObject({
      coverUrl: `https://media.ej.cl/scheduled/${cr.ref}.jpg`,
      atributos: { fuentes: 'revista', pieza: 'video9/08', estilo: 'golpes' },
    })
    const destinos = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.postId, postId))
    expect(Object.fromEntries(destinos.map((d) => [d.network, d.captionOverride]))).toEqual({
      youtube: 'El título corregido\nEl texto corregido',
      instagram: null,
    })
    expect((await (await db()).select().from(creativos).where(eq(creativos.id, cr.id)))[0]).toMatchObject({ estado: 'programado', postId })
    expect((await (await db()).select().from(comandas).where(eq(comandas.id, c.id)))[0]!.estado).toBe('servida')
  })

  it('el título: sin el del compositor, el del chef; con el del compositor vacío, ninguno', async () => {
    const { programarCreativo } = await import('./meson')
    const { crearPostProgramado } = await import('@/lib/social/publish/crear')
    const { scheduledPostTargets, socialAccounts } = await esquema()
    const [yt] = await (await db()).insert(socialAccounts).values({ ownerId: duena.id, network: 'youtube', handle: 'yt2' }).returning()
    const c = await comanda(duena.id, { estado: 'sirviendo' })
    const programar = async (tituloYoutube: string | undefined) => {
      const cr = await creativo(duena.id, c.id, { tituloYoutube: 'Del chef' })
      const r = await programarCreativo(duena.id, cr.id, new Date())
      const postId = await crearPostProgramado(duena.id, {
        caption: 'Texto',
        scheduledAt: new Date(),
        media: [],
        cuentas: [{ id: yt!.id, network: 'youtube', handle: 'yt2' }],
        borradorId: 'borradorId' in r ? r.borradorId : null,
        tituloYoutube,
      })
      const [d] = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.postId, postId))
      return d!.captionOverride
    }
    expect(await programar(undefined)).toBe('Del chef\nTexto')
    expect(await programar('')).toBeNull()
  })

  it('lo que espera en un borrador cuenta: la comanda no se sirve hasta programarlo', async () => {
    const { descartarCreativo, programarCreativo } = await import('./meson')
    const { comandas } = await esquema()
    const c = await comanda(duena.id)
    const enBorrador = await creativo(duena.id, c.id)
    const otro = await creativo(duena.id, c.id)
    await programarCreativo(duena.id, enBorrador.id, new Date())
    await descartarCreativo(duena.id, otro.id, 'corte', null, new Date())
    expect((await (await db()).select().from(comandas).where(eq(comandas.id, c.id)))[0]!.estado).toBe('lista')
  })

  it('si el creativo ya no está en un borrador, no se crea nada y el borrador sigue', async () => {
    const { programarCreativo } = await import('./meson')
    const { CreativoNoEsta, crearPostProgramado } = await import('@/lib/social/publish/crear')
    const { borradores, creativos, scheduledPosts, socialAccounts } = await esquema()
    const [ig] = await (await db()).insert(socialAccounts).values({ ownerId: duena.id, network: 'instagram', handle: 'ig2' }).returning()
    const cr = await creativo(duena.id, (await comanda(duena.id)).id)
    const r = await programarCreativo(duena.id, cr.id, new Date())
    const borradorId = 'borradorId' in r ? r.borradorId : ''
    await (await db()).update(creativos).set({ estado: 'mesa' }).where(eq(creativos.id, cr.id))
    const antes = (await (await db()).select().from(scheduledPosts)).length

    await expect(
      crearPostProgramado(duena.id, {
        caption: 'Texto',
        scheduledAt: new Date(),
        media: [],
        cuentas: [{ id: ig!.id, network: 'instagram', handle: 'ig2' }],
        borradorId,
      }),
    ).rejects.toBeInstanceOf(CreativoNoEsta)
    expect((await (await db()).select().from(scheduledPosts)).length).toBe(antes)
    expect(await (await db()).select().from(borradores).where(eq(borradores.id, borradorId))).toHaveLength(1)
  })
})
