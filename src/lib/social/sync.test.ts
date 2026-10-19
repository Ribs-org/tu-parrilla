import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SocialAccount } from '@/db'
import type { FetchedBatch, OpcionesDeListado, PostMetricValues } from './connector'

// `sync.ts` importa `server-only` (a través de `../usuarios`, que también lo hace
// directo), que solo entiende el bundler de Next: se sustituye por un módulo vacío para
// poder importarlo bajo Vitest (mismo motivo que en `usuarios.test.ts`).
vi.mock('server-only', () => ({}))

// La base doblada al nivel de drizzle, no del driver: `syncAccount` solo necesita cuatro
// formas de cadena (`insert…values…onConflictDoUpdate[…returning]`, `select…from…where`,
// `update…set…where`), y todas terminan en un `await`. Cada eslabón se devuelve a sí mismo
// y además es «then-able», así que la misma pieza sirve para las cuatro. Lo único que el
// doble guarda es qué se escribió y en qué tabla: es lo que estos casos miran.
// `select` devuelve `leidas.filas`: lo que un caso quiera que la base «tenga guardado».
const { escrituras, leidas } = vi.hoisted(() => ({
  escrituras: [] as Array<{ tabla: unknown; valores: unknown }>,
  leidas: { filas: [] as unknown[] },
}))

vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  const eslabon = (tabla: unknown, filas: unknown[]) => {
    const paso = {
      values: (valores: unknown) => {
        escrituras.push({ tabla, valores })
        return paso
      },
      onConflictDoUpdate: () => paso,
      returning: () => paso,
      from: () => paso,
      leftJoin: () => paso,
      where: () => paso,
      groupBy: () => paso,
      set: () => paso,
      then: (ok?: never, err?: never) => Promise.resolve(filas).then(ok, err),
    }
    return paso
  }
  return {
    ...real,
    getDb: () => ({
      insert: (tabla: unknown) => eslabon(tabla, [{ id: 'post-1' }]),
      select: () => eslabon(null, leidas.filas),
      update: () => eslabon(null, []),
    }),
  }
})

// El conector: lo justo para que `syncAccount` llegue a escribir un snapshot. Sin
// `fetchAccountMetrics`, para que el único `day` escrito sea el de `post_metrics`.
const fetchPosts = vi.fn<(opciones?: OpcionesDeListado) => Promise<FetchedBatch>>()
const fetchMetricsById = vi.fn<(ids: string[]) => Promise<Map<string, PostMetricValues>>>()
vi.mock('./index', () => ({
  connectorFor: () => ({
    ensureCredential: async () => 'token',
    fetchPosts: (_cuenta: unknown, _token: unknown, opciones?: OpcionesDeListado) => fetchPosts(opciones),
    fetchMetricsById: (_cuenta: unknown, _token: unknown, ids: string[]) => fetchMetricsById(ids),
  }),
}))

// La zona del dueño de la cuenta, que es lo que este archivo quiere poder mover.
const buscarPorId = vi.fn()
vi.mock('../usuarios', () => ({
  adminId: async () => 'owner-1',
  buscarPorId: (id: string) => buscarPorId(id),
}))

const { isCampaignUniqueViolation, lecturasSinRepetir, syncAccount } = await import('./sync')

// La forma real de un error de unicidad tal como lo entrega el driver de este proyecto
// (`postgres`, no `node-postgres`): el campo es `constraint_name`, no `constraint` — ver
// `node_modules/postgres/src/connection.js:46`.
const pgError = (constraint_name: string) => ({ code: '23505', constraint_name })

// Y la forma real en la que ese error llega a quien lo atrapa: drizzle-orm 0.45.2 envuelve
// toda consulta fallida en `DrizzleQueryError` y deja el original en `cause` (ver
// `node_modules/drizzle-orm/errors.cjs:35-45` y cada `throw new DrizzleQueryError(...)` en
// `node_modules/drizzle-orm/pg-core/session.js`). Un test que arma un error plano, sin este
// envoltorio, no habría atrapado el bug: la función nunca mira el error que de verdad
// llega.
const drizzleQueryError = (cause: unknown) => Object.assign(new Error('Failed query'), { cause })

describe('isCampaignUniqueViolation', () => {
  it('reconoce un choque de social_posts_campaign_unique envuelto por drizzle', () => {
    const error = drizzleQueryError(pgError('social_posts_campaign_unique'))
    expect(isCampaignUniqueViolation(error)).toBe(true)
  })

  it('no confunde una violación de unicidad de otra restricción', () => {
    const error = drizzleQueryError(pgError('social_accounts_network_external_id_unique'))
    expect(isCampaignUniqueViolation(error)).toBe(false)
  })

  it('no confunde un error cualquiera con un choque de unicidad', () => {
    const error = drizzleQueryError(new Error('la base no responde'))
    expect(isCampaignUniqueViolation(error)).toBe(false)
  })

  it('no revienta si no hay ni error ni cause', () => {
    expect(isCampaignUniqueViolation('algo que no es un error')).toBe(false)
    expect(isCampaignUniqueViolation(null)).toBe(false)
    expect(isCampaignUniqueViolation(undefined)).toBe(false)
  })
})

/**
 * El `day` de un snapshot es la única zona de toda la rama que ensucia el historial en vez
 * de mostrar mal una hora: `getPostRows` compara esas llaves contra `localDay(…, f.zone)`,
 * así que si se escribieran en la zona del servidor, una captura de las 23:30 se leería un
 * día corrida —o fuera de la ventana— para quien la mira. El instante es el mismo en los
 * dos casos; lo único que cambia es la zona del dueño de la cuenta.
 */
describe('syncAccount: el día del snapshot es el del dueño', () => {
  const cuenta = {
    id: 'acc-1',
    ownerId: 'owner-1',
    network: 'instagram',
    handle: '@demo',
    externalId: 'ext-1',
    metaUserId: null,
    accessToken: 'token',
    refreshToken: null,
    expiresAt: null,
    lastSyncedAt: null,
    lastSyncError: null,
    caidaAvisadaEn: null,
    createdAt: new Date('2026-01-01'),
  } satisfies SocialAccount

  beforeEach(() => {
    escrituras.length = 0
    leidas.filas = []
    buscarPorId.mockClear()
    vi.useFakeTimers()
    // 23:30 UTC del 5 de octubre: ya es día 6 en Madrid (+02:00) y todavía día 5 en
    // Santiago (−03:00). Un instante cualquiera no distinguiría las dos zonas.
    vi.setSystemTime(new Date('2026-10-05T23:30:00Z'))
    fetchPosts.mockResolvedValue({
      posts: [
        {
          externalId: 'ext-post-1',
          permalink: null,
          caption: null,
          thumbnailUrl: null,
          mediaType: null,
          publishedAt: new Date('2026-10-01T12:00:00Z'),
          metrics: { views: 10, likes: 1, comments: 0, shares: 0, saves: 0, reach: 10 },
        },
      ],
      windowWasCapped: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** El `day` que llegó al insert de `post_metrics`, que va de a muchas lecturas. */
  function diaEscrito(): string {
    const fila = escrituras.find((e) => Array.isArray(e.valores) && (e.valores[0] as { day?: string })?.day !== undefined)
    return ((fila!.valores as unknown[])[0] as { day: string }).day
  }

  it('con el dueño en Madrid, las 23:30 UTC son el día siguiente', async () => {
    buscarPorId.mockResolvedValue({ id: 'owner-1', zona: 'Europe/Madrid' })
    await syncAccount(cuenta, true)
    expect(buscarPorId).toHaveBeenCalledWith('owner-1')
    expect(diaEscrito()).toBe('2026-10-06')
  })

  it('con el dueño en Santiago, el mismo instante sigue siendo el día 5', async () => {
    buscarPorId.mockResolvedValue({ id: 'owner-1', zona: 'America/Santiago' })
    await syncAccount(cuenta, true)
    expect(diaEscrito()).toBe('2026-10-05')
  })

  it('sin dueño en la fila, cae al default del sitio y no revienta', async () => {
    buscarPorId.mockResolvedValue(null)
    await syncAccount({ ...cuenta, ownerId: null }, true)
    expect(buscarPorId).not.toHaveBeenCalled()
    expect(diaEscrito()).toBe('2026-10-05')
  })
})

describe('lecturasSinRepetir', () => {
  it('una publicación dos veces en el lote queda una sola, con la última lectura', () => {
    const m = (views: number) => ({ views, likes: null, comments: null, shares: null, saves: null, reach: null })
    const unicas = lecturasSinRepetir([
      { postId: 'a', metrics: m(1) },
      { postId: 'b', metrics: m(2) },
      { postId: 'a', metrics: m(3) },
    ])
    expect(unicas).toHaveLength(2)
    expect(unicas.find((l) => l.postId === 'a')!.metrics.views).toBe(3)
  })
})

/**
 * La lectura por edad (`lectura.ts`): lo de los últimos diez días llega en el listado, y lo
 * viejo que hoy toca se pide por id, hasta que se acaba el plazo.
 */
describe('syncAccount: lo viejo se lee por id', () => {
  const cuenta = {
    id: 'acc-1',
    ownerId: 'owner-1',
    network: 'instagram',
    handle: '@demo',
    externalId: 'ext-1',
    metaUserId: null,
    accessToken: 'token',
    refreshToken: null,
    expiresAt: null,
    lastSyncedAt: null,
    lastSyncError: null,
    caidaAvisadaEn: null,
    createdAt: new Date('2026-01-01'),
  } satisfies SocialAccount
  const vista = { views: 50, likes: 2, comments: 0, shares: 0, saves: 0, reach: 40 }

  /** Lo que la base tiene guardado de la cuenta: tres viejas y una del listado. */
  const guardadas = [
    // Hace 20 días, leída hace 7: le toca (una vez por semana).
    { id: 'p-toca', externalId: 'toca', publishedAt: new Date('2026-09-25T15:00:00Z'), ultimaLectura: '2026-10-08' },
    // Hace 20 días, leída hace 2: no le toca.
    { id: 'p-reciente', externalId: 'reciente', publishedAt: new Date('2026-09-25T15:00:00Z'), ultimaLectura: '2026-10-13' },
    // Nunca leída: siempre toca.
    { id: 'p-nunca', externalId: 'nunca', publishedAt: new Date('2026-06-01T15:00:00Z'), ultimaLectura: null },
    // Vino en el listado de hoy: no se pide de nuevo.
    { id: 'p-listada', externalId: 'listada', publishedAt: new Date('2026-10-12T15:00:00Z'), ultimaLectura: '2026-10-14' },
  ]

  beforeEach(() => {
    escrituras.length = 0
    leidas.filas = guardadas
    buscarPorId.mockResolvedValue({ id: 'owner-1', zona: 'America/Santiago' })
    fetchMetricsById.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
    fetchPosts.mockResolvedValue({
      posts: [
        {
          externalId: 'listada',
          permalink: null,
          caption: null,
          thumbnailUrl: null,
          mediaType: null,
          publishedAt: new Date('2026-10-12T15:00:00Z'),
          metrics: vista,
        },
      ],
      windowWasCapped: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Los postId de las lecturas escritas en `post_metrics`, en el orden en que se escribieron. */
  function lecturasEscritas(): string[] {
    return escrituras
      .filter((e) => Array.isArray(e.valores))
      .flatMap((e) => (e.valores as Array<{ postId: string }>).map((v) => v.postId))
  }

  it('lista lo de los últimos diez días', async () => {
    fetchMetricsById.mockResolvedValue(new Map())
    await syncAccount(cuenta, true)
    const desde = fetchPosts.mock.lastCall![0]!.desde!
    expect(desde.toISOString()).toBe('2026-10-05T12:00:00.000Z')
  })

  it('pide por id solo lo que no vino en el listado y hoy le toca, de lo más nuevo a lo más viejo', async () => {
    fetchMetricsById.mockResolvedValue(new Map([['toca', vista], ['nunca', vista]]))
    const leidasHoy = await syncAccount(cuenta, true)
    expect(fetchMetricsById).toHaveBeenCalledTimes(1)
    expect(fetchMetricsById.mock.calls[0]![0]).toEqual(['toca', 'nunca'])
    // La del listado, primero; después las dos viejas que la red devolvió.
    expect(lecturasEscritas()).toEqual(['post-1', 'p-toca', 'p-nunca'])
    expect(leidasHoy).toBe(3)
  })

  it('lo que la red no devuelve por id (borrado) simplemente no se escribe', async () => {
    fetchMetricsById.mockResolvedValue(new Map([['toca', vista]]))
    await syncAccount(cuenta, true)
    expect(lecturasEscritas()).toEqual(['post-1', 'p-toca'])
  })

  it('con el plazo vencido no pide nada viejo, y la cuenta igual queda leída', async () => {
    const leidasHoy = await syncAccount(cuenta, true, Date.now())
    expect(fetchMetricsById).not.toHaveBeenCalled()
    expect(leidasHoy).toBe(1)
  })

  it('un error leyendo lo viejo no tumba la cuenta: lo nuevo ya quedó guardado', async () => {
    fetchMetricsById.mockRejectedValue(new Error('Instagram 429: demasiadas llamadas'))
    await expect(syncAccount(cuenta, true)).resolves.toBe(1)
    expect(lecturasEscritas()).toEqual(['post-1'])
  })
})
