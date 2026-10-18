import { describe, expect, it } from 'vitest'
import { RANGO_ERROR } from './metrics-api'
import { armarProgramados, impideBorrar, parseVentana } from './schedule-api'

const ZONE = 'America/Santiago'
// 20 de junio de 2026, 11:00 en Chile (UTC-4 en invierno).
const now = new Date('2026-06-20T15:00:00Z')

describe('parseVentana', () => {
  it('sin parámetros va de hoy a 30 días adelante, ambos días completos', () => {
    const r = parseVentana(null, null, now, ZONE)
    if ('error' in r) throw new Error(r.error)
    expect(r.from).toEqual(new Date('2026-06-20T04:00:00Z'))
    // Hasta el 20 de julio inclusive: el corte es el inicio del 21.
    expect(r.to).toEqual(new Date('2026-07-21T04:00:00Z'))
    expect(r.desde).toBe('2026-06-20')
    expect(r.hasta).toBe('2026-07-20')
  })

  it('con solo desde, cubre 30 días desde ese día', () => {
    const r = parseVentana('2026-06-01', null, now, ZONE)
    if ('error' in r) throw new Error(r.error)
    expect(r.desde).toBe('2026-06-01')
    expect(r.hasta).toBe('2026-07-01')
  })

  it('con solo hasta, parte hoy', () => {
    const r = parseVentana(null, '2026-06-25', now, ZONE)
    if ('error' in r) throw new Error(r.error)
    expect(r.desde).toBe('2026-06-20')
    expect(r.hasta).toBe('2026-06-25')
  })

  it('acepta un rango pasado: lo publicado también se lista', () => {
    const r = parseVentana('2026-05-01', '2026-05-31', now, ZONE)
    if ('error' in r) throw new Error(r.error)
    expect(r.from).toEqual(new Date('2026-05-01T04:00:00Z'))
    expect(r.to).toEqual(new Date('2026-06-01T04:00:00Z'))
  })

  it('rechaza formato inválido y rango invertido con la frase de métricas', () => {
    expect(parseVentana('2026/06/01', null, now, ZONE)).toEqual({ error: RANGO_ERROR })
    expect(parseVentana('2026-06-10', '2026-06-01', now, ZONE)).toEqual({ error: RANGO_ERROR })
  })
})

describe('armarProgramados', () => {
  const post = {
    id: 'p1',
    caption: 'Hola',
    scheduledAt: new Date('2026-06-21T22:00:00Z'),
    coverUrl: 'https://m.x/portada.jpg',
    atributos: { hook: 'pregunta' },
    ref: 'lote-7',
  }
  const filas = [
    {
      post,
      target: { network: 'instagram', status: 'published', lastError: null, externalId: '18', attemptCount: 1, accountId: 'acc-ig', reintentarDesde: null },
      handle: '@vicente',
    },
    {
      post,
      target: { network: 'x', status: 'failed', lastError: 'X aún no recibe video desde el calendario.', externalId: null, attemptCount: 3, accountId: 'acc-x', reintentarDesde: new Date('2026-06-21T23:00:00Z') },
      handle: null,
    },
    {
      post: { id: 'p2', caption: '', scheduledAt: new Date('2026-06-22T12:00:00Z'), coverUrl: null, atributos: null, ref: null },
      target: { network: 'threads', status: 'scheduled', lastError: null, externalId: null, attemptCount: 0, accountId: 'acc-th', reintentarDesde: null },
      handle: '@vicentethreads',
    },
  ]
  const medias = [
    { postId: 'p1', blobUrl: 'https://m.x/b.mp4', mediaType: 'video' as const, position: 1 },
    { postId: 'p1', blobUrl: 'https://m.x/a.jpg', mediaType: 'image' as const, position: 0 },
  ]

  it('agrupa un post con sus redes, media en orden y fecha en hora de Chile', () => {
    const posts = armarProgramados(filas, medias, ZONE)
    expect(posts).toHaveLength(2)
    expect(posts[0]).toEqual({
      id: 'p1',
      texto: 'Hola',
      fecha: '2026-06-21T18:00:00-04:00',
      portada: 'https://m.x/portada.jpg',
      media: [
        { url: 'https://m.x/a.jpg', tipo: 'image' },
        { url: 'https://m.x/b.mp4', tipo: 'video' },
      ],
      atributos: { hook: 'pregunta' },
      ref: 'lote-7',
      redes: [
        { red: 'instagram', estado: 'published', error: null, externalId: '18', intentos: 1, proximoIntento: null, cuentaId: 'acc-ig', handle: '@vicente' },
        // Quemado: la hora de su último reintento ya no dice nada, aunque la fila la traiga.
        { red: 'x', estado: 'failed', error: 'X aún no recibe video desde el calendario.', externalId: null, intentos: 3, proximoIntento: null, cuentaId: 'acc-x', handle: null },
      ],
    })
  })

  it('un destino que espera su próximo intento dice cuándo, en hora de Chile', () => {
    const fila = {
      post: { id: 'p3', caption: 'Reintento', scheduledAt: new Date('2026-06-21T22:00:00Z'), coverUrl: null, atributos: null, ref: null },
      target: {
        network: 'instagram',
        status: 'scheduled',
        lastError: 'No se pudo hablar con la red. Se reintentará.',
        externalId: null,
        attemptCount: 1,
        reintentarDesde: new Date('2026-06-21T22:15:00Z'),
        accountId: 'acc-ig',
      },
      handle: '@vicente',
    }
    const [post] = armarProgramados([fila], [], ZONE)
    expect(post!.ref).toBeNull()
    expect(post!.redes[0]!.proximoIntento).toBe('2026-06-21T18:15:00-04:00')
  })

  it('un post sin media ni atributos viaja con lista vacía y null, nunca 0', () => {
    const posts = armarProgramados(filas, medias, ZONE)
    expect(posts[1]).toMatchObject({ id: 'p2', texto: '', media: [], atributos: null, portada: null })
  })

  it('respeta el orden de llegada de las filas: el query ya ordena por fecha', () => {
    expect(armarProgramados(filas, medias, ZONE).map((p) => p.id)).toEqual(['p1', 'p2'])
  })
})

describe('impideBorrar', () => {
  it('basta un destino publicado o publicando; fallidos y programados no impiden', () => {
    expect(impideBorrar([{ status: 'scheduled' }, { status: 'failed' }])).toBe(false)
    expect(impideBorrar([{ status: 'scheduled' }, { status: 'published' }])).toBe(true)
    expect(impideBorrar([{ status: 'publishing' }])).toBe(true)
    expect(impideBorrar([])).toBe(false)
  })
})
