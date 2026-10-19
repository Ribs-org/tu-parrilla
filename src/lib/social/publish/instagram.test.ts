import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  carouselChildParams,
  carouselParentParams,
  classifyContainerStatus,
  ESPERA_TOPE_INSTAGRAM_MS,
  esTopeDiario,
  instagramPublisher,
  motivoDeRechazo,
  photoContainerParams,
  reelContainerParams,
} from './instagram'
import { PUBLISH_NETWORK_ERROR, TOPE_INSTAGRAM, TRIAL_REEL_NO_DISPONIBLE } from './publisher'

const image = { url: 'https://blob.test/a.jpg', mediaType: 'image' as const, position: 0 }
const video = { url: 'https://blob.test/b.mp4', mediaType: 'video' as const, position: 0 }

describe('payloads de contenedores', () => {
  it('foto: image_url y caption, nada más', () => {
    expect(photoContainerParams('Hola', image)).toEqual({
      image_url: 'https://blob.test/a.jpg',
      caption: 'Hola',
    })
  })

  it('video: media_type REELS con video_url', () => {
    expect(reelContainerParams('Hola', video, null)).toEqual({
      media_type: 'REELS',
      video_url: 'https://blob.test/b.mp4',
      caption: 'Hola',
    })
  })

  it('hijo de carrusel: imagen y video llevan is_carousel_item', () => {
    expect(carouselChildParams(image)).toEqual({
      image_url: 'https://blob.test/a.jpg',
      is_carousel_item: 'true',
    })
    expect(carouselChildParams(video)).toEqual({
      media_type: 'VIDEO',
      video_url: 'https://blob.test/b.mp4',
      is_carousel_item: 'true',
    })
  })

  it('padre de carrusel: children en orden, separados por coma', () => {
    expect(carouselParentParams('Hola', ['C1', 'C2', 'C3'])).toEqual({
      media_type: 'CAROUSEL',
      children: 'C1,C2,C3',
      caption: 'Hola',
    })
  })
})

describe('reelContainerParams con portada', () => {
  const media = { url: 'https://blob/v.mp4', mediaType: 'video' as const, position: 0 }

  it('con portada agrega cover_url', () => {
    expect(reelContainerParams('Hola', media, 'https://blob/p.jpg')).toEqual({
      media_type: 'REELS',
      video_url: 'https://blob/v.mp4',
      caption: 'Hola',
      cover_url: 'https://blob/p.jpg',
    })
  })

  it('sin portada el cuerpo queda como siempre', () => {
    expect(reelContainerParams('Hola', media, null)).toEqual({
      media_type: 'REELS',
      video_url: 'https://blob/v.mp4',
      caption: 'Hola',
    })
  })
})

describe('classifyContainerStatus', () => {
  it('FINISHED está listo para publicar', () => {
    expect(classifyContainerStatus({ status_code: 'FINISHED' })).toBe('finished')
  })

  it('ERROR y EXPIRED son veredictos, no esperas', () => {
    expect(classifyContainerStatus({ status_code: 'ERROR' })).toBe('error')
    expect(classifyContainerStatus({ status_code: 'EXPIRED' })).toBe('error')
  })

  it('IN_PROGRESS, ausente o desconocido siguen esperando', () => {
    expect(classifyContainerStatus({ status_code: 'IN_PROGRESS' })).toBe('in_progress')
    expect(classifyContainerStatus({})).toBe('in_progress')
    expect(classifyContainerStatus({ status_code: 'PUBLISHED' })).toBe('in_progress')
  })
})

describe('reelContainerParams con trial reel', () => {
  const media = { url: 'https://blob/v.mp4', mediaType: 'video' as const, position: 0 }

  it('con trialReel agrega trial_params en MANUAL, como JSON en el form', () => {
    expect(reelContainerParams('Hola', media, null, { trialReel: true })).toEqual({
      media_type: 'REELS',
      video_url: 'https://blob/v.mp4',
      caption: 'Hola',
      trial_params: '{"graduation_strategy":"MANUAL"}',
    })
  })

  it('con portada y trial, van las dos', () => {
    expect(reelContainerParams('Hola', media, 'https://blob/p.jpg', { trialReel: true })).toMatchObject({
      cover_url: 'https://blob/p.jpg',
      trial_params: '{"graduation_strategy":"MANUAL"}',
    })
  })

  it('sin opciones, o con las de otra red, no hay trial_params', () => {
    expect(reelContainerParams('Hola', media, null, null)).not.toHaveProperty('trial_params')
    expect(reelContainerParams('Hola', media, null, { modo: 'borrador' })).not.toHaveProperty('trial_params')
  })
})

describe('motivoDeRechazo', () => {
  const cuerpo = '{"error":{"message":"Trial reels are not available for this account","code":100}}'

  it('un rechazo que habla de trial, en un trial reel, es la frase fija', () => {
    expect(motivoDeRechazo(cuerpo, { trialReel: true })).toBe(TRIAL_REEL_NO_DISPONIBLE)
  })

  it('el mismo cuerpo sin trial reel pedido no es esa frase: se trata como hasta ahora', () => {
    expect(motivoDeRechazo(cuerpo, null)).toBeNull()
  })

  it('otro rechazo en un trial reel tampoco: solo se explica lo que se sabe explicar', () => {
    expect(motivoDeRechazo('{"error":{"message":"Invalid parameter","code":100}}', { trialReel: true })).toBeNull()
  })
})

describe('publish: el rechazo de un trial reel', () => {
  afterEach(() => vi.unstubAllGlobals())

  const input = {
    caption: 'Hola',
    media: [{ url: 'https://blob/v.mp4', mediaType: 'video' as const, position: 0 }],
    containerId: null,
    token: 't',
    accountExternalId: '123',
    coverUrl: null,
  }
  const cuatrocientos = () =>
    new Response('{"error":{"message":"Trial reels are not available for this account"}}', { status: 400 })

  it('en un trial reel, falla con la frase fija y no se reintenta como fallo de red', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => cuatrocientos()))
    const salida = await instagramPublisher.publish({ ...input, opciones: { trialReel: true } })
    // `definitivo: true` es lo que hace que `resolveOutcome` no lo reintente: Meta ya
    // contestó que no, no es un fallo de red que valga la pena repetir.
    expect(salida).toEqual({ kind: 'failed', reason: TRIAL_REEL_NO_DISPONIBLE, definitivo: true })
  })

  it('en un reel normal, el mismo 400 sigue siendo el fallo de red de siempre', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => cuatrocientos()))
    const salida = await instagramPublisher.publish({ ...input, opciones: null })
    expect(salida).toEqual({ kind: 'failed', reason: PUBLISH_NETWORK_ERROR })
  })
})

// El cuerpo que Meta devuelve con el tope diario de la Content Publishing API: código 9,
// subcódigo 2207042. El mensaje va antes y es largo; el subcódigo, al final.
const TOPE = JSON.stringify({
  error: {
    message: `Application request limit reached. ${'x'.repeat(320)}`,
    type: 'OAuthException',
    code: 9,
    error_subcode: 2207042,
    is_transient: false,
    error_user_title: 'Se alcanzó el número máximo de publicaciones',
    fbtrace_id: 'A1b2',
  },
})

describe('esTopeDiario', () => {
  it('reconoce el subcódigo 2207042 aunque venga después de un mensaje largo', () => {
    expect(esTopeDiario(TOPE)).toBe(true)
  })

  it('otro rechazo, u otro subcódigo que lo contiene, no es el tope', () => {
    expect(esTopeDiario('{"error":{"message":"Invalid parameter","code":100}}')).toBe(false)
    expect(esTopeDiario('{"error":{"code":9,"error_subcode":22070420}}')).toBe(false)
    expect(esTopeDiario('Bad gateway')).toBe(false)
  })
})

describe('publish: el tope diario espera en vez de fallar', () => {
  afterEach(() => vi.unstubAllGlobals())

  const foto = {
    caption: 'Hola',
    media: [{ url: 'https://blob/a.jpg', mediaType: 'image' as const, position: 0 }],
    containerId: null,
    token: 't',
    accountExternalId: '123',
    coverUrl: null,
    opciones: null,
  }
  const espera = { kind: 'deferred', esperaMs: ESPERA_TOPE_INSTAGRAM_MS, motivo: TOPE_INSTAGRAM }

  it('al publicar el contenedor: espera una hora y guarda el contenedor para no rehacerlo', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: 'CT_7' }))
      .mockResolvedValueOnce(new Response(TOPE, { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish(foto)).toEqual({ ...espera, containerId: 'CT_7' })
  })

  it('al crear el contenedor: espera igual, sin contenedor que guardar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(TOPE, { status: 400 })))
    expect(await instagramPublisher.publish(foto)).toEqual(espera)
  })

  it('el reintento con el contenedor guardado solo lo publica', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ status_code: 'FINISHED' }))
      .mockResolvedValueOnce(Response.json({ id: '18000000000000009' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish({ ...foto, containerId: 'CT_7' })).toEqual({
      kind: 'published',
      externalId: '18000000000000009',
    })
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/media_publish')
  })
})
