import { describe, expect, it } from 'vitest'
import {
  AVISAN,
  avisoDelCambio,
  correoDeComanda,
  correoDePregunta,
  correosApagados,
  type ComandaQueAvisa,
} from './correo-de-comanda'

const SITIO = 'https://tu-parrilla.cl'
const base: ComandaQueAvisa = { id: 'c0ffee', estado: 'lista', principal: 'video9.mp4', motivo: null, enElMeson: 12 }

describe('el correo de una comanda que terminó', () => {
  it('avisan lista, rechazada y fallida; servida no, que llega después de lista y la hace el dueño', () => {
    expect([...AVISAN].sort()).toEqual(['fallida', 'lista', 'rechazada'])
  })

  it('sirviendo avisa solo al entrar: la primera tanda, no las que siguen', () => {
    expect(avisoDelCambio('en_el_horno', 'sirviendo')).toBe('sirviendo')
    expect(avisoDelCambio('en_preparacion', 'sirviendo')).toBe('sirviendo')
    expect(avisoDelCambio('sirviendo', 'sirviendo')).toBeNull()
    expect(avisoDelCambio('sirviendo', 'lista')).toBe('lista')
    expect(avisoDelCambio('en_el_horno', 'lista')).toBe('lista')
    expect(avisoDelCambio('revisando', 'rechazada')).toBe('rechazada')
    expect(avisoDelCambio('sirviendo', 'fallida')).toBe('fallida')
    expect(avisoDelCambio('revisando', 'en_preparacion')).toBeNull()
    expect(avisoDelCambio('en_preparacion', 'en_el_horno')).toBeNull()
  })

  it('apagados es solo la fila que lo dice: sin fila, salen', () => {
    expect(correosApagados(null)).toBe(false)
    expect(correosApagados('apagados')).toBe(true)
    expect(correosApagados('otra cosa')).toBe(false)
  })

  it('la primera tanda: lo que ya llegó, el «1 de 5», el mensaje del chef y que avisa de nuevo al terminar', () => {
    const c: ComandaQueAvisa = { ...base, estado: 'sirviendo', enElMeson: 3, mensaje: 'Aquí va lo primero', tandas: { servidas: 1, total: 5 } }
    const { subject, text } = correoDeComanda(c, SITIO)
    expect(subject).toBe('Salió la primera tanda: «video9.mp4»')
    expect(text).toContain('El chef empezó a servir «video9.mp4»: te dejó 3 cortes en el mesón, listos para programar. Van 1 de 5 tandas en el mesón.')
    expect(text).toContain('El chef: «Aquí va lo primero»')
    expect(text).toContain('Míralo en el mesón: https://tu-parrilla.cl/admin/ia/meson?comanda=c0ffee')
    expect(text).toContain('te escribimos de nuevo cuando esté lista')
    expect(correoDeComanda({ ...c, enElMeson: 0, tandas: undefined, principal: null }, SITIO, 'dia').text).toContain(
      'El chef empezó a servir tu comanda: lo primero está llegando a la bandeja.',
    )
  })

  it('el asunto del chef reemplaza al de siempre, en cualquier correo; vacío, queda el de siempre', () => {
    expect(correoDeComanda({ ...base, asunto: 'Aquí su pedido 🍖' }, SITIO).subject).toBe('Aquí su pedido 🍖')
    expect(correoDeComanda({ ...base, estado: 'sirviendo', asunto: 'Va la primera' }, SITIO).subject).toBe('Va la primera')
    expect(correoDeComanda({ ...base, estado: 'fallida', motivo: 'x', asunto: 'Lo siento' }, SITIO).subject).toBe('Lo siento')
    expect(correoDeComanda({ ...base, asunto: '   ' }, SITIO).subject).toBe('Lista en el mesón: «video9.mp4»')
  })

  it('cada correo dice dónde se apagan', () => {
    for (const estado of ['sirviendo', 'lista', 'rechazada', 'fallida'] as const) {
      expect(correoDeComanda({ ...base, estado, motivo: 'x' }, SITIO).text).toContain(
        'Si no quieres estos correos, apágalos en Tu Cuenta: https://tu-parrilla.cl/admin/cuenta',
      )
    }
  })

  it('lista, de noche: cuántos cortes quedaron en el mesón, con el enlace a esa comanda', () => {
    const { subject, text } = correoDeComanda(base, SITIO)
    expect(subject).toBe('Lista en el mesón: «video9.mp4»')
    expect(text).toContain('El chef terminó «video9.mp4»: te dejó 12 cortes en el mesón, listos para programar.')
    expect(text).toContain('Míralo en el mesón: https://tu-parrilla.cl/admin/ia/meson?comanda=c0ffee')
    expect(text).toContain('Lo que nadie programa en 30 días se borra solo.')
    expect(text).not.toContain('El chef: «')
    expect(correoDeComanda({ ...base, mensaje: ' Aquí su pedido ' }, SITIO).text).toContain('El chef: «Aquí su pedido»')
  })

  it('lista, de día: la bandeja y las piezas', () => {
    const { subject, text } = correoDeComanda({ ...base, enElMeson: 1 }, SITIO, 'dia')
    expect(subject).toBe('Lista en la bandeja: «video9.mp4»')
    expect(text).toContain('te dejó una pieza en la bandeja, lista para programar.')
    expect(text).toContain('Míralo en la bandeja:')
  })

  it('lista sin nada en el mesón, y sin nombre de archivo', () => {
    const { subject, text } = correoDeComanda({ ...base, principal: null, enElMeson: 0 }, SITIO)
    expect(subject).toBe('Lista en el mesón: tu comanda')
    expect(text).toContain('Lo que entregó ya no está en el mesón')
    expect(text).toContain('Mírala en La Cocina: https://tu-parrilla.cl/admin/ia')
  })

  it('rechazada: el motivo del chef, lo que pasa con lo subido y cómo pedir otra', () => {
    const { subject, text } = correoDeComanda({ ...base, estado: 'rechazada', motivo: 'El video está en inglés.', enElMeson: 0 }, SITIO)
    expect(subject).toBe('No se puede cocinar: «video9.mp4»')
    expect(text).toContain('El chef revisó «video9.mp4» y no la puede cocinar:\n\nEl video está en inglés.')
    expect(text).toContain('se guarda 14 días y después se borra')
    expect(text).toContain('https://tu-parrilla.cl/admin/ia/pedir')
    expect(correoDeComanda({ ...base, estado: 'rechazada', motivo: 'x' }, SITIO, 'dia').subject).toBe('No se puede preparar: «video9.mp4»')
  })

  it('fallida: lo que alcanzó a salir sigue en el mesón', () => {
    const { subject, text } = correoDeComanda({ ...base, estado: 'fallida', motivo: 'Se cortó la luz.', enElMeson: 3 }, SITIO)
    expect(subject).toBe('No se pudo terminar: «video9.mp4»')
    expect(text).toContain('Se cortó la luz.')
    expect(text).toContain('Lo que alcanzó a salir te espera en el mesón: 3 cortes. https://tu-parrilla.cl/admin/ia/meson?comanda=c0ffee')
  })

  it('sin dominio del producto, los enlaces quedan como ruta', () => {
    expect(correoDeComanda(base, '').text).toContain('Míralo en el mesón: /admin/ia/meson?comanda=c0ffee')
  })
})

describe('el correo de cuando el chef pregunta', () => {
  const pregunta = {
    principal: 'video9.mp4',
    texto: '¿Qué tema destaco?',
    opciones: ['La parte de ventas', 'La anécdota del final'],
    siNoContestas: 'Si no contestas hoy antes de las 18:00, el chef sigue con «La parte de ventas».',
  }

  it('la pregunta tal cual, sus opciones, el plazo con lo que pasa y dónde se responde', () => {
    const { subject, text } = correoDePregunta(pregunta, SITIO)
    expect(subject).toBe('El chef te pregunta: «video9.mp4»')
    expect(text).toContain('El chef tiene una duda sobre «video9.mp4»:\n\n¿Qué tema destaco?')
    expect(text).toContain('Las opciones: «La parte de ventas», «La anécdota del final».')
    expect(text).toContain('Si no contestas hoy antes de las 18:00, el chef sigue con «La parte de ventas».')
    expect(text).toContain('Respóndele en La Cocina: https://tu-parrilla.cl/admin/ia')
    expect(text).toContain('Este correo llega una vez por pregunta.')
  })

  it('libre y sin nombre de archivo: sin la línea de las opciones', () => {
    const { subject, text } = correoDePregunta({ ...pregunta, principal: null, opciones: null }, SITIO)
    expect(subject).toBe('El chef te pregunta: tu comanda')
    expect(text).toContain('El chef tiene una duda sobre tu comanda:')
    expect(text).not.toContain('Las opciones')
  })
})
