import { afterEach, describe, expect, it, vi } from 'vitest'
import { ARCHIVO_MUY_GRANDE } from './limites'
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
