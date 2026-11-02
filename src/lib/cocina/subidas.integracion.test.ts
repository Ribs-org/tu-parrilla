import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Las subidas por partes a la cámara de frío contra una Postgres de verdad, entrando por las rutas.
// El almacén es de mentira pero se porta como R2: guarda las partes de cada subida, las junta al
// cerrar y olvida la subida al abortarla. Lo que importa: que nadie toque lo de otro, que una subida
// no se cierre con partes que faltan o pesan otra cosa, que la cuota cuente lo que ya está subiendo
// —también con dos subidas a la vez—, y que el barrido no se lleve lo que está en la cámara.

vi.mock('server-only', () => ({}))

const BASE = 'https://media.ej.cl'
const almacen = {
  subidas: new Map<string, { key: string; tipo: string; partes: Map<number, { etag: string; bytes: number }> }>(),
  objetos: new Map<string, number>(),
  abortadas: [] as string[],
  borradas: [] as string[],
  pesoFalso: false,
  siguiente: 1,
  /** Lo que tarda el almacén en abrir una subida: con algo de demora, dos aperturas a la vez de verdad se cruzan. */
  demora: 0,
}
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  const noExiste = () => Object.assign(new Error('NoSuchUpload'), { name: 'NoSuchUpload' })
  return {
    ...real,
    basePublica: () => BASE,
    abrirPorPartes: vi.fn(async (key: string, tipo: string) => {
      if (almacen.demora) await new Promise((r) => setTimeout(r, almacen.demora))
      const id = `up-${almacen.siguiente++}`
      almacen.subidas.set(id, { key, tipo, partes: new Map() })
      return id
    }),
    urlParaParte: vi.fn(async (key: string, id: string, numero: number) => `https://subir.ej.cl/${key}?uploadId=${id}&partNumber=${numero}`),
    partesSubidas: vi.fn(async (_key: string, id: string) => {
      const s = almacen.subidas.get(id)
      return s ? [...s.partes].map(([numero, p]) => ({ numero, ...p })) : null
    }),
    cerrarPorPartes: vi.fn(async (key: string, id: string, partes: Array<{ bytes: number }>) => {
      if (!almacen.subidas.has(id)) throw noExiste()
      almacen.objetos.set(key, partes.reduce((suma, p) => suma + p.bytes, 0))
      almacen.subidas.delete(id)
    }),
    abortarPorPartes: vi.fn(async (_key: string, id: string) => {
      almacen.subidas.delete(id)
      almacen.abortadas.push(id)
    }),
    objetoEnAlmacen: vi.fn(async (url: string) => {
      const bytes = almacen.objetos.get(url.slice(BASE.length + 1))
      if (bytes === undefined) return null
      return { bytes: almacen.pesoFalso ? bytes - 1 : bytes, tipo: 'video/mp4' }
    }),
    borrar: vi.fn(async (url: string) => {
      almacen.borradas.push(url)
      almacen.objetos.delete(url.slice(BASE.length + 1))
    }),
  }
})

let quien: Usuario | null = null
vi.mock('@/lib/auth', () => ({ usuarioActual: async () => quien }))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { TAMANO_PARTE } = await import('./insumos')

let conCocina: Usuario
let otro: Usuario
let sinCocina: Usuario

const BYTES = 2 * TAMANO_PARTE + 1000
const largo = { nombre: 'video9.mp4', tipo: 'video/mp4', bytes: BYTES, uso: 'crudo', duracionS: 1800, derechos: true }

function pedido(ruta: string, metodo = 'GET', cuerpo?: unknown): Request {
  return new Request(`https://tu-parrilla.cl${ruta}`, {
    method: metodo,
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo), headers: { 'content-type': 'application/json' } }),
  })
}
const params = (id: string) => ({ params: Promise.resolve({ id }) })

const rutas = async () => ({
  abrir: (await import('@/app/api/admin/cocina/subidas/route')).POST,
  estado: (await import('@/app/api/admin/cocina/subidas/[id]/route')).GET,
  abortar: (await import('@/app/api/admin/cocina/subidas/[id]/route')).DELETE,
  partes: (await import('@/app/api/admin/cocina/subidas/[id]/partes/route')).POST,
  cerrar: (await import('@/app/api/admin/cocina/subidas/[id]/cerrar/route')).POST,
})

/** Abre una subida como `usuario` y devuelve su id. */
async function abrir(usuario: Usuario, cuerpo: Record<string, unknown> = largo): Promise<string> {
  quien = usuario
  const r = await (await rutas()).abrir(pedido('/api/admin/cocina/subidas', 'POST', cuerpo))
  expect(r.status).toBe(201)
  return ((await r.json()) as { id: string }).id
}

/** «Sube» una parte al almacén de mentira, con el peso que se le diga. */
async function subirParte(id: string, numero: number, bytes: number) {
  const { subidas } = await esquema()
  const [s] = await (await db()).select().from(subidas).where(eq(subidas.id, id))
  almacen.subidas.get(s!.idEnAlmacen)!.partes.set(numero, { etag: `"e${numero}"`, bytes })
}

async function subirTodo(id: string) {
  await subirParte(id, 1, TAMANO_PARTE)
  await subirParte(id, 2, TAMANO_PARTE)
  await subirParte(id, 3, 1000)
}

async function cuota(usuario: Usuario, bytes: number | null) {
  const { users } = await esquema()
  await (await db()).update(users).set({ bodegaBytes: bytes }).where(eq(users.id, usuario.id))
}

describe.skipIf(!URL_PRUEBAS)('las subidas por partes a la cámara de frío, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_subidas')
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([
        { correo: 'con@ejemplo.cl', cocinaDesde: new Date() },
        { correo: 'otro@ejemplo.cl', cocinaDesde: new Date() },
        { correo: 'sin@ejemplo.cl' },
      ])
      .returning()
    ;[conCocina, otro, sinCocina] = filas as [Usuario, Usuario, Usuario]
  }, 60_000)

  afterAll(() => vi.restoreAllMocks())

  beforeEach(async () => {
    const { materiales, subidas, comandas } = await esquema()
    await (await db()).delete(subidas)
    await (await db()).delete(comandas)
    await (await db()).delete(materiales)
    await cuota(conCocina, null)
    almacen.subidas.clear()
    almacen.objetos.clear()
    almacen.abortadas.length = 0
    almacen.borradas.length = 0
    almacen.pesoFalso = false
    almacen.demora = 0
  })

  it('sin sesión, nada; sin la cocina encendida, no se abre', async () => {
    const { abrir: abrirRuta } = await rutas()
    quien = null
    expect((await abrirRuta(pedido('/api/admin/cocina/subidas', 'POST', largo))).status).toBe(401)
    quien = sinCocina
    const r = await abrirRuta(pedido('/api/admin/cocina/subidas', 'POST', largo))
    expect(r.status).toBe(403)
    expect(await r.json()).toEqual({ error: 'La Cocina no está encendida para tu cuenta.' })
  })

  it('lo que no va, se dice al abrir: sin la casilla de los derechos no hay subida', async () => {
    quien = conCocina
    const r = await (await rutas()).abrir(pedido('/api/admin/cocina/subidas', 'POST', { ...largo, derechos: false }))
    expect(r.status).toBe(400)
    expect(almacen.subidas.size).toBe(0)
  })

  it('de punta a punta: abrir, firmar, subir, cerrar, y cerrar otra vez da el mismo material', async () => {
    const r = await rutas()
    const id = await abrir(conCocina)
    expect(await (await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).json()).toMatchObject({
      partes: 3,
      tamanoParte: TAMANO_PARTE,
      llegaron: [],
      material: null,
    })

    const firmadas = await (await r.partes(pedido(`/api/admin/cocina/subidas/${id}/partes`, 'POST', { partes: [1, 2, 3] }), params(id))).json()
    expect(firmadas.partes.map((p: { numero: number; bytes: number }) => [p.numero, p.bytes])).toEqual([
      [1, TAMANO_PARTE],
      [2, TAMANO_PARTE],
      [3, 1000],
    ])

    await subirTodo(id)
    expect((await (await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).json()).llegaron).toEqual([1, 2, 3])

    const cerrada = await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))
    expect(cerrada.status).toBe(201)
    const { material } = await cerrada.json()
    expect(material).toEqual({
      id: expect.any(String),
      nombre: 'video9.mp4',
      uso: 'crudo',
      bytes: BYTES,
      duracionS: 1800,
      tipoArchivo: 'video/mp4',
      clase: 'video',
      creadoEn: expect.any(String),
    })
    const { materiales } = await esquema()
    const [fila] = await (await db()).select().from(materiales).where(eq(materiales.id, material.id))
    expect(fila).toMatchObject({ ownerId: conCocina.id, bytes: BYTES, borradoEn: null })
    expect(fila!.url).toMatch(new RegExp(`^${BASE}/cocina/${conCocina.id}/bodega/[0-9a-f-]{36}-video9\\.mp4$`))

    const otraVez = await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))
    expect(otraVez.status).toBe(200)
    expect((await otraVez.json()).material.id).toBe(material.id)
    expect((await (await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).json()).material.id).toBe(material.id)
    expect(await (await db()).select().from(materiales)).toHaveLength(1)
  })

  it('no se cierra con una parte que falta, ni con una que llegó con otro peso', async () => {
    const r = await rutas()
    const id = await abrir(conCocina)
    await subirParte(id, 1, TAMANO_PARTE)
    await subirParte(id, 3, 1000)
    const sinLaDos = await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))
    expect(sinLaDos.status).toBe(409)
    expect(await sinLaDos.json()).toEqual({ error: 'Falta 1 parte por subir: súbela y vuelve a cerrar.' })

    await subirParte(id, 2, TAMANO_PARTE - 1)
    expect((await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))).status).toBe(409)
    expect((await (await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).json()).llegaron).toEqual([1, 3])
  })

  it('si el objeto que queda no pesa lo anunciado, se borra y hay que subirlo de nuevo', async () => {
    const r = await rutas()
    const id = await abrir(conCocina)
    await subirTodo(id)
    almacen.pesoFalso = true
    const cierre = await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))
    expect(cierre.status).toBe(409)
    expect(await cierre.json()).toEqual({ error: 'El archivo llegó con otro tamaño: súbelo de nuevo.' })
    expect(almacen.borradas).toHaveLength(1)
    const { materiales } = await esquema()
    expect(await (await db()).select().from(materiales)).toHaveLength(0)
    expect((await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).status).toBe(404)
  })

  it('las partes se piden de este archivo, sin repetir y de a cincuenta como mucho', async () => {
    const r = await rutas()
    const id = await abrir(conCocina)
    for (const partes of [[], [0], [4], [1, 1], [1.5], 'todas', Array.from({ length: 51 }, () => 1)]) {
      const respuesta = await r.partes(pedido(`/api/admin/cocina/subidas/${id}/partes`, 'POST', { partes }), params(id))
      expect(respuesta.status, JSON.stringify(partes)).toBe(400)
    }
  })

  it('la subida de otro no existe: ni se mira, ni se firma, ni se cierra, ni se aborta', async () => {
    const r = await rutas()
    const id = await abrir(conCocina)
    await subirTodo(id)
    quien = otro
    expect((await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).status).toBe(404)
    expect((await r.partes(pedido(`/api/admin/cocina/subidas/${id}/partes`, 'POST', { partes: [1] }), params(id))).status).toBe(404)
    expect((await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))).status).toBe(404)
    expect((await r.abortar(pedido(`/api/admin/cocina/subidas/${id}`, 'DELETE'), params(id))).status).toBe(404)
    expect(almacen.abortadas).toHaveLength(0)
    const { materiales } = await esquema()
    expect(await (await db()).select().from(materiales)).toHaveLength(0)
  })

  it('abortarla le pide al almacén borrar sus partes; una ya cerrada no se aborta', async () => {
    const r = await rutas()
    const id = await abrir(conCocina)
    expect((await r.abortar(pedido(`/api/admin/cocina/subidas/${id}`, 'DELETE'), params(id))).status).toBe(200)
    expect(almacen.abortadas).toHaveLength(1)
    expect((await r.abortar(pedido(`/api/admin/cocina/subidas/${id}`, 'DELETE'), params(id))).status).toBe(404)

    const cerrada = await abrir(conCocina)
    await subirTodo(cerrada)
    await r.cerrar(pedido(`/api/admin/cocina/subidas/${cerrada}/cerrar`, 'POST'), params(cerrada))
    expect((await r.abortar(pedido(`/api/admin/cocina/subidas/${cerrada}`, 'DELETE'), params(cerrada))).status).toBe(409)
  })

  it('si la base falla después de abrirla en el almacén, la aborta: no quedan partes sin dueño', async () => {
    const { abrirSubida } = await import('./subidas')
    const { leerSubida } = await import('./bodega')
    const pedidoLeido = leerSubida(largo)
    if ('error' in pedidoLeido) throw new Error(pedidoLeido.error)
    // Un dueño que no está en la base: no hay fila que bloquear, y no se abre nada en el almacén.
    await expect(abrirSubida({ id: randomUUID(), cocinaDesde: new Date() }, pedidoLeido, new Date())).rejects.toThrow()
    expect(almacen.subidas.size).toBe(0)
  })

  describe('la cuota', () => {
    it('cuenta lo que ya está subiendo, no solo lo guardado: la segunda no cabe hasta que la primera se aborte', async () => {
      const r = await rutas()
      await cuota(conCocina, Math.floor(BYTES * 1.5))
      const primera = await abrir(conCocina)
      quien = conCocina
      const segunda = await r.abrir(pedido('/api/admin/cocina/subidas', 'POST', { ...largo, nombre: 'otro.mp4' }))
      expect(segunda.status).toBe(409)
      expect((await segunda.json()).error).toMatch(/^No hay espacio para «otro\.mp4»: pesa 128 MB y te quedan 64 MB libres de 192 MB\./)
      expect(almacen.subidas.size).toBe(1)

      await r.abortar(pedido(`/api/admin/cocina/subidas/${primera}`, 'DELETE'), params(primera))
      await abrir(conCocina, { ...largo, nombre: 'otro.mp4' })
    })

    it('lo guardado cuenta; lo sacado deja de contar, y lo de otro nunca cuenta', async () => {
      const r = await rutas()
      const { materiales } = await esquema()
      await cuota(conCocina, Math.floor(BYTES * 1.5))
      const id = await abrir(conCocina)
      await subirTodo(id)
      const { material } = await (await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))).json()
      quien = conCocina
      expect((await r.abrir(pedido('/api/admin/cocina/subidas', 'POST', largo))).status).toBe(409)

      // Lo de otro, aunque sea mucho, no le quita espacio.
      await (await db()).insert(materiales).values({ ownerId: otro.id, nombre: 'x', url: `${BASE}/x`, bytes: 10 * BYTES, tipoArchivo: 'video/mp4', derechosEn: new Date() })
      await (await db()).update(materiales).set({ borradoEn: new Date() }).where(eq(materiales.id, material.id))
      await abrir(conCocina)
    })

    it('dos subidas a la vez que juntas no caben: entra una sola', async () => {
      const r = await rutas()
      await cuota(conCocina, Math.floor(BYTES * 1.5))
      quien = conCocina
      // El almacén tarda en abrir: sin el candado sobre la fila del dueño, las dos alcanzarían a
      // contar antes de que la otra guarde la suya, y entrarían las dos.
      almacen.demora = 300
      const [a, b] = await Promise.all([
        r.abrir(pedido('/api/admin/cocina/subidas', 'POST', { ...largo, nombre: 'a.mp4' })),
        r.abrir(pedido('/api/admin/cocina/subidas', 'POST', { ...largo, nombre: 'b.mp4' })),
      ])
      expect([a.status, b.status].sort()).toEqual([201, 409])
      const { subidas } = await esquema()
      expect(await (await db()).select().from(subidas)).toHaveLength(1)
      expect(almacen.subidas.size).toBe(1)
    })

    it('sin cuota propia, la de siempre: 20 GB', async () => {
      quien = conCocina
      const r = await (await rutas()).abrir(pedido('/api/admin/cocina/subidas', 'POST', { ...largo, bytes: 20 * 1024 ** 3 }))
      expect(r.status).toBe(201)
      const otra = await (await rutas()).abrir(pedido('/api/admin/cocina/subidas', 'POST', { ...largo, bytes: 1 }))
      expect(otra.status).toBe(409)
    })
  })

  it('el barrido aborta lo abandonado y olvida lo cerrado, pero lo de la cámara no vence', async () => {
    const { barrerSubidas } = await import('./subidas')
    const { materiales, subidas } = await esquema()
    const ahora = new Date('2026-10-23T12:00:00Z')
    const hace = (horas: number) => new Date(ahora.getTime() - horas * 3_600_000)

    const vieja = await abrir(conCocina)
    const nueva = await abrir(conCocina)
    await (await db()).update(subidas).set({ creadaEn: hace(25) }).where(eq(subidas.id, vieja))
    await (await db()).update(subidas).set({ creadaEn: hace(1) }).where(eq(subidas.id, nueva))
    await (await db()).insert(materiales).values({
      ownerId: conCocina.id,
      nombre: 'guardado hace meses.mp4',
      url: `${BASE}/cocina/viejo.mp4`,
      bytes: 1,
      tipoArchivo: 'video/mp4',
      derechosEn: hace(24 * 90),
      creadoEn: hace(24 * 90),
    })

    expect(await barrerSubidas(ahora)).toEqual({ abortadas: 1 })
    expect((await (await db()).select().from(subidas)).map((s) => s.id)).toEqual([nueva])
    expect(almacen.borradas).toEqual([])
    expect(await (await db()).select().from(materiales)).toHaveLength(1)
  })
})
