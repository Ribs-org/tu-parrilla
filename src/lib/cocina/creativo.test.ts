import { describe, expect, it, vi } from 'vitest'

// `batch.ts` trae `usuarios.ts`, que es solo de servidor; acá no se habla con la base.
vi.mock('server-only', () => ({}))

const { CREATIVO_ILEGIBLE, CREATIVO_SIN_MEDIA, MAX_TITULO_YOUTUBE, PORTADA_NO_ES_IMAGEN, leerCreativo } = await import('./creativo')
const { ATRIBUTOS_ERROR } = await import('@/lib/social/publish/atributos')
const { ARCHIVO_MUY_GRANDE, MAX_BYTES_ARCHIVO } = await import('@/lib/social/publish/limites')

const video = { nombre: 'v10r15.mp4', tipo: 'video/mp4', bytes: 1000, rol: 'media' }
const portada = { nombre: 'v10r15.jpg', tipo: 'image/jpeg', bytes: 200, rol: 'portada' }

describe('leerCreativo', () => {
  it('lee un video con su portada, sus textos, su pieza y su estilo', () => {
    expect(
      leerCreativo({
        ref: 'video10/15 golpes',
        pieza: 'video10/15',
        tanda: 'video10-clips-ritmo',
        texto: 'El texto del post',
        tituloYoutube: 'El título',
        estilo: 'golpes',
        atributos: { estilo: 'golpes', fuentes: 'revista' },
        duracionS: 38.5,
        archivos: [video, portada],
      }),
    ).toEqual({
      ref: 'video10/15 golpes',
      pieza: 'video10/15',
      tanda: 'video10-clips-ritmo',
      tipo: 'video',
      texto: 'El texto del post',
      tituloYoutube: 'El título',
      estilo: 'golpes',
      atributos: { estilo: 'golpes', fuentes: 'revista' },
      duracionS: 38.5,
      archivos: [
        { nombre: 'v10r15.mp4', tipo: 'video/mp4', mediaType: 'video', bytes: 1000, rol: 'media' },
        { nombre: 'v10r15.jpg', tipo: 'image/jpeg', mediaType: 'image', bytes: 200, rol: 'portada' },
      ],
    })
  })

  it('el tipo sale de los archivos: varias láminas son un carrusel, una sola imagen es una imagen', () => {
    const lamina = (n: number) => ({ nombre: `${n}.jpg`, tipo: 'image/jpeg', bytes: 10, rol: 'media' })
    expect(leerCreativo({ ref: 'c', archivos: [lamina(1), lamina(2)] })).toMatchObject({ tipo: 'carrusel' })
    expect(leerCreativo({ ref: 'i', archivos: [lamina(1)] })).toMatchObject({ tipo: 'imagen' })
  })

  it('el tipo de archivo se normaliza como al programar: image/jpg es image/jpeg', () => {
    const r = leerCreativo({ ref: 'r', archivos: [{ ...video, tipo: 'video/mp4' }, { ...portada, tipo: 'image/jpg' }] })
    expect('archivos' in r && r.archivos[1]!.tipo).toBe('image/jpeg')
  })

  it('sin texto vale, con texto vacío', () => {
    expect(leerCreativo({ ref: 'r', archivos: [video] })).toMatchObject({ texto: '', tituloYoutube: null, pieza: null })
  })

  it('lo que no se puede publicar, o pasa el tope, no entra', () => {
    expect(leerCreativo({ ref: 'r', archivos: [{ ...video, tipo: 'application/pdf' }] })).toEqual({
      error: 'v10r15.mp4: ese tipo de archivo no se puede publicar.',
    })
    expect(leerCreativo({ ref: 'r', archivos: [{ ...video, bytes: MAX_BYTES_ARCHIVO + 1 }] })).toEqual({
      error: `v10r15.mp4: ${ARCHIVO_MUY_GRANDE}`,
    })
  })

  it('sin un archivo que publicar no hay creativo, y la portada es una imagen y una sola', () => {
    expect(leerCreativo({ ref: 'r', archivos: [] })).toEqual({ error: CREATIVO_SIN_MEDIA })
    expect(leerCreativo({ ref: 'r', archivos: [portada] })).toEqual({ error: CREATIVO_SIN_MEDIA })
    expect(leerCreativo({ ref: 'r', archivos: [video, { ...video, rol: 'portada' }] })).toEqual({ error: PORTADA_NO_ES_IMAGEN })
    expect(leerCreativo({ ref: 'r', archivos: [video, portada, portada] })).toEqual({ error: CREATIVO_ILEGIBLE })
  })

  it('el título de YouTube no pasa de 100 caracteres, y la ref es obligatoria', () => {
    expect(leerCreativo({ ref: 'r', tituloYoutube: 'x'.repeat(MAX_TITULO_YOUTUBE + 1), archivos: [video] })).toEqual({
      error: CREATIVO_ILEGIBLE,
    })
    expect(leerCreativo({ archivos: [video] })).toEqual({ error: CREATIVO_ILEGIBLE })
  })

  it('los atributos se validan como al programar', () => {
    expect(leerCreativo({ ref: 'r', atributos: { anidado: { no: 1 } }, archivos: [video] })).toEqual({ error: ATRIBUTOS_ERROR })
  })

  it('lo que no es un objeto no se entiende', () => {
    expect(leerCreativo(null)).toEqual({ error: CREATIVO_ILEGIBLE })
    expect(leerCreativo([video])).toEqual({ error: CREATIVO_ILEGIBLE })
  })
})
