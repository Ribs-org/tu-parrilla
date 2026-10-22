import { describe, expect, it } from 'vitest'
import { PALABRAS_DE_DIA } from '@/lib/vocabulario'
import { NOMBRE_ESTADO } from './nombres'
import { antesEnLaFila, estadoEnPalabras } from './tarjeta'

const comanda = (estado: Parameters<typeof estadoEnPalabras>[0]['estado'], extra = {}) => ({
  estado,
  tandasServidas: 0,
  tandasTotal: null,
  enElMeson: 0,
  ...extra,
})

describe('el estado en la tarjeta', () => {
  it('sirviendo dice cuántas tandas llegaron al mesón, y de día a la vitrina', () => {
    const c = comanda('sirviendo', { tandasServidas: 3, tandasTotal: 5 })
    expect(estadoEnPalabras(c, 'noche')).toBe('Sirviendo: 3 de 5 tandas en el mesón')
    expect(estadoEnPalabras(c, 'dia')).toBe('Sirviendo: 3 de 5 tandas en la vitrina')
    expect(estadoEnPalabras({ ...c, tandasTotal: null, tandasServidas: 2 }, 'noche')).toBe('Sirviendo: 2 tandas en el mesón')
  })

  it('lista dice cuántos cortes esperan en el mesón; de día, piezas', () => {
    expect(estadoEnPalabras(comanda('lista', { enElMeson: 12 }), 'noche')).toBe('Lista en el mesón: 12 cortes')
    expect(estadoEnPalabras(comanda('lista', { enElMeson: 1 }), 'dia')).toBe('Lista en la vitrina: una pieza')
  })

  it('los demás, con su nombre de noche y de día', () => {
    expect(estadoEnPalabras(comanda('revisando'), 'noche')).toBe('El chef mira la res')
    expect(estadoEnPalabras(comanda('revisando'), 'dia')).toBe('El chef mira el atún')
    expect(estadoEnPalabras(comanda('recibida'), 'dia')).toBe('Comanda colgada')
  })

  it('cuántas van antes, en palabras', () => {
    expect(antesEnLaFila(0)).toBe('Es la próxima en la fila.')
    expect(antesEnLaFila(1)).toBe('Hay 1 comanda antes que la tuya.')
    expect(antesEnLaFila(4)).toBe('Hay 4 comandas antes que la tuya.')
  })

  it('cada estado que cambia de día está en el vocabulario de día, que la wiki cuenta entero', () => {
    for (const nombres of Object.values(NOMBRE_ESTADO).filter((n) => n.noche !== n.dia)) {
      expect(PALABRAS_DE_DIA).toContainEqual(nombres)
    }
  })
})
