import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// La API de la cocina contra una Postgres de verdad, entrando por las rutas: lo que importa —que
// el chef vea solo a quien tiene la cocina, que dos trabajadores no tomen la misma comanda, que no
// se salten estados, que lo entregado llegue al mesón solo cuando sus archivos están— lo deciden
// las condiciones del SQL. El almacén es de mentira: un mapa de lo que «se subió».

vi.mock('server-only', () => ({}))

// Lo que la ruta deja para después de responder (`after`): acá se junta, y la prueba lo corre
// cuando quiere, como lo haría la plataforma.
const despues: Array<() => unknown> = []
vi.mock('next/server', async (importOriginal) => {
  const real = await importOriginal<typeof import('next/server')>()
  return { ...real, after: (tarea: () => unknown) => void despues.push(tarea) }
})
async function correrLoDeDespues() {
  while (despues.length > 0) await despues.shift()!()
}

/** Resend de mentira: cada correo que «sale», con su destinatario, su asunto y su texto. */
function correosDeMentira() {
  const enviados: Array<{ to: string; subject: string; text: string; from: string }> = []
  vi.stubEnv('RESEND_API_KEY', 're_de_prueba')
  vi.stubEnv('DOMINIO_PRODUCTO', 'tu-parrilla.cl')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      enviados.push(JSON.parse(String(init.body)))
      return new Response('{"id":"x"}', { status: 200 })
    }),
  )
  return enviados
}

const BASE = 'https://media.ej.cl'
const subidos = new Map<string, number>()
vi.mock('@/lib/storage', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/storage')>()
  return {
    ...real,
    basePublica: () => BASE,
    urlParaBajar: vi.fn(async (key: string) => `https://firmado.ej.cl/${key}?firma=1`),
    urlParaSubir: vi.fn(async (key: string) => ({ subir: `https://subir.ej.cl/${key}?firma=1`, publica: `${BASE}/${key}` })),
    objetoEnAlmacen: vi.fn(async (url: string) => (subidos.has(url) ? { bytes: subidos.get(url)!, tipo: 'video/mp4' } : null)),
  }
})

const SECRETO = 'secreto-de-la-cocina'
const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let direccion = ''
let conCocina = ''
let otroConCocina = ''
let sinCocina = ''

function pedido(ruta: string, cuerpo?: unknown, metodo = cuerpo === undefined ? 'GET' : 'POST'): Request {
  return new Request(`https://tu-parrilla.cl${ruta}`, {
    method: metodo,
    headers: { authorization: `Bearer ${SECRETO}` },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  })
}
const params = (id: string) => ({ params: Promise.resolve({ id }) })

async function comanda(ownerId: string, cambios: Record<string, unknown> = {}, creadaEn = new Date()) {
  const { comandas } = await esquema()
  const [c] = await (await db())
    .insert(comandas)
    .values({ ownerId, ref: crypto.randomUUID(), pedido: { notas: 'la parte de ventas' }, receta: { marca: { nombre: 'Marca' } }, creadaEn, ...cambios })
    .returning()
  return c!
}

async function insumo(ownerId: string, comandaId: string, cambios: Record<string, unknown> = {}) {
  const { insumos } = await esquema()
  const [i] = await (await db())
    .insert(insumos)
    .values({
      ownerId,
      comandaId,
      tipo: 'principal',
      subtipo: 'largo',
      nombre: 'video9.mp4',
      url: `${BASE}/cocina/${ownerId}/insumos/abc-video9.mp4`,
      bytes: 4_000_000_000,
      duracionS: 1800,
      tipoArchivo: 'video/mp4',
      derechosEn: new Date(),
      ...cambios,
    })
    .returning()
  return i!
}

describe.skipIf(!URL_PRUEBAS)('la API de la cocina, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    direccion = await prepararBase('pruebas_cocina')
    vi.stubEnv('COCINA_SECRET', SECRETO)
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([
        { correo: 'con@ejemplo.cl', nombre: 'Con cocina', cocinaDesde: new Date() },
        { correo: 'otro@ejemplo.cl', nombre: 'Otro con cocina', cocinaDesde: new Date() },
        { correo: 'sin@ejemplo.cl', nombre: 'Sin cocina' },
      ])
      .returning()
    conCocina = filas[0]!.id
    otroConCocina = filas[1]!.id
    sinCocina = filas[2]!.id
  }, 60_000)

  afterAll(() => vi.unstubAllEnvs())

  beforeEach(async () => {
    const { comandas, marcas, materiales } = await esquema()
    await (await db()).delete(comandas)
    await (await db()).delete(materiales)
    await (await db()).delete(marcas)
    subidos.clear()
    despues.length = 0
    vi.unstubAllGlobals()
  })

  it('sin la credencial de la cocina, nada', async () => {
    const { GET } = await import('@/app/api/cocina/comandas/route')
    const r = await GET(new Request('https://tu-parrilla.cl/api/cocina/comandas'))
    expect(r.status).toBe(401)
  })

  it('las que esperan: solo de quien tiene la cocina, las pruebas primero y una de cada dueño por vuelta', async () => {
    const { GET } = await import('@/app/api/cocina/comandas/route')
    const t0 = Date.UTC(2026, 9, 22, 12, 0)
    const primera = await comanda(conCocina, {}, new Date(t0))
    const segunda = await comanda(conCocina, {}, new Date(t0 + 60_000))
    const delOtro = await comanda(otroConCocina, { pedido: { notas: '   ' } }, new Date(t0 + 120_000))
    const prueba = await comanda(otroConCocina, { tipo: 'prueba' }, new Date(t0 + 180_000))
    await comanda(sinCocina, {}, new Date(t0 - 60_000))
    await insumo(conCocina, primera.id)

    const cuerpo = await (await GET(pedido('/api/cocina/comandas'))).json()
    expect(cuerpo.comandas.map((c: { id: string }) => c.id)).toEqual([prueba.id, primera.id, delOtro.id, segunda.id])
    const conInsumo = cuerpo.comandas.find((c: { id: string }) => c.id === primera.id)
    expect(conInsumo.dueno).toEqual({ id: conCocina, nombre: 'Con cocina' })
    expect(conInsumo.pedido).toEqual({ notas: 'la parte de ventas' })
    // La instrucción al chef, arriba y con nombre propio; `pedido.notas` sigue igual.
    expect(conInsumo.instruccion).toBe('la parte de ventas')
    const sinInstruccion = cuerpo.comandas.find((c: { id: string }) => c.id === delOtro.id)
    expect(sinInstruccion.instruccion).toBeNull()
    // Sin la URL: el enlace se pide aparte, y vence.
    expect(conInsumo.insumos).toEqual([
      expect.objectContaining({ tipo: 'principal', subtipo: 'largo', nombre: 'video9.mp4', bytes: 4_000_000_000 }),
    ])
    expect(conInsumo.insumos[0]).not.toHaveProperty('url')
  })

  it('tomarla: una vez por trabajador, y la de otro no', async () => {
    const { POST } = await import('@/app/api/cocina/comandas/[id]/tomar/route')
    const c = await comanda(conCocina)
    const r1 = await POST(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))
    expect(await r1.json()).toMatchObject({ ok: true, estado: 'revisando', tomadaPor: 'servidor' })
    const r2 = await POST(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))
    expect(r2.status).toBe(200)
    const r3 = await POST(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'otro' }), params(c.id))
    expect(r3.status).toBe(409)

    const ajena = await comanda(sinCocina)
    const r4 = await POST(pedido(`/api/cocina/comandas/${ajena.id}/tomar`, { trabajador: 'servidor' }), params(ajena.id))
    expect(r4.status).toBe(404)
  })

  it('los estados: el camino con las tandas, y nada que se salte un paso o salga de lo terminado', async () => {
    const tomar = (await import('@/app/api/cocina/comandas/[id]/tomar/route')).POST
    const { POST } = await import('@/app/api/cocina/comandas/[id]/estado/route')
    const { comandaEventos, comandas } = await esquema()
    const c = await comanda(conCocina)
    const cambiar = (cuerpo: unknown) => POST(pedido(`/api/cocina/comandas/${c.id}/estado`, cuerpo), params(c.id))

    // Sin tomar, no se mueve.
    expect((await cambiar({ estado: 'en_preparacion' })).status).toBe(409)
    await tomar(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))

    const salto = await cambiar({ estado: 'lista' })
    expect(salto.status).toBe(409)
    expect(await salto.json()).toEqual({ error: 'Una comanda en «revisando» no pasa a «lista».' })

    expect((await cambiar({ estado: 'en_preparacion', mensaje: 'Eligiendo los cortes' })).status).toBe(200)
    const sirviendo = await cambiar({ estado: 'sirviendo', eta: '2026-10-23T14:00:00-03:00', tandas: { servidas: 1, total: 5 } })
    expect(await sirviendo.json()).toMatchObject({ estado: 'sirviendo', tandas: { servidas: 1, total: 5 }, eta: '2026-10-23T17:00:00.000Z' })
    expect((await cambiar({ estado: 'sirviendo', tandas: { servidas: 3, total: 5 } })).status).toBe(200)
    expect((await cambiar({ estado: 'lista', tandas: { servidas: 5, total: 5 } })).status).toBe(200)

    const [final] = await (await db()).select().from(comandas).where(eq(comandas.id, c.id))
    expect(final!.estado).toBe('lista')
    expect(final!.tandasServidas).toBe(5)
    expect(final!.listaEn).not.toBeNull()
    const eventos = await (await db()).select().from(comandaEventos).where(eq(comandaEventos.comandaId, c.id))
    expect(eventos.map((e) => e.estado)).toEqual(['revisando', 'en_preparacion', 'sirviendo', 'sirviendo', 'lista'])
  })

  it('rechazarla pide el motivo, y una rechazada ya no se mueve', async () => {
    const tomar = (await import('@/app/api/cocina/comandas/[id]/tomar/route')).POST
    const { POST } = await import('@/app/api/cocina/comandas/[id]/estado/route')
    const c = await comanda(conCocina)
    await tomar(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))
    const cambiar = (cuerpo: unknown) => POST(pedido(`/api/cocina/comandas/${c.id}/estado`, cuerpo), params(c.id))

    expect((await cambiar({ estado: 'rechazada' })).status).toBe(400)
    const crudo = await insumo(conCocina, c.id)
    const antes = Date.now()
    const r = await cambiar({ estado: 'rechazada', motivo: 'El video está en inglés: por ahora el chef trabaja en español.' })
    expect(r.status).toBe(200)
    // Rechazada, lo crudo se guarda 14 días más y lo borra el barrido de la cocina.
    const { insumos } = await esquema()
    const [fila] = await (await db()).select().from(insumos).where(eq(insumos.id, crudo.id))
    const plazo = (fila!.expiraEn!.getTime() - antes) / 86_400_000
    expect(plazo).toBeGreaterThan(13.99)
    expect(plazo).toBeLessThan(14.01)
    expect((await cambiar({ estado: 'en_preparacion' })).status).toBe(409)
  })

  it('lista: un solo correo al dueño, aunque el chef la mande cuatro veces a la vez y la reintente después', async () => {
    const enviados = correosDeMentira()
    const { POST } = await import('@/app/api/cocina/comandas/[id]/estado/route')
    const { creativos } = await esquema()
    const c = await comanda(conCocina, { estado: 'en_el_horno', tomadaPor: 'servidor' })
    await insumo(conCocina, c.id)
    await (await db())
      .insert(creativos)
      .values(['a', 'b', 'c'].map((ref) => ({ ownerId: conCocina, comandaId: c.id, ref, tipo: 'video' as const, estado: 'mesa' as const })))
    const cambiar = (cuerpo: unknown) => POST(pedido(`/api/cocina/comandas/${c.id}/estado`, cuerpo), params(c.id))

    // Las cuatro leen «en_el_horno» antes de que ninguna escriba: otra conexión tiene tomada la
    // fila, y cada una queda esperando el candado con el estado ya leído. Al soltarla, escribe una;
    // las otras vuelven a mirar el `where`, ya no calza, y terminan en 409. Sin la fila tomada,
    // las llamadas «a la vez» se ordenan solas y no prueban la carrera.
    const otro = postgres(direccion, { max: 1, onnotice: () => {} })
    const vigia = postgres(direccion, { max: 1, onnotice: () => {} })
    let aLaVez: Response[]
    try {
      let soltar!: () => void
      const suelto = new Promise<void>((r) => (soltar = r))
      let tomada!: () => void
      const filaTomada = new Promise<void>((r) => (tomada = r))
      const transaccion = otro.begin(async (tx) => {
        await tx`select id from comandas where id = ${c.id} for update`
        tomada()
        await suelto
      })
      await filaTomada
      const llamadas = Promise.all(Array.from({ length: 4 }, () => cambiar({ estado: 'lista' })))
      let esperando = 0
      for (let i = 0; i < 100 && esperando < 4; i++) {
        await new Promise((r) => setTimeout(r, 50))
        const [fila] = await vigia`select count(*)::int as n from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'`
        esperando = fila!.n as number
      }
      expect(esperando).toBe(4)
      soltar()
      await transaccion
      aLaVez = await llamadas
    } finally {
      await otro.end()
      await vigia.end()
    }
    expect(aLaVez.map((r) => r.status).sort()).toEqual([200, 409, 409, 409])
    expect((await cambiar({ estado: 'lista' })).status).toBe(409)
    await correrLoDeDespues()

    expect(enviados).toHaveLength(1)
    expect(enviados[0]).toMatchObject({ to: 'con@ejemplo.cl', subject: 'Lista en el mesón: «video9.mp4»' })
    expect(enviados[0]!.text).toContain('te dejó 3 cortes en el mesón, listos para programar')
    expect(enviados[0]!.text).toContain(`https://tu-parrilla.cl/admin/ia/meson?comanda=${c.id}`)
  })

  it('la primera tanda: un correo, con el asunto del chef saneado y su mensaje; las tandas que siguen no avisan', async () => {
    const enviados = correosDeMentira()
    const { POST } = await import('@/app/api/cocina/comandas/[id]/estado/route')
    const { creativos } = await esquema()
    const c = await comanda(conCocina, { estado: 'en_el_horno', tomadaPor: 'servidor' })
    await insumo(conCocina, c.id)
    await (await db())
      .insert(creativos)
      .values(['a', 'b'].map((ref) => ({ ownerId: conCocina, comandaId: c.id, ref, tipo: 'video' as const, estado: 'mesa' as const })))
    const cambiar = (cuerpo: unknown) => POST(pedido(`/api/cocina/comandas/${c.id}/estado`, cuerpo), params(c.id))

    const largo = await cambiar({ estado: 'sirviendo', asunto: 'x'.repeat(121) })
    expect(largo.status).toBe(400)
    expect(await largo.json()).toEqual({ error: '«asunto» es un texto de hasta 120 caracteres, o null.' })
    expect(
      (await cambiar({ estado: 'sirviendo', mensaje: 'Aquí va lo primero', asunto: 'Su primera tanda\r\nBcc: otro@ej.cl', tandas: { servidas: 1, total: 3 } }))
        .status,
    ).toBe(200)
    expect((await cambiar({ estado: 'sirviendo', asunto: 'Otra más', tandas: { servidas: 2, total: 3 } })).status).toBe(200)
    await correrLoDeDespues()

    expect(enviados).toHaveLength(1)
    expect(enviados[0]).toMatchObject({ to: 'con@ejemplo.cl', subject: 'Su primera tanda Bcc: otro@ej.cl' })
    expect(enviados[0]!.text).toContain('El chef empezó a servir «video9.mp4»: te dejó 2 cortes en el mesón, listos para programar. Van 1 de 3 tandas en el mesón.')
    expect(enviados[0]!.text).toContain('El chef: «Aquí va lo primero»')
  })

  it('con los correos apagados en Tu Cuenta no sale ninguno, y el cambio pasa igual', async () => {
    const enviados = correosDeMentira()
    const { POST } = await import('@/app/api/cocina/comandas/[id]/estado/route')
    const { ajustes } = await esquema()
    await (await db()).insert(ajustes).values({ ownerId: conCocina, clave: 'cocina_correos', valor: 'apagados' })
    try {
      const c = await comanda(conCocina, { estado: 'en_el_horno', tomadaPor: 'servidor' })
      const cambiar = (cuerpo: unknown) => POST(pedido(`/api/cocina/comandas/${c.id}/estado`, cuerpo), params(c.id))
      expect((await cambiar({ estado: 'sirviendo', tandas: { servidas: 1, total: 2 } })).status).toBe(200)
      expect((await cambiar({ estado: 'lista' })).status).toBe(200)
      await correrLoDeDespues()
      expect(enviados).toHaveLength(0)
    } finally {
      await (await db()).delete(ajustes).where(eq(ajustes.ownerId, conCocina))
    }
  })

  it('fallida y rechazada: un correo cada una, con el motivo; lo que sigue en curso no avisa hasta servir', async () => {
    const enviados = correosDeMentira()
    const { POST } = await import('@/app/api/cocina/comandas/[id]/estado/route')
    const enCurso = await comanda(conCocina, { estado: 'revisando', tomadaPor: 'servidor' })
    const rota = await comanda(conCocina, { estado: 'en_el_horno', tomadaPor: 'servidor' })
    const fuera = await comanda(conCocina, { estado: 'revisando', tomadaPor: 'servidor' })
    const cambiar = (id: string, cuerpo: unknown) => POST(pedido(`/api/cocina/comandas/${id}/estado`, cuerpo), params(id))

    expect((await cambiar(enCurso.id, { estado: 'en_preparacion' })).status).toBe(200)
    // Un asunto en un cambio que no avisa no manda nada.
    expect((await cambiar(enCurso.id, { estado: 'en_el_horno', asunto: 'Va al fuego' })).status).toBe(200)
    await correrLoDeDespues()
    expect(enviados).toHaveLength(0)

    const fallida = { estado: 'fallida', motivo: 'Se cortó la luz en la cocina a mitad del render.' }
    // El reintento del chef, después de que la primera ya escribió: lo terminado no se mueve.
    expect((await cambiar(rota.id, fallida)).status).toBe(200)
    expect((await cambiar(rota.id, fallida)).status).toBe(409)
    expect((await cambiar(fuera.id, { estado: 'rechazada', motivo: 'El video está en inglés.' })).status).toBe(200)
    expect((await cambiar(fuera.id, { estado: 'rechazada', motivo: 'El video está en inglés.' })).status).toBe(409)
    await correrLoDeDespues()

    expect(enviados.map((e) => e.subject).sort()).toEqual(['No se pudo terminar: tu comanda', 'No se puede cocinar: tu comanda'])
    expect(enviados.find((e) => e.subject.startsWith('No se pudo'))!.text).toContain('Se cortó la luz en la cocina a mitad del render.')
    expect(enviados.find((e) => e.subject.startsWith('No se puede'))!.text).toContain('El video está en inglés.')
  })

  it('sin Resend no sale nada, y el cambio pasa igual', async () => {
    const { POST } = await import('@/app/api/cocina/comandas/[id]/estado/route')
    const fetchEspia = vi.fn()
    vi.stubGlobal('fetch', fetchEspia)
    vi.stubEnv('RESEND_API_KEY', '')
    const c = await comanda(conCocina, { estado: 'en_el_horno', tomadaPor: 'servidor' })
    expect((await POST(pedido(`/api/cocina/comandas/${c.id}/estado`, { estado: 'lista' }), params(c.id))).status).toBe(200)
    await correrLoDeDespues()
    expect(fetchEspia).not.toHaveBeenCalled()
  })

  it('el enlace de un insumo: solo con la comanda tomada, y no de lo que ya se borró', async () => {
    const tomar = (await import('@/app/api/cocina/comandas/[id]/tomar/route')).POST
    const { GET } = await import('@/app/api/cocina/insumos/[id]/enlace/route')
    const c = await comanda(conCocina)
    const i = await insumo(conCocina, c.id)
    expect((await GET(pedido(`/api/cocina/insumos/${i.id}/enlace`), params(i.id))).status).toBe(409)

    await tomar(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))
    const r = await GET(pedido(`/api/cocina/insumos/${i.id}/enlace`), params(i.id))
    expect(await r.json()).toMatchObject({ url: `https://firmado.ej.cl/cocina/${conCocina}/insumos/abc-video9.mp4?firma=1` })

    const borrado = await insumo(conCocina, c.id, { borradoEn: new Date() })
    expect((await GET(pedido(`/api/cocina/insumos/${borrado.id}/enlace`), params(borrado.id))).status).toBe(404)
  })

  it('una comanda de la cámara de frío le llega al chef igual que siempre, con el uso y el material de más, y lo que no es video ni foto aparte', async () => {
    const { GET } = await import('@/app/api/cocina/comandas/route')
    const tomar = (await import('@/app/api/cocina/comandas/[id]/tomar/route')).POST
    const enlace = (await import('@/app/api/cocina/insumos/[id]/enlace/route')).GET
    const { pedirComanda } = await import('./pedir')
    const { materiales, users } = await esquema()
    const [duena] = await (await db()).select().from(users).where(eq(users.id, conCocina))
    const nuevo = (nombre: string, tipoArchivo: string, uso: string | null) =>
      (async () => {
        const [m] = await (await db())
          .insert(materiales)
          .values({
            ownerId: conCocina,
            nombre,
            uso: uso as 'crudo',
            url: `${BASE}/cocina/${conCocina}/bodega/${crypto.randomUUID()}-${nombre}`,
            bytes: 1000,
            duracionS: tipoArchivo.startsWith('image/') ? null : 61,
            tipoArchivo,
            derechosEn: new Date(),
          })
          .returning()
        return m!
      })()
    const largo = await nuevo('charla.mp4', 'video/mp4', 'crudo')
    const intro = await nuevo('intro.mp4', 'video/mp4', 'intro')
    const logo = await nuevo('logo.png', 'image/png', 'logo')
    const tema = await nuevo('tema.mp3', 'audio/mpeg', 'musica')
    const r = await pedirComanda(
      duena!,
      {
        ref: crypto.randomUUID(),
        principal: largo.id,
        subtipo: 'largo',
        acompanamientos: [
          { id: intro.id, rol: 'imagen' },
          { id: logo.id, rol: 'imagen' },
          { id: tema.id, rol: 'imagen' },
        ],
        formatos: ['clips'],
        cantidad: 'unos-10',
        notas: 'Usa mi intro al principio.',
        paraCuando: null,
        marca: { nombre: 'Marca', handle: null, acento: null, ctaTexto: null },
      },
      new Date(),
    )
    const id = 'id' in r ? r.id : ''
    // Una de antes de la cámara, al lado, sigue llegando igual: sin uso ni material.
    const vieja = await comanda(conCocina)
    await insumo(conCocina, vieja.id)

    const { comandas } = await (await GET(pedido('/api/cocina/comandas'))).json()
    const deLaCamara = comandas.find((c: { id: string }) => c.id === id)
    expect(deLaCamara.instruccion).toBe('Usa mi intro al principio.')
    expect(deLaCamara.minutos).toBe(2)
    expect(deLaCamara.insumos).toEqual([
      { id: expect.any(String), tipo: 'principal', subtipo: 'largo', nombre: 'charla.mp4', bytes: 1000, duracionS: 61, tipoArchivo: 'video/mp4', uso: 'crudo', materialId: largo.id },
      { id: expect.any(String), tipo: 'imagen', subtipo: null, nombre: 'intro.mp4', bytes: 1000, duracionS: 61, tipoArchivo: 'video/mp4', uso: 'intro', materialId: intro.id },
      { id: expect.any(String), tipo: 'imagen', subtipo: null, nombre: 'logo.png', bytes: 1000, duracionS: null, tipoArchivo: 'image/png', uso: 'logo', materialId: logo.id },
    ])
    expect(deLaCamara.extras).toEqual([
      { id: expect.any(String), tipo: 'extra', subtipo: null, nombre: 'tema.mp3', bytes: 1000, duracionS: 61, tipoArchivo: 'audio/mpeg', uso: 'musica', materialId: tema.id },
    ])
    const deAntes = comandas.find((c: { id: string }) => c.id === vieja.id)
    expect(deAntes.insumos).toEqual([expect.objectContaining({ tipo: 'principal', uso: null, materialId: null })])
    expect(deAntes.extras).toEqual([])

    // El enlace sirve para lo de la cámara y para el extra, por la misma ruta: nombra el archivo del material.
    await tomar(pedido(`/api/cocina/comandas/${id}/tomar`, { trabajador: 'servidor' }), params(id))
    for (const [insumoId, material] of [
      [deLaCamara.insumos[0].id, largo],
      [deLaCamara.extras[0].id, tema],
    ] as const) {
      const respuesta = await enlace(pedido(`/api/cocina/insumos/${insumoId}/enlace`), params(insumoId))
      expect(respuesta.status).toBe(200)
      expect((await respuesta.json()).url).toBe(`https://firmado.ej.cl/${material.url.slice(BASE.length + 1)}?firma=1`)
    }
  })

  it('entregar: se anuncia, se sube, y recién con todo arriba llega al mesón', async () => {
    const tomar = (await import('@/app/api/cocina/comandas/[id]/tomar/route')).POST
    const anunciar = (await import('@/app/api/cocina/comandas/[id]/creativos/route')).POST
    const listo = (await import('@/app/api/cocina/creativos/[id]/listo/route')).POST
    const { creativoMedia, creativos } = await esquema()
    const c = await comanda(conCocina)
    const creativo = {
      ref: 'video10/15 golpes',
      pieza: 'video10/15',
      tanda: 'video10-clips-ritmo',
      texto: 'El texto',
      tituloYoutube: 'El título',
      estilo: 'golpes',
      atributos: { estilo: 'golpes' },
      archivos: [
        { nombre: 'v10r15.mp4', tipo: 'video/mp4', bytes: 1000, rol: 'media' },
        { nombre: 'v10r15.jpg', tipo: 'image/jpeg', bytes: 200, rol: 'portada' },
      ],
    }
    const enviar = () => anunciar(pedido(`/api/cocina/comandas/${c.id}/creativos`, creativo), params(c.id))

    // Sin tomar, no se entrega.
    expect((await enviar()).status).toBe(409)
    await tomar(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))

    const r1 = await enviar()
    expect(r1.status).toBe(201)
    const anuncio = await r1.json()
    expect(anuncio).toMatchObject({ estado: 'subiendo', repetido: false })
    expect(anuncio.archivos).toHaveLength(2)
    // En la carpeta del dueño: programarlo después no lo vuelve a bajar.
    for (const a of anuncio.archivos) expect(a.url).toMatch(new RegExp(`^${BASE}/scheduled/${conCocina}/cocina/${c.id}/`))
    const [fila] = await (await db()).select().from(creativos).where(eq(creativos.id, anuncio.id))
    expect(fila).toMatchObject({ estado: 'subiendo', pieza: 'video10/15', tipo: 'video', tituloYoutube: 'El título' })
    expect(fila!.portadaUrl).toBe(anuncio.archivos.find((a: { rol: string }) => a.rol === 'portada').url)

    // Anunciarlo otra vez mientras sube: el mismo creativo, con enlaces nuevos, y nada creado.
    const otraVez = await enviar()
    expect(otraVez.status).toBe(200)
    const r2 = await otraVez.json()
    expect(r2).not.toHaveProperty('nuevo')
    expect(r2.id).toBe(anuncio.id)
    expect(r2.archivos.map((a: { url: string }) => a.url)).toEqual(anuncio.archivos.map((a: { url: string }) => a.url))

    // Cerrarlo sin subir todo: dice qué falta.
    subidos.set(anuncio.archivos[0].url, 1000)
    const sinPortada = await listo(pedido(`/api/cocina/creativos/${anuncio.id}/listo`, {}), params(anuncio.id))
    expect(sinPortada.status).toBe(409)
    expect(await sinPortada.json()).toEqual({ error: 'Falta subir «v10r15.jpg», o pesa distinto de lo anunciado.' })

    subidos.set(anuncio.archivos[1].url, 200)
    const cerrado = await listo(pedido(`/api/cocina/creativos/${anuncio.id}/listo`, {}), params(anuncio.id))
    expect(await cerrado.json()).toEqual({ ok: true, id: anuncio.id, estado: 'mesa' })
    const [enElMeson] = await (await db()).select().from(creativos).where(eq(creativos.id, anuncio.id))
    const dias = (enElMeson!.expiraEn!.getTime() - Date.now()) / 86_400_000
    expect(dias).toBeGreaterThan(29.9)
    expect(dias).toBeLessThanOrEqual(30)

    // Ya en el mesón: anunciarlo otra vez no crea nada.
    const r3 = await (await enviar()).json()
    expect(r3).toMatchObject({ id: anuncio.id, repetido: true, archivos: [] })
    const media = await (await db()).select().from(creativoMedia).where(eq(creativoMedia.creativoId, anuncio.id))
    expect(media).toHaveLength(2)
  })

  it('tres anuncios de la misma ref a la vez terminan en un solo creativo', async () => {
    const tomar = (await import('@/app/api/cocina/comandas/[id]/tomar/route')).POST
    const anunciar = (await import('@/app/api/cocina/comandas/[id]/creativos/route')).POST
    const { creativoMedia, creativos } = await esquema()
    const c = await comanda(conCocina)
    await tomar(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))
    const cuerpo = { ref: 'reintento', archivos: [{ nombre: 'r.mp4', tipo: 'video/mp4', bytes: 10, rol: 'media' }] }

    const respuestas = await Promise.all(
      [1, 2, 3].map(() => anunciar(pedido(`/api/cocina/comandas/${c.id}/creativos`, cuerpo), params(c.id))),
    )
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 200, 201])
    const ids = new Set((await Promise.all(respuestas.map((r) => r.json()))).map((b: { id: string }) => b.id))
    expect(ids.size).toBe(1)
    const filas = await (await db()).select().from(creativos).where(eq(creativos.comandaId, c.id))
    expect(filas).toHaveLength(1)
    const media = await (await db()).select().from(creativoMedia).where(eq(creativoMedia.creativoId, filas[0]!.id))
    expect(media).toHaveLength(1)
  })

  it('un anuncio que choca con otro de la misma ref a medio guardar devuelve el de ese otro', async () => {
    const tomar = (await import('@/app/api/cocina/comandas/[id]/tomar/route')).POST
    const anunciar = (await import('@/app/api/cocina/comandas/[id]/creativos/route')).POST
    const { creativos } = await esquema()
    const c = await comanda(conCocina)
    await tomar(pedido(`/api/cocina/comandas/${c.id}/tomar`, { trabajador: 'servidor' }), params(c.id))

    // El otro anuncio ya escribió su fila pero no cerró su transacción: este no la ve al buscar,
    // y al insertar queda esperando el candado. Cuando el otro confirma, choca con la unicidad.
    // Las tres llamadas a la vez de la prueba anterior no garantizan llegar a este punto; esto sí.
    const otro = postgres(direccion, { max: 1, onnotice: () => {} })
    const vigia = postgres(direccion, { max: 1, onnotice: () => {} })
    try {
      let escrito!: (id: string) => void
      const idDelOtro = new Promise<string>((r) => (escrito = r))
      let soltar!: () => void
      const suelto = new Promise<void>((r) => (soltar = r))
      const transaccion = otro.begin(async (tx) => {
        const [fila] = await tx`insert into creativos (owner_id, comanda_id, ref, tipo) values (${conCocina}, ${c.id}, 'choque', 'video') returning id`
        escrito(fila!.id as string)
        await suelto
      })
      const id = await idDelOtro

      const respuesta = anunciar(
        pedido(`/api/cocina/comandas/${c.id}/creativos`, {
          ref: 'choque',
          archivos: [{ nombre: 'c.mp4', tipo: 'video/mp4', bytes: 10, rol: 'media' }],
        }),
        params(c.id),
      )
      for (let i = 0; i < 100; i++) {
        const [{ n }] = await vigia`select count(*)::int as n from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'`
        if (n > 0) break
        await new Promise((r) => setTimeout(r, 50))
      }
      soltar()
      await transaccion

      const r = await respuesta
      expect(r.status).toBe(200)
      expect(await r.json()).toMatchObject({ id, estado: 'subiendo', repetido: false })
      const filas = await (await db()).select().from(creativos).where(eq(creativos.comandaId, c.id))
      expect(filas.map((f) => f.id)).toEqual([id])
    } finally {
      await otro.end()
      await vigia.end()
    }
  })

  it('una consulta del chef trae hasta cien, las más viejas', async () => {
    const { GET } = await import('@/app/api/cocina/comandas/route')
    const { comandas } = await esquema()
    const t0 = Date.UTC(2026, 9, 1)
    await (await db()).insert(comandas).values(
      Array.from({ length: 101 }, (_, n) => ({
        ownerId: conCocina,
        ref: `fila-${n}`,
        pedido: {},
        receta: {},
        creadaEn: new Date(t0 + n * 60_000),
      })),
    )
    const cuerpo = await (await GET(pedido('/api/cocina/comandas'))).json()
    expect(cuerpo.comandas).toHaveLength(100)
    expect(cuerpo.comandas.map((c: { ref: string }) => c.ref)).not.toContain('fila-100')
  })

  it('el latido queda anotado por trabajador', async () => {
    const { POST } = await import('@/app/api/cocina/latido/route')
    const { latidos } = await esquema()
    expect((await POST(pedido('/api/cocina/latido', { trabajador: 'servidor', datos: { trabajos: 2 } }))).status).toBe(200)
    expect((await POST(pedido('/api/cocina/latido', { trabajador: 'servidor', datos: { trabajos: 1 } }))).status).toBe(200)
    const filas = await (await db()).select().from(latidos)
    expect(filas).toHaveLength(1)
    expect(filas[0]!.datos).toEqual({ trabajos: 1 })
  })
})
