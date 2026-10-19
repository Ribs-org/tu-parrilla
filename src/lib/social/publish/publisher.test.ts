import { describe, expect, it } from 'vitest'
import {
  ESPERAS_TRAS_FALLO_MS,
  MAX_PUBLISH_ATTEMPTS,
  PUBLISH_REJECTED,
  TOPE_INSTAGRAM,
  isStaleProcessing,
  resolveOutcome,
  mediaParaBorrar,
} from './publisher'

const AHORA = new Date('2026-10-17T12:00:00Z')
const MIN = 60_000

describe('resolveOutcome', () => {
  it('publicado guarda el id externo y limpia el resto', () => {
    expect(resolveOutcome({ kind: 'published', externalId: '18000000000000001' }, 1, AHORA)).toEqual({
      status: 'published',
      containerId: null,
      externalId: '18000000000000001',
      attemptCount: 1,
      lastError: null,
      reintentarDesde: null,
    })
  })

  it('procesando estaciona el contenedor sin gastar intentos', () => {
    // Esperar a Meta no es un fallo: el intento se gasta solo cuando algo salió mal.
    expect(resolveOutcome({ kind: 'processing', containerId: 'CT_1' }, 0, AHORA)).toEqual({
      status: 'publishing',
      containerId: 'CT_1',
      externalId: null,
      attemptCount: 0,
      lastError: null,
      reintentarDesde: null,
    })
  })

  it('un fallo con intentos restantes vuelve a programado, con el motivo visible', () => {
    const patch = resolveOutcome({ kind: 'failed', reason: PUBLISH_REJECTED }, 0, AHORA)
    expect(patch.status).toBe('scheduled')
    expect(patch.attemptCount).toBe(1)
    expect(patch.lastError).toBe(PUBLISH_REJECTED)
    expect(patch.containerId).toBeNull()
  })

  it('publicado sin id externo (un borrador a la bandeja) también cierra el destino', () => {
    expect(resolveOutcome({ kind: 'published', externalId: null }, 2, AHORA)).toEqual({
      status: 'published',
      containerId: null,
      externalId: null,
      attemptCount: 2,
      lastError: null,
      reintentarDesde: null,
    })
  })

  it('diferido sin más datos vuelve a programado sin gastar intento, ni motivo, ni espera', () => {
    // La red pidió esperar (cupo por minuto): no es un fallo del post.
    expect(resolveOutcome({ kind: 'deferred' }, 1, AHORA)).toEqual({
      status: 'scheduled',
      containerId: null,
      externalId: null,
      attemptCount: 1,
      lastError: null,
      reintentarDesde: null,
    })
  })

  it('diferido con plazo, motivo y contenedor (el tope de Instagram) guarda los tres sin gastar intento', () => {
    const patch = resolveOutcome(
      { kind: 'deferred', esperaMs: 60 * MIN, motivo: TOPE_INSTAGRAM, containerId: 'CT_9' },
      2,
      AHORA,
    )
    expect(patch).toEqual({
      status: 'scheduled',
      containerId: 'CT_9',
      externalId: null,
      attemptCount: 2,
      lastError: TOPE_INSTAGRAM,
      reintentarDesde: new Date(AHORA.getTime() + 60 * MIN),
    })
  })

  it('el tercer fallo es definitivo', () => {
    const patch = resolveOutcome({ kind: 'failed', reason: PUBLISH_REJECTED }, MAX_PUBLISH_ATTEMPTS - 1, AHORA)
    expect(patch.status).toBe('failed')
    expect(patch.attemptCount).toBe(MAX_PUBLISH_ATTEMPTS)
  })

  it('solo el tercer fallo produce failed: el email de aviso sale una única vez', () => {
    const statuses = [0, 1, 2].map(
      (attempts) => resolveOutcome({ kind: 'failed', reason: PUBLISH_REJECTED }, attempts, AHORA).status,
    )
    expect(statuses).toEqual(['scheduled', 'scheduled', 'failed'])
  })

  it('entre intentos espera quince minutos y después dos horas; el quemado ya no espera nada', () => {
    const esperas = [0, 1, 2].map((attempts) => {
      const desde = resolveOutcome({ kind: 'failed', reason: PUBLISH_REJECTED }, attempts, AHORA).reintentarDesde
      return desde ? (desde.getTime() - AHORA.getTime()) / MIN : null
    })
    expect(esperas).toEqual([15, 120, null])
    expect(ESPERAS_TRAS_FALLO_MS).toEqual([15 * MIN, 120 * MIN])
  })

  it('un fallo definitivo cae en failed en el primer intento, sin esperar al tercero', () => {
    const patch = resolveOutcome({ kind: 'failed', reason: PUBLISH_REJECTED, definitivo: true }, 0, AHORA)
    expect(patch.status).toBe('failed')
    expect(patch.attemptCount).toBe(1)
    expect(patch.lastError).toBe(PUBLISH_REJECTED)
    expect(patch.reintentarDesde).toBeNull()
  })

  it('sin definitivo, el mismo fallo en el primer intento sigue el comportamiento de siempre', () => {
    const patch = resolveOutcome({ kind: 'failed', reason: PUBLISH_REJECTED }, 0, AHORA)
    expect(patch.status).toBe('scheduled')
  })
})

describe('isStaleProcessing', () => {
  const base = new Date('2026-08-31T12:00:00Z')

  it('un publishing reciente no está vencido', () => {
    expect(isStaleProcessing(new Date('2026-08-31T11:00:00Z'), base)).toBe(false)
  })

  it('a las 24 horas exactas ya venció', () => {
    expect(isStaleProcessing(new Date('2026-08-30T12:00:00Z'), base)).toBe(true)
  })
})

describe('mediaParaBorrar', () => {
  const video = { id: 'm1', mediaType: 'video' as const, blobUrl: 'https://blob/v.mp4' }
  const foto = { id: 'm2', mediaType: 'image' as const, blobUrl: 'https://blob/f.jpg' }

  it('con todos los destinos publicados, el video ya cumplió: se borra', () => {
    expect(
      mediaParaBorrar([{ status: 'published' }, { status: 'published' }], [video, foto]),
    ).toEqual([video])
  })

  it('las fotos se conservan: pesan poco y son la memoria visual del calendario', () => {
    expect(mediaParaBorrar([{ status: 'published' }], [foto])).toEqual([])
  })

  it('mientras quede un destino sin publicar, no se toca nada', () => {
    for (const pendiente of ['scheduled', 'publishing', 'failed']) {
      expect(mediaParaBorrar([{ status: 'published' }, { status: pendiente }], [video])).toEqual([])
    }
  })

  it('un post sin destinos no se considera publicado', () => {
    expect(mediaParaBorrar([], [video])).toEqual([])
  })
})
