import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FACEBOOK_HISTORIA_RECHAZADA,
  FACEBOOK_MIXED_MEDIA,
  FACEBOOK_REJECTED,
  classifyStoryUpload,
  classifyVideoStatus,
  facebookPublisher,
  postIdDeHistoria,
  hasMixedMedia,
  multiPhotoFeedParams,
  photoPostParams,
  unpublishedPhotoParams,
  videoPostParams,
  idDelFeed,
} from './facebook'

const image = { url: 'https://blob.test/a.jpg', mediaType: 'image' as const, position: 0 }
const video = { url: 'https://blob.test/b.mp4', mediaType: 'video' as const, position: 0 }

describe('payloads de publicación en la página', () => {
  it('foto sola: url y caption, publicada de inmediato', () => {
    expect(photoPostParams('Hola', image)).toEqual({
      url: 'https://blob.test/a.jpg',
      caption: 'Hola',
    })
  })

  it('foto de un post múltiple: sin caption y sin publicar todavía', () => {
    // El texto va una sola vez, en el post de /feed; la foto suelta espera invisible.
    expect(unpublishedPhotoParams(image)).toEqual({
      url: 'https://blob.test/a.jpg',
      published: 'false',
    })
  })

  it('el post múltiple adjunta los fbid en orden, como JSON indexado', () => {
    expect(multiPhotoFeedParams('Hola', ['F1', 'F2', 'F3'])).toEqual({
      message: 'Hola',
      'attached_media[0]': '{"media_fbid":"F1"}',
      'attached_media[1]': '{"media_fbid":"F2"}',
      'attached_media[2]': '{"media_fbid":"F3"}',
    })
  })

  it('video: file_url y description', () => {
    expect(videoPostParams('Hola', video)).toEqual({
      file_url: 'https://blob.test/b.mp4',
      description: 'Hola',
    })
  })
})

describe('classifyVideoStatus', () => {
  it('ready está listo para declararse publicado', () => {
    expect(classifyVideoStatus({ status: { video_status: 'ready' } })).toBe('ready')
  })

  it('error es un veredicto, no una espera', () => {
    expect(classifyVideoStatus({ status: { video_status: 'error' } })).toBe('error')
  })

  it('processing, ausente o desconocido siguen esperando', () => {
    expect(classifyVideoStatus({ status: { video_status: 'processing' } })).toBe('processing')
    expect(classifyVideoStatus({})).toBe('processing')
    expect(classifyVideoStatus({ status: { video_status: 'upload_complete' } })).toBe('processing')
  })
})

describe('hasMixedMedia', () => {
  it('video y foto juntos es mezcla; cualquiera solo o repetido no lo es', () => {
    expect(hasMixedMedia([image, video])).toBe(true)
    expect(hasMixedMedia([image, { ...image, position: 1 }])).toBe(false)
    expect(hasMixedMedia([video])).toBe(false)
  })

  it('la frase del rechazo es fija y en español', () => {
    expect(FACEBOOK_MIXED_MEDIA).toBe('Facebook no admite mezclar video y fotos en un post.')
  })

  it('la frase del rechazo nombra a Facebook, no a otra red', () => {
    expect(FACEBOOK_REJECTED).toBe('Facebook rechazó la publicación.')
  })
})

describe('idDelFeed', () => {
  const PAGE = '1203923749477794'

  it('compone páginaID_postID: es el espacio de ids que guardan las métricas', () => {
    expect(idDelFeed({ post_id: '122107507743448275' }, PAGE, '1372222415120746')).toBe(
      '1203923749477794_122107507743448275',
    )
  })

  it('un post_id ya compuesto se respeta tal cual', () => {
    expect(idDelFeed({ post_id: `${PAGE}_999` }, PAGE, 'v-1')).toBe(`${PAGE}_999`)
  })

  it('sin post_id usable cae al id propio: publicar vale más que el calce', () => {
    expect(idDelFeed({}, PAGE, 'v-1')).toBe('v-1')
    expect(idDelFeed({ post_id: '' }, PAGE, 'v-1')).toBe('v-1')
    expect(idDelFeed({ post_id: 42 }, PAGE, 'v-1')).toBe('v-1')
    expect(idDelFeed(null, PAGE, 'v-1')).toBe('v-1')
  })
})

describe('historias de la página', () => {
  afterEach(() => vi.unstubAllGlobals())

  const base = {
    caption: '',
    containerId: null,
    token: 't',
    accountExternalId: 'PAGE',
    coverUrl: null,
    opciones: { historia: true as const },
  }

  it('el estado espera solo la subida; cualquier fase en error es un rechazo', () => {
    expect(classifyStoryUpload({ status: { uploading_phase: { status: 'in_progress' } } })).toBe('uploading')
    expect(classifyStoryUpload({ status: { uploading_phase: { status: 'complete' } } })).toBe('uploaded')
    expect(classifyStoryUpload({ status: { uploading_phase: { status: 'complete' }, processing_phase: { status: 'error' } } })).toBe('error')
    expect(classifyStoryUpload({ status: { video_status: 'expired' } })).toBe('error')
    expect(classifyStoryUpload({})).toBe('uploading')
  })

  it('el post_id llega como número o como texto', () => {
    expect(postIdDeHistoria({ success: true, post_id: 1234 })).toBe('1234')
    expect(postIdDeHistoria({ post_id: '99' })).toBe('99')
    expect(postIdDeHistoria({ success: true })).toBeNull()
    expect(postIdDeHistoria(null)).toBeNull()
  })

  it('una foto sube sin publicar y photo_stories la cuelga, en la misma corrida', async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json({ id: 'PH_1' }))
      .mockResolvedValueOnce(Response.json({ success: true, post_id: 555 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await facebookPublisher.publish({ ...base, media: [image] })).toEqual({ kind: 'published', externalId: '555' })
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/PAGE/photos')
    expect(new URLSearchParams(String(fetchMock.mock.calls[0]![1]!.body)).get('published')).toBe('false')
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/PAGE/photo_stories')
    expect(new URLSearchParams(String(fetchMock.mock.calls[1]![1]!.body)).get('photo_id')).toBe('PH_1')
  })

  it('un video: start, la subida con file_url, y queda procesando con su id', async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json({ video_id: 'V_1', upload_url: 'https://rupload.facebook.com/video-upload/v23.0/V_1' }))
      .mockResolvedValueOnce(Response.json({ success: true }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await facebookPublisher.publish({ ...base, media: [video] })).toEqual({ kind: 'processing', containerId: 'V_1' })
    expect(new URLSearchParams(String(fetchMock.mock.calls[0]![1]!.body)).get('upload_phase')).toBe('start')
    const subida = fetchMock.mock.calls[1]!
    expect(subida[0]).toBe('https://rupload.facebook.com/video-upload/v23.0/V_1')
    expect((subida[1]!.headers as Record<string, string>).file_url).toBe('https://blob.test/b.mp4')
  })

  it('la corrida siguiente espera la subida y la cierra con finish', async () => {
    const fetchMock = vi
      .fn<(url: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValueOnce(Response.json({ status: { uploading_phase: { status: 'complete' } } }))
      .mockResolvedValueOnce(Response.json({ success: true, post_id: '777' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await facebookPublisher.publish({ ...base, media: [video], containerId: 'V_1' })).toEqual({
      kind: 'published',
      externalId: '777',
    })
    const fin = new URLSearchParams(String(fetchMock.mock.calls[1]![1]!.body))
    expect(fin.get('upload_phase')).toBe('finish')
    expect(fin.get('video_id')).toBe('V_1')
  })

  it('mientras sube, sigue esperando; si Meta la rechaza, falla con su frase', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: { uploading_phase: { status: 'in_progress' } } })))
    expect(await facebookPublisher.publish({ ...base, media: [video], containerId: 'V_1' })).toEqual({
      kind: 'processing',
      containerId: 'V_1',
    })
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: { video_status: 'error' } })))
    expect(await facebookPublisher.publish({ ...base, media: [video], containerId: 'V_1' })).toEqual({
      kind: 'failed',
      reason: FACEBOOK_HISTORIA_RECHAZADA,
    })
  })
})
