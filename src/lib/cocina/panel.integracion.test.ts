import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// La pestaña La Cocina contra una Postgres de verdad: lo que ve el dueño de sus comandas, si la
// cocina está abierta, cancelar, y encenderle la cocina a alguien desde Los Maestros. Lo que
// importa: que nadie vea ni cancele lo de otro, que lo que está en el horno no se cancele, y que
// solo el admin encienda la cocina.

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }))

class NoEsAdmin extends Error {}
let quien: Usuario | null = null
vi.mock('@/lib/auth', () => ({
  requireUser: async () => {
    if (!quien) throw new Error('sin sesión')
    return quien
  },
  requireAdmin: async () => {
    if (quien?.rol !== 'admin') throw new NoEsAdmin('redirect:/admin')
    return quien
  },
  destroySession: async () => {},
}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let admin: Usuario
let duena: Usuario
let otra: Usuario
let sinCocina: Usuario

async function comanda(ownerId: string, cambios: Record<string, unknown> = {}) {
  const { comandas } = await esquema()
  const [c] = await (await db())
    .insert(comandas)
    .values({ ownerId, ref: crypto.randomUUID(), pedido: {}, receta: {}, ...cambios })
    .returning()
  return c!
}

describe.skipIf(!URL_PRUEBAS)('la pestaña La Cocina, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_panel_cocina')
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([
        { correo: 'admin@ejemplo.cl', rol: 'admin' },
        { correo: 'duena@ejemplo.cl', cocinaDesde: new Date() },
        { correo: 'otra@ejemplo.cl', cocinaDesde: new Date() },
        { correo: 'sin@ejemplo.cl' },
      ])
      .returning()
    ;[admin, duena, otra, sinCocina] = filas as [Usuario, Usuario, Usuario, Usuario]
  }, 60_000)

  afterAll(() => vi.restoreAllMocks())

  beforeEach(async () => {
    const { comandas, latidos } = await esquema()
    await (await db()).delete(comandas)
    await (await db()).delete(latidos)
  })

  it('el dueño ve solo las suyas, la más nueva arriba, con su plato principal, su mesón y su línea de tiempo', async () => {
    const { comandasDelDueno } = await import('./panel')
    const { comandaEventos, creativos, insumos } = await esquema()
    const vieja = await comanda(duena.id, { estado: 'lista', creadaEn: new Date('2026-10-20T12:00:00Z') })
    const nueva = await comanda(duena.id, { estado: 'revisando', creadaEn: new Date('2026-10-22T12:00:00Z') })
    await comanda(otra.id)
    await (await db()).insert(insumos).values({
      ownerId: duena.id,
      comandaId: vieja.id,
      tipo: 'principal',
      nombre: 'video9.mp4',
      url: 'https://media.ej.cl/cocina/v9.mp4',
      bytes: 1,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
    })
    const creativo = { ownerId: duena.id, comandaId: vieja.id, tipo: 'video' as const }
    await (await db()).insert(creativos).values([
      { ...creativo, ref: 'a', estado: 'mesa' as const },
      { ...creativo, ref: 'b', estado: 'mesa' as const },
      { ...creativo, ref: 'c', estado: 'subiendo' as const },
    ])
    await (await db()).insert(comandaEventos).values([
      { comandaId: nueva.id, estado: 'revisando', creadoEn: new Date('2026-10-22T12:05:00Z') },
      { comandaId: vieja.id, estado: 'lista', mensaje: 'Listo todo', creadoEn: new Date('2026-10-21T12:00:00Z') },
    ])

    const vistas = await comandasDelDueno(duena.id)
    expect(vistas.map((c) => c.id)).toEqual([nueva.id, vieja.id])
    expect(vistas[1]).toMatchObject({ principal: 'video9.mp4', enElMeson: 2, cancelable: false, antes: null })
    expect(vistas[1]!.eventos).toEqual([expect.objectContaining({ estado: 'lista', mensaje: 'Listo todo' })])
    expect(vistas[0]).toMatchObject({ principal: null, enElMeson: 0, cancelable: true })
  })

  it('cuántas van antes: la fila del chef, contando las de otros con la cocina y no las de quien no la tiene', async () => {
    const { comandasDelDueno } = await import('./panel')
    const t = (minuto: number) => new Date(Date.UTC(2026, 9, 22, 12, minuto))
    await comanda(otra.id, { creadaEn: t(0) })
    await comanda(sinCocina.id, { creadaEn: t(1) })
    const mia = await comanda(duena.id, { creadaEn: t(2) })
    await comanda(otra.id, { tipo: 'prueba', creadaEn: t(3) })

    const [vista] = await comandasDelDueno(duena.id)
    // La prueba de la otra se salta la fila, y su primera va antes por llegar antes.
    expect(vista).toMatchObject({ id: mia.id, antes: 2 })
  })

  it('la cocina está abierta con un latido de hace menos de diez minutos, y no se adivina la hora sin datos', async () => {
    const { estadoDeLaCocina, etaEnLaFila } = await import('./panel')
    const { latidos } = await esquema()
    const ahora = new Date('2026-10-22T12:00:00Z')
    expect(await estadoDeLaCocina(ahora)).toEqual({ abierta: false, ultimoLatido: null, trabajos: null, minutosPorComanda: null })

    await (await db()).insert(latidos).values({ trabajador: 'casa', en: new Date('2026-10-22T11:55:00Z'), datos: { trabajos: 2, minutosPorComanda: 240 } })
    const abierta = await estadoDeLaCocina(ahora)
    expect(abierta).toMatchObject({ abierta: true, trabajos: 2, minutosPorComanda: 240 })
    // Dos antes y ella: tres comandas en dos trabajos son dos vueltas de cuatro horas.
    expect(etaEnLaFila(2, abierta, ahora)).toEqual(new Date('2026-10-22T20:00:00Z'))

    expect((await estadoDeLaCocina(new Date('2026-10-22T12:06:00Z'))).abierta).toBe(false)
    expect(etaEnLaFila(0, { ...abierta, minutosPorComanda: null }, ahora)).toBeNull()
  })

  it('cancelar: la propia mientras no está en el horno; lo crudo queda con catorce días', async () => {
    const { cancelarComandaPropia } = await import('@/app/admin/cocina-actions')
    const { COMANDA_AJENA, COMANDA_NO_CANCELABLE } = await import('./panel')
    const { comandaEventos, comandas, insumos } = await esquema()
    const mia = await comanda(duena.id)
    await (await db()).insert(insumos).values({
      ownerId: duena.id,
      comandaId: mia.id,
      tipo: 'principal',
      nombre: 'v.mp4',
      url: 'https://media.ej.cl/cocina/v.mp4',
      bytes: 1,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
    })
    const ajena = await comanda(otra.id)
    const enElHorno = await comanda(duena.id, { estado: 'en_el_horno' })

    quien = duena
    expect(await cancelarComandaPropia(ajena.id)).toEqual({ error: COMANDA_AJENA })
    expect(await cancelarComandaPropia(enElHorno.id)).toEqual({ error: COMANDA_NO_CANCELABLE })
    expect(await cancelarComandaPropia('no-es-un-id')).toEqual({ error: COMANDA_AJENA })

    const antes = Date.now()
    expect(await cancelarComandaPropia(mia.id)).toEqual({})
    const [fila] = await (await db()).select().from(comandas).where(eq(comandas.id, mia.id))
    expect(fila!.estado).toBe('cancelada')
    const eventos = await (await db()).select().from(comandaEventos).where(eq(comandaEventos.comandaId, mia.id))
    expect(eventos.map((e) => e.estado)).toEqual(['cancelada'])
    const [crudo] = await (await db()).select().from(insumos).where(eq(insumos.comandaId, mia.id))
    const dias = (crudo!.expiraEn!.getTime() - antes) / 86_400_000
    expect(dias).toBeGreaterThan(13.99)
    expect(dias).toBeLessThan(14.01)

    // La de la otra y la del horno siguen como estaban.
    const [suya] = await (await db()).select().from(comandas).where(eq(comandas.id, ajena.id))
    expect(suya!.estado).toBe('recibida')
    const [horno] = await (await db()).select().from(comandas).where(eq(comandas.id, enElHorno.id))
    expect(horno!.estado).toBe('en_el_horno')
    // Cancelada, ya no se cancela otra vez.
    expect(await cancelarComandaPropia(mia.id)).toEqual({ error: COMANDA_NO_CANCELABLE })
  })

  it('el pulso: cambia con lo que la tarjeta muestra, y no con lo de nadie más', async () => {
    const { pulsoDeLaCocina } = await import('./panel')
    const { comandas, creativos, latidos } = await esquema()
    const ahora = new Date('2026-10-22T12:00:00Z')
    const pulso = () => pulsoDeLaCocina(duena.id, ahora)

    expect(await pulso()).toMatchObject({ vivas: 0 })
    const mia = await comanda(duena.id, { actualizadaEn: new Date('2026-10-22T11:00:00Z') })
    const colgada = await pulso()
    expect(colgada.vivas).toBe(1)
    expect(colgada.firma).toMatch(/^[0-9a-f]{16}$/)
    expect((await pulso()).firma).toBe(colgada.firma)

    // Lo de otra que no mueve la fila de la suya no cuenta; una que se cuelga y espera, sí.
    await comanda(otra.id, { estado: 'en_el_horno' })
    expect((await pulso()).firma).toBe(colgada.firma)
    const ajena = await comanda(otra.id)
    const conFila = await pulso()
    expect(conFila.firma).not.toBe(colgada.firma)

    // El chef la toma: cambia.
    await (await db()).update(comandas).set({ estado: 'revisando', actualizadaEn: new Date('2026-10-22T11:30:00Z') }).where(eq(comandas.id, mia.id))
    const tomada = await pulso()
    expect(tomada.firma).not.toBe(conFila.firma)
    // Ya no espera: la fila de los demás deja de contar.
    await (await db()).delete(comandas).where(eq(comandas.id, ajena.id))
    expect((await pulso()).firma).toBe(tomada.firma)

    // Llega algo al mesón: cambia.
    await (await db()).insert(creativos).values({ ownerId: duena.id, comandaId: mia.id, ref: 'a', tipo: 'video', estado: 'mesa' })
    const conMeson = await pulso()
    expect(conMeson.firma).not.toBe(tomada.firma)

    // Se abre la cocina: cambia.
    await (await db()).insert(latidos).values({ trabajador: 'casa', en: new Date('2026-10-22T11:58:00Z') })
    expect((await pulso()).firma).not.toBe(conMeson.firma)

    // Lista, ya no está en marcha: el panel deja de preguntar.
    await (await db()).update(comandas).set({ estado: 'lista' }).where(eq(comandas.id, mia.id))
    expect((await pulso()).vivas).toBe(0)
  })

  it('encender y apagar la cocina de alguien: solo el admin', async () => {
    const { encenderCocina } = await import('@/app/admin/actions')
    const { users } = await esquema()
    const leer = async (id: string) => (await (await db()).select().from(users).where(eq(users.id, id)))[0]!.cocinaDesde

    quien = duena
    await expect(encenderCocina(sinCocina.id, true)).rejects.toBeInstanceOf(NoEsAdmin)
    expect(await leer(sinCocina.id)).toBeNull()

    quien = admin
    expect(await encenderCocina(sinCocina.id, true)).toEqual({})
    expect(await leer(sinCocina.id)).toBeInstanceOf(Date)
    expect(await encenderCocina(sinCocina.id, false)).toEqual({})
    expect(await leer(sinCocina.id)).toBeNull()
    expect(await encenderCocina(crypto.randomUUID(), true)).toEqual({ error: 'Esa persona ya no está en Los Maestros.' })
  })
})
