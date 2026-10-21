import { describe, expect, it } from 'vitest'
import {
  ESPERAS_TRAS_FALLO_MS,
  MAX_PUBLISH_ATTEMPTS,
  PEOR_SUBIDA_YOUTUBE_MS,
  PUBLISH_NETWORK_ERROR,
  PUBLISH_REJECTED,
  REARME,
  TOPE_INSTAGRAM,
  alcanzaElTiempo,
  contenedorEsBorrador,
  enVuelo,
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

  it('un fallo que trae su contenedor lo conserva: el reintento pregunta por él en vez de subir otro', () => {
    const reintento = resolveOutcome({ kind: 'failed', reason: PUBLISH_NETWORK_ERROR, containerId: 'CT_9' }, 0, AHORA)
    expect(reintento.status).toBe('scheduled')
    expect(reintento.containerId).toBe('CT_9')
    // Quemado también: un rearme lo retoma desde ahí.
    const quemado = resolveOutcome({ kind: 'failed', reason: PUBLISH_NETWORK_ERROR, containerId: 'CT_9' }, 2, AHORA)
    expect(quemado.status).toBe('failed')
    expect(quemado.containerId).toBe('CT_9')
  })

  it('un fallo sin contenedor lo deja en null, como siempre', () => {
    expect(resolveOutcome({ kind: 'failed', reason: PUBLISH_REJECTED }, 0, AHORA).containerId).toBeNull()
  })
})

describe('enVuelo', () => {
  it('un reclamo vigente está en vuelo; uno vencido o ninguno, no', () => {
    expect(enVuelo({ reclamadoHasta: new Date(AHORA.getTime() + MIN) }, AHORA)).toBe(true)
    expect(enVuelo({ reclamadoHasta: new Date(AHORA.getTime() - MIN) }, AHORA)).toBe(false)
    expect(enVuelo({ reclamadoHasta: AHORA }, AHORA)).toBe(false)
    expect(enVuelo({ reclamadoHasta: null }, AHORA)).toBe(false)
    expect(enVuelo({}, AHORA)).toBe(false)
  })
})

describe('alcanzaElTiempo', () => {
  // Una corrida que empezó en 0: puede empezar intentos hasta los 120 s y todo tiene que
  // terminar antes de los 230 s (los 240 de Vercel menos el margen), como en el cron.
  const plazos = { empezarHasta: 120_000, terminarAntesDe: 230_000 }
  const instagram = { network: 'instagram', containerId: null }
  const youtubeNuevo = { network: 'youtube', containerId: null }
  const youtubeSondeo = { network: 'youtube', containerId: 'yt-1' }

  it('ningún intento empieza pasado el límite para empezar', () => {
    expect(alcanzaElTiempo(instagram, plazos, 120_000)).toBe(true)
    expect(alcanzaElTiempo(instagram, plazos, 120_001)).toBe(false)
  })

  it('subir un video nuevo a YouTube empieza solo si le caben todos sus plazos', () => {
    const ultimo = plazos.terminarAntesDe - PEOR_SUBIDA_YOUTUBE_MS
    expect(alcanzaElTiempo(youtubeNuevo, plazos, ultimo)).toBe(true)
    expect(alcanzaElTiempo(youtubeNuevo, plazos, ultimo + 1)).toBe(false)
    // Preguntar por un video ya subido es corto: sigue la regla de todos.
    expect(alcanzaElTiempo(youtubeSondeo, plazos, ultimo + 1)).toBe(true)
  })

  it('el peor intento de YouTube cabe en una corrida de 240 segundos con su margen', () => {
    expect(PEOR_SUBIDA_YOUTUBE_MS).toBeLessThan(plazos.terminarAntesDe)
  })
})

describe('REARME', () => {
  it('vuelve a la fila sin intentos, error ni espera, y no toca el contenedor', () => {
    expect(REARME).toEqual({
      status: 'scheduled',
      attemptCount: 0,
      lastError: null,
      reintentarDesde: null,
      publicandoDesde: null,
    })
    expect(REARME).not.toHaveProperty('containerId')
  })

  it('solo el contenedor de Instagram es un borrador que se puede tirar', () => {
    expect(contenedorEsBorrador('instagram')).toBe(true)
    for (const red of ['youtube', 'facebook', 'tiktok']) expect(contenedorEsBorrador(red)).toBe(false)
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
