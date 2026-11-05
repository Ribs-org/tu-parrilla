import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  THREADS_REJECTED,
  THREADS_SINGLE_FILE,
  classifyThreadsStatus,
  esMediaNoLista,
  threadsContainerParams,
  threadsPublisher,
} from './threads'

const image = { url: 'https://blob.test/a.jpg', mediaType: 'image' as const, position: 0 }
const video = { url: 'https://blob.test/b.mp4', mediaType: 'video' as const, position: 0 }

describe('threadsContainerParams', () => {
  it('sin archivo es un post de texto', () => {
    expect(threadsContainerParams('Hola', null)).toEqual({ media_type: 'TEXT', text: 'Hola' })
  })

  it('imagen y video llevan su url y el texto', () => {
    expect(threadsContainerParams('Hola', image)).toEqual({
      media_type: 'IMAGE',
      image_url: 'https://blob.test/a.jpg',
      text: 'Hola',
    })
    expect(threadsContainerParams('Hola', video)).toEqual({
      media_type: 'VIDEO',
      video_url: 'https://blob.test/b.mp4',
      text: 'Hola',
    })
  })
})

describe('classifyThreadsStatus', () => {
  it('FINISHED publica; ERROR y EXPIRED son veredictos', () => {
    expect(classifyThreadsStatus({ status: 'FINISHED' })).toBe('finished')
    expect(classifyThreadsStatus({ status: 'ERROR' })).toBe('error')
    expect(classifyThreadsStatus({ status: 'EXPIRED' })).toBe('error')
  })

  it('IN_PROGRESS, ausente o desconocido siguen esperando', () => {
    expect(classifyThreadsStatus({ status: 'IN_PROGRESS' })).toBe('in_progress')
    expect(classifyThreadsStatus({})).toBe('in_progress')
  })
})

describe('frases fijas', () => {
  it('nombran a Threads, no a otra red', () => {
    expect(THREADS_REJECTED).toBe('Threads rechazó la publicación.')
    expect(THREADS_SINGLE_FILE).toBe('Threads recibe un solo archivo por post.')
  })
})

// Lo que Threads contestó el 2026-11-05 al publicar una imagen en el mismo segundo en que se creó su contenedor.
const MEDIA_NO_LISTA = JSON.stringify({
  error: {
    message: 'The requested resource does not exist',
    code: 24,
    type: 'OAuthException',
    error_subcode: 4279009,
    error_user_title: 'Media Not Found',
  },
})

const entrada = {
  caption: 'Hola',
  media: [] as (typeof image)[],
  containerId: null as string | null,
  token: 't',
  accountExternalId: '42',
  coverUrl: null,
  opciones: null,
}

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), { status })
}

describe('esMediaNoLista', () => {
  it('reconoce el «Media Not Found» de un contenedor que todavía procesa', () => {
    expect(esMediaNoLista(MEDIA_NO_LISTA)).toBe(true)
    expect(esMediaNoLista('{"error":{"code":100,"error_subcode":42790091}}')).toBe(false)
    expect(esMediaNoLista('Bad gateway')).toBe(false)
  })
})

describe('threadsPublisher', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('una imagen espera en su contenedor: no publica en el mismo segundo', async () => {
    const fetchMock = vi.fn(async () => json({ id: 'c1' }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await threadsPublisher.publish({ ...entrada, media: [image] })).toEqual({
      kind: 'processing',
      containerId: 'c1',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('el texto solo se publica al tiro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (String(url).includes('threads_publish') ? json({ id: 'p1' }) : json({ id: 'c1' }))),
    )
    expect(await threadsPublisher.publish(entrada)).toEqual({ kind: 'published', externalId: 'p1' })
  })

  it('con el contenedor en FINISHED, publica', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (String(url).includes('threads_publish') ? json({ id: 'p1' }) : json({ status: 'FINISHED' }))),
    )
    expect(await threadsPublisher.publish({ ...entrada, media: [image], containerId: 'c1' })).toEqual({
      kind: 'published',
      externalId: 'p1',
    })
  })

  it('«Media Not Found» al publicar sigue esperando en vez de fallar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        String(url).includes('threads_publish') ? new Response(MEDIA_NO_LISTA, { status: 400 }) : json({ status: 'FINISHED' }),
      ),
    )
    expect(await threadsPublisher.publish({ ...entrada, media: [image], containerId: 'c1' })).toEqual({
      kind: 'processing',
      containerId: 'c1',
    })
  })

  it('otro rechazo al publicar es un fallo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        String(url).includes('threads_publish') ? json({ error: { code: 100 } }, 400) : json({ status: 'FINISHED' }),
      ),
    )
    expect(await threadsPublisher.publish({ ...entrada, media: [image], containerId: 'c1' })).toEqual({
      kind: 'failed',
      reason: THREADS_REJECTED,
    })
  })
})
