import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El barrido de la cocina contra una Postgres de verdad: lo crudo vencido se borra y se marca, lo que
// pasó 30 días en el mesón se descarta por viejo y suelta sus archivos, lo que espera en un borrador
// no vence, y la comanda que se quedó sin nada por decidir queda servida. También el aviso del
// resumen del día, que lee lo mismo.

vi.mock('server-only', () => ({}))
const almacen = { borradas: [] as string[], fallan: new Set<string>() }
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  return {
    ...real,
    borrar: vi.fn(async (url: string) => {
      if (almacen.fallan.has(url)) throw new Error('R2 no contestó')
      almacen.borradas.push(url)
    }),
  }
})

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const AHORA = new Date('2026-10-23T12:00:00Z')
const dias = (n: number) => new Date(AHORA.getTime() + n * 86_400_000)

let duena: Usuario

async function comanda(cambios: Record<string, unknown> = {}) {
  const { comandas } = await esquema()
  const [c] = await (await db())
    .insert(comandas)
    .values({ ownerId: duena.id, ref: crypto.randomUUID(), pedido: {}, receta: {}, estado: 'lista', ...cambios })
    .returning()
  return c!
}

async function insumo(comandaId: string, cambios: Record<string, unknown> = {}) {
  const { insumos } = await esquema()
  const [i] = await (await db())
    .insert(insumos)
    .values({
      ownerId: duena.id,
      comandaId,
      tipo: 'principal',
      nombre: 'video9.mp4',
      url: `https://media.ej.cl/cocina/${crypto.randomUUID()}.mp4`,
      bytes: 1,
      tipoArchivo: 'video/mp4',
      derechosEn: AHORA,
      ...cambios,
    })
    .returning()
  return i!
}

async function creativo(comandaId: string, cambios: Record<string, unknown> = {}) {
  const { creativoMedia, creativos } = await esquema()
  const ref = crypto.randomUUID()
  const [c] = await (await db())
    .insert(creativos)
    .values({ ownerId: duena.id, comandaId, ref, tipo: 'video', estado: 'mesa', portadaUrl: `https://media.ej.cl/scheduled/${ref}.jpg`, ...cambios })
    .returning()
  await (await db()).insert(creativoMedia).values({
    creativoId: c!.id,
    url: `https://media.ej.cl/scheduled/${ref}.mp4`,
    mediaType: 'video',
    rol: 'media',
    nombre: 'v.mp4',
    tipoArchivo: 'video/mp4',
    bytes: 10,
    position: 0,
  })
  return c!
}

describe.skipIf(!URL_PRUEBAS)('el barrido de la cocina, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_barrido_cocina')
    const { users } = await esquema()
    ;[duena] = (await (await db()).insert(users).values({ correo: 'duena@ejemplo.cl', cocinaDesde: AHORA }).returning()) as [Usuario]
  }, 60_000)

  afterAll(() => vi.restoreAllMocks())

  beforeEach(async () => {
    const { comandas } = await esquema()
    await (await db()).delete(comandas)
    almacen.borradas.length = 0
    almacen.fallan.clear()
  })

  it('lo crudo vencido se borra del almacén y queda marcado; lo que no venció, o no tiene plazo, no', async () => {
    const { barrerCocina } = await import('./barrido')
    const { insumos } = await esquema()
    const c = await comanda({ estado: 'servida' })
    const vencido = await insumo(c.id, { expiraEn: dias(-1) })
    const vigente = await insumo(c.id, { expiraEn: dias(3) })
    const sinPlazo = await insumo(c.id)
    const ya = await insumo(c.id, { expiraEn: dias(-5), borradoEn: dias(-4) })

    expect(await barrerCocina(AHORA)).toMatchObject({ crudos: 1 })
    expect(almacen.borradas).toEqual([vencido.url])
    const filas = await (await db()).select().from(insumos)
    expect(filas.find((i) => i.id === vencido.id)!.borradoEn).toEqual(AHORA)
    for (const i of [vigente, sinPlazo]) expect(filas.find((f) => f.id === i.id)!.borradoEn).toBeNull()
    expect(filas.find((f) => f.id === ya.id)!.borradoEn).toEqual(dias(-4))
  })

  it('un crudo que no se pudo borrar queda sin marcar, para la pasada siguiente', async () => {
    const { barrerCocina } = await import('./barrido')
    const { insumos } = await esquema()
    const c = await comanda({ estado: 'cancelada' })
    const terco = await insumo(c.id, { expiraEn: dias(-1) })
    almacen.fallan.add(terco.url)
    expect(await barrerCocina(AHORA)).toMatchObject({ crudos: 0 })
    expect((await (await db()).select().from(insumos).where(eq(insumos.id, terco.id)))[0]!.borradoEn).toBeNull()
  })

  it('lo que pasó 30 días en el mesón se descarta por viejo y suelta sus archivos; lo de un borrador, no', async () => {
    const { barrerCocina, MOTIVO_VENCIDO } = await import('./barrido')
    const { comandas, creativoMedia, creativos } = await esquema()
    const c = await comanda()
    const viejo = await creativo(c.id, { expiraEn: dias(-1) })
    const nuevo = await creativo(c.id, { expiraEn: dias(10) })
    const enBorrador = await creativo(c.id, { expiraEn: dias(-1), estado: 'borrador' })

    expect(await barrerCocina(AHORA)).toMatchObject({ vencidos: 1, servidas: 0 })
    const filas = await (await db()).select().from(creativos)
    expect(filas.find((f) => f.id === viejo.id)).toMatchObject({ estado: 'descartado', descarteMotivo: MOTIVO_VENCIDO, portadaUrl: null })
    expect(filas.find((f) => f.id === nuevo.id)!.estado).toBe('mesa')
    expect(filas.find((f) => f.id === enBorrador.id)!.estado).toBe('borrador')
    expect(almacen.borradas.sort()).toEqual([`https://media.ej.cl/scheduled/${viejo.ref}.jpg`, `https://media.ej.cl/scheduled/${viejo.ref}.mp4`])
    expect(await (await db()).select().from(creativoMedia).where(eq(creativoMedia.creativoId, viejo.id))).toHaveLength(0)
    // Queda uno en la mesa y otro en un borrador: la comanda sigue lista.
    expect((await (await db()).select().from(comandas).where(eq(comandas.id, c.id)))[0]!.estado).toBe('lista')
  })

  it('la comanda que se quedó sin nada por decidir queda servida, y su crudo empieza sus 14 días', async () => {
    const { barrerCocina } = await import('./barrido')
    const { comandas, insumos } = await esquema()
    const c = await comanda()
    const crudo = await insumo(c.id)
    await creativo(c.id, { expiraEn: dias(-1) })

    expect(await barrerCocina(AHORA)).toMatchObject({ vencidos: 1, servidas: 1 })
    expect((await (await db()).select().from(comandas).where(eq(comandas.id, c.id)))[0]).toMatchObject({ estado: 'servida', servidaEn: AHORA })
    expect((await (await db()).select().from(insumos).where(eq(insumos.id, crudo.id)))[0]!.expiraEn).toEqual(dias(14))
  })

  it('el resumen del día avisa lo que vence en el mesón en la semana, por comanda', async () => {
    const { leerResumen } = await import('@/lib/avisos/run')
    const c = await comanda()
    await insumo(c.id, { nombre: 'entrevista.mov' })
    await creativo(c.id, { expiraEn: dias(5) })
    await creativo(c.id, { expiraEn: dias(2) })
    await creativo(c.id, { expiraEn: dias(20) })
    await creativo(c.id, { expiraEn: dias(1), estado: 'borrador' })

    const resumen = await leerResumen(duena.id, AHORA)
    expect(resumen.meson).toEqual([{ comanda: 'entrevista.mov', cuantos: 2, vence: dias(2) }])
  })
})
