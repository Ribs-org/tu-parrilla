import { afterEach, describe, expect, it, vi } from 'vitest'
import { ARCHIVO_MUY_GRANDE } from './limites'
import { PLAYLIST_NO_AGREGADO, PLAYLIST_YA_NO_EXISTE } from '../playlists-youtube'
import {
  YOUTUBE_REJECTED,
  classifyUploadStatus,
  youtubePublisher,
  singleVideo,
  youtubeMetadata,
  youtubeTitle,
  youtubeUploadBody,
} from './youtube'

const image = { url: 'https://blob.test/a.jpg', mediaType: 'image' as const, position: 0 }
const video = { url: 'https://blob.test/b.mp4', mediaType: 'video' as const, position: 0 }

describe('publish: un video más grande que lo que se deja programar', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('se quema sin bajarlo entero: el video no entra en la memoria de la función', async () => {
    const cuerpo = new ReadableStream({ start: (c) => c.enqueue(new Uint8Array([1])) })
    const fetchMock = vi.fn(
      async () => new Response(cuerpo, { status: 200, headers: { 'content-length': String(700 * 1024 * 1024) } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const salida = await youtubePublisher.publish({
      caption: 'Hola',
      media: [video],
      containerId: null,
      token: 't',
      accountExternalId: 'canal',
      coverUrl: null,
      opciones: null,
    })
    expect(salida).toEqual({ kind: 'failed', reason: ARCHIVO_MUY_GRANDE, definitivo: true })
    // Solo la descarga: nunca llegó a subir nada a YouTube.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('youtubeTitle', () => {
  it('la primera línea es el título; el resto queda para la descripción', () => {
    expect(youtubeTitle('¿VALE LA PENA LA U?\nSi tenís 17, tómate un año.')).toBe('¿VALE LA PENA LA U?')
  })

  it('recorta a los 100 caracteres que YouTube admite', () => {
    expect(youtubeTitle('x'.repeat(150))).toHaveLength(100)
  })

  it('un caption vacío no deja el título vacío: YouTube lo exige', () => {
    expect(youtubeTitle('')).toBe('Video')
    expect(youtubeTitle('   \n resto')).toBe('resto')
  })
})

describe('youtubeMetadata', () => {
  it('público y declarado no-infantil, con el caption completo de descripción', () => {
    expect(youtubeMetadata('Título\ncuerpo')).toEqual({
      snippet: { title: 'Título', description: 'Título\ncuerpo' },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    })
  })
})

describe('youtubeMetadata con las opciones del destino', () => {
  it('sin opciones va exactamente lo de antes: público y sin la declaración de IA', () => {
    expect(youtubeMetadata('Hola', null).status).toEqual({ privacyStatus: 'public', selfDeclaredMadeForKids: false })
    expect(youtubeMetadata('Hola', { playlist: 'PL123' }).status).toEqual({
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
    })
  })

  it('la visibilidad elegida es el privacyStatus', () => {
    expect(youtubeMetadata('Hola', { visibilidad: 'unlisted' }).status.privacyStatus).toBe('unlisted')
    expect(youtubeMetadata('Hola', { visibilidad: 'private' }).status.privacyStatus).toBe('private')
  })

  it('«Hecho con IA» encendido declara contenido sintético; apagado no manda la clave', () => {
    expect(youtubeMetadata('Hola', { ia: true }).status).toEqual({
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true,
    })
    expect('containsSyntheticMedia' in youtubeMetadata('Hola', { visibilidad: 'private' }).status).toBe(false)
  })
})

describe('publish: las opciones viajan en la subida', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('el multipart lleva la visibilidad y la declaración de IA del destino', async () => {
    const llamadas: Array<{ url: string; body?: unknown }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        llamadas.push({ url, body: init?.body })
        if (url === video.url) return new Response(new Uint8Array([1, 2, 3]), { status: 200 })
        return Response.json({ id: 'vid-1' })
      }),
    )
    const salida = await youtubePublisher.publish({
      caption: 'Hola',
      media: [video],
      containerId: null,
      token: 't',
      accountExternalId: 'canal',
      coverUrl: null,
      opciones: { visibilidad: 'unlisted', ia: true, playlist: 'PL123' },
    })
    expect(salida).toEqual({ kind: 'processing', containerId: 'vid-1' })
    const subida = llamadas.find((l) => l.url.includes('/upload/youtube/v3/videos'))!
    const texto = new TextDecoder().decode(subida.body as Uint8Array)
    expect(texto).toContain('"privacyStatus":"unlisted"')
    expect(texto).toContain('"containsSyntheticMedia":true')
    // La playlist no se toca al subir: espera a que el video termine de procesarse.
    expect(llamadas.some((l) => l.url.includes('playlistItems'))).toBe(false)
  })
})

describe('publish: la playlist, cuando el video ya salió', () => {
  afterEach(() => vi.unstubAllGlobals())

  function sondeo(playlist: Response | Error) {
    const llamadas: Array<{ url: string; init?: RequestInit }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        llamadas.push({ url, init })
        if (url.includes('/youtube/v3/videos?part=status')) {
          return Response.json({ items: [{ status: { uploadStatus: 'processed' } }] })
        }
        if (playlist instanceof Error) throw playlist
        return playlist
      }),
    )
    return llamadas
  }

  const entrada = (opciones: unknown) => ({
    caption: 'Hola',
    media: [video],
    containerId: 'vid-1',
    token: 't',
    accountExternalId: 'canal',
    coverUrl: null,
    opciones: opciones as never,
  })

  it('sin playlist publica sin llamar a playlistItems', async () => {
    const llamadas = sondeo(Response.json({}))
    expect(await youtubePublisher.publish(entrada({ visibilidad: 'private' }))).toEqual({
      kind: 'published',
      externalId: 'vid-1',
    })
    expect(llamadas.some((l) => l.url.includes('playlistItems'))).toBe(false)
  })

  it('con playlist la agrega una vez, con el video y la playlist elegidos', async () => {
    const llamadas = sondeo(Response.json({ id: 'item-1' }))
    expect(await youtubePublisher.publish(entrada({ playlist: 'PL123' }))).toEqual({
      kind: 'published',
      externalId: 'vid-1',
    })
    const agregar = llamadas.filter((l) => l.url.includes('playlistItems'))
    expect(agregar).toHaveLength(1)
    expect(agregar[0]!.init?.method).toBe('POST')
    expect(JSON.parse(String(agregar[0]!.init?.body))).toEqual({
      snippet: { playlistId: 'PL123', resourceId: { kind: 'youtube#video', videoId: 'vid-1' } },
    })
  })

  it('si YouTube no la agrega, el destino queda publicado con el aviso, no fallado', async () => {
    sondeo(new Response('{"error":{"code":403}}', { status: 403 }))
    expect(await youtubePublisher.publish(entrada({ playlist: 'PL123' }))).toEqual({
      kind: 'published',
      externalId: 'vid-1',
      aviso: PLAYLIST_NO_AGREGADO,
    })
  })

  it('una playlist que ya no existe lo dice con su frase', async () => {
    sondeo(new Response('{"error":{"code":404}}', { status: 404 }))
    expect(await youtubePublisher.publish(entrada({ playlist: 'PL123' }))).toEqual({
      kind: 'published',
      externalId: 'vid-1',
      aviso: PLAYLIST_YA_NO_EXISTE,
    })
  })

  it('una llamada que se corta tampoco tumba lo publicado', async () => {
    sondeo(new Error('socket hang up'))
    expect(await youtubePublisher.publish(entrada({ playlist: 'PL123' }))).toEqual({
      kind: 'published',
      externalId: 'vid-1',
      aviso: PLAYLIST_NO_AGREGADO,
    })
  })
})

describe('singleVideo', () => {
  it('exactamente un video pasa; fotos, mezcla o varios videos no', () => {
    expect(singleVideo([video])).toBe(video)
    expect(singleVideo([image])).toBeNull()
    expect(singleVideo([video, image])).toBeNull()
    expect(singleVideo([video, { ...video, position: 1 }])).toBeNull()
    expect(singleVideo([])).toBeNull()
  })
})

describe('classifyUploadStatus', () => {
  const listWith = (uploadStatus: string) => ({
    items: [{ status: { uploadStatus } }],
  })

  it('processed está listo', () => {
    expect(classifyUploadStatus(listWith('processed'))).toBe('ready')
  })

  it('failed, rejected y deleted son veredictos', () => {
    expect(classifyUploadStatus(listWith('failed'))).toBe('error')
    expect(classifyUploadStatus(listWith('rejected'))).toBe('error')
    expect(classifyUploadStatus(listWith('deleted'))).toBe('error')
  })

  it('uploaded, desconocido o sin status siguen esperando', () => {
    expect(classifyUploadStatus(listWith('uploaded'))).toBe('processing')
    expect(classifyUploadStatus({ items: [{}] })).toBe('processing')
  })

  it('un video que ya no aparece en la lista es un veredicto, no una espera', () => {
    expect(classifyUploadStatus({ items: [] })).toBe('error')
    expect(classifyUploadStatus({})).toBe('error')
  })
})

describe('YOUTUBE_REJECTED', () => {
  it('la frase del rechazo nombra a YouTube, no a otra red', () => {
    expect(YOUTUBE_REJECTED).toBe('YouTube rechazó el video.')
  })
})

describe('youtubeUploadBody', () => {
  it('arma el multipart/related: metadata JSON, luego el video, con el boundary', () => {
    const body = youtubeUploadBody('{"a":1}', new Uint8Array([7, 8]), 'FRONTERA')
    const text = new TextDecoder().decode(body)
    expect(text).toContain('--FRONTERA\r\nContent-Type: application/json')
    expect(text).toContain('{"a":1}')
    expect(text).toContain('Content-Type: video/*')
    expect(text.endsWith('--FRONTERA--\r\n')).toBe(true)
    // Los bytes del video viajan intactos entre las cabeceras y el cierre.
    expect([...body].includes(7) && [...body].includes(8)).toBe(true)
  })
})
