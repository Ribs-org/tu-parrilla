import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { asc, eq } from 'drizzle-orm'
import type { Usuario } from '@/db'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Las preguntas del chef y la alarma de la cocina contra una Postgres de verdad, entrando por las
// rutas del chef y del teléfono. Lo que importa lo deciden las condiciones del SQL: que una
// pregunta pase la comanda a `pregunta` una sola vez y mande un solo correo, que la conteste solo
// su dueño, que contestarla o que pase el plazo la devuelva a donde estaba —una de las dos, nunca
// las dos—, y que la alarma suene una vez por comanda y por motivo.

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

const despues: Array<() => unknown> = []
vi.mock('next/server', async (importOriginal) => {
  const real = await importOriginal<typeof import('next/server')>()
  return { ...real, after: (tarea: () => unknown) => void despues.push(tarea) }
})
async function correrLoDeDespues() {
  while (despues.length > 0) await despues.shift()!()
}

let quien: Usuario | null = null
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => quien }))
vi.mock('@/lib/auth', () => ({
  requireUser: async () => {
    if (!quien) throw new Error('sin sesión')
    return quien
  },
}))

/** Resend de mentira: cada correo que «sale». `falla` hace que Resend conteste 500. */
const correo = { enviados: [] as Array<{ to: string; subject: string; text: string }>, falla: false }
function correosDeMentira() {
  correo.enviados = []
  correo.falla = false
  vi.stubEnv('RESEND_API_KEY', 're_de_prueba')
  vi.stubEnv('DOMINIO_PRODUCTO', 'tu-parrilla.cl')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      if (correo.falla) return new Response('caído', { status: 500 })
      correo.enviados.push(JSON.parse(String(init.body)))
      return new Response('{"id":"x"}', { status: 200 })
    }),
  )
}

const SECRETO = 'secreto-de-la-cocina'
const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let duena: Usuario
let otra: Usuario
let sinCocina: Usuario

function delChef(ruta: string, cuerpo?: unknown): Request {
  return new Request(`https://tu-parrilla.cl${ruta}`, {
    method: cuerpo === undefined ? 'GET' : 'POST',
    headers: { authorization: `Bearer ${SECRETO}` },
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  })
}
function delTelefono(ruta: string, cuerpo: unknown): Request {
  return new Request(`https://tu-parrilla.cl${ruta}`, {
    method: 'POST',
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
}
const params = (id: string) => ({ params: Promise.resolve({ id }) })

async function comanda(ownerId: string, cambios: Record<string, unknown> = {}) {
  const { comandas } = await esquema()
  const [c] = await (await db())
    .insert(comandas)
    .values({ ownerId, ref: crypto.randomUUID(), pedido: { notas: 'Borrar los subtítulos.' }, receta: {}, estado: 'revisando', ...cambios })
    .returning()
  return c!
}

const enUnaHora = () => new Date(Date.now() + 3_600_000).toISOString()
const pregunta = (cambios: Record<string, unknown> = {}) => ({
  texto: '¿Qué tema destaco?',
  opciones: ['La parte de ventas', 'La anécdota del final'],
  plazo: enUnaHora(),
  porDefecto: 'La parte de ventas',
  ...cambios,
})

const rutas = async () => ({
  preguntar: (await import('@/app/api/cocina/comandas/[id]/preguntas/route')).POST,
  respuestas: (await import('@/app/api/cocina/comandas/[id]/respuestas/route')).GET,
  listar: (await import('@/app/api/cocina/comandas/route')).GET,
  estado: (await import('@/app/api/cocina/comandas/[id]/estado/route')).POST,
  responder: (await import('@/app/api/mobile/cocina/preguntas/[id]/respuesta/route')).POST,
  cocinaDelTelefono: (await import('@/app/api/mobile/cocina/route')).GET,
})

async function estadoDe(id: string) {
  const { comandas } = await esquema()
  return (await (await db()).select().from(comandas).where(eq(comandas.id, id)))[0]!
}
async function eventosDe(id: string) {
  const { comandaEventos } = await esquema()
  return (await db()).select().from(comandaEventos).where(eq(comandaEventos.comandaId, id)).orderBy(asc(comandaEventos.creadoEn))
}

describe.skipIf(!URL_PRUEBAS)('las preguntas del chef y la alarma, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_preguntas_cocina')
    const { users } = await esquema()
    const filas = await (await db())
      .insert(users)
      .values([
        { correo: 'duena@ejemplo.cl', nombre: 'Daniel Máximo', cocinaDesde: new Date() },
        { correo: 'otra@ejemplo.cl', nombre: 'Otra', cocinaDesde: new Date() },
        { correo: 'sin@ejemplo.cl', nombre: 'Sin cocina' },
      ])
      .returning()
    ;[duena, otra, sinCocina] = filas as [Usuario, Usuario, Usuario]
  }, 60_000)

  afterAll(() => vi.unstubAllEnvs())

  beforeEach(async () => {
    const { comandas } = await esquema()
    await (await db()).delete(comandas)
    despues.length = 0
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.stubEnv('COCINA_SECRET', SECRETO)
    correosDeMentira()
  })

  it('preguntar: la comanda pasa a «pregunta», el dueño recibe un correo, y reintentar no hace otra', async () => {
    const r = await rutas()
    const c = await comanda(duena.id, { mensaje: 'Revisando el audio' })
    const hecha = await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta()), params(c.id))
    expect(hecha.status).toBe(201)
    const cuerpo = await hecha.json()
    expect(cuerpo).toMatchObject({
      ok: true,
      id: c.id,
      estado: 'pregunta',
      repetida: false,
      pregunta: { texto: '¿Qué tema destaco?', opciones: ['La parte de ventas', 'La anécdota del final'], porDefecto: 'La parte de ventas', vuelveA: 'revisando', respuesta: null, porPlazo: false },
    })
    expect(await estadoDe(c.id)).toMatchObject({ estado: 'pregunta', mensaje: null })
    expect((await eventosDe(c.id)).map((e) => [e.estado, e.mensaje])).toEqual([['pregunta', '¿Qué tema destaco?']])

    await correrLoDeDespues()
    expect(correo.enviados).toHaveLength(1)
    expect(correo.enviados[0]).toMatchObject({ to: 'duena@ejemplo.cl', subject: 'El chef te pregunta: tu comanda' })
    expect(correo.enviados[0]!.text).toContain('Las opciones: «La parte de ventas», «La anécdota del final».')
    expect(correo.enviados[0]!.text).toMatch(/Si no contestas (hoy|mañana) antes de las \d\d:\d\d, el chef sigue con «La parte de ventas»\./)

    // El mismo reintento: la misma pregunta, sin otro correo. Otra distinta, no.
    const otraVez = await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta()), params(c.id))
    expect(otraVez.status).toBe(200)
    expect(await otraVez.json()).toMatchObject({ repetida: true, pregunta: { id: cuerpo.pregunta.id } })
    const distinta = await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta({ texto: '¿Y el tono?' })), params(c.id))
    expect(distinta.status).toBe(409)
    expect(await distinta.json()).toEqual({ error: 'Esa comanda ya espera la respuesta de otra pregunta: pregunta de nuevo cuando llegue.' })
    await correrLoDeDespues()
    expect(correo.enviados).toHaveLength(1)

    // Mientras espera, el chef no la mueve con `estado`.
    const mover = await r.estado(delChef(`/api/cocina/comandas/${c.id}/estado`, { estado: 'en_el_horno' }), params(c.id))
    expect(mover.status).toBe(409)
    expect(await mover.json()).toEqual({ error: 'Una comanda en «pregunta» no pasa a «en_el_horno».' })
  })

  it('desde dónde se pregunta: no sin tomar, no en el horno, no lo terminado ni lo de quien no tiene la cocina', async () => {
    const r = await rutas()
    const casos: Array<[Record<string, unknown>, string, number, string]> = [
      [{ estado: 'recibida' }, duena.id, 409, 'Esa comanda todavía no está tomada: tómala primero.'],
      [{ estado: 'en_el_horno' }, duena.id, 409, 'Una comanda en «en_el_horno» no pasa a «pregunta».'],
      [{ estado: 'cancelada' }, duena.id, 409, 'Esa comanda ya terminó: no recibe más cambios.'],
      [{}, sinCocina.id, 404, 'Esa comanda no existe.'],
    ]
    for (const [cambios, dueno, status, frase] of casos) {
      const c = await comanda(dueno, cambios)
      const res = await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta()), params(c.id))
      expect(res.status, JSON.stringify(cambios)).toBe(status)
      expect(await res.json()).toEqual({ error: frase })
    }
    const c = await comanda(duena.id, { estado: 'en_preparacion' })
    const mala = await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta({ porDefecto: 'Otra' })), params(c.id))
    expect(mala.status).toBe(400)
    expect((await mala.json()).error).toMatch(/^«porDefecto» es lo que haces si nadie contesta/)
    expect((await estadoDe(c.id)).estado).toBe('en_preparacion')
  })

  it('contestar desde el teléfono: solo la dueña, solo una opción, y la comanda vuelve a donde estaba con la respuesta para el chef', async () => {
    const r = await rutas()
    const c = await comanda(duena.id, { estado: 'en_preparacion' })
    const { pregunta: p } = await (await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta()), params(c.id))).json()

    // La pregunta llega a la lista del teléfono, con el plazo en palabras.
    quien = duena
    const enLaApp = await (await r.cocinaDelTelefono(new Request('https://tu-parrilla.cl/api/mobile/cocina', { headers: { authorization: 'Bearer token' } }))).json()
    expect(enLaApp.comandas[0]).toMatchObject({
      estado: 'pregunta',
      tramo: 2,
      pregunta: { id: p.id, texto: '¿Qué tema destaco?', porDefecto: 'La parte de ventas', siNoContestas: expect.stringMatching(/^Si no contestas /) },
    })

    // Otra persona no la ve ni la contesta.
    quien = otra
    const ajena = await r.responder(delTelefono(`/api/mobile/cocina/preguntas/${p.id}/respuesta`, { respuesta: 'La parte de ventas' }), params(p.id))
    expect(ajena.status).toBe(409)
    expect(await ajena.json()).toEqual({ error: 'Esa pregunta ya no espera respuesta: se respondió, pasó su plazo o la comanda se canceló.' })

    quien = duena
    const noEsOpcion = await r.responder(delTelefono(`/api/mobile/cocina/preguntas/${p.id}/respuesta`, { respuesta: 'Otra cosa' }), params(p.id))
    expect(noEsOpcion.status).toBe(400)
    expect(await noEsOpcion.json()).toEqual({ error: 'Elige una de las opciones del chef.' })
    const bien = await r.responder(delTelefono(`/api/mobile/cocina/preguntas/${p.id}/respuesta`, { respuesta: 'la anécdota del final' }), params(p.id))
    expect(bien.status).toBe(200)
    expect((await estadoDe(c.id)).estado).toBe('en_preparacion')
    expect((await eventosDe(c.id)).map((e) => [e.estado, e.mensaje])).toEqual([
      ['pregunta', '¿Qué tema destaco?'],
      ['en_preparacion', 'Respondiste: «La anécdota del final».'],
    ])
    // Contestarla de nuevo ya no se puede.
    expect((await r.responder(delTelefono(`/api/mobile/cocina/preguntas/${p.id}/respuesta`, { respuesta: 'La parte de ventas' }), params(p.id))).status).toBe(409)

    // El chef lo lee en sus respuestas y en la lista de lo que está en preparación.
    const respuestas = await (await r.respuestas(delChef(`/api/cocina/comandas/${c.id}/respuestas`), params(c.id))).json()
    expect(respuestas).toMatchObject({
      id: c.id,
      estado: 'en_preparacion',
      preguntas: [{ id: p.id, respuesta: 'La anécdota del final', porPlazo: false, vuelveA: 'en_preparacion', respondidaEn: expect.any(String) }],
    })
    const lista = await (await r.listar(delChef('/api/cocina/comandas?estado=en_preparacion'))).json()
    expect(lista.comandas[0].preguntas).toEqual(respuestas.preguntas)
  })

  it('contestar desde el panel, con una respuesta libre', async () => {
    const { responderPreguntaPropia } = await import('@/app/admin/cocina-actions')
    const { comandasDelDueno } = await import('./panel')
    const r = await rutas()
    const c = await comanda(duena.id)
    await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta({ opciones: null, porDefecto: 'Sigo con la parte de ventas.' })), params(c.id))
    const [vista] = await comandasDelDueno(duena.id)
    expect(vista!.pregunta).toMatchObject({ texto: '¿Qué tema destaco?', opciones: null, porDefecto: 'Sigo con la parte de ventas.', vuelveA: 'revisando' })

    quien = duena
    expect(await responderPreguntaPropia(vista!.pregunta!.id, '   ')).toEqual({ error: 'Escribe tu respuesta al chef.' })
    expect(await responderPreguntaPropia(vista!.pregunta!.id, ' Destaca los precios. ')).toEqual({})
    const [despuesDe] = await comandasDelDueno(duena.id)
    expect(despuesDe).toMatchObject({ estado: 'revisando', pregunta: null })
    const respuestas = await (await r.respuestas(delChef(`/api/cocina/comandas/${c.id}/respuestas`), params(c.id))).json()
    expect(respuestas.preguntas[0]).toMatchObject({ respuesta: 'Destaca los precios.', porPlazo: false })
  })

  it('el plazo: pasado, la próxima lectura del chef la cierra con la opción por defecto, y contestar después ya no cuenta', async () => {
    const r = await rutas()
    const { preguntas } = await esquema()
    const c = await comanda(duena.id, { estado: 'en_preparacion' })
    const { pregunta: p } = await (await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta()), params(c.id))).json()
    await (await db()).update(preguntas).set({ plazo: new Date(Date.now() - 60_000) }).where(eq(preguntas.id, p.id))

    // El chef pregunta por lo nuevo, como cada minuto: en esa misma lectura ya está de vuelta.
    const lista = await (await r.listar(delChef('/api/cocina/comandas?estado=en_preparacion'))).json()
    expect(lista.comandas.map((x: { id: string }) => x.id)).toEqual([c.id])
    expect(lista.comandas[0].preguntas[0]).toMatchObject({ respuesta: 'La parte de ventas', porPlazo: true })
    expect((await eventosDe(c.id)).at(-1)).toMatchObject({ estado: 'en_preparacion', mensaje: 'Pasó el plazo: el chef sigue con «La parte de ventas».' })

    quien = duena
    const tarde = await r.responder(delTelefono(`/api/mobile/cocina/preguntas/${p.id}/respuesta`, { respuesta: 'La anécdota del final' }), params(p.id))
    expect(tarde.status).toBe(409)
  })

  it('el plazo, por el cron; y lo cancelado no se cierra ni vuelve', async () => {
    const r = await rutas()
    const { vencerPreguntas } = await import('./preguntar')
    const { cancelarComanda } = await import('./panel')
    const { preguntas } = await esquema()
    const vence = await comanda(duena.id)
    const cancelada = await comanda(duena.id)
    for (const c of [vence, cancelada]) await r.preguntar(delChef(`/api/cocina/comandas/${c.id}/preguntas`, pregunta()), params(c.id))
    expect(await cancelarComanda(duena.id, cancelada.id, new Date())).toEqual({ ok: true })
    await (await db()).update(preguntas).set({ plazo: new Date(Date.now() - 60_000) })

    expect(await vencerPreguntas(new Date())).toBe(1)
    expect((await estadoDe(vence.id)).estado).toBe('revisando')
    expect((await estadoDe(cancelada.id)).estado).toBe('cancelada')
    expect(await vencerPreguntas(new Date())).toBe(0)
  })

  it('la alarma: sin tomar a la media hora y atrasada a la hora, un correo por pasada, una vez por motivo', async () => {
    const { vigilarLaCocina } = await import('./alarma')
    const { comandas } = await esquema()
    vi.stubEnv('ADMIN_EMAIL', 'admin@ejemplo.cl')
    const ahora = new Date('2026-11-06T15:00:00Z')
    const hace = (minutos: number) => new Date(ahora.getTime() - minutos * 60_000)
    const colgada = await comanda(duena.id, { estado: 'recibida', creadaEn: hace(4 * 24 * 60) })
    await comanda(duena.id, { estado: 'recibida', creadaEn: hace(10) })
    const atrasada = await comanda(otra.id, { estado: 'en_el_horno', creadaEn: hace(600), eta: hace(90) })
    await comanda(otra.id, { estado: 'en_el_horno', creadaEn: hace(600), eta: hace(30) })
    await comanda(duena.id, { estado: 'pregunta', creadaEn: hace(600), eta: hace(300) })
    await comanda(sinCocina.id, { estado: 'recibida', creadaEn: hace(600) })

    expect(await vigilarLaCocina(ahora)).toEqual({ avisadas: 2 })
    expect(correo.enviados).toHaveLength(1)
    const [aviso] = correo.enviados
    expect(aviso).toMatchObject({ to: 'admin@ejemplo.cl', subject: 'La Cocina: una comanda sin tomar y una comanda atrasada' })
    expect(aviso!.text).toContain(`- Sin tomar hace 4 días: Daniel Máximo (duena@ejemplo.cl), comanda ${colgada.id.slice(0, 8)}.`)
    expect(aviso!.text).toContain('  Pidió: «Borrar los subtítulos.».')
    expect(aviso!.text).toContain(`- Pasó su hora estimada hace 1 h 30 min, en «Al fuego»: Otra (otra@ejemplo.cl), comanda ${atrasada.id.slice(0, 8)}.`)
    expect(aviso!.text).toContain('https://tu-parrilla.cl/admin/usuarios')

    // La pasada siguiente no repite nada.
    expect(await vigilarLaCocina(new Date(ahora.getTime() + 5 * 60_000))).toEqual({ avisadas: 0 })
    expect(correo.enviados).toHaveLength(1)

    // El chef da una hora nueva y también pasa: es otro atraso. Para entonces, la que se colgó hace
    // diez minutos y la que estaba media hora atrasada también suenan, cada una por primera vez; la
    // de hace cuatro días, no.
    const nueva = new Date(ahora.getTime() + 10 * 60_000)
    await (await db()).update(comandas).set({ eta: nueva }).where(eq(comandas.id, atrasada.id))
    expect(await vigilarLaCocina(new Date(nueva.getTime() + 61 * 60_000))).toEqual({ avisadas: 3 })
    expect(correo.enviados).toHaveLength(2)
    expect(correo.enviados[1]!.subject).toBe('La Cocina: una comanda sin tomar y 2 comandas atrasadas')
    expect(correo.enviados[1]!.text).toContain(`comanda ${atrasada.id.slice(0, 8)}.`)
    expect(correo.enviados[1]!.text).not.toContain(`comanda ${colgada.id.slice(0, 8)}`)
  })

  it('la alarma: si el correo no sale, se suelta y suena en la pasada siguiente; sin a quién avisar, no marca nada', async () => {
    const { vigilarLaCocina } = await import('./alarma')
    const ahora = new Date('2026-11-06T15:00:00Z')
    const c = await comanda(duena.id, { estado: 'recibida', creadaEn: new Date(ahora.getTime() - 45 * 60_000) })

    vi.stubEnv('ADMIN_EMAIL', '')
    vi.stubEnv('PUBLISH_ALERT_TO', '')
    expect(await vigilarLaCocina(ahora)).toEqual({ avisadas: 0 })
    expect((await estadoDe(c.id)).alarmaRecibidaEn).toBeNull()

    vi.stubEnv('ADMIN_EMAIL', 'admin@ejemplo.cl')
    correo.falla = true
    expect(await vigilarLaCocina(ahora)).toMatchObject({ avisadas: 0, error: expect.any(String) })
    expect((await estadoDe(c.id)).alarmaRecibidaEn).toBeNull()

    correo.falla = false
    expect(await vigilarLaCocina(ahora)).toEqual({ avisadas: 1 })
    expect((await estadoDe(c.id)).alarmaRecibidaEn).toEqual(ahora)
  })
})
