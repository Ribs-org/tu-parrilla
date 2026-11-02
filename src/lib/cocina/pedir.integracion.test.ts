import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { asc, eq } from 'drizzle-orm'
import postgres from 'postgres'
import type { Usuario } from '@/db'
import type { PedidoDeComanda } from './pedido'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Colgar una comanda contra una Postgres de verdad, eligiendo de la cámara de frío: que entre
// cualquier combinación de lo propio que sigue en la cámara, cada cosa con su rol; que la comanda
// guarde una foto de cada material y nombre el mismo archivo; que el mismo material sirva para dos
// comandas; que la receta quede congelada aunque la marca cambie; que mandarla dos veces no la
// duplique, y que la acción vuelva a La Cocina al terminar.

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

async function material(ownerId: string, cambios: Record<string, unknown> = {}) {
  const { materiales } = await esquema()
  const [m] = await (await db())
    .insert(materiales)
    .values({
      ownerId,
      nombre: 'video9.mp4',
      uso: 'crudo',
      url: `https://media.ej.cl/cocina/${crypto.randomUUID()}.mp4`,
      bytes: 1000,
      duracionS: 1801,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
      ...cambios,
    })
    .returning()
  return m!
}

const marca = { nombre: 'Vicente', handle: '@vicente', acento: '#3D7BFF', ctaTexto: 'Sígueme' }
const pedidoCon = (
  principal: string,
  acompanamientos: PedidoDeComanda['acompanamientos'] = [],
  cambios: Partial<PedidoDeComanda> = {},
): PedidoDeComanda => ({
  ref: crypto.randomUUID(),
  principal,
  subtipo: 'largo',
  acompanamientos,
  formatos: ['clips'],
  cantidad: 'unos-10',
  notas: 'la parte de ventas',
  paraCuando: null,
  marca,
  ...cambios,
})

describe.skipIf(!URL_PRUEBAS)('colgar una comanda eligiendo de la cámara, contra una Postgres de verdad', () => {
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
    const { comandas, materiales, marcas } = await esquema()
    await (await db()).delete(comandas)
    await (await db()).delete(materiales)
    await (await db()).delete(marcas)
  })

  it('dos de cuatro videos y cuatro fotos: la cuelga con su receta, sus minutos y una foto de cada material', async () => {
    const { pedirComanda } = await import('./pedir')
    const { comandaEventos, comandas, insumos, marcas } = await esquema()
    const largo = await material(duena.id, { nombre: 'charla.mp4' })
    const intro = await material(duena.id, { nombre: 'intro.mp4', uso: 'intro', duracionS: 20 })
    await material(duena.id, { nombre: 'otro largo.mp4' })
    await material(duena.id, { nombre: 'outro.mp4', uso: 'outro' })
    const fotos = await Promise.all([1, 2, 3, 4].map((n) => material(duena.id, { nombre: `foto${n}.jpg`, uso: null, tipoArchivo: 'image/jpeg', duracionS: null })))
    const musica = await material(duena.id, { nombre: 'tema.mp3', uso: 'musica', tipoArchivo: 'audio/mpeg' })
    const ahora = new Date('2026-11-02T15:00:00Z')

    const r = await pedirComanda(
      duena,
      pedidoCon(
        largo.id,
        [{ id: intro.id, rol: 'imagen' }, ...fotos.map((f) => ({ id: f.id, rol: 'camara' as const })), { id: musica.id, rol: 'pantalla' }],
        { subtipo: 'podcast' },
      ),
      ahora,
    )
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

    const llevados = await (await db()).select().from(insumos).where(eq(insumos.comandaId, id)).orderBy(asc(insumos.posicion))
    // Una foto no sincroniza aunque se pida, y lo que no es video ni foto va como extra.
    expect(llevados.map((i) => [i.nombre, i.tipo, i.subtipo, i.uso])).toEqual([
      ['charla.mp4', 'principal', 'podcast', 'crudo'],
      ['intro.mp4', 'imagen', null, 'intro'],
      ['foto1.jpg', 'imagen', null, null],
      ['foto2.jpg', 'imagen', null, null],
      ['foto3.jpg', 'imagen', null, null],
      ['foto4.jpg', 'imagen', null, null],
      ['tema.mp3', 'extra', null, 'musica'],
    ])
    // Nombra el mismo archivo que el material, y no vence: el archivo es de la cámara.
    expect(llevados[0]).toMatchObject({ materialId: largo.id, url: largo.url, bytes: largo.bytes, expiraEn: null, ownerId: duena.id })
    expect(llevados.map((i) => i.posicion)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('el mismo material sirve para otra comanda, y lo que cambie después no cambia lo que ya se pidió', async () => {
    const { pedirComanda } = await import('./pedir')
    const { insumos, materiales } = await esquema()
    const largo = await material(duena.id, { nombre: 'charla.mp4' })
    const primera = await pedirComanda(duena, pedidoCon(largo.id), new Date())
    await (await db()).update(materiales).set({ nombre: 'charla renombrada.mp4', uso: 'outro' }).where(eq(materiales.id, largo.id))
    const segunda = await pedirComanda(duena, pedidoCon(largo.id, [], { subtipo: 'tomas' }), new Date())
    expect(primera).toMatchObject({ ok: true })
    expect(segunda).toMatchObject({ ok: true })

    const filas = await (await db()).select().from(insumos).where(eq(insumos.materialId, largo.id))
    const de = (r: typeof primera) => filas.find((i) => i.comandaId === ('id' in r ? r.id : ''))!
    expect(de(primera)).toMatchObject({ nombre: 'charla.mp4', uso: 'crudo', subtipo: 'largo' })
    expect(de(segunda)).toMatchObject({ nombre: 'charla renombrada.mp4', uso: 'outro', subtipo: 'tomas' })
    expect(de(primera).id).not.toBe(de(segunda).id)
  })

  it('mandarla dos veces con la misma ref no la duplica', async () => {
    const { pedirComanda } = await import('./pedir')
    const { comandas, insumos } = await esquema()
    const largo = await material(duena.id)
    const p = pedidoCon(largo.id)
    const primera = await pedirComanda(duena, p, new Date())
    const segunda = await pedirComanda(duena, p, new Date())
    expect(segunda).toEqual({ ok: true, id: 'id' in primera ? primera.id : '', repetida: true })
    expect(await (await db()).select().from(comandas)).toHaveLength(1)
    expect(await (await db()).select().from(insumos)).toHaveLength(1)
  })

  it('la marca se guarda para la siguiente, pero lo que ya se pidió no cambia', async () => {
    const { marcaDe, pedirComanda } = await import('./pedir')
    const { comandas, marcas } = await esquema()
    const a = await pedirComanda(duena, pedidoCon((await material(duena.id)).id), new Date())
    await pedirComanda(duena, pedidoCon((await material(duena.id)).id, [], { marca: { ...marca, nombre: 'Vicente Pareja' } }), new Date())

    expect(await (await db()).select().from(marcas)).toHaveLength(1)
    expect(await marcaDe(duena.id)).toMatchObject({ nombre: 'Vicente Pareja' })
    const [primera] = await (await db()).select().from(comandas).where(eq(comandas.id, 'id' in a ? a.id : ''))
    expect((primera!.receta as { marca: { nombre: string } }).marca.nombre).toBe('Vicente')
  })

  it('solo entra lo propio que sigue en la cámara, y el plato principal tiene que ser un video', async () => {
    const { pedirComanda } = await import('./pedir')
    const { comandas } = await esquema()
    const deOtra = await material(otra.id)
    expect(await pedirComanda(duena, pedidoCon(deOtra.id), new Date())).toEqual({ falla: 'principal' })

    const foto = await material(duena.id, { tipoArchivo: 'image/jpeg' })
    expect(await pedirComanda(duena, pedidoCon(foto.id), new Date())).toEqual({ falla: 'principal' })

    const sacado = await material(duena.id, { borradoEn: new Date() })
    expect(await pedirComanda(duena, pedidoCon(sacado.id), new Date())).toEqual({ falla: 'principal' })

    const largo = await material(duena.id)
    expect(await pedirComanda(duena, pedidoCon(largo.id, [{ id: deOtra.id, rol: 'imagen' }]), new Date())).toEqual({ falla: 'acompanamiento' })
    expect(await pedirComanda(duena, pedidoCon(largo.id, [{ id: sacado.id, rol: 'imagen' }]), new Date())).toEqual({ falla: 'acompanamiento' })
    // Nada de eso dejó una comanda a medias.
    expect(await (await db()).select().from(comandas)).toHaveLength(0)

    expect(await pedirComanda(sinCocina, pedidoCon((await material(sinCocina.id)).id), new Date())).toEqual({ falla: 'apagada' })
  })

  it('dos envíos a la vez del mismo formulario: el que choca con la ref devuelve el primero', async () => {
    const { pedirComanda } = await import('./pedir')
    const { comandas } = await esquema()
    const largo = await material(duena.id)
    const p = pedidoCon(largo.id)

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
    const largo = await material(duena.id)
    await expect(pedirComandaPropia(pedidoCon(largo.id))).rejects.toEqual(new Redireccion('/admin/ia'))
    // El mismo material sirve para otra comanda: la segunda también se cuelga.
    await expect(pedirComandaPropia(pedidoCon(largo.id))).rejects.toEqual(new Redireccion('/admin/ia'))
    const foto = await material(duena.id, { tipoArchivo: 'image/png' })
    expect(await pedirComandaPropia(pedidoCon(foto.id))).toEqual({ error: PRINCIPAL_NO_SIRVE })
    expect(await pedirComandaPropia({ ...pedidoCon(largo.id), principal: undefined })).toEqual({ error: PRINCIPAL_FALTA })
  })
})
