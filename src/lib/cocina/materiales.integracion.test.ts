import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// La cámara de frío contra una Postgres de verdad: lo que se ve adentro, renombrar, cambiar el uso y
// sacar. Lo que importa: que un material que una comanda en marcha está usando no se pueda sacar
// —tampoco si se saca justo mientras se pide—, que sacar lo usado deje la historia de la comanda, que
// nadie toque lo de otro, y que la cuota la cambie solo el admin.

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('next/navigation', () => ({ redirect: () => {} }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }), headers: async () => new Headers() }))
const borradas: string[] = []
let almacenCaido = false
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  return {
    ...real,
    borrar: vi.fn(async (url: string) => {
      if (almacenCaido) throw new Error('R2 no responde')
      borradas.push(url)
    }),
  }
})
let quien: Usuario | null = null
vi.mock('@/lib/auth', () => ({
  requireUser: async () => {
    if (!quien) throw new Error('sin sesión')
    return quien
  },
  requireAdmin: async () => {
    if (quien?.rol !== 'admin') throw new Error('no es admin')
    return quien
  },
}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let duena: Usuario
let otra: Usuario
let admin: Usuario

async function material(ownerId: string, cambios: Record<string, unknown> = {}) {
  const { materiales } = await esquema()
  const [m] = await (await db())
    .insert(materiales)
    .values({
      ownerId,
      nombre: 'intro.mp4',
      uso: 'intro',
      url: `https://media.ej.cl/cocina/${crypto.randomUUID()}.mp4`,
      bytes: 1000,
      duracionS: 20,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
      ...cambios,
    })
    .returning()
  return m!
}

/** Una comanda en el estado que se diga, que lleva ese material. */
async function comandaCon(ownerId: string, materialId: string, estado: string) {
  const { comandas, insumos, materiales } = await esquema()
  const [m] = await (await db()).select().from(materiales).where(eq(materiales.id, materialId))
  const [c] = await (await db())
    .insert(comandas)
    .values({ ownerId, ref: crypto.randomUUID(), estado: estado as 'recibida', pedido: {}, receta: {} })
    .returning()
  await (await db()).insert(insumos).values({
    ownerId,
    comandaId: c!.id,
    materialId,
    tipo: 'principal',
    nombre: m!.nombre,
    url: m!.url,
    bytes: m!.bytes,
    tipoArchivo: m!.tipoArchivo,
    derechosEn: m!.derechosEn,
  })
  return c!
}

describe.skipIf(!URL_PRUEBAS)('la cámara de frío, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_materiales')
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([
        { correo: 'duena@ejemplo.cl', cocinaDesde: new Date() },
        { correo: 'otra@ejemplo.cl', cocinaDesde: new Date() },
        { correo: 'admin@ejemplo.cl', rol: 'admin' },
      ])
      .returning()
    ;[duena, otra, admin] = filas as [Usuario, Usuario, Usuario]
  }, 60_000)

  afterAll(() => vi.restoreAllMocks())

  beforeEach(async () => {
    const { comandas, materiales } = await esquema()
    await (await db()).delete(comandas)
    await (await db()).delete(materiales)
    borradas.length = 0
    almacenCaido = false
  })

  it('lo que hay adentro: lo propio, sin lo sacado, de lo más nuevo a lo más viejo, con cuántas comandas en marcha lo usan', async () => {
    const { materialesDeLaCamara } = await import('./materiales')
    const viejo = await material(duena.id, { nombre: 'viejo.mp4', creadoEn: new Date('2026-10-01T00:00:00Z') })
    const nuevo = await material(duena.id, { nombre: 'tema.mp3', tipoArchivo: 'audio/mpeg', creadoEn: new Date('2026-11-01T00:00:00Z') })
    await material(duena.id, { borradoEn: new Date() })
    await material(otra.id)
    await comandaCon(duena.id, viejo.id, 'en_el_horno')
    await comandaCon(duena.id, viejo.id, 'recibida')
    await comandaCon(duena.id, viejo.id, 'servida')
    await comandaCon(duena.id, nuevo.id, 'lista')

    const adentro = await materialesDeLaCamara(duena.id)
    expect(adentro.map((m) => [m.nombre, m.clase, m.enMarcha])).toEqual([
      ['tema.mp3', 'audio', 0],
      ['viejo.mp4', 'video', 2],
    ])
    expect(adentro[0]).not.toHaveProperty('url')
  })

  it('renombrar y cambiar el uso: lo propio sí; lo de otro, no; y lo que ya se pidió no cambia', async () => {
    const { editarMaterialPropio } = await import('@/app/admin/cocina-actions')
    const { insumos, materiales } = await esquema()
    const m = await material(duena.id)
    const c = await comandaCon(duena.id, m.id, 'servida')
    quien = duena
    expect(await editarMaterialPropio(m.id, '  Mi intro  ', 'outro')).toEqual({})
    const [fila] = await (await db()).select().from(materiales).where(eq(materiales.id, m.id))
    expect(fila).toMatchObject({ nombre: 'Mi intro', uso: 'outro' })
    expect(await editarMaterialPropio(m.id, 'Mi intro', null)).toEqual({})
    const [insumo] = await (await db()).select().from(insumos).where(eq(insumos.comandaId, c.id))
    expect(insumo!.nombre).toBe('intro.mp4')

    expect(await editarMaterialPropio(m.id, '   ', null)).toEqual({ error: 'Ponle un nombre: es como lo vas a reconocer.' })
    expect(await editarMaterialPropio(m.id, 'x', 'sorpresa')).toEqual({ error: 'Ese uso no existe: elige uno de la lista, o ninguno.' })
    quien = otra
    expect(await editarMaterialPropio(m.id, 'robado', null)).toEqual({ error: 'Ese material ya no está: recarga la página.' })
  })

  it('sacar lo que nunca se usó: se borra del almacén y la fila se va', async () => {
    const { sacarMaterialPropio } = await import('@/app/admin/cocina-actions')
    const { materiales } = await esquema()
    const m = await material(duena.id)
    quien = duena
    expect(await sacarMaterialPropio(m.id)).toEqual({})
    expect(borradas).toEqual([m.url])
    expect(await (await db()).select().from(materiales)).toHaveLength(0)
  })

  it('lo que una comanda en marcha usa no se saca; terminada, sí, y su historia queda', async () => {
    const { sacarMaterialPropio } = await import('@/app/admin/cocina-actions')
    const { MATERIAL_EN_USO } = await import('./bodega')
    const { comandas, insumos, materiales } = await esquema()
    const m = await material(duena.id)
    const c = await comandaCon(duena.id, m.id, 'en_preparacion')
    quien = duena
    expect(await sacarMaterialPropio(m.id)).toEqual({ error: MATERIAL_EN_USO })
    expect(borradas).toEqual([])

    await (await db()).update(comandas).set({ estado: 'cancelada' }).where(eq(comandas.id, c.id))
    const ahora = Date.now()
    expect(await sacarMaterialPropio(m.id)).toEqual({})
    expect(borradas).toEqual([m.url])
    const [fila] = await (await db()).select().from(materiales).where(eq(materiales.id, m.id))
    expect(fila!.borradoEn!.getTime()).toBeGreaterThanOrEqual(ahora - 1000)
    const [insumo] = await (await db()).select().from(insumos).where(eq(insumos.comandaId, c.id))
    expect(insumo).toMatchObject({ materialId: m.id, nombre: 'intro.mp4' })
    expect(insumo!.borradoEn).not.toBeNull()
    // Sacado, ya no está: ni en la cámara ni para sacarlo otra vez.
    expect(await sacarMaterialPropio(m.id)).toEqual({ error: 'Ese material ya no está: recarga la página.' })
  })

  it('una comanda lista ya no lo tiene en marcha: se puede sacar', async () => {
    const { sacarMaterial } = await import('./materiales')
    const m = await material(duena.id)
    await comandaCon(duena.id, m.id, 'lista')
    expect(await sacarMaterial(duena.id, m.id, new Date())).toEqual({ ok: true })
  })

  it('si el almacén no responde, nada cambia y se puede volver a intentar', async () => {
    const { sacarMaterialPropio } = await import('@/app/admin/cocina-actions')
    const { materiales } = await esquema()
    const m = await material(duena.id)
    quien = duena
    almacenCaido = true
    expect((await sacarMaterialPropio(m.id)).error).toMatch(/^No se pudo sacar/)
    expect(await (await db()).select().from(materiales)).toHaveLength(1)
    almacenCaido = false
    expect(await sacarMaterialPropio(m.id)).toEqual({})
  })

  it('lo de otro no se saca', async () => {
    const { sacarMaterial } = await import('./materiales')
    const m = await material(otra.id)
    expect(await sacarMaterial(duena.id, m.id, new Date())).toEqual({ falla: 'no-existe' })
    expect(await sacarMaterial(duena.id, 'no-es-un-id', new Date())).toEqual({ falla: 'no-existe' })
    expect(borradas).toEqual([])
  })

  it('sacar mientras se pide con él: o la comanda se cuelga y no se saca, o se saca y la comanda no se cuelga', async () => {
    const { sacarMaterial } = await import('./materiales')
    const { pedirComanda } = await import('./pedir')
    const { materiales } = await esquema()
    for (let vuelta = 0; vuelta < 6; vuelta++) {
      const m = await material(duena.id)
      const [pedido, sacado] = await Promise.all([
        pedirComanda(
          duena,
          {
            ref: crypto.randomUUID(),
            principal: m.id,
            subtipo: 'largo',
            acompanamientos: [],
            formatos: ['clips'],
            cantidad: 'lo-que-de',
            notas: '',
            paraCuando: null,
            marca: { nombre: 'V', handle: null, acento: null, ctaTexto: null },
          },
          new Date(),
        ),
        sacarMaterial(duena.id, m.id, new Date()),
      ])
      const colgada = 'ok' in pedido
      expect(colgada !== ('ok' in sacado), `vuelta ${vuelta}: ${JSON.stringify([pedido, sacado])}`).toBe(true)
      const [fila] = await (await db()).select().from(materiales).where(eq(materiales.id, m.id))
      if (colgada) expect(fila).toMatchObject({ borradoEn: null })
      else expect(fila).toBeUndefined()
    }
  })

  it('la cuota la cambia el admin en GB, y vacía vuelve a la de siempre; Los Maestros ve cuánto ocupa cada uno', async () => {
    const { cambiarCuotaDeLaCamaraAccion } = await import('@/app/admin/actions')
    const { ocupadoPorUsuario } = await import('./materiales')
    const { usoDeLaCamara } = await import('./subidas')
    await material(duena.id, { bytes: 3000 })
    await material(duena.id, { bytes: 500, borradoEn: new Date() })
    await material(otra.id, { bytes: 7 })

    quien = duena
    await expect(cambiarCuotaDeLaCamaraAccion(duena.id, '500')).rejects.toThrow()
    quien = admin
    expect(await cambiarCuotaDeLaCamaraAccion(duena.id, '50')).toEqual({})
    expect(await usoDeLaCamara(duena.id)).toEqual({ cuantos: 1, guardados: 3000, subiendo: 0, cuota: 50 * 1024 ** 3 })
    expect(await cambiarCuotaDeLaCamaraAccion(duena.id, 'mucho')).toHaveProperty('error')
    expect(await cambiarCuotaDeLaCamaraAccion(duena.id, '')).toEqual({})
    expect((await usoDeLaCamara(duena.id)).cuota).toBe(20 * 1024 ** 3)
    expect(await cambiarCuotaDeLaCamaraAccion(crypto.randomUUID(), '5')).toEqual({ error: 'Esa persona ya no está en Los Maestros.' })

    const ocupado = await ocupadoPorUsuario()
    expect(ocupado.get(duena.id)).toBe(3000)
    expect(ocupado.get(otra.id)).toBe(7)
  })
})
