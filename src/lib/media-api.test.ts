import { describe, expect, it, vi } from 'vitest'
import { ARCHIVO_MUY_GRANDE, CUERPO_ILEGIBLE, TIPO_NO_PUBLICABLE } from './mobile-api'

// `batch.ts` trae `@/lib/usuarios`, que importa `server-only`.
vi.mock('server-only', () => ({}))

const { subidaDeLaApi } = await import('./media-api')
const { carpetaDeLaApi, mediaTypeFromUrl } = await import('./social/publish/batch')

describe('subidaDeLaApi', () => {
  it('va en la carpeta del dueño, con el uuid y el nombre', () => {
    expect(subidaDeLaApi('dueno-1', 'video-01.mp4', 'video/mp4', 1000, 'u1')).toEqual({
      key: `${carpetaDeLaApi('dueno-1')}u1-video-01.mp4`,
      mediaType: 'video',
      tipo: 'video/mp4',
    })
  })

  it('termina en la extensión de su tipo, no en la que trae el nombre', () => {
    // Las reglas de formato del lote leen la extensión de la URL: tiene que decir lo mismo que el tipo.
    const subida = subidaDeLaApi('dueno-1', 'toma final.mov', 'video/mp4', 0, 'u2')
    expect('key' in subida && subida.key).toBe(`${carpetaDeLaApi('dueno-1')}u2-toma final.mp4`)
    const sinNombre = subidaDeLaApi('dueno-1', '', 'image/jpg', 0, 'u3')
    expect(sinNombre).toEqual({ key: `${carpetaDeLaApi('dueno-1')}u3-archivo.jpg`, mediaType: 'image', tipo: 'image/jpeg' })
    expect('key' in sinNombre && mediaTypeFromUrl(`https://media.ej.cl/${sinNombre.key}`)).toBe('image')
  })

  it('una ruta en el nombre no abre otra carpeta', () => {
    const subida = subidaDeLaApi('dueno-1', '../../otro-dueno/x.mp4', 'video/mp4', 0, 'u4')
    expect('key' in subida && subida.key).toBe(`${carpetaDeLaApi('dueno-1')}u4-x.mp4`)
  })

  it('rechaza con las frases del teléfono: tipo, tamaño y cuerpo', () => {
    expect(subidaDeLaApi('dueno-1', 'a.svg', 'image/svg+xml', 10, 'u')).toEqual({ error: TIPO_NO_PUBLICABLE })
    expect(subidaDeLaApi('dueno-1', 'a.mp4', 'video/mp4', 600 * 1024 * 1024, 'u')).toEqual({ error: ARCHIVO_MUY_GRANDE })
    expect(subidaDeLaApi('dueno-1', 'a.mp4', 'video/mp4', 'mucho', 'u')).toEqual({ error: CUERPO_ILEGIBLE })
  })
})
