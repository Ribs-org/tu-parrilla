import { describe, expect, it } from 'vitest'
import {
  ACENTO_ILEGIBLE,
  CANTIDAD_FALTA,
  DEMASIADOS,
  FECHA_ILEGIBLE,
  FORMATO_FALTA,
  MARCA_LARGA,
  MARCA_SIN_NOMBRE,
  NOTAS_LARGAS,
  PEDIDO_ILEGIBLE,
  PRINCIPAL_FALTA,
  leerPedido,
  minutosDe,
} from './pedido'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const pedido = {
  ref: id(1),
  principal: id(2),
  acompanamientos: [id(3)],
  formatos: ['clips', 'carruseles'],
  cantidad: 'unos-10',
  notas: '  la parte de ventas  ',
  paraCuando: '2026-10-24',
  marca: { nombre: 'Vicente', handle: 'vicente', acento: '#3d7bff', ctaTexto: 'Sígueme para más' },
}

describe('leerPedido', () => {
  it('lee la comanda entera, con el @ con su arroba y el color en mayúsculas', () => {
    expect(leerPedido(pedido)).toEqual({
      ref: id(1),
      principal: id(2),
      acompanamientos: [id(3)],
      formatos: ['clips', 'carruseles'],
      cantidad: 'unos-10',
      notas: 'la parte de ventas',
      paraCuando: '2026-10-24',
      marca: { nombre: 'Vicente', handle: '@vicente', acento: '#3D7BFF', ctaTexto: 'Sígueme para más' },
    })
  })

  it('lo opcional vacío queda en nada', () => {
    const r = leerPedido({ ...pedido, acompanamientos: undefined, notas: '', paraCuando: '', marca: { nombre: 'V', handle: ' ', acento: '', ctaTexto: '' } })
    expect(r).toMatchObject({ acompanamientos: [], notas: '', paraCuando: null, marca: { nombre: 'V', handle: null, acento: null, ctaTexto: null } })
  })

  it('un acompañamiento repetido, o el mismo principal, no entra dos veces', () => {
    expect(leerPedido({ ...pedido, acompanamientos: [id(3), id(3), id(2)] })).toMatchObject({ acompanamientos: [id(3)] })
  })

  it('los formatos que no existen no cuentan, y sin uno conocido no hay comanda', () => {
    expect(leerPedido({ ...pedido, formatos: ['carruseles', 'podcasts'] })).toMatchObject({ formatos: ['carruseles'] })
    expect(leerPedido({ ...pedido, formatos: [] })).toEqual({ error: FORMATO_FALTA })
    expect(leerPedido({ ...pedido, formatos: 'clips' })).toEqual({ error: FORMATO_FALTA })
  })

  it('sin plato principal, o sin la ref del formulario, no hay comanda', () => {
    expect(leerPedido({ ...pedido, principal: undefined })).toEqual({ error: PRINCIPAL_FALTA })
    expect(leerPedido({ ...pedido, ref: 'otra' })).toEqual({ error: PEDIDO_ILEGIBLE })
    expect(leerPedido({ ...pedido, acompanamientos: ['no-es-un-id'] })).toEqual({ error: PEDIDO_ILEGIBLE })
    expect(leerPedido(null)).toEqual({ error: PEDIDO_ILEGIBLE })
  })

  it('cada campo con su frase', () => {
    expect(leerPedido({ ...pedido, cantidad: 'muchos' })).toEqual({ error: CANTIDAD_FALTA })
    expect(leerPedido({ ...pedido, notas: 'x'.repeat(1001) })).toEqual({ error: NOTAS_LARGAS })
    expect(leerPedido({ ...pedido, paraCuando: 'mañana' })).toEqual({ error: FECHA_ILEGIBLE })
    expect(leerPedido({ ...pedido, paraCuando: '2026-13-45' })).toEqual({ error: FECHA_ILEGIBLE })
    expect(leerPedido({ ...pedido, marca: { ...pedido.marca, nombre: '  ' } })).toEqual({ error: MARCA_SIN_NOMBRE })
    expect(leerPedido({ ...pedido, marca: { ...pedido.marca, ctaTexto: 'x'.repeat(121) } })).toEqual({ error: MARCA_LARGA })
    expect(leerPedido({ ...pedido, marca: { ...pedido.marca, acento: 'azul' } })).toEqual({ error: ACENTO_ILEGIBLE })
    expect(leerPedido({ ...pedido, acompanamientos: Array.from({ length: 11 }, (_, n) => id(10 + n)) })).toEqual({ error: DEMASIADOS })
  })
})

describe('minutosDe', () => {
  it('los minutos del plato principal, hacia arriba; sin duración, cero', () => {
    expect(minutosDe(1800)).toBe(30)
    expect(minutosDe(1801)).toBe(31)
    expect(minutosDe(null)).toBe(0)
    expect(minutosDe(0)).toBe(0)
  })
})
