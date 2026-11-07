import { describe, expect, it } from 'vitest'
import type { ComentarioFila } from './comentarios-cola'
import { codigoDeLaMesa, mesaParaElTelefono } from './comentarios-movil'
import { COMENTARIO_AUSENTE, RED_RECHAZO, SIN_CREDENCIAL } from './social/comentarios/comentarista'
import { SIN_BORRADOR } from './social/comentarios/modelo'
import { ESCRIBE_RESPUESTA, validarRespuesta } from './social/comentarios/validar'

function fila(cambios: Partial<ComentarioFila>): ComentarioFila {
  return {
    id: 'c1',
    network: 'instagram',
    accountHandle: '@cuenta',
    author: 'ana',
    text: 'Qué rico',
    publishedAt: new Date('2026-11-07T12:00:00Z'),
    draft: '¡Gracias!',
    draftError: null,
    state: 'pendiente',
    error: null,
    replyExternalId: null,
    dmState: 'no',
    dmError: null,
    postExternalId: 'p1',
    postCaption: 'El asado del domingo',
    postThumbnailUrl: 'https://x/mini.jpg',
    postPermalink: 'https://instagram.com/p/1',
    automatico: false,
    reglaPalabra: null,
    ...cambios,
  }
}

describe('mesaParaElTelefono', () => {
  it('agrupa por publicación como el panel, lo más nuevo primero', () => {
    const mesa = mesaParaElTelefono(
      [
        fila({ id: 'a', postExternalId: 'p1', publishedAt: new Date('2026-11-07T10:00:00Z') }),
        fila({ id: 'b', postExternalId: 'p2', publishedAt: new Date('2026-11-07T11:00:00Z'), reglaPalabra: 'guia' }),
        fila({ id: 'c', postExternalId: 'p1', publishedAt: new Date('2026-11-07T12:00:00Z') }),
      ],
      { estado: 'pendientes', red: null },
      ['instagram', 'facebook', 'youtube'],
      3,
      false,
    )
    expect(mesa.publicaciones.map((p) => [p.id, p.comentarios.map((c) => c.id)])).toEqual([
      ['p1', ['c', 'a']],
      ['p2', ['b']],
    ])
    expect(mesa.publicaciones[1]!.palabraClave).toBe('GUIA')
    expect(mesa.publicaciones[0]).toMatchObject({ red: 'instagram', cuenta: '@cuenta', texto: 'El asado del domingo', enlace: 'https://instagram.com/p/1' })
    expect(mesa.pendientes).toBe(3)
  })

  it('la fecha va en ISO y el texto vacío llega vacío, sin romper', () => {
    const [c] = mesaParaElTelefono([fila({ text: '' })], { estado: 'pendientes', red: null }, [], 1, false).publicaciones[0]!.comentarios
    expect(c).toMatchObject({ texto: '', publicadoEl: '2026-11-07T12:00:00.000Z', borrador: '¡Gracias!' })
  })

  it('el privado solo viaja con los privados encendidos y algo que contar', () => {
    const conDm = fila({ state: 'enviado', dmState: 'fallido', dmError: 'No se pudo mandar el privado.' })
    const apagado = mesaParaElTelefono([conDm], { estado: 'enviados', red: null }, [], 0, false)
    const encendido = mesaParaElTelefono([conDm, fila({ id: 'z' })], { estado: 'enviados', red: null }, [], 0, true)
    expect(apagado.publicaciones[0]!.comentarios[0]!.privado).toBeNull()
    expect(encendido.publicaciones[0]!.comentarios.map((c) => c.privado)).toEqual([
      { estado: 'fallido', error: 'No se pudo mandar el privado.' },
      null,
    ])
  })
})

describe('codigoDeLaMesa', () => {
  it('cada frase del panel con su código; un 404 con frase es un comentario que no está', () => {
    const largo = validarRespuesta('x'.repeat(10), 5)
    expect('error' in largo && codigoDeLaMesa(largo.error)).toBe(400)
    expect(codigoDeLaMesa(ESCRIBE_RESPUESTA)).toBe(400)
    expect(codigoDeLaMesa(COMENTARIO_AUSENTE)).toBe(404)
    expect(codigoDeLaMesa(SIN_CREDENCIAL)).toBe(409)
    expect(codigoDeLaMesa(RED_RECHAZO)).toBe(502)
    expect(codigoDeLaMesa(SIN_BORRADOR)).toBe(502)
  })
})
