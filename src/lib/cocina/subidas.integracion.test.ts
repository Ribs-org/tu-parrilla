import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Las subidas por partes del panel contra una Postgres de verdad, entrando por las rutas. El
// almacén es de mentira pero se porta como R2: guarda las partes de cada subida, las junta al
// cerrar y olvida la subida al abortarla. Lo que importa: que nadie toque lo de otro, que una
// subida no se cierre con partes que faltan o pesan otra cosa, y que el barrido no se lleve lo
// que todavía sirve.

vi.mock('server-only', () => ({}))

const BASE = 'https://media.ej.cl'
const almacen = {
  subidas: new Map<string, { key: string; tipo: string; partes: Map<number, { etag: string; bytes: number }> }>(),
  objetos: new Map<string, number>(),
  abortadas: [] as string[],
  borradas: [] as string[],
  pesoFalso: false,
  siguiente: 1,
}
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  const noExiste = () => Object.assign(new Error('NoSuchUpload'), { name: 'NoSuchUpload' })
  return {
    ...real,
    basePublica: () => BASE,
    abrirPorPartes: vi.fn(async (key: string, tipo: string) => {
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
const largo = { nombre: 'video9.mp4', tipo: 'video/mp4', bytes: BYTES, insumo: 'principal', subtipo: 'largo', duracionS: 1800, derechos: true }

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
  sacar: (await import('@/app/api/admin/cocina/insumos/[id]/route')).DELETE,
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

describe.skipIf(!URL_PRUEBAS)('las subidas por partes de la cocina, contra una Postgres de verdad', () => {
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
    const { insumos, subidas, comandas } = await esquema()
    await (await db()).delete(subidas)
    await (await db()).delete(insumos)
    await (await db()).delete(comandas)
    almacen.subidas.clear()
    almacen.objetos.clear()
    almacen.abortadas.length = 0
    almacen.borradas.length = 0
    almacen.pesoFalso = false
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

  it('de punta a punta: abrir, firmar, subir, cerrar, y cerrar otra vez da el mismo insumo', async () => {
    const r = await rutas()
    const id = await abrir(conCocina)
    expect(await (await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).json()).toMatchObject({
      partes: 3,
      tamanoParte: TAMANO_PARTE,
      llegaron: [],
      insumo: null,
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
    const { insumo } = await cerrada.json()
    expect(insumo).toEqual({
      id: expect.any(String),
      tipo: 'principal',
      subtipo: 'largo',
      nombre: 'video9.mp4',
      bytes: BYTES,
      duracionS: 1800,
      tipoArchivo: 'video/mp4',
    })
    const { insumos } = await esquema()
    const [fila] = await (await db()).select().from(insumos).where(eq(insumos.id, insumo.id))
    expect(fila).toMatchObject({ ownerId: conCocina.id, comandaId: null, bytes: BYTES })
    expect(fila!.url).toMatch(new RegExp(`^${BASE}/cocina/${conCocina.id}/insumos/[0-9a-f-]{36}-video9\\.mp4$`))

    const otraVez = await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))
    expect(otraVez.status).toBe(200)
    expect((await otraVez.json()).insumo.id).toBe(insumo.id)
    expect((await (await r.estado(pedido(`/api/admin/cocina/subidas/${id}`), params(id))).json()).insumo.id).toBe(insumo.id)
    expect(await (await db()).select().from(insumos)).toHaveLength(1)
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
    const { insumos } = await esquema()
    expect(await (await db()).select().from(insumos)).toHaveLength(0)
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
    const { insumos } = await esquema()
    expect(await (await db()).select().from(insumos)).toHaveLength(0)
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

  it('sacar un archivo subido: el propio y suelto sí, y se borra del almacén; el de una comanda o el de otro, no', async () => {
    const r = await rutas()
    const { comandas, insumos } = await esquema()
    const id = await abrir(conCocina)
    await subirTodo(id)
    const { insumo } = await (await r.cerrar(pedido(`/api/admin/cocina/subidas/${id}/cerrar`, 'POST'), params(id))).json()

    quien = otro
    expect((await r.sacar(pedido(`/api/admin/cocina/insumos/${insumo.id}`, 'DELETE'), params(insumo.id))).status).toBe(404)

    quien = conCocina
    const [c] = await (await db()).insert(comandas).values({ ownerId: conCocina.id, ref: 'r', pedido: {}, receta: {} }).returning()
    await (await db()).update(insumos).set({ comandaId: c!.id }).where(eq(insumos.id, insumo.id))
    const enComanda = await r.sacar(pedido(`/api/admin/cocina/insumos/${insumo.id}`, 'DELETE'), params(insumo.id))
    expect(enComanda.status).toBe(409)

    await (await db()).update(insumos).set({ comandaId: null }).where(eq(insumos.id, insumo.id))
    expect((await r.sacar(pedido(`/api/admin/cocina/insumos/${insumo.id}`, 'DELETE'), params(insumo.id))).status).toBe(200)
    expect(almacen.borradas).toHaveLength(1)
    expect(await (await db()).select().from(insumos)).toHaveLength(0)
  })

  it('si la base falla después de abrirla en el almacén, la aborta: no quedan partes sin dueño', async () => {
    const { abrirSubida } = await import('./subidas')
    const { leerSubida } = await import('./insumos')
    const pedidoLeido = leerSubida(largo)
    if ('error' in pedidoLeido) throw new Error(pedidoLeido.error)
    // Un dueño que no está en la base: la fila choca con su llave foránea.
    await expect(abrirSubida({ id: randomUUID(), cocinaDesde: new Date() }, pedidoLeido, new Date())).rejects.toThrow()
    expect(almacen.abortadas).toHaveLength(1)
  })

  it('el barrido aborta lo abandonado, borra lo que nunca llegó a una comanda y deja lo demás', async () => {
    const { barrerSubidas } = await import('./subidas')
    const { comandas, insumos, subidas } = await esquema()
    const ahora = new Date('2026-10-23T12:00:00Z')
    const hace = (horas: number) => new Date(ahora.getTime() - horas * 3_600_000)

    const vieja = await abrir(conCocina)
    const nueva = await abrir(conCocina)
    await (await db()).update(subidas).set({ creadaEn: hace(25) }).where(eq(subidas.id, vieja))
    await (await db()).update(subidas).set({ creadaEn: hace(1) }).where(eq(subidas.id, nueva))

    const [c] = await (await db()).insert(comandas).values({ ownerId: conCocina.id, ref: 'r', pedido: {}, receta: {} }).returning()
    const base = { ownerId: conCocina.id, tipo: 'principal' as const, nombre: 'x.mp4', bytes: 1, tipoArchivo: 'video/mp4', derechosEn: ahora }
    await (await db()).insert(insumos).values([
      { ...base, url: `${BASE}/cocina/suelto-viejo.mp4`, creadoEn: hace(4 * 24) },
      { ...base, url: `${BASE}/cocina/suelto-nuevo.mp4`, creadoEn: hace(24) },
      { ...base, url: `${BASE}/cocina/en-comanda.mp4`, creadoEn: hace(10 * 24), comandaId: c!.id },
    ])

    expect(await barrerSubidas(ahora)).toEqual({ abortadas: 1, sueltos: 1 })
    expect((await (await db()).select().from(subidas)).map((s) => s.id)).toEqual([nueva])
    expect(almacen.borradas).toEqual([`${BASE}/cocina/suelto-viejo.mp4`])
    expect((await (await db()).select().from(insumos)).map((i) => i.url).sort()).toEqual([
      `${BASE}/cocina/en-comanda.mp4`,
      `${BASE}/cocina/suelto-nuevo.mp4`,
    ])
  })
})
