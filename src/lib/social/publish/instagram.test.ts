import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  carouselChildParams,
  carouselParentParams,
  classifyContainerStatus,
  esMediaNoLista,
  ESPERA_TOPE_INSTAGRAM_MS,
  esTopeDiario,
  explicacionDeMeta,
  instagramPublisher,
  leerErrorDeMeta,
  motivoDeRechazo,
  photoContainerParams,
  rechazoDelContenedor,
  reelContainerParams,
  storyContainerParams,
  SUBCODIGO_TRIAL_SIN_SEGUIDORES,
} from './instagram'
import {
  HISTORIA_SOLO_EMPRESA,
  historiaSoloEmpresa,
  PUBLISH_NETWORK_ERROR,
  PUBLISH_REJECTED,
  rechazoDeInstagram,
  SIN_SEGUIDORES_PARA_TRIAL,
  TOPE_INSTAGRAM,
  trialNoDisponible,
  trialSinSeguidores,
} from './publisher'

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

  it('ERROR y EXPIRED son veredictos, no esperas: un rechazo, y un contenedor que Meta descartó sin publicar', () => {
    expect(classifyContainerStatus({ status_code: 'ERROR' })).toBe('error')
    expect(classifyContainerStatus({ status_code: 'EXPIRED' })).toBe('expired')
  })

  it('PUBLISHED ya salió: un intento anterior lo publicó y su respuesta se perdió', () => {
    expect(classifyContainerStatus({ status_code: 'PUBLISHED' })).toBe('published')
  })

  it('IN_PROGRESS, ausente o desconocido siguen esperando', () => {
    expect(classifyContainerStatus({ status_code: 'IN_PROGRESS' })).toBe('in_progress')
    expect(classifyContainerStatus({})).toBe('in_progress')
    expect(classifyContainerStatus({ status_code: 'ALGO_NUEVO' })).toBe('in_progress')
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

// Lo que Meta contestó el 2026-10-22 al trial reel de una cuenta nueva. El registro cortó
// `error_user_msg` en «no alcanza el mínim»; el final es una reconstrucción.
const SIN_SEGUIDORES = JSON.stringify({
  error: {
    message: 'Application does not have permission for this action',
    type: 'OAuthException',
    code: 10,
    error_subcode: SUBCODIGO_TRIAL_SIN_SEGUIDORES,
    is_transient: false,
    error_user_title: 'No tienes suficientes seguidores para crear reels de prueba',
    error_user_msg: 'La cuenta de Instagram no alcanza el mínimo de seguidores.',
    fbtrace_id: 'A1b2',
  },
})

describe('leerErrorDeMeta y explicacionDeMeta', () => {
  it('lee el código, el subcódigo y lo que Meta le muestra a una persona, con sus tildes', () => {
    // JSON.stringify no escapa la í; Meta sí (`í`). Las dos se leen igual.
    const escapado = SIN_SEGUIDORES.replace('mínimo', 'm\\u00ednimo')
    expect(leerErrorDeMeta(escapado)).toEqual({
      codigo: 10,
      subcodigo: SUBCODIGO_TRIAL_SIN_SEGUIDORES,
      titulo: 'No tienes suficientes seguidores para crear reels de prueba',
      mensaje: 'La cuenta de Instagram no alcanza el mínimo de seguidores.',
      tecnico: 'Application does not have permission for this action',
    })
  })

  it('la explicación prefiere lo de una persona y lleva el código al final', () => {
    expect(explicacionDeMeta(leerErrorDeMeta(SIN_SEGUIDORES)!)).toBe(
      '«No tienes suficientes seguidores para crear reels de prueba. La cuenta de Instagram no alcanza el mínimo de seguidores.» (código 10, subcódigo 2207081)',
    )
    expect(explicacionDeMeta(leerErrorDeMeta('{"error":{"message":"Invalid parameter","code":100}}')!)).toBe(
      '«Invalid parameter» (código 100)',
    )
  })

  it('un cuerpo cortado pierde solo el campo cortado', () => {
    const cortado = SIN_SEGUIDORES.slice(0, SIN_SEGUIDORES.indexOf('mínimo'))
    const e = leerErrorDeMeta(cortado)!
    expect(e.subcodigo).toBe(SUBCODIGO_TRIAL_SIN_SEGUIDORES)
    expect(e.titulo).toBe('No tienes suficientes seguidores para crear reels de prueba')
    expect(e.mensaje).toBeNull()
  })

  it('lo que no es un error de Meta no se lee como uno', () => {
    expect(leerErrorDeMeta('Bad gateway')).toBeNull()
    expect(leerErrorDeMeta('<html>502</html>')).toBeNull()
  })

  it('una explicación larga se corta', () => {
    const largo = JSON.stringify({ error: { message: 'x'.repeat(1000), code: 1 } })
    expect(explicacionDeMeta(leerErrorDeMeta(largo)!).length).toBeLessThan(320)
  })
})

describe('motivoDeRechazo', () => {
  const cuerpo = '{"error":{"message":"Trial reels are not available for this account","code":100}}'

  it('el subcódigo de los seguidores, en un trial reel, nombra la cuenta y dice el porqué', () => {
    expect(motivoDeRechazo(SIN_SEGUIDORES, { trialReel: true }, '@vicente_edits2')).toBe(
      `@vicente_edits2 ${SIN_SEGUIDORES_PARA_TRIAL}`,
    )
    expect(trialSinSeguidores(null)).toBe(`La cuenta ${SIN_SEGUIDORES_PARA_TRIAL}`)
  })

  it('un rechazo que habla de trial sin ese código: probablemente la función, con lo que Meta dijo', () => {
    expect(motivoDeRechazo(cuerpo, { trialReel: true }, '@a')).toBe(
      trialNoDisponible('@a', '«Trial reels are not available for this account» (código 100)'),
    )
  })

  it('también si Meta lo dijo en español, como lo dice a una persona', () => {
    const enEspanol = '{"error":{"code":100,"error_user_title":"No puedes crear reels de prueba"}}'
    expect(motivoDeRechazo(enEspanol, { trialReel: true }, '@a')).toBe(
      trialNoDisponible('@a', '«No puedes crear reels de prueba» (código 100)'),
    )
  })

  it('sin trial reel pedido no es ninguna de esas frases: se trata como hasta ahora', () => {
    expect(motivoDeRechazo(cuerpo, null)).toBeNull()
    expect(motivoDeRechazo(SIN_SEGUIDORES, null)).toBeNull()
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
    cuenta: '@vicente_edits2',
  }
  const cuatrocientos = () =>
    new Response('{"error":{"message":"Trial reels are not available for this account"}}', { status: 400 })

  it('sin los seguidores: falla al tiro, sin reintentos, con la cuenta y el porqué', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(SIN_SEGUIDORES, { status: 400 })))
    const salida = await instagramPublisher.publish({ ...input, opciones: { trialReel: true } })
    // `definitivo: true` es lo que hace que `resolveOutcome` no lo reintente: Meta ya
    // contestó que no, no es un fallo de red que valga la pena repetir.
    // `sinTrial` es lo que `trial-reels.ts` anota en la cuenta: no acepta trial reels.
    expect(salida).toEqual({
      kind: 'failed',
      reason: trialSinSeguidores('@vicente_edits2'),
      definitivo: true,
      sinTrial: true,
    })
  })

  it('un rechazo que habla de trial también falla al tiro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => cuatrocientos()))
    const salida = await instagramPublisher.publish({ ...input, opciones: { trialReel: true } })
    expect(salida).toEqual({
      kind: 'failed',
      reason: trialNoDisponible('@vicente_edits2', '«Trial reels are not available for this account»'),
      definitivo: true,
      sinTrial: true,
    })
  })

  it('en un reel normal, el mismo 400 se reintenta como siempre, ahora con lo que Meta dijo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => cuatrocientos()))
    const salida = await instagramPublisher.publish({ ...input, opciones: null })
    expect(salida).toEqual({
      kind: 'failed',
      reason: rechazoDeInstagram('@vicente_edits2', '«Trial reels are not available for this account»'),
    })
  })

  it('una respuesta que no es de Meta sigue siendo el fallo de red', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Bad gateway', { status: 502 })))
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

describe('publish: retomar un contenedor guardado sin publicar dos veces', () => {
  afterEach(() => vi.unstubAllGlobals())

  const foto = {
    caption: 'Hola',
    media: [{ url: 'https://blob/a.jpg', mediaType: 'image' as const, position: 0 }],
    containerId: 'CT_7',
    token: 't',
    accountExternalId: '123',
    coverUrl: null,
    opciones: null,
  }

  it('si el sondeo no contesta, sigue esperando con el mismo contenedor', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Bad gateway', { status: 502 })))
    expect(await instagramPublisher.publish(foto)).toEqual({ kind: 'processing', containerId: 'CT_7' })
  })

  it('si el sondeo se corta (plazo, red), también', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('The operation was aborted due to timeout'))))
    expect(await instagramPublisher.publish(foto)).toEqual({ kind: 'processing', containerId: 'CT_7' })
  })

  it('PUBLISHED: ya salió en un intento anterior; se anota sin volver a publicar', async () => {
    const fetchMock = vi.fn(async () => Response.json({ status_code: 'PUBLISHED' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish(foto)).toEqual({ kind: 'published', externalId: null })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('EXPIRED: Meta lo descartó sin publicarlo; se arma otro y se publica en el mismo intento', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ status_code: 'EXPIRED' }))
      .mockResolvedValueOnce(Response.json({ id: 'CT_8' }))
      .mockResolvedValueOnce(Response.json({ id: '18000000000000010' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish(foto)).toEqual({ kind: 'published', externalId: '18000000000000010' })
    expect(String(fetchMock.mock.calls[1]![0])).toMatch(/\/123\/media$/)
    expect(String(fetchMock.mock.calls[2]![0])).toContain('/media_publish')
  })

  it('si media_publish no contesta, el fallo se lleva el contenedor para preguntar por él después', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ status_code: 'FINISHED' }))
      .mockRejectedValueOnce(new Error('The operation was aborted due to timeout'))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish(foto)).toEqual({
      kind: 'failed',
      reason: PUBLISH_NETWORK_ERROR,
      containerId: 'CT_7',
    })
  })

  it('si Meta rechaza media_publish, también se lleva el contenedor, y dice qué dijo Meta', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ status_code: 'FINISHED' }))
      .mockResolvedValueOnce(new Response('{"error":{"message":"Invalid parameter","code":100}}', { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish({ ...foto, cuenta: '@vicente' })).toEqual({
      kind: 'failed',
      reason: 'Instagram rechazó la publicación en @vicente: «Invalid parameter» (código 100).',
      containerId: 'CT_7',
    })
  })

  it('un contenedor en ERROR dice el porqué que trae su status; sin él, la frase de siempre', async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () =>
      Response.json({ status_code: 'ERROR', status: 'Error: Media upload has failed with error code 2207026' }),
    )
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish({ ...foto, cuenta: '@vicente' })).toEqual({
      kind: 'failed',
      reason: 'Instagram rechazó la publicación en @vicente: «Error: Media upload has failed with error code 2207026».',
    })
    // Meta solo manda `status` si se lo pide.
    expect(String(fetchMock.mock.calls[0]![0])).toContain('fields=status_code,status&')
    expect(rechazoDelContenedor({ status_code: 'ERROR', status: 'ERROR' }, '@vicente')).toBe(PUBLISH_REJECTED)
    expect(rechazoDelContenedor({ status_code: 'ERROR' }, '@vicente')).toBe(PUBLISH_REJECTED)
  })
})

describe('historias', () => {
  afterEach(() => vi.unstubAllGlobals())

  const base = {
    caption: '',
    containerId: null,
    token: 't',
    accountExternalId: '123',
    coverUrl: null,
    cuenta: '@vicente_edits2',
    opciones: { historia: true as const },
  }

  it('el contenedor es STORIES, sin texto ni portada', () => {
    expect(storyContainerParams(image)).toEqual({ media_type: 'STORIES', image_url: 'https://blob.test/a.jpg' })
    expect(storyContainerParams(video)).toEqual({ media_type: 'STORIES', video_url: 'https://blob.test/b.mp4' })
  })

  it('una foto sale en la misma corrida: crea el contenedor y lo publica', async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json({ id: 'CT_1' }))
      .mockResolvedValueOnce(Response.json({ id: 'IG_1' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await instagramPublisher.publish({ ...base, media: [image] })).toEqual({ kind: 'published', externalId: 'IG_1' })
    const cuerpo = new URLSearchParams(String(fetchMock.mock.calls[0]![1]!.body))
    expect(cuerpo.get('media_type')).toBe('STORIES')
    expect(cuerpo.get('caption')).toBeNull()
  })

  it('un video queda procesando, como un reel', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ id: 'CT_2' })))
    expect(await instagramPublisher.publish({ ...base, media: [video] })).toEqual({ kind: 'processing', containerId: 'CT_2' })
  })

  it('una cuenta que no es de empresa falla al tiro, sin decir nada de los trial reels', async () => {
    const creador = '{"error":{"message":"The user is not an Instagram Business","code":10}}'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(creador, { status: 400 })))
    expect(await instagramPublisher.publish({ ...base, media: [image] })).toEqual({
      kind: 'failed',
      reason: historiaSoloEmpresa('@vicente_edits2'),
      definitivo: true,
    })
    expect(historiaSoloEmpresa('@a')).toBe(`@a ${HISTORIA_SOLO_EMPRESA}`)
  })

  it('otro rechazo de una historia se reintenta como cualquiera', () => {
    expect(motivoDeRechazo('{"error":{"message":"Invalid parameter","code":100}}', { historia: true })).toBeNull()
  })
})

describe('la foto que Meta todavía no tiene lista', () => {
  afterEach(() => vi.unstubAllGlobals())

  const noLista =
    '{"error":{"message":"Media ID is not available","code":9007,"error_subcode":2207027,"error_user_msg":"El contenido multimedia no está listo para publicarse. Espera un momento."}}'

  it('se reconoce por su subcódigo', () => {
    expect(esMediaNoLista(noLista)).toBe(true)
    expect(esMediaNoLista('{"error":{"code":9007,"error_subcode":22070270}}')).toBe(false)
  })

  it('no es un rechazo: queda procesando con su contenedor, y la corrida siguiente lo publica', async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json({ id: 'CT_9' }))
      .mockResolvedValueOnce(new Response(noLista, { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)
    const salida = await instagramPublisher.publish({
      caption: 'Hola',
      media: [image],
      containerId: null,
      token: 't',
      accountExternalId: '123',
      coverUrl: null,
      opciones: null,
      cuenta: '@vicente',
    })
    expect(salida).toEqual({ kind: 'processing', containerId: 'CT_9' })
  })
})
