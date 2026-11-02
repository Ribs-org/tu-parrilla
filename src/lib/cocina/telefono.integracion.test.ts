import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// La Cocina desde la app del teléfono contra una Postgres de verdad, entrando por las rutas de
// `/api/mobile/cocina/…`. El token se dobla —quién pregunta lo decide la prueba— y el almacén es de
// mentira pero se porta como R2. Lo que importa: que sin token no pase nada, que nadie vea ni toque
// lo de otro (la cámara, las subidas, las comandas), que la cuota se respete con su frase, y que el
// camino entero —subir lo grabado y mandarlo al chef con la instrucción— cuelgue la comanda que el
// teléfono después lista.

vi.mock('server-only', () => ({}))

const BASE = 'https://media.ej.cl'
const almacen = {
  subidas: new Map<string, { key: string; partes: Map<number, { etag: string; bytes: number }> }>(),
  objetos: new Map<string, number>(),
  siguiente: 1,
}
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  return {
    ...real,
    basePublica: () => BASE,
    abrirPorPartes: vi.fn(async (key: string) => {
      const id = `up-${almacen.siguiente++}`
      almacen.subidas.set(id, { key, partes: new Map() })
      return id
    }),
    urlParaParte: vi.fn(async (key: string, id: string, numero: number) => `https://subir.ej.cl/${key}?uploadId=${id}&partNumber=${numero}`),
    partesSubidas: vi.fn(async (_key: string, id: string) => {
      const s = almacen.subidas.get(id)
      return s ? [...s.partes].map(([numero, p]) => ({ numero, ...p })) : null
    }),
    cerrarPorPartes: vi.fn(async (key: string, id: string, partes: Array<{ bytes: number }>) => {
      almacen.objetos.set(key, partes.reduce((suma, p) => suma + p.bytes, 0))
      almacen.subidas.delete(id)
    }),
    abortarPorPartes: vi.fn(async (_key: string, id: string) => {
      almacen.subidas.delete(id)
    }),
    objetoEnAlmacen: vi.fn(async (url: string) => {
      const bytes = almacen.objetos.get(url.slice(BASE.length + 1))
      return bytes === undefined ? null : { bytes, tipo: 'video/mp4' }
    }),
    borrar: vi.fn(async () => {}),
  }
})

let quien: Usuario | null = null
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => quien }))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { TAMANO_PARTE } = await import('./insumos')

let duena: Usuario
let otra: Usuario
let sinCocina: Usuario
let sinNombre: Usuario

const BYTES = TAMANO_PARTE + 500
const grabado = { nombre: 'Video del 2 de nov, 14.05.mp4', tipo: 'video/mp4', bytes: BYTES, uso: 'crudo', duracionS: 95, derechos: true }

function pedido(ruta: string, metodo = 'GET', cuerpo?: unknown): Request {
  return new Request(`https://tu-parrilla.cl${ruta}`, {
    method: metodo,
    headers: { authorization: 'Bearer token-de-prueba', ...(cuerpo === undefined ? {} : { 'content-type': 'application/json' }) },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  })
}
const params = (id: string) => ({ params: Promise.resolve({ id }) })

const rutas = async () => ({
  cocina: (await import('@/app/api/mobile/cocina/route')).GET,
  abrir: (await import('@/app/api/mobile/cocina/subidas/route')).POST,
  estado: (await import('@/app/api/mobile/cocina/subidas/[id]/route')).GET,
  abortar: (await import('@/app/api/mobile/cocina/subidas/[id]/route')).DELETE,
  partes: (await import('@/app/api/mobile/cocina/subidas/[id]/partes/route')).POST,
  cerrar: (await import('@/app/api/mobile/cocina/subidas/[id]/cerrar/route')).POST,
  pedir: (await import('@/app/api/mobile/cocina/comandas/route')).POST,
})

/** Lo que haría el teléfono con un archivo: abrir la subida, subir cada parte al almacén y cerrarla. */
async function subirDesdeElTelefono(usuario: Usuario, cuerpo: Record<string, unknown> = grabado): Promise<{ id: string; nombre: string }> {
  const r = await rutas()
  quien = usuario
  const abierta = await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', cuerpo))
  expect(abierta.status).toBe(201)
  const { id, partes } = (await abierta.json()) as { id: string; partes: number }
  const firmadas = await r.partes(pedido(`/api/mobile/cocina/subidas/${id}/partes`, 'POST', { partes: Array.from({ length: partes }, (_, n) => n + 1) }), params(id))
  expect(firmadas.status).toBe(200)
  const { subidas } = await esquema()
  const [s] = await (await db()).select().from(subidas).where(eq(subidas.id, id))
  for (const p of (await firmadas.json()).partes as Array<{ numero: number; bytes: number }>) {
    almacen.subidas.get(s!.idEnAlmacen)!.partes.set(p.numero, { etag: `"e${p.numero}"`, bytes: p.bytes })
  }
  const cerrada = await r.cerrar(pedido(`/api/mobile/cocina/subidas/${id}/cerrar`, 'POST'), params(id))
  expect(cerrada.status).toBe(201)
  return (await cerrada.json()).material
}

describe.skipIf(!URL_PRUEBAS)('La Cocina desde el teléfono, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_cocina_telefono')
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([
        { correo: 'duena@ejemplo.cl', nombre: 'Dueña', cocinaDesde: new Date() },
        { correo: 'otra@ejemplo.cl', nombre: 'Otra', cocinaDesde: new Date() },
        { correo: 'sin@ejemplo.cl', nombre: 'Sin cocina' },
        { correo: 'sinnombre@ejemplo.cl', cocinaDesde: new Date() },
      ])
      .returning()
    ;[duena, otra, sinCocina, sinNombre] = filas as [Usuario, Usuario, Usuario, Usuario]
    // Las rutas se cargan acá, con tiempo: cargarlas en frío dentro de la primera prueba pasaba sus cinco segundos.
    await rutas()
  }, 60_000)

  afterAll(() => vi.restoreAllMocks())

  beforeEach(async () => {
    const { comandas, materiales, marcas, subidas, users } = await esquema()
    await (await db()).delete(subidas)
    await (await db()).delete(comandas)
    await (await db()).delete(materiales)
    await (await db()).delete(marcas)
    await (await db()).update(users).set({ bodegaBytes: null })
    almacen.subidas.clear()
    almacen.objetos.clear()
  })

  it('sin token, 401 en todas: la app vuelve a la entrada', async () => {
    const r = await rutas()
    quien = null
    const id = crypto.randomUUID()
    expect((await r.cocina(pedido('/api/mobile/cocina'))).status).toBe(401)
    expect((await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', grabado))).status).toBe(401)
    expect((await r.estado(pedido(`/api/mobile/cocina/subidas/${id}`), params(id))).status).toBe(401)
    expect((await r.abortar(pedido(`/api/mobile/cocina/subidas/${id}`, 'DELETE'), params(id))).status).toBe(401)
    expect((await r.partes(pedido(`/api/mobile/cocina/subidas/${id}/partes`, 'POST', { partes: [1] }), params(id))).status).toBe(401)
    expect((await r.cerrar(pedido(`/api/mobile/cocina/subidas/${id}/cerrar`, 'POST'), params(id))).status).toBe(401)
    expect((await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', {}))).status).toBe(401)
  })

  it('con la cocina apagada, la pantalla lo sabe y no se sube ni se pide nada', async () => {
    const r = await rutas()
    quien = sinCocina
    const cocina = await r.cocina(pedido('/api/mobile/cocina'))
    expect(await cocina.json()).toEqual({ encendida: false, abierta: false, marca: null, camara: null, materiales: [], comandas: [] })
    const abierta = await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', grabado))
    expect(abierta.status).toBe(403)
    expect(await abierta.json()).toEqual({ error: 'La Cocina no está encendida para tu cuenta.' })
    expect((await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', { ref: crypto.randomUUID(), principal: crypto.randomUUID() }))).status).toBe(403)
  })

  it('de punta a punta: lo grabado sube por partes, se manda al chef con la instrucción y aparece en la lista', async () => {
    const r = await rutas()
    const material = await subirDesdeElTelefono(duena)
    expect(material).toMatchObject({ nombre: 'Video del 2 de nov, 14.05.mp4', bytes: BYTES, clase: 'video', uso: 'crudo', duracionS: 95 })

    quien = duena
    const ref = crypto.randomUUID()
    const colgada = await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', { ref, principal: material.id, instruccion: 'Clips de menos de 30 segundos.' }))
    expect(colgada.status).toBe(201)
    const { id } = await colgada.json()

    // Mandarla otra vez —se perdió la respuesta y se tocó de nuevo— no la duplica.
    const otraVez = await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', { ref, principal: material.id, instruccion: 'Clips de menos de 30 segundos.' }))
    expect(otraVez.status).toBe(200)
    expect(await otraVez.json()).toEqual({ id, repetida: true })

    const { comandas } = await esquema()
    const [c] = await (await db()).select().from(comandas).where(eq(comandas.id, id))
    expect(c).toMatchObject({
      ownerId: duena.id,
      estado: 'recibida',
      minutos: 2,
      pedido: { formatos: ['clips'], cantidad: 'lo-que-de', notas: 'Clips de menos de 30 segundos.', paraCuando: null },
      receta: { marca: { nombre: 'Dueña' } },
    })

    const cocina = await (await r.cocina(pedido('/api/mobile/cocina'))).json()
    expect(cocina).toMatchObject({
      encendida: true,
      abierta: false,
      marca: 'Dueña',
      camara: { cuantos: 1, guardados: BYTES, subiendo: 0 },
      materiales: [{ id: material.id, enMarcha: 1, pieza: { noche: 'un corte', dia: 'un trozo' } }],
      comandas: [
        {
          id,
          estado: 'recibida',
          palabras: { noche: 'Comanda colgada', dia: 'Comanda colgada' },
          enMarcha: true,
          principal: 'Video del 2 de nov, 14.05.mp4',
          instruccion: 'Clips de menos de 30 segundos.',
          fila: 'Es la próxima en la fila.',
        },
      ],
    })
  })

  it('nadie ve ni toca lo de otro: ni su cámara, ni sus subidas, ni sus comandas', async () => {
    const r = await rutas()
    const suyo = await subirDesdeElTelefono(otra)
    quien = otra
    const abierta = await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', grabado))
    const { id: suSubida } = await abierta.json()

    quien = duena
    const mia = await (await r.cocina(pedido('/api/mobile/cocina'))).json()
    expect(mia.materiales).toEqual([])
    expect(mia.camara).toMatchObject({ cuantos: 0, guardados: 0, subiendo: 0 })

    // Su subida no existe para quien no es su dueña: ni verla, ni firmarle partes, ni cerrarla, ni abortarla.
    expect((await r.estado(pedido(`/api/mobile/cocina/subidas/${suSubida}`), params(suSubida))).status).toBe(404)
    expect((await r.partes(pedido(`/api/mobile/cocina/subidas/${suSubida}/partes`, 'POST', { partes: [1] }), params(suSubida))).status).toBe(404)
    expect((await r.cerrar(pedido(`/api/mobile/cocina/subidas/${suSubida}/cerrar`, 'POST'), params(suSubida))).status).toBe(404)
    expect((await r.abortar(pedido(`/api/mobile/cocina/subidas/${suSubida}`, 'DELETE'), params(suSubida))).status).toBe(404)
    quien = otra
    expect((await r.estado(pedido(`/api/mobile/cocina/subidas/${suSubida}`), params(suSubida))).status).toBe(200)

    // Su material no sirve para una comanda mía, ni de plato principal ni acompañando.
    quien = duena
    const noPrincipal = await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', { ref: crypto.randomUUID(), principal: suyo.id }))
    expect(noPrincipal.status).toBe(409)
    expect(await noPrincipal.json()).toEqual({ error: 'El plato principal ya no está en la cámara, o no es un video: elige otro.' })
    const mio = await subirDesdeElTelefono(duena)
    quien = duena
    const noAcompana = await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', { ref: crypto.randomUUID(), principal: mio.id, acompanamientos: [suyo.id] }))
    expect(noAcompana.status).toBe(409)
    expect(await noAcompana.json()).toEqual({ error: 'Uno de los materiales ya no está en la cámara: actualiza La Cocina y vuelve a elegir.' })

    // Y sus comandas no aparecen en mi lista.
    quien = otra
    expect((await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', { ref: crypto.randomUUID(), principal: suyo.id }))).status).toBe(201)
    quien = duena
    expect((await (await r.cocina(pedido('/api/mobile/cocina'))).json()).comandas).toEqual([])
  })

  it('lo que no cabe en la cuota se rechaza al abrir, con cuánto pesa y cuánto queda, contando lo que está subiendo', async () => {
    const r = await rutas()
    const { users } = await esquema()
    await (await db()).update(users).set({ bodegaBytes: BYTES + 100 }).where(eq(users.id, duena.id))
    quien = duena
    expect((await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', grabado))).status).toBe(201)
    const llena = await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', { ...grabado, nombre: 'otro.mp4' }))
    expect(llena.status).toBe(409)
    expect((await llena.json()).error).toMatch(/^No hay espacio para «otro\.mp4»: pesa 64 MB y te quedan 0,1 MB libres de 64 MB\./)
  })

  it('sin la casilla de los derechos no se abre, y abortar libera el lugar', async () => {
    const r = await rutas()
    quien = duena
    const sin = await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', { ...grabado, derechos: false }))
    expect(sin.status).toBe(400)
    expect(await sin.json()).toEqual({ error: 'Marca que tienes los derechos de este material y el permiso de quienes aparecen.' })
    const { id } = await (await r.abrir(pedido('/api/mobile/cocina/subidas', 'POST', grabado))).json()
    expect((await (await r.cocina(pedido('/api/mobile/cocina'))).json()).camara.subiendo).toBe(BYTES)
    expect((await r.abortar(pedido(`/api/mobile/cocina/subidas/${id}`, 'DELETE'), params(id))).status).toBe(200)
    expect((await (await r.cocina(pedido('/api/mobile/cocina'))).json()).camara.subiendo).toBe(0)
  })

  it('sin marca ni nombre en la cuenta, la comanda no sale y dice dónde ponerlo', async () => {
    const r = await rutas()
    const material = await subirDesdeElTelefono(sinNombre)
    quien = sinNombre
    expect((await (await r.cocina(pedido('/api/mobile/cocina'))).json()).marca).toBeNull()
    const sin = await r.pedir(pedido('/api/mobile/cocina/comandas', 'POST', { ref: crypto.randomUUID(), principal: material.id }))
    expect(sin.status).toBe(400)
    expect((await sin.json()).error).toMatch(/^Ponle nombre a tu marca: .* Escribe tu nombre en Tu Cuenta/)
  })
})
