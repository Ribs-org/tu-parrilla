import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScheduledPost, ScheduledPostTarget, Usuario } from '@/db'
import { CuentaInvalida, type CuentaDestino } from '@/lib/social/cuentas'
import { BORRADOR_NO_EXISTE } from '@/lib/mobile-api'
import { OPCIONES_ERROR, TRIAL_REEL_MEDIA } from '@/lib/social/publish/opciones'

// `route.ts` llega a `@/lib/usuarios` por `@/lib/mobile-api` → `publish/batch`, y ese
// módulo trae `server-only` (no resuelve bajo Vitest). Mismo motivo y mismo arreglo que
// `aislamiento.test.ts`.
vi.mock('server-only', () => ({}))

const USUARIO: Usuario = {
  id: 'owner-1',
  correo: 'dueno@example.com',
  nombre: null,
  rol: 'usuario',
  zona: 'America/Santiago',
  tema: 'noche',
  sesionVersion: 1,
  invitadoEn: new Date('2026-01-01'),
  primerIngresoEn: new Date('2026-01-01'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => USUARIO }))

// Igual que en `check/route.test.ts`: se mockea solo `resolverDestinos`, el resto del
// módulo sigue real.
const resolverDestinos = vi.fn()
vi.mock('@/lib/mobile-api', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/mobile-api')>()
  return { ...real, resolverDestinos: (...args: Parameters<typeof real.resolverDestinos>) => resolverDestinos(...args) }
})

const crearPostProgramado = vi.fn()
vi.mock('@/lib/social/publish/crear', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/social/publish/crear')>()),
  crearPostProgramado: (...args: unknown[]) => crearPostProgramado(...args),
}))

const cargarBorrador = vi.fn()
const borrarBorrador = vi.fn()
vi.mock('@/lib/borradores', () => ({
  cargarBorrador: (...args: unknown[]) => cargarBorrador(...args),
  borrarBorrador: (...args: unknown[]) => borrarBorrador(...args),
  listarBorradores: async () => [],
}))
vi.mock('@/lib/borradores-movil', () => ({
  cuentasParaElTelefono: async () => ({ propias: new Set(['c-ig']), ajenas: new Map([['tt-1', 'TikTok']]) }),
  resumirParaElTelefono: () => null,
}))

// R2 no está configurado bajo test (sin `R2_*`): mockeado explícito, no implícito por
// la ausencia de env, para que este archivo no dependa de qué haya en `.env.local`.
vi.mock('@/lib/storage', () => ({
  basePublica: () => 'https://cdn.ejemplo.cl',
  keyDesdeUrl: (base: string, url: string) => (url.startsWith(`${base}/`) ? url.slice(base.length + 1) : null),
  tamanoEnAlmacen: async () => 1024,
}))

const { POST, agruparPostsMovil } = await import('./route')

function filaPost(overrides: Partial<ScheduledPost> = {}): ScheduledPost {
  return {
    id: 'post-1',
    ownerId: 'owner-1',
    caption: 'Hola',
    scheduledAt: new Date('2026-10-01T12:00:00Z'),
    coverUrl: null,
    videosLiberados: 0,
    atributos: null,
    ref: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function filaTarget(overrides: Partial<ScheduledPostTarget> = {}): ScheduledPostTarget {
  return {
    id: 'target-1',
    postId: 'post-1',
    network: 'instagram',
    accountId: 'acc-1',
    captionOverride: null,
    status: 'scheduled',
    containerId: null,
    externalId: null,
    attemptCount: 0,
    lastError: null,
    reintentarDesde: null,
    opciones: null,
    reclamadoHasta: null,
    publicandoDesde: null,
    archivadoEn: null,
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

/**
 * `agruparPostsMovil` es lo que arma la respuesta de `GET /api/mobile/schedule` a
 * partir de las filas del `leftJoin`. Se prueba sin base: la propiedad que importa es
 * que cada destino traiga su propio `id`, porque con dos cuentas de una misma red
 * `red` deja de ser única dentro de un post — y es lo único que el Resumen y el
 * Calendario del teléfono pueden usar de clave de React (repaso final de la rama).
 */
describe('agruparPostsMovil (GET /api/mobile/schedule)', () => {
  it('dos destinos de la misma red en un post traen ids de destino distintos', () => {
    const post = filaPost()
    const filas = [
      { post, target: filaTarget({ id: 'dest-ig-1', accountId: 'ig-1' }), handle: '@vicente' },
      { post, target: filaTarget({ id: 'dest-ig-2', accountId: 'ig-2' }), handle: '@vicenteclips' },
    ]
    const [agrupado] = agruparPostsMovil(filas, new Map(), 'America/Santiago')
    expect(agrupado!.redes).toHaveLength(2)
    expect(new Set(agrupado!.redes.map((r) => r.id)).size).toBe(2)
    expect(agrupado!.redes.map((r) => ({ id: r.id, red: r.red, handle: r.handle }))).toEqual([
      { id: 'dest-ig-1', red: 'instagram', handle: '@vicente' },
      { id: 'dest-ig-2', red: 'instagram', handle: '@vicenteclips' },
    ])
  })

  it('trae el corte que dibuja el teléfono: su formato y el sello de cada destino', () => {
    const post = filaPost({ id: 'post-3' })
    const filas = [
      { post, target: filaTarget({ id: 'dest-1', postId: 'post-3', accountId: 'viva', status: 'published' }), handle: '@a' },
      { post, target: filaTarget({ id: 'dest-2', postId: 'post-3', accountId: 'fria' }), handle: '@b' },
    ]
    const media = new Map([
      [
        'post-3',
        [
          { blobUrl: 'https://cdn.ejemplo.cl/1.mp4', mediaType: 'video' },
          { blobUrl: 'https://cdn.ejemplo.cl/2.jpg', mediaType: 'image' },
        ],
      ],
    ])
    const [agrupado] = agruparPostsMovil(filas, media, 'America/Santiago', new Set(['fria']))
    expect(agrupado).toMatchObject({ formato: 'tira', huesos: 2, miniatura: 'https://cdn.ejemplo.cl/2.jpg' })
    expect(agrupado!.redes.map((r) => r.sello)).toEqual(['servido', 'frio'])
  })

  it('un video que ya salió en todas sus redes sigue siendo una entraña, aunque su archivo ya no esté', () => {
    // `limpiarMedia` borra el video y su fila; el post se queda con la cuenta.
    const post = filaPost({ id: 'post-4', videosLiberados: 1 })
    const filas = [
      { post, target: filaTarget({ id: 'dest-1', postId: 'post-4', status: 'published' }), handle: '@a' },
      { post, target: filaTarget({ id: 'dest-2', postId: 'post-4', network: 'tiktok', status: 'published' }), handle: '@a' },
    ]
    const [agrupado] = agruparPostsMovil(filas, new Map(), 'America/Santiago')
    expect(agrupado).toMatchObject({ formato: 'entrana', huesos: 0, miniatura: null })
  })

  it('agrupa por post, no por destino: dos filas del mismo post arman un post con dos redes', () => {
    const post = filaPost({ id: 'post-2' })
    const filas = [
      { post, target: filaTarget({ id: 'dest-1', postId: 'post-2', network: 'instagram' }), handle: '@vicente' },
      { post, target: filaTarget({ id: 'dest-2', postId: 'post-2', network: 'x' }), handle: '@vicente_x' },
    ]
    const agrupados = agruparPostsMovil(filas, new Map(), 'America/Santiago')
    expect(agrupados).toHaveLength(1)
    expect(agrupados[0]!.id).toBe('post-2')
    expect(agrupados[0]!.redes).toHaveLength(2)
  })
})

function peticion(body: unknown): Request {
  return new Request('https://ejemplo.cl/api/mobile/schedule', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const IG: CuentaDestino = { id: 'c-ig', network: 'facebook', handle: '@fb' }

/**
 * El `POST` que de verdad crea el post. `check/route.test.ts` prueba el chequeo; este
 * archivo prueba que el `POST` cumple exactamente lo mismo que `check` promete —mismo
 * `resolverDestinos`, mismo borrador— y que un rechazo de destino nunca llega a crear
 * nada.
 */
describe('POST /api/mobile/schedule', () => {
  beforeEach(() => {
    resolverDestinos.mockReset()
    crearPostProgramado.mockReset()
    cargarBorrador.mockReset()
    borrarBorrador.mockReset()
    borrarBorrador.mockResolvedValue(undefined)
  })

  it('resuelve el destino con el borrador entero y crea el post con las cuentas resueltas', async () => {
    resolverDestinos.mockResolvedValueOnce({ cuentas: [IG], networks: ['facebook'] })
    crearPostProgramado.mockResolvedValueOnce('post-1')
    const res = await POST(peticion({ texto: 'Hola', cuentas: ['c-ig'], ahora: true, media: [] }))
    expect(resolverDestinos).toHaveBeenCalledWith('owner-1', expect.objectContaining({ cuentas: ['c-ig'] }))
    expect(crearPostProgramado).toHaveBeenCalledWith('owner-1', expect.objectContaining({ cuentas: [IG] }))
    expect(res.status).toBe(200)
  })

  it('si resolverDestinos rechaza, el POST rechaza con su misma frase y no crea nada', async () => {
    resolverDestinos.mockRejectedValueOnce(new CuentaInvalida('Una de las cuentas elegidas no es tuya.'))
    const res = await POST(peticion({ texto: 'Hola', cuentas: ['ajena'], ahora: true, media: [] }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Una de las cuentas elegidas no es tuya.' })
    expect(crearPostProgramado).not.toHaveBeenCalled()
  })

  it('valida con las redes que resolverDestinos entregó, no con lo que el cuerpo declaró', async () => {
    resolverDestinos.mockResolvedValueOnce({ cuentas: [], networks: ['instagram'] })
    const res = await POST(peticion({ texto: 'Hola', cuentas: ['c1'], ahora: true, media: [] }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Instagram, YouTube y TikTok necesitan al menos un archivo.' })
    expect(crearPostProgramado).not.toHaveBeenCalled()
  })

  it('sin ningún destino resuelto, la frase la da validateScheduleDraft y no se crea nada', async () => {
    resolverDestinos.mockResolvedValueOnce({ cuentas: [], networks: [] })
    const res = await POST(peticion({ texto: 'Hola', cuentas: [], ahora: true, media: [] }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Elige al menos una plataforma.' })
    expect(crearPostProgramado).not.toHaveBeenCalled()
  })

  it('un trial reel con un solo video crea el post con las opciones de la cuenta resuelta', async () => {
    const IG_TRIAL: CuentaDestino = { id: 'ig-1', network: 'instagram', handle: '@vicente' }
    resolverDestinos.mockResolvedValueOnce({ cuentas: [IG_TRIAL], networks: ['instagram'] })
    crearPostProgramado.mockResolvedValueOnce('post-1')
    const res = await POST(
      peticion({
        texto: 'Hola',
        cuentas: ['ig-1'],
        ahora: true,
        media: [{ url: 'https://cdn.ejemplo.cl/scheduled/a.mp4', mediaType: 'video' }],
        opciones: { 'ig-1': { trialReel: true } },
      }),
    )
    expect(res.status).toBe(200)
    expect(crearPostProgramado).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ opciones: { 'ig-1': { trialReel: true } } }),
    )
  })

  it('un trial reel con una foto se rechaza por la regla de media y no crea nada', async () => {
    const IG_TRIAL: CuentaDestino = { id: 'ig-1', network: 'instagram', handle: '@vicente' }
    resolverDestinos.mockResolvedValueOnce({ cuentas: [IG_TRIAL], networks: ['instagram'] })
    const res = await POST(
      peticion({
        texto: 'Hola',
        cuentas: ['ig-1'],
        ahora: true,
        media: [{ url: 'https://cdn.ejemplo.cl/scheduled/a.jpg', mediaType: 'image' }],
        opciones: { 'ig-1': { trialReel: true } },
      }),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: TRIAL_REEL_MEDIA })
    expect(crearPostProgramado).not.toHaveBeenCalled()
  })

  it('opciones con forma inválida para la cuenta resuelta se rechaza con OPCIONES_ERROR y no crea nada', async () => {
    const IG_TRIAL: CuentaDestino = { id: 'ig-1', network: 'instagram', handle: '@vicente' }
    resolverDestinos.mockResolvedValueOnce({ cuentas: [IG_TRIAL], networks: ['instagram'] })
    const res = await POST(
      peticion({
        texto: 'Hola',
        cuentas: ['ig-1'],
        ahora: true,
        media: [{ url: 'https://cdn.ejemplo.cl/scheduled/a.mp4', mediaType: 'video' }],
        opciones: { 'ig-1': { trialReel: 'sí' } },
      }),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: OPCIONES_ERROR })
    expect(crearPostProgramado).not.toHaveBeenCalled()
  })

  describe('desde un borrador', () => {
    const BORRADOR = '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'

    it('crea el post consumiendo el borrador en la misma transacción', async () => {
      cargarBorrador.mockResolvedValueOnce({ id: BORRADOR, campos: { cuentas: ['c-ig'] }, fecha: null, media: [] })
      resolverDestinos.mockResolvedValueOnce({ cuentas: [IG], networks: ['facebook'] })
      crearPostProgramado.mockResolvedValueOnce('post-1')
      const res = await POST(peticion({ texto: 'Hola', cuentas: ['c-ig'], ahora: true, media: [], borradorId: BORRADOR }))
      expect(res.status).toBe(200)
      expect(cargarBorrador).toHaveBeenCalledWith('owner-1', BORRADOR)
      expect(crearPostProgramado).toHaveBeenCalledWith('owner-1', expect.objectContaining({ borradorId: BORRADOR }))
      // Ya no hay un borrado aparte después: si fallaba, el borrador quedaba para programarse otra vez.
      expect(borrarBorrador).not.toHaveBeenCalled()
    })

    it('si el borrador ya no existe, no se crea nada: puede ser el mismo envío repetido', async () => {
      cargarBorrador.mockResolvedValueOnce(null)
      for (const borradorId of [BORRADOR, 'no-es-uuid']) {
        const res = await POST(peticion({ texto: 'Hola', cuentas: ['c-ig'], ahora: true, media: [], borradorId }))
        expect(res.status).toBe(404)
        expect(await res.json()).toEqual({ error: BORRADOR_NO_EXISTE })
      }
      expect(crearPostProgramado).not.toHaveBeenCalled()
    })

    it('con algo que el teléfono no programa, se rechaza con el motivo y el borrador sigue', async () => {
      cargarBorrador.mockResolvedValueOnce({ id: BORRADOR, campos: { cuentas: ['c-ig', 'tt-1'] }, fecha: null, media: [] })
      const res = await POST(peticion({ texto: 'Hola', cuentas: ['c-ig'], ahora: true, media: [], borradorId: BORRADOR }))
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Este borrador va también a TikTok: eso se programa en el panel web.' })
      expect(crearPostProgramado).not.toHaveBeenCalled()
      expect(borrarBorrador).not.toHaveBeenCalled()
    })

    it('un rechazo de validación no toca el borrador', async () => {
      cargarBorrador.mockResolvedValueOnce({ id: BORRADOR, campos: {}, fecha: null, media: [] })
      resolverDestinos.mockResolvedValueOnce({ cuentas: [], networks: [] })
      const res = await POST(peticion({ texto: 'Hola', cuentas: [], ahora: true, media: [], borradorId: BORRADOR }))
      expect(res.status).toBe(400)
      expect(borrarBorrador).not.toHaveBeenCalled()
    })

    it('si otro envío consumió el borrador entre la revisión y la creación, no sale un segundo post', async () => {
      const { BorradorConsumido } = await import('@/lib/social/publish/crear')
      cargarBorrador.mockResolvedValueOnce({ id: BORRADOR, campos: {}, fecha: null, media: [] })
      resolverDestinos.mockResolvedValueOnce({ cuentas: [IG], networks: ['facebook'] })
      crearPostProgramado.mockRejectedValueOnce(new BorradorConsumido())
      const res = await POST(peticion({ texto: 'Hola', cuentas: ['c-ig'], ahora: true, media: [], borradorId: BORRADOR }))
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: BORRADOR_NO_EXISTE })
    })
  })
})
