import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FetchedPost, OpcionesDeListado } from './connector'

// La lectura de cada hora sin base ni redes: qué cuentas lee, qué les pide, qué escribe y cómo
// sigue cuando una falla o se acaba el plazo. Lo que la base hace con las lecturas está en
// `reciente.integracion.test.ts`.

vi.mock('server-only', () => ({}))

const { estado } = vi.hoisted(() => ({ estado: { cuentas: [] as unknown[] } }))

vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  const cadena = {
    from: () => cadena,
    where: () => cadena,
    orderBy: () => Promise.resolve(estado.cuentas),
  }
  return { ...real, getDb: () => ({ select: () => cadena }) }
})

const fetchPosts = vi.fn<(cuenta: { id: string }, opciones?: OpcionesDeListado) => Promise<{ posts: FetchedPost[] }>>()
const ensureCredential = vi.fn(async (cuenta: { accessToken: string | null }) => cuenta.accessToken)
vi.mock('./index', () => ({
  connectorFor: () => ({
    ensureCredential,
    fetchPosts: (cuenta: { id: string }, _token: unknown, opciones?: OpcionesDeListado) => fetchPosts(cuenta, opciones),
  }),
}))

const upsertPost = vi.fn<(post: FetchedPost, cuenta: unknown, tag: unknown) => Promise<string>>(
  async (post) => `post-${post.externalId}`,
)
const writeSnapshots = vi.fn<(lecturas: unknown, dia: string) => Promise<void>>(async () => {})
vi.mock('./sync', () => ({
  upsertPost: (post: FetchedPost, cuenta: unknown, tag: unknown) => upsertPost(post, cuenta, tag),
  writeSnapshots: (lecturas: unknown, dia: string) => writeSnapshots(lecturas, dia),
}))

const buscarPorId = vi.fn(async () => ({ zona: 'America/Santiago' }))
vi.mock('../usuarios', () => ({ buscarPorId: () => buscarPorId() }))

const vincularSinId = vi.fn(async () => 0)
vi.mock('./vincular-sin-id', () => ({ vincularSinId: () => vincularSinId() }))

const { HORAS_DE_LO_RECIENTE, PLAZO_DE_LO_RECIENTE_MS, REDES_DE_CADA_HORA, leerLoReciente, seLeeCadaHora } = await import('./reciente')

const AHORA = Date.parse('2026-11-10T15:00:00Z')

function cuenta(id: string, network: string, creada: string, accessToken: string | null = 'token') {
  return { id, network, handle: `@${id}`, externalId: `ext-${id}`, ownerId: 'dueno-1', accessToken, createdAt: new Date(creada) }
}

function post(externalId: string, publicada: string): FetchedPost {
  return {
    externalId,
    permalink: null,
    caption: null,
    thumbnailUrl: null,
    mediaType: 'reel',
    publishedAt: new Date(publicada),
    metrics: { views: 10, likes: 2, comments: 1, shares: null, saves: null, reach: null },
  }
}

describe('leerLoReciente', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AHORA)
    fetchPosts.mockReset()
    upsertPost.mockClear()
    writeSnapshots.mockClear()
    buscarPorId.mockClear()
    vincularSinId.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('YouTube no entra: su cupo no alcanza para leer cada hora', () => {
    expect(REDES_DE_CADA_HORA).toEqual(['instagram', 'facebook', 'tiktok'])
    expect(HORAS_DE_LO_RECIENTE).toBe(48)
  })

  it('pide solo lo de las últimas 48 horas y escribe la lectura de hoy, en el día del dueño', async () => {
    estado.cuentas = [cuenta('ig', 'instagram', '2026-01-01')]
    fetchPosts.mockResolvedValue({
      // El conector ya recorta, pero si uno no lo hiciera, lo de antes no se escribe igual.
      posts: [post('nuevo', '2026-11-10T09:00:00Z'), post('viejo', '2026-11-08T14:59:00Z')],
    })
    const informe = await leerLoReciente()

    expect(fetchPosts).toHaveBeenCalledWith(expect.objectContaining({ id: 'ig' }), {
      desde: new Date(AHORA - 48 * 3_600_000),
      soloDesde: true,
    })
    expect(upsertPost).toHaveBeenCalledTimes(1)
    expect(upsertPost.mock.calls[0]![0].externalId).toBe('nuevo')
    // Las 15:00 UTC del 10 son las 12:00 del 10 en Santiago.
    expect(writeSnapshots).toHaveBeenCalledWith([{ postId: 'post-nuevo', metrics: post('nuevo', '2026-11-10T09:00:00Z').metrics }], '2026-11-10')
    expect(vincularSinId).toHaveBeenCalledTimes(1)
    expect(informe).toEqual([{ network: 'instagram', handle: '@ig', ok: true, posts: 1 }])
  })

  it('sin nada en las 48 horas no escribe nada', async () => {
    estado.cuentas = [cuenta('fb', 'facebook', '2026-01-01')]
    fetchPosts.mockResolvedValue({ posts: [] })
    expect(await leerLoReciente()).toEqual([{ network: 'facebook', handle: '@fb', ok: true, posts: 0 }])
    expect(writeSnapshots).not.toHaveBeenCalled()
    expect(buscarPorId).not.toHaveBeenCalled()
  })

  it('la primaria es la más antigua de la red aunque esté desconectada, como en la del día', async () => {
    estado.cuentas = [cuenta('vieja', 'tiktok', '2025-01-01', null), cuenta('nueva', 'tiktok', '2026-01-01')]
    fetchPosts.mockResolvedValue({ posts: [post('a', '2026-11-10T09:00:00Z')] })
    const informe = await leerLoReciente()

    // La desconectada no se lee ni sale en el informe.
    expect(fetchPosts).toHaveBeenCalledTimes(1)
    expect(informe).toHaveLength(1)
    expect(upsertPost.mock.calls[0]![2]).toEqual({ primaria: false, handle: '@nueva', externalId: 'ext-nueva' })
  })

  it('una cuenta que falla deja su error y las demás de la red siguen', async () => {
    estado.cuentas = [cuenta('uno', 'instagram', '2026-01-01'), cuenta('dos', 'instagram', '2026-02-01')]
    fetchPosts.mockImplementation(async (c) => {
      if (c.id === 'uno') throw new Error('Instagram 400: token')
      return { posts: [post('b', '2026-11-10T09:00:00Z')] }
    })
    expect(await leerLoReciente()).toEqual([
      { network: 'instagram', handle: '@uno', ok: false, posts: 0, error: 'Instagram 400: token' },
      { network: 'instagram', handle: '@dos', ok: true, posts: 1 },
    ])
  })

  it('pasado el plazo no empieza ninguna cuenta más: quedan para la hora siguiente', async () => {
    estado.cuentas = [cuenta('ig', 'instagram', '2026-01-01'), cuenta('tt', 'tiktok', '2026-01-01')]
    expect(await leerLoReciente(AHORA - PLAZO_DE_LO_RECIENTE_MS)).toEqual([
      { network: 'instagram', handle: '@ig', ok: true, posts: 0, saltada: true },
      { network: 'tiktok', handle: '@tt', ok: true, posts: 0, saltada: true },
    ])
    expect(fetchPosts).not.toHaveBeenCalled()
  })
})

describe('seLeeCadaHora', () => {
  it('lo dice la pieza mientras no llegan los números: dentro de la hora, o con la del día', () => {
    expect(seLeeCadaHora('instagram')).toBe(true)
    expect(seLeeCadaHora('tiktok')).toBe(true)
    expect(seLeeCadaHora('youtube')).toBe(false)
    expect(seLeeCadaHora('threads')).toBe(false)
  })
})
