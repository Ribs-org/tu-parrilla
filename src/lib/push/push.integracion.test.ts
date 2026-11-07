import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// Los avisos al teléfono contra una Postgres de verdad, con Expo de mentira (un `fetch` que anota
// cada lote): registrar y borrar el token de un teléfono, mandarle a una cuenta y olvidar el token
// que Expo da por muerto, y el resumen de La Mesa con su hora entre uno y otro.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const MINUTO = 60_000

type Lote = Array<{ to: string; title: string; body: string; data: { tipo: string } }>
const lotes: Lote[] = []
/** Lo que contesta Expo a cada mensaje, por token; sin entrada, «ok». */
const respuestaPorToken = new Map<string, unknown>()

function expoDeMentira() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const lote = JSON.parse(String(init.body)) as Lote
      lotes.push(lote)
      return new Response(JSON.stringify({ data: lote.map((m) => respuestaPorToken.get(m.to) ?? { status: 'ok', id: 'r' }) }), {
        status: 200,
      })
    }),
  )
}

async function usuario(tema: 'noche' | 'dia' = 'noche') {
  const { users } = await esquema()
  const [u] = await (await db()).insert(users).values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl`, tema }).returning()
  return u!
}

const token = () => `ExponentPushToken[${crypto.randomUUID().replaceAll('-', '')}]`

describe.skipIf(!URL_PRUEBAS)('los avisos al teléfono contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_push')
  }, 60_000)

  afterEach(() => {
    lotes.length = 0
    respuestaPorToken.clear()
    vi.unstubAllGlobals()
  })

  it('el token es del teléfono: si entra otra cuenta, pasa a ella; y cada una borra solo el suyo', async () => {
    const { pushTokens } = await esquema()
    const { registrarToken, borrarToken } = await import('./enviar')
    const ana = await usuario()
    const beto = await usuario()
    const t = token()

    await registrarToken(ana, t, 'android')
    await registrarToken(ana, t, 'android')
    let filas = await (await db()).select().from(pushTokens).where(eq(pushTokens.token, t))
    expect(filas).toHaveLength(1)
    expect(filas[0]!.ownerId).toBe(ana.id)

    await registrarToken(beto, t, 'android')
    filas = await (await db()).select().from(pushTokens).where(eq(pushTokens.token, t))
    expect(filas.map((f) => f.ownerId)).toEqual([beto.id])

    expect(await borrarToken(ana.id, t)).toBe(false)
    expect(await borrarToken(beto.id, t)).toBe(true)
    expect(await (await db()).select().from(pushTokens).where(eq(pushTokens.token, t))).toEqual([])
  })

  it('manda a cada teléfono de la cuenta, en su modo, y olvida el que Expo da por muerto', async () => {
    expoDeMentira()
    const { pushTokens } = await esquema()
    const { registrarToken, avisarAlTelefono } = await import('./enviar')
    const { avisoDeQuemado } = await import('./avisos')
    const u = await usuario('dia')
    const vivo = token()
    const muerto = token()
    await registrarToken(u, vivo, 'android')
    await registrarToken(u, muerto, 'ios')
    respuestaPorToken.set(muerto, { status: 'error', message: 'no', details: { error: 'DeviceNotRegistered' } })

    const r = await avisarAlTelefono(u.id, (tema) =>
      avisoDeQuemado({ postId: 'p', red: 'instagram', handle: null, texto: 'Hola', motivo: '' }, tema),
    )
    expect(r).toEqual({ telefonos: 2, aceptados: 1 })
    expect(lotes).toHaveLength(1)
    expect(lotes[0]!.map((m) => m.to).sort()).toEqual([vivo, muerto].sort())
    expect(lotes[0]![0]!.title).toBe('Se echó a perder: Instagram')
    const quedan = await (await db()).select({ token: pushTokens.token }).from(pushTokens).where(eq(pushTokens.ownerId, u.id))
    expect(quedan).toEqual([{ token: vivo }])
  })

  it('una cuenta sin teléfonos no le pide nada a Expo', async () => {
    expoDeMentira()
    const { avisarAlTelefono } = await import('./enviar')
    const { avisoDeRespuesta } = await import('./avisos')
    const u = await usuario()
    expect(await avisarAlTelefono(u.id, (tema) => avisoDeRespuesta({ id: 's', respuesta: 'Listo' }, tema))).toEqual({
      telefonos: 0,
      aceptados: 0,
    })
    expect(lotes).toEqual([])
  })

  it('La Mesa: un resumen con lo pendiente que entró, y el siguiente recién pasada la hora', async () => {
    expoDeMentira()
    const { postComments, socialAccounts, users } = await esquema()
    const { registrarToken } = await import('./enviar')
    const { resumirComentarios } = await import('./comentarios')
    const u = await usuario()
    const sinTelefono = await usuario()
    await registrarToken(u, token(), 'android')
    const ahora = new Date('2026-11-07T15:00:00Z')

    const cuenta = async (ownerId: string, network: string) => {
      const [c] = await (await db()).insert(socialAccounts).values({ ownerId, network, externalId: crypto.randomUUID() }).returning()
      return c!
    }
    const ig = await cuenta(u.id, 'instagram')
    const yt = await cuenta(u.id, 'youtube')
    const otra = await cuenta(sinTelefono.id, 'instagram')
    const comentario = (accountId: string, network: string, hace: number, extra: Record<string, unknown> = {}) => ({
      accountId,
      network,
      postExternalId: 'post',
      externalId: crypto.randomUUID(),
      text: 'buenísimo',
      publishedAt: new Date(ahora.getTime() - hace * MINUTO),
      createdAt: new Date(ahora.getTime() - hace * MINUTO),
      ...extra,
    })
    await (await db()).insert(postComments).values([
      comentario(ig.id, 'instagram', 10),
      comentario(ig.id, 'instagram', 5),
      comentario(yt.id, 'youtube', 3),
      // Ya respondido, automático, o de antes de la última hora: no cuentan.
      comentario(ig.id, 'instagram', 4, { state: 'enviado' }),
      comentario(ig.id, 'instagram', 4, { automatico: true }),
      comentario(ig.id, 'instagram', 120),
      // De una cuenta sin teléfonos: no le llega a nadie.
      comentario(otra.id, 'instagram', 2),
    ])

    expect(await resumirComentarios(ahora)).toEqual({ avisados: 1 })
    expect(lotes).toHaveLength(1)
    expect(lotes[0]![0]).toMatchObject({
      title: '3 comentarios nuevos en La Mesa',
      body: 'Esperan tu respuesta, en Instagram y YouTube.',
      data: { tipo: 'comentarios' },
    })
    const [fila] = await (await db()).select({ hasta: users.pushComentariosHasta }).from(users).where(eq(users.id, u.id))
    expect(fila!.hasta).toEqual(ahora)

    // Entra otro a los diez minutos: espera la hora.
    const despues = new Date(ahora.getTime() + 10 * MINUTO)
    await (await db()).insert(postComments).values({ ...comentario(ig.id, 'instagram', 0), createdAt: despues, publishedAt: despues })
    expect(await resumirComentarios(new Date(despues.getTime() + MINUTO))).toEqual({ avisados: 0 })
    expect(lotes).toHaveLength(1)

    // Pasada la hora, cuenta solo el que entró después del resumen.
    expect(await resumirComentarios(new Date(ahora.getTime() + 61 * MINUTO))).toEqual({ avisados: 1 })
    expect(lotes[1]![0]!.title).toBe('Un comentario nuevo en La Mesa')
  })

  it('La Mesa: si Expo no acepta el resumen, la marca vuelve y la pasada siguiente lo intenta', async () => {
    expoDeMentira()
    const { postComments, socialAccounts, users } = await esquema()
    const { registrarToken } = await import('./enviar')
    const { resumirComentarios } = await import('./comentarios')
    const u = await usuario()
    const t = token()
    await registrarToken(u, t, 'android')
    respuestaPorToken.set(t, { status: 'error', message: 'cupo', details: { error: 'MessageRateExceeded' } })
    const ahora = new Date('2026-11-07T18:00:00Z')
    const [c] = await (await db()).insert(socialAccounts).values({ ownerId: u.id, network: 'facebook', externalId: crypto.randomUUID() }).returning()
    await (await db()).insert(postComments).values({
      accountId: c!.id,
      network: 'facebook',
      postExternalId: 'post',
      externalId: crypto.randomUUID(),
      text: 'hola',
      publishedAt: new Date(ahora.getTime() - MINUTO),
      createdAt: new Date(ahora.getTime() - MINUTO),
    })

    expect(await resumirComentarios(ahora)).toEqual({ avisados: 0 })
    const [fila] = await (await db()).select({ hasta: users.pushComentariosHasta }).from(users).where(eq(users.id, u.id))
    expect(fila!.hasta).toBeNull()

    respuestaPorToken.clear()
    expect(await resumirComentarios(new Date(ahora.getTime() + 5 * MINUTO))).toEqual({ avisados: 1 })
  })

  it('revocar las sesiones corta los avisos: el token de la sesión vieja se borra sin recibir nada', async () => {
    expoDeMentira()
    const { pushTokens, users } = await esquema()
    const { registrarToken, avisarAlTelefono } = await import('./enviar')
    const { avisoDeRespuesta } = await import('./avisos')
    const u = await usuario()
    const t = token()
    await registrarToken(u, t, 'android')
    await (await db()).update(users).set({ sesionVersion: u.sesionVersion + 1 }).where(eq(users.id, u.id))

    expect(await avisarAlTelefono(u.id, (tema) => avisoDeRespuesta({ id: 's', respuesta: 'Listo' }, tema))).toEqual({
      telefonos: 0,
      aceptados: 0,
    })
    expect(lotes).toEqual([])
    expect(await (await db()).select().from(pushTokens).where(eq(pushTokens.token, t))).toEqual([])
  })
})
