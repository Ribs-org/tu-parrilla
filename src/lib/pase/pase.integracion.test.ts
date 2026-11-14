import { beforeAll, describe, expect, it, vi } from 'vitest'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El Pase contra una Postgres de verdad, con el almacén doblado: los códigos abren su pase con su
// rol, y dejan de abrirlo al cambiarlos o archivar; cada rol cambia solo lo suyo; las versiones
// comparten grupo y cuentan, las variantes no se repiten, y subir una versión marca hecho lo que
// arregla; nada de otro pase se ve.

vi.mock('server-only', () => ({}))
const BASE = 'https://media.ejemplo.cl'
vi.mock('@/lib/storage', async (original) => ({
  ...(await original<typeof import('@/lib/storage')>()),
  basePublica: () => BASE,
  objetoEnAlmacen: async (url: string) => (url.endsWith('.mp4') ? { bytes: 1000, tipo: 'video/mp4' } : url.endsWith('.png') ? { bytes: 10, tipo: 'image/png' } : null),
  urlParaSubir: async (key: string) => ({ subir: `${BASE}/firmado/${key}`, publica: `${BASE}/${key}` }),
}))
vi.mock('@/lib/social/publish/batch', () => ({
  copiarMedia: async (url: string) =>
    url.includes('roto') ? { ok: false, motivo: 'http 404' } : { ok: true, url: `${BASE}/scheduled/copia.mp4`, mediaType: 'video', bytes: 5 },
}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const p = await import('./pase')
const { comentarioNuevo } = await import('./reglas')

async function admin(): Promise<string> {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `pase-${crypto.randomUUID()}@ejemplo.cl`, rol: 'admin' }).returning()
  return u!.id
}

async function unPase() {
  const dueno = await admin()
  const r = await p.crearPase(dueno, { titulo: 'Shorts de la semana', instrucciones: 'Sin sonido tiene que entenderse.' })
  if ('error' in r) throw new Error(r.error)
  return { dueno, pase: r.pase }
}

async function subir(pase: Awaited<ReturnType<typeof unPase>>['pase'], cuerpo: Record<string, unknown>) {
  const r = await p.nuevaPieza(pase, { url: `${BASE}/pase/${pase.id}/a.mp4`, titulo: 'La visa secreta', ...cuerpo })
  if ('error' in r) throw new Error(r.error)
  return r
}

describe.skipIf(!URL_PRUEBAS)('El Pase, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_pase')
  }, 60_000)

  it('cada código abre su pase con su rol; cambiarlos o archivar cierra los de antes', async () => {
    const { dueno, pase } = await unPase()
    expect(await p.entrarConCodigo(pase.codigoRevisor)).toMatchObject({ rol: 'revisor', pase: { id: pase.id } })
    expect(await p.entrarConCodigo(pase.codigoEditor)).toMatchObject({ rol: 'editor', pase: { id: pase.id } })
    expect(await p.entrarConCodigo('rev_' + 'x'.repeat(20))).toBeNull()

    expect(await p.cambiarCodigos(dueno, pase.id)).toBe(true)
    expect(await p.entrarConCodigo(pase.codigoRevisor)).toBeNull()
    const [nuevo] = await p.pasesDe(dueno)
    expect(await p.entrarConCodigo(nuevo!.codigoEditor)).toMatchObject({ rol: 'editor' })

    expect(await p.archivarPase(dueno, pase.id, true)).toBe(true)
    expect(await p.entrarConCodigo(nuevo!.codigoEditor)).toBeNull()
    // Otro admin no toca el pase ajeno.
    expect(await p.archivarPase(await admin(), pase.id, false)).toBe(false)
  })

  it('versiones y variantes: el grupo se comparte, el número sube, una variante no se repite', async () => {
    const { pase } = await unPase()
    const v1 = await subir(pase, {})
    expect(v1.pieza).toMatchObject({ version: 1, variante: null, tipo: 'video' })
    const a = await subir(pase, { responde_a: v1.pieza.id, variante: 'A', notas: 'Más rápido' })
    const b = await subir(pase, { responde_a: v1.pieza.id, variante: 'B' })
    expect([a.pieza.grupo, b.pieza.grupo]).toEqual([v1.pieza.grupo, v1.pieza.grupo])
    expect([a.pieza.version, b.pieza.version]).toEqual([2, 2])
    expect(a.pieza.titulo).toBe('La visa secreta')
    expect(await p.nuevaPieza(pase, { url: `${BASE}/pase/${pase.id}/c.mp4`, responde_a: v1.pieza.id, variante: 'A' })).toMatchObject({
      error: expect.stringContaining('variante'),
    })
    // Una URL pública se copia; una rota no entra.
    expect(await p.nuevaPieza(pase, { url: 'https://drive.ejemplo.com/video', titulo: 'Copiada' })).toMatchObject({ pieza: { url: `${BASE}/scheduled/copia.mp4` } })
    expect(await p.nuevaPieza(pase, { url: 'https://roto.ejemplo.com/x', titulo: 'Rota' })).toMatchObject({ error: expect.stringContaining('no se pudo traer') })
    // Lo subido con el enlace del pase se comprueba en el almacén; una imagen es imagen.
    expect(await p.nuevaPieza(pase, { url: `${BASE}/pase/${pase.id}/foto.png`, titulo: 'Portada' })).toMatchObject({ pieza: { tipo: 'imagen' } })
  })

  it('la crítica: se deja sobre una pieza del pase, cada rol cambia lo suyo, y una versión marca lo que arregla', async () => {
    const { pase } = await unPase()
    const v1 = await subir(pase, {})
    const nuevo = comentarioNuevo({ pieza: v1.pieza.id, autor: 'Vicente', texto: 'El subtítulo tapa la cara', desde: 20.3, hasta: 22, etiqueta: 'subtitulos', zona: { x: 0.1, y: 0.7, ancho: 0.8, alto: 0.2 } })
    if ('error' in nuevo) throw new Error(nuevo.error)
    const r = await p.comentar(pase, nuevo.comentario)
    if ('error' in r) throw new Error(r.error)
    const general = await p.comentar(pase, { ...nuevo.comentario, desdeMs: null, hastaMs: null, zona: null, texto: 'La música tapa la voz', etiqueta: 'audio' })
    if ('error' in general) throw new Error(general.error)

    // Una pieza de otro pase no existe para este.
    const otro = await unPase()
    expect(await p.comentar(otro.pase, nuevo.comentario)).toMatchObject({ error: expect.stringContaining('no está en este pase') })
    expect(await p.cambiarComentario(otro.pase, 'editor', r.comentario.id, { estado: 'resuelto' })).toMatchObject({ error: expect.stringContaining('no está') })

    // Quien revisa no contesta; quien edita no reescribe la crítica.
    expect(await p.cambiarComentario(pase, 'revisor', r.comentario.id, { respuesta: 'listo' })).toMatchObject({ error: expect.stringContaining('solo') })
    expect(await p.cambiarComentario(pase, 'editor', r.comentario.id, { texto: 'otra cosa' })).toMatchObject({ error: expect.stringContaining('solo') })
    expect(await p.cambiarComentario(pase, 'editor', general.comentario.id, { respuesta: 'Bajé la música 6 dB' })).toMatchObject({ comentario: { respuesta: 'Bajé la música 6 dB', estado: 'abierto' } })

    // La versión 2 resuelve la del subtítulo, y dice cuál la arregló.
    const v2 = await subir(pase, { responde_a: v1.pieza.id, resuelve: [r.comentario.id, 'no-es-un-id'] })
    expect(v2.resueltas).toBe(1)
    const api = await p.paseParaLaApi(pase, 'editor')
    const [primera, segunda] = api.piezas
    expect(primera!.comentarios.map((c) => [c.cuando, c.estado, c.resueltoEn])).toEqual([
      [null, 'abierto', null],
      ['0:20.3–0:22.0', 'resuelto', v2.pieza.id],
    ])
    expect(primera!.comentarios[1]).toMatchObject({ desde: 20.3, hasta: 22, zona: { x: 0.1, y: 0.7, ancho: 0.8, alto: 0.2 }, etiqueta: 'subtitulos' })
    expect(segunda).toMatchObject({ version: 2, respondeA: v1.pieza.id, comentarios: [] })

    // Quien revisa la vuelve a abrir si no quedó; y la borra si no quería dejarla.
    expect(await p.cambiarComentario(pase, 'revisor', r.comentario.id, { estado: 'abierto' })).toMatchObject({ comentario: { estado: 'abierto', resueltoEn: null } })
    expect(await p.borrarComentario(pase, general.comentario.id)).toBe(true)
    expect(await p.borrarComentario(otro.pase, r.comentario.id)).toBe(false)
  })

  it('el veredicto, y la lista del dueño con lo que tiene cada pase', async () => {
    const { dueno, pase } = await unPase()
    const v1 = await subir(pase, {})
    expect(await p.darVeredicto(pase, v1.pieza.id, 'aprobada', 'Vicente')).toMatchObject({ pieza: { estado: 'aprobada', estadoPor: 'Vicente' } })
    expect(await p.darVeredicto(pase, v1.pieza.id, 'genial', 'Vicente')).toMatchObject({ error: expect.stringContaining('estado') })
    const c = await p.comentar(pase, { piezaId: v1.pieza.id, autor: 'Ana', texto: 'Ojo con el color', etiqueta: 'color', desdeMs: 1000, hastaMs: null, zona: null })
    expect('comentario' in c).toBe(true)
    const [fila] = await p.pasesDe(dueno)
    expect(fila).toMatchObject({ id: pase.id, piezas: 1, abiertos: 1 })
    expect(await p.pasesDe(await admin())).toEqual([])
  })

  it('el enlace para subir va a la carpeta del pase, y solo con lo que se puede revisar', async () => {
    const { pase } = await unPase()
    const r = await p.enlaceDeSubida(pase, { tipo: 'video/mp4', bytes: 1000 })
    expect(r).toMatchObject({ url: expect.stringMatching(new RegExp(`^${BASE}/pase/${pase.id}/[0-9a-f-]+\\.mp4$`)), contentType: 'video/mp4' })
    expect(await p.enlaceDeSubida(pase, { tipo: 'application/pdf', bytes: 10 })).toMatchObject({ error: expect.stringContaining('MP4') })
    expect(await p.enlaceDeSubida(pase, { tipo: 'image/png', bytes: 60 * 1024 * 1024 })).toMatchObject({ error: expect.stringContaining('grande') })
  })
})
