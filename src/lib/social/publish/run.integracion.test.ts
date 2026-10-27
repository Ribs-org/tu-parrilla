import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'
import type { PublishInput, PublishOutcome } from './publisher'

// La publicación contra una Postgres de verdad: el reclamo de cada destino es SQL (un
// `UPDATE` con condiciones y `RETURNING`, un `SELECT … FOR UPDATE`), y lo que importa —que
// dos corridas no publiquen dos veces, que una corrida que muere gaste su intento, que no se
// pueda borrar lo que está saliendo— solo se puede ver con la base decidiendo quién gana. La
// red es de mentira: un publicador que hace lo que cada prueba pide.

const publicar = vi.fn<(input: PublishInput) => Promise<PublishOutcome>>()

vi.mock('server-only', () => ({}))
vi.mock('./index', () => ({
  PUBLISHERS: [{ network: 'instagram', ensureCredential: async () => 'token', publish: (input: PublishInput) => publicar(input) }],
}))
vi.mock('@/lib/social', () => ({ CONNECTORS: [] }))
vi.mock('./alert', () => ({ sendFailureAlert: vi.fn(async () => {}) }))
vi.mock('@/lib/avisos/run', () => ({ marcarCaida: vi.fn(async () => {}) }))
vi.mock('@/lib/storage', () => ({ borrar: vi.fn(async () => {}) }))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

let cuentaId = ''
let duenoId = ''
/** Suelta el intento colgado de mentira de una prueba, para que su corrida termine. */
let soltar: (() => void) | undefined

/** Un post vencido con un destino a Instagram, y lo que la prueba quiera cambiarle al destino. */
async function destinoVencido(cambios: Record<string, unknown> = {}, horaDelPost = new Date(Date.now() - 60_000)) {
  const { scheduledPosts, scheduledPostTargets } = await esquema()
  const [post] = await (await db())
    .insert(scheduledPosts)
    .values({ ownerId: duenoId, caption: 'hola', scheduledAt: horaDelPost })
    .returning()
  const [destino] = await (await db())
    .insert(scheduledPostTargets)
    .values({ postId: post!.id, network: 'instagram', accountId: cuentaId, ...cambios })
    .returning()
  return destino!
}

async function leer(id: string) {
  const { scheduledPostTargets } = await esquema()
  const [fila] = await (await db()).select().from(scheduledPostTargets).where(eq(scheduledPostTargets.id, id))
  return fila
}

/**
 * Una corrida que se queda colgada a mitad del intento, como una que Vercel cortó. Vuelve
 * envuelta (`{ corrida }`): devolver la promesa sola haría que quien espera esta función
 * esperara también a la corrida, que no termina hasta `soltar()`.
 */
async function corridaColgada(destinoId: string) {
  const { publishDue } = await import('./run')
  publicar.mockImplementationOnce(
    () => new Promise<PublishOutcome>((r) => (soltar = () => r({ kind: 'published', externalId: 'tarde' }))),
  )
  const corrida = publishDue()
  await vi.waitFor(async () => expect((await leer(destinoId))?.reclamadoHasta).not.toBeNull())
  // Colgada de verdad: adentro de la publicación, no solo con el reclamo puesto. Entre una cosa y
  // la otra hay varias consultas, y la corrida siguiente de la prueba podía adelantarse.
  await vi.waitFor(() => expect(publicar).toHaveBeenCalledTimes(1))
  return { corrida }
}

describe.skipIf(!URL_PRUEBAS)('contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_publicar')
    const { users, socialAccounts } = await esquema()
    const [dueno] = await (await db()).insert(users).values({ correo: 'duena@ejemplo.cl' }).returning()
    duenoId = dueno!.id
    const [cuenta] = await (await db())
      .insert(socialAccounts)
      .values({ ownerId: duenoId, network: 'instagram', handle: '@prueba', externalId: 'ig-1', accessToken: 'x' })
      .returning()
    cuentaId = cuenta!.id
  }, 60_000)

  beforeEach(async () => {
    publicar.mockReset()
    soltar = undefined
    const { scheduledPosts } = await esquema()
    await (await db()).delete(scheduledPosts)
  })

  afterAll(() => soltar?.())

  describe('publishDue', () => {

    it('lo que Meta dice de los trial reels queda en la cuenta: «no» al rechazarlo, «sí» cuando uno sale', async () => {
      const { publishDue } = await import('./run')
      const { socialAccounts } = await esquema()
      const leerCuenta = async () =>
        (await (await db()).select().from(socialAccounts).where(eq(socialAccounts.id, cuentaId)))[0]!
      const motivo = '@prueba no tiene trial reels: Instagram los da solo a cuentas con un mínimo de seguidores.'

      await destinoVencido({ opciones: { trialReel: true } })
      publicar.mockResolvedValueOnce({ kind: 'failed', reason: motivo, definitivo: true, sinTrial: true })
      await publishDue()
      let cuenta = await leerCuenta()
      expect(cuenta.trialReels).toBe('no')
      expect(cuenta.trialReelsMotivo).toBe(motivo)
      expect(cuenta.trialReelsEn).not.toBeNull()

      // Una cuenta que creció: el primero que sale la corrige sola.
      await destinoVencido({ opciones: { trialReel: true } })
      publicar.mockResolvedValueOnce({ kind: 'published', externalId: 'ig-trial' })
      await publishDue()
      cuenta = await leerCuenta()
      expect(cuenta.trialReels).toBe('si')
      expect(cuenta.trialReelsMotivo).toBeNull()

      // Un reel normal que sale no dice nada de los trial reels.
      await (await db()).update(socialAccounts).set({ trialReels: null, trialReelsEn: null }).where(eq(socialAccounts.id, cuentaId))
      await destinoVencido()
      publicar.mockResolvedValueOnce({ kind: 'published', externalId: 'ig-normal' })
      await publishDue()
      expect((await leerCuenta()).trialReels).toBeNull()
    })

    it('dos corridas a la vez publican una sola vez', async () => {
      const { publishDue } = await import('./run')
      const destino = await destinoVencido()
      publicar.mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 300))
        return { kind: 'published', externalId: 'media-1' }
      })

      await Promise.all([publishDue(), publishDue()])

      expect(publicar).toHaveBeenCalledTimes(1)
      const fila = await leer(destino.id)
      expect(fila?.status).toBe('published')
      expect(fila?.externalId).toBe('media-1')
      expect(fila?.reclamadoHasta).toBeNull()
    })

    it('mientras una corrida tiene el destino, otra no lo toca; con el reclamo vencido, sí, y el intento cortado cuenta', async () => {
      const { publishDue } = await import('./run')
      const destino = await destinoVencido()
      const { corrida: colgada } = await corridaColgada(destino.id)

      // Una segunda corrida ahora no lo toca.
      await publishDue()
      expect(publicar).toHaveBeenCalledTimes(1)
      expect((await leer(destino.id))?.attemptCount).toBe(1)

      // Once minutos después el reclamo venció: otra corrida lo toma, y el intento cortado
      // ya quedó contado.
      publicar.mockResolvedValueOnce({ kind: 'failed', reason: 'No se pudo hablar con la red. Se reintentará.' })
      await publishDue(new Date(Date.now() + 11 * 60_000))
      expect(publicar).toHaveBeenCalledTimes(2)
      const fila = await leer(destino.id)
      expect(fila?.status).toBe('scheduled')
      expect(fila?.attemptCount).toBe(2)
      expect(fila?.reclamadoHasta).toBeNull()

      // La corrida colgada termina tarde: su reclamo ya no es suyo, y no pisa lo que pasó después.
      soltar?.()
      await colgada
      expect((await leer(destino.id))?.status).toBe('scheduled')
    })

    it('un destino con los intentos gastados en cortes se quema sin volver a intentarse', async () => {
      const { publishDue } = await import('./run')
      const { PUBLICACION_CORTADA } = await import('./publisher')
      const destino = await destinoVencido({ attemptCount: 3 })

      await publishDue()

      expect(publicar).not.toHaveBeenCalled()
      const fila = await leer(destino.id)
      expect(fila?.status).toBe('failed')
      expect(fila?.lastError).toBe(PUBLICACION_CORTADA)
    })

    it('un video que se rearma con fecha vieja sigue esperando: las 24 horas se cuentan desde que entró a publishing', async () => {
      const { publishDue } = await import('./run')
      const haceTresDias = new Date(Date.now() - 3 * 24 * 60 * 60_000)
      const destino = await destinoVencido(
        { status: 'publishing', containerId: 'contenedor-1', publicandoDesde: new Date(Date.now() - 60 * 60_000) },
        haceTresDias,
      )
      publicar.mockResolvedValueOnce({ kind: 'processing', containerId: 'contenedor-1' })

      await publishDue()

      expect(publicar).toHaveBeenCalledTimes(1)
      const fila = await leer(destino.id)
      expect(fila?.status).toBe('publishing')
      expect(fila?.publicandoDesde).not.toBeNull()
    })

    it('lo atascado 24 horas se quema sin volver a subirse, y conserva su contenedor', async () => {
      const { publishDue } = await import('./run')
      const { STALE_PROCESSING } = await import('./publisher')
      const destino = await destinoVencido({
        status: 'publishing',
        containerId: 'contenedor-2',
        publicandoDesde: new Date(Date.now() - 25 * 60 * 60_000),
      })

      await publishDue()

      expect(publicar).not.toHaveBeenCalled()
      const fila = await leer(destino.id)
      expect(fila?.status).toBe('failed')
      expect(fila?.lastError).toBe(STALE_PROCESSING)
      expect(fila?.containerId).toBe('contenedor-2')
    })

    it('el texto que sale es el guardado al momento del intento, no el de la lista de vencidos', async () => {
      const { publishDue } = await import('./run')
      const { scheduledPosts } = await esquema()
      await destinoVencido({}, new Date(Date.now() - 120_000))
      const segundo = await destinoVencido({}, new Date(Date.now() - 60_000))
      const textos: string[] = []
      publicar.mockImplementation(async (input) => {
        textos.push(input.caption)
        // Mientras sale el primero, el dueño guarda un texto nuevo para el segundo en el editor.
        if (textos.length === 1) {
          await (await db()).update(scheduledPosts).set({ caption: 'el texto nuevo' }).where(eq(scheduledPosts.id, segundo.postId))
        }
        return { kind: 'published', externalId: `media-${textos.length}` }
      })

      await publishDue()

      expect(textos).toEqual(['hola', 'el texto nuevo'])
    })

    it('sin tiempo para empezar, no reclama nada: lo toma la corrida siguiente', async () => {
      const { publishDue } = await import('./run')
      const destino = await destinoVencido()

      const reporte = await publishDue(new Date(), undefined, {
        empezarHasta: Date.now() - 1,
        terminarAntesDe: Date.now() + 60_000,
      })

      expect(publicar).not.toHaveBeenCalled()
      expect(reporte.sinTiempo).toBe(1)
      expect((await leer(destino.id))?.attemptCount).toBe(0)
    })
  })

  describe('borrar y reprogramar', () => {
    it('no se puede borrar un post que una corrida está publicando, y el resultado se anota igual', async () => {
      const { borrarPostProgramado } = await import('./borrar')
      const destino = await destinoVencido()
      const { corrida: colgada } = await corridaColgada(destino.id)

      expect(await borrarPostProgramado(duenoId, destino.postId)).toBe('publicado')

      soltar?.()
      await colgada
      const fila = await leer(destino.id)
      expect(fila?.status).toBe('published')
      expect(fila?.externalId).toBe('tarde')
    })

    it('un post sin nada en curso se borra, y uno ajeno es «no existe»', async () => {
      const { borrarPostProgramado } = await import('./borrar')
      const destino = await destinoVencido()

      expect(await borrarPostProgramado('00000000-0000-0000-0000-000000000000', destino.postId)).toBe('no-existe')
      expect(await borrarPostProgramado(duenoId, destino.postId)).toBe('borrado')
      expect(await leer(destino.id)).toBeUndefined()
    })

    it('reprogramar un destino quemado conserva su contenedor, y el intento siguiente pregunta por él', async () => {
      const { publishDue } = await import('./run')
      const { reprogramarDestino } = await import('./reprogramar')
      const { STALE_PROCESSING } = await import('./publisher')
      const destino = await destinoVencido({
        status: 'failed',
        attemptCount: 1,
        lastError: STALE_PROCESSING,
        containerId: 'contenedor-3',
        publicandoDesde: new Date(Date.now() - 25 * 60 * 60_000),
      })
      const nuevaHora = new Date(Date.now() + 60 * 60_000)

      expect(await reprogramarDestino(duenoId, destino.id, nuevaHora)).toBe('reprogramado')
      const rearmado = await leer(destino.id)
      expect(rearmado).toMatchObject({
        status: 'scheduled',
        attemptCount: 0,
        lastError: null,
        containerId: 'contenedor-3',
        publicandoDesde: null,
      })

      publicar.mockResolvedValueOnce({ kind: 'published', externalId: 'ya-habia-salido' })
      await publishDue(new Date(nuevaHora.getTime() + 60_000))
      expect(publicar).toHaveBeenCalledTimes(1)
      expect(publicar.mock.calls[0]![0].containerId).toBe('contenedor-3')
      // El handle viaja para que un rechazo nombre la cuenta (`rechazoDeInstagram`).
      expect(publicar.mock.calls[0]![0].cuenta).toBe('@prueba')
      expect((await leer(destino.id))?.status).toBe('published')
    })
  })

  describe('reclamarEnvio', () => {
    it('dos envíos a la vez del mismo comentario: uno solo lo obtiene', async () => {
      const { postComments } = await esquema()
      const { reclamarEnvio } = await import('../comentarios/reclamo')
      const [comentario] = await (await db())
        .insert(postComments)
        .values({
          accountId: cuentaId,
          network: 'instagram',
          postExternalId: 'p1',
          externalId: `c-${Date.now()}`,
          text: 'quiero la guía',
          publishedAt: new Date(),
        })
        .returning()

      const [a, b] = await Promise.all([reclamarEnvio(comentario!.id), reclamarEnvio(comentario!.id)])

      expect([a, b].filter(Boolean)).toHaveLength(1)
    })
  })
})
