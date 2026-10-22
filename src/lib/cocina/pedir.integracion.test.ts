import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import type { Usuario } from '@/db'
import type { PedidoDeComanda } from './pedido'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Colgar una comanda contra una Postgres de verdad: que entre solo lo propio y suelto, que la receta
// quede congelada aunque la marca cambie, que mandarla dos veces no la duplique, y que la acción
// vuelva a La Cocina al terminar.

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
class Redireccion extends Error {
  constructor(public url: string) {
    super(`redirect:${url}`)
  }
}
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Redireccion(url)
  },
}))
let quien: Usuario | null = null
vi.mock('@/lib/auth', () => ({
  requireUser: async () => {
    if (!quien) throw new Error('sin sesión')
    return quien
  },
}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let direccion = ''
let duena: Usuario
let otra: Usuario
let sinCocina: Usuario

async function insumo(ownerId: string, cambios: Record<string, unknown> = {}) {
  const { insumos } = await esquema()
  const [i] = await (await db())
    .insert(insumos)
    .values({
      ownerId,
      tipo: 'principal',
      subtipo: 'largo',
      nombre: 'video9.mp4',
      url: `https://media.ej.cl/cocina/${crypto.randomUUID()}.mp4`,
      bytes: 1000,
      duracionS: 1801,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
      ...cambios,
    })
    .returning()
  return i!
}

const marca = { nombre: 'Vicente', handle: '@vicente', acento: '#3D7BFF', ctaTexto: 'Sígueme' }
const pedidoCon = (principal: string, acompanamientos: string[] = [], cambios: Partial<PedidoDeComanda> = {}): PedidoDeComanda => ({
  ref: crypto.randomUUID(),
  principal,
  acompanamientos,
  formatos: ['clips'],
  cantidad: 'unos-10',
  notas: 'la parte de ventas',
  paraCuando: null,
  marca,
  ...cambios,
})

describe.skipIf(!URL_PRUEBAS)('colgar una comanda, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    direccion = await prepararBase('pruebas_pedir')
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([
        { correo: 'duena@ejemplo.cl', nombre: 'Dueña', cocinaDesde: new Date() },
        { correo: 'otra@ejemplo.cl', cocinaDesde: new Date() },
        { correo: 'sin@ejemplo.cl' },
      ])
      .returning()
    ;[duena, otra, sinCocina] = filas as [Usuario, Usuario, Usuario]
  }, 60_000)

  afterAll(() => vi.restoreAllMocks())

  beforeEach(async () => {
    const { comandas, insumos, marcas } = await esquema()
    await (await db()).delete(comandas)
    await (await db()).delete(insumos)
    await (await db()).delete(marcas)
  })

  it('la cuelga con su receta congelada, su primer paso, sus minutos y sus archivos amarrados', async () => {
    const { pedirComanda } = await import('./pedir')
    const { comandaEventos, comandas, insumos, marcas } = await esquema()
    const principal = await insumo(duena.id)
    const camara = await insumo(duena.id, { tipo: 'camara', subtipo: null, nombre: 'dji.mp4' })
    const ahora = new Date('2026-10-22T15:00:00Z')

    const r = await pedirComanda(duena, pedidoCon(principal.id, [camara.id]), ahora)
    expect(r).toMatchObject({ ok: true, repetida: false })
    const id = 'id' in r ? r.id : ''
    const [c] = await (await db()).select().from(comandas).where(eq(comandas.id, id))
    expect(c).toMatchObject({
      ownerId: duena.id,
      estado: 'recibida',
      tipo: 'tanda',
      minutos: 31,
      pedido: { formatos: ['clips'], cantidad: 'unos-10', notas: 'la parte de ventas', paraCuando: null, estilos: 'chef' },
      receta: { marca: { nombre: 'Vicente', handle: '@vicente', acento: '#3D7BFF', cta: 'Sígueme' }, estilos: 'chef' },
    })
    const [m] = await (await db()).select().from(marcas).where(eq(marcas.ownerId, duena.id))
    expect(c!.marcaId).toBe(m!.id)
    const eventos = await (await db()).select().from(comandaEventos).where(eq(comandaEventos.comandaId, id))
    expect(eventos.map((e) => e.estado)).toEqual(['recibida'])
    const amarrados = await (await db()).select().from(insumos).where(eq(insumos.comandaId, id))
    expect(amarrados.map((i) => i.id).sort()).toEqual([principal.id, camara.id].sort())
  })

  it('mandarla dos veces con la misma ref no la duplica', async () => {
    const { pedirComanda } = await import('./pedir')
    const { comandas } = await esquema()
    const principal = await insumo(duena.id)
    const p = pedidoCon(principal.id)
    const primera = await pedirComanda(duena, p, new Date())
    const segunda = await pedirComanda(duena, p, new Date())
    expect(segunda).toEqual({ ok: true, id: 'id' in primera ? primera.id : '', repetida: true })
    expect(await (await db()).select().from(comandas)).toHaveLength(1)
  })

  it('la marca se guarda para la siguiente, pero lo que ya se pidió no cambia', async () => {
    const { marcaDe, pedirComanda } = await import('./pedir')
    const { comandas, marcas } = await esquema()
    const a = await pedirComanda(duena, pedidoCon((await insumo(duena.id)).id), new Date())
    await pedirComanda(duena, pedidoCon((await insumo(duena.id)).id, [], { marca: { ...marca, nombre: 'Vicente Pareja' } }), new Date())

    expect(await (await db()).select().from(marcas)).toHaveLength(1)
    expect(await marcaDe(duena.id)).toMatchObject({ nombre: 'Vicente Pareja' })
    const [primera] = await (await db()).select().from(comandas).where(eq(comandas.id, 'id' in a ? a.id : ''))
    expect((primera!.receta as { marca: { nombre: string } }).marca.nombre).toBe('Vicente')
  })

  it('solo entra lo propio, suelto y del tipo que corresponde', async () => {
    const { pedirComanda } = await import('./pedir')
    const deOtra = await insumo(otra.id)
    expect(await pedirComanda(duena, pedidoCon(deOtra.id), new Date())).toEqual({ falla: 'principal' })

    const imagen = await insumo(duena.id, { tipo: 'imagen', subtipo: null })
    expect(await pedirComanda(duena, pedidoCon(imagen.id), new Date())).toEqual({ falla: 'principal' })

    const principal = await insumo(duena.id)
    const otroPrincipal = await insumo(duena.id)
    expect(await pedirComanda(duena, pedidoCon(principal.id, [otroPrincipal.id]), new Date())).toEqual({ falla: 'acompanamiento' })

    const borrado = await insumo(duena.id, { borradoEn: new Date() })
    expect(await pedirComanda(duena, pedidoCon(borrado.id), new Date())).toEqual({ falla: 'principal' })

    // Ya en una comanda, no entra en otra.
    await pedirComanda(duena, pedidoCon(principal.id), new Date())
    expect(await pedirComanda(duena, pedidoCon(principal.id), new Date())).toEqual({ falla: 'principal' })

    expect(await pedirComanda(sinCocina, pedidoCon((await insumo(sinCocina.id)).id), new Date())).toEqual({ falla: 'apagada' })
  })

  it('dos envíos a la vez del mismo formulario: el que choca con la ref devuelve el primero', async () => {
    const { pedirComanda } = await import('./pedir')
    const { comandas } = await esquema()
    const principal = await insumo(duena.id)
    const p = pedidoCon(principal.id)

    // El otro envío ya escribió su comanda pero no confirmó: este no la ve al mirar, y al
    // insertar espera el candado. Cuando el otro confirma, choca con la unicidad de la ref.
    const otroEnvio = postgres(direccion, { max: 1, onnotice: () => {} })
    const vigia = postgres(direccion, { max: 1, onnotice: () => {} })
    try {
      let escrito!: (id: string) => void
      const idDelOtro = new Promise<string>((r) => (escrito = r))
      let soltar!: () => void
      const suelto = new Promise<void>((r) => (soltar = r))
      const transaccion = otroEnvio.begin(async (tx) => {
        const [fila] = await tx`insert into comandas (owner_id, ref, pedido, receta) values (${duena.id}, ${p.ref}, '{}', '{}') returning id`
        escrito(fila!.id as string)
        await suelto
      })
      const id = await idDelOtro

      const respuesta = pedirComanda(duena, p, new Date())
      for (let i = 0; i < 100; i++) {
        const [{ n }] = await vigia`select count(*)::int as n from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'`
        if (n > 0) break
        await new Promise((r) => setTimeout(r, 50))
      }
      soltar()
      await transaccion

      expect(await respuesta).toEqual({ ok: true, id, repetida: true })
      expect((await (await db()).select().from(comandas)).map((c) => c.id)).toEqual([id])
    } finally {
      await otroEnvio.end()
      await vigia.end()
    }
  })

  it('lo suelto que se ofrece: solo lo propio, sin comanda y sin borrar', async () => {
    const { insumosSueltos, pedirComanda } = await import('./pedir')
    const suelto = await insumo(duena.id, { nombre: 'suelto.mp4' })
    await insumo(otra.id)
    await insumo(duena.id, { borradoEn: new Date() })
    await pedirComanda(duena, pedidoCon((await insumo(duena.id)).id), new Date())
    expect((await insumosSueltos(duena.id)).map((i) => i.id)).toEqual([suelto.id])
  })

  it('el lugar de una nueva en la fila: después de lo que espera, con las pruebas primero', async () => {
    const { lugarDeUnaNueva } = await import('./pedir')
    const { comandas } = await esquema()
    expect(await lugarDeUnaNueva(duena.id, new Date())).toBe(0)
    await (await db()).insert(comandas).values([
      { ownerId: otra.id, ref: 'a', pedido: {}, receta: {}, creadaEn: new Date('2026-10-22T10:00:00Z') },
      { ownerId: otra.id, ref: 'b', pedido: {}, receta: {}, creadaEn: new Date('2026-10-22T11:00:00Z') },
      { ownerId: sinCocina.id, ref: 'c', pedido: {}, receta: {} },
    ])
    // La primera de la otra va antes; su segunda va después de la de esta dueña, que es una por vuelta.
    expect(await lugarDeUnaNueva(duena.id, new Date('2026-10-22T12:00:00Z'))).toBe(1)
  })

  it('la acción: la cuelga y vuelve a La Cocina, o dice por qué no', async () => {
    const { pedirComandaPropia } = await import('@/app/admin/cocina-actions')
    const { PRINCIPAL_NO_SIRVE } = await import('./pedir')
    const { PRINCIPAL_FALTA } = await import('./pedido')
    quien = duena
    const principal = await insumo(duena.id)
    await expect(pedirComandaPropia(pedidoCon(principal.id))).rejects.toEqual(new Redireccion('/admin/ia'))
    expect(await pedirComandaPropia(pedidoCon(principal.id))).toEqual({ error: PRINCIPAL_NO_SIRVE })
    expect(await pedirComandaPropia({ ...pedidoCon(principal.id), principal: undefined })).toEqual({ error: PRINCIPAL_FALTA })
  })
})
