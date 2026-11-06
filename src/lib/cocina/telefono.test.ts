import { describe, expect, it } from 'vitest'
import { ACOMPANAMIENTO_NO_SIRVE, PRINCIPAL_NO_SIRVE } from './pedir'
import { INSTRUCCION_LARGA, MAX_INSTRUCCION, PRINCIPAL_FALTA } from './pedido'
import type { ComandaDelPanel } from './panel'
import {
  MARCA_SIN_NOMBRE_TELEFONO,
  comandaParaElTelefono,
  fraseParaElTelefono,
  marcaParaElTelefono,
  pedidoDelTelefono,
} from './telefono'

// Lo que el teléfono manda al pedir una comanda y lo que recibe de vuelta, sin base.

const REF = '11111111-1111-4111-8111-111111111111'
const VIDEO = '22222222-2222-4222-8222-222222222222'
const FOTO = '33333333-3333-4333-8333-333333333333'
const MARCA = { nombre: 'La Marca', handle: '@marca', acento: '#3D7BFF', ctaTexto: 'Sígueme' }

describe('la comanda que manda el teléfono', () => {
  it('se completa con lo que el panel trae marcado: un video largo, clips y lo que dé el material', () => {
    const p = pedidoDelTelefono({ ref: REF, principal: VIDEO, acompanamientos: [FOTO], instruccion: '  Clips cortos.  ' }, MARCA)
    expect(p).toEqual({
      ref: REF,
      principal: VIDEO,
      subtipo: 'largo',
      acompanamientos: [{ id: FOTO, rol: 'imagen' }],
      formatos: ['clips'],
      cantidad: 'lo-que-de',
      notas: 'Clips cortos.',
      paraCuando: null,
      marca: MARCA,
    })
  })

  it('sin instrucción ni acompañamientos también va: el chef elige', () => {
    const p = pedidoDelTelefono({ ref: REF, principal: VIDEO }, MARCA)
    expect(p).toMatchObject({ notas: '', acompanamientos: [] })
  })

  it('el principal repetido entre los acompañamientos no se cuelga dos veces', () => {
    const p = pedidoDelTelefono({ ref: REF, principal: VIDEO, acompanamientos: [VIDEO, FOTO] }, MARCA)
    expect(p).toMatchObject({ acompanamientos: [{ id: FOTO, rol: 'imagen' }] })
  })

  it('lo que no se entiende se rechaza con la frase del teléfono, que no tiene página que recargar', () => {
    for (const cuerpo of [null, [], { ref: 'x', principal: VIDEO }, { ref: REF, principal: VIDEO, acompanamientos: 'x' }, { ref: REF, principal: VIDEO, instruccion: 3 }]) {
      expect(pedidoDelTelefono(cuerpo, MARCA)).toEqual({ error: 'No entendimos la comanda: actualiza La Cocina y vuelve a intentarlo.' })
    }
  })

  it('sin plato principal, o con la instrucción muy larga, las frases del panel', () => {
    expect(pedidoDelTelefono({ ref: REF }, MARCA)).toEqual({ error: PRINCIPAL_FALTA })
    expect(pedidoDelTelefono({ ref: REF, principal: VIDEO, instruccion: 'a'.repeat(MAX_INSTRUCCION + 1) }, MARCA)).toEqual({
      error: INSTRUCCION_LARGA,
    })
  })

  it('sin marca ni nombre en la cuenta, dice dónde ponerlo', () => {
    expect(pedidoDelTelefono({ ref: REF, principal: VIDEO }, null)).toEqual({ error: MARCA_SIN_NOMBRE_TELEFONO })
  })
})

describe('la marca con que firma el chef', () => {
  it('la guardada manda; sin ella, el nombre de la cuenta; sin ninguno, ninguna', () => {
    expect(marcaParaElTelefono(MARCA, 'Otro')).toBe(MARCA)
    expect(marcaParaElTelefono(null, '  Vicente ')).toEqual({ nombre: 'Vicente', handle: null, acento: null, ctaTexto: null })
    expect(marcaParaElTelefono(null, '   ')).toBeNull()
    expect(marcaParaElTelefono(null, null)).toBeNull()
  })
})

describe('las frases para el teléfono', () => {
  it('las que mandan a recargar la página mandan a actualizar La Cocina; las demás, tal cual', () => {
    expect(fraseParaElTelefono(ACOMPANAMIENTO_NO_SIRVE)).toBe('Uno de los materiales ya no está en la cámara: actualiza La Cocina y vuelve a elegir.')
    expect(fraseParaElTelefono(PRINCIPAL_NO_SIRVE)).toBe(PRINCIPAL_NO_SIRVE)
  })
})

describe('una comanda como la lista el teléfono', () => {
  const base: ComandaDelPanel = {
    id: 'c-1',
    estado: 'recibida',
    creadaEn: new Date('2026-11-02T15:00:00Z'),
    eta: null,
    mensaje: null,
    motivo: null,
    tandasServidas: 0,
    tandasTotal: null,
    principal: 'video.mp4',
    instruccion: 'Clips cortos.',
    enElMeson: 0,
    antes: 2,
    cancelable: true,
    eventos: [],
    pregunta: null,
  }
  const AHORA = new Date('2026-11-06T15:00:00Z')
  const ZONA = 'America/Santiago'
  const enElTelefono = (c: ComandaDelPanel) => comandaParaElTelefono(c, AHORA, ZONA)

  it('esperando: en palabras de noche y de día, en marcha y con su lugar en la fila', () => {
    expect(enElTelefono(base)).toEqual({
      id: 'c-1',
      estado: 'recibida',
      palabras: { noche: 'Comanda colgada', dia: 'Comanda colgada' },
      enMarcha: true,
      tramo: 0,
      creadaEn: '2026-11-02T15:00:00.000Z',
      eta: null,
      principal: 'video.mp4',
      instruccion: 'Clips cortos.',
      fila: 'Hay 2 comandas antes que la tuya.',
      mensaje: null,
      pregunta: null,
    })
  })

  it('lista: cuántos cortes esperan, ya no en marcha; rechazada: el motivo y sin recorrido', () => {
    const lista = enElTelefono({ ...base, estado: 'lista', enElMeson: 3, antes: null })
    expect(lista).toMatchObject({ palabras: { noche: 'Lista en el mesón: 3 cortes', dia: 'Lista en la bandeja: 3 piezas' }, enMarcha: false, tramo: 5, fila: null })
    const rechazada = enElTelefono({ ...base, estado: 'rechazada', motivo: 'No tiene audio.', antes: null })
    expect(rechazada).toMatchObject({ tramo: null, mensaje: 'No tiene audio.', enMarcha: false })
  })

  it('pregunta: la pregunta con sus opciones y el plazo en palabras, en marcha y en el tramo de donde salió', () => {
    const plazo = new Date('2026-11-06T21:00:00Z')
    const c = enElTelefono({
      ...base,
      estado: 'pregunta',
      antes: null,
      pregunta: { id: 'p-1', texto: '¿Qué tema destaco?', opciones: ['Ventas', 'La anécdota'], plazo, porDefecto: 'Ventas', vuelveA: 'en_preparacion' },
    })
    expect(c).toMatchObject({
      palabras: { noche: 'El chef te pregunta', dia: 'El chef te pregunta' },
      enMarcha: true,
      tramo: 2,
      pregunta: {
        id: 'p-1',
        texto: '¿Qué tema destaco?',
        opciones: ['Ventas', 'La anécdota'],
        porDefecto: 'Ventas',
        plazo: '2026-11-06T21:00:00.000Z',
        siNoContestas: 'Si no contestas hoy antes de las 18:00, el chef sigue con «Ventas».',
      },
    })
  })
})
