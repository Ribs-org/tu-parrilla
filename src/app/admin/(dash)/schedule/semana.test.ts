import { describe, expect, it } from 'vitest'
import { dondeVaAhora, estadoDeFila, mezclaDeRedes, resumenDelDia, selloQueManda } from './semana'

describe('selloQueManda', () => {
  it('lo quemado manda; después lo que pide atención, y después lo que está saliendo', () => {
    expect(selloQueManda(['servido', 'quemado', 'saliendo'])).toBe('quemado')
    expect(selloQueManda(['servido', 'bandeja'])).toBe('bandeja')
    expect(selloQueManda(['pendiente', 'saliendo'])).toBe('saliendo')
  })

  it('salido en todas, servido; lo que solo espera su hora, nada', () => {
    expect(selloQueManda(['servido', 'servido'])).toBe('servido')
    expect(selloQueManda(['servido', 'pendiente'])).toBeNull()
    expect(selloQueManda([])).toBeNull()
  })
})

describe('estadoDeFila', () => {
  it('lo que salió en todas se aplana; lo que viene y lo que está saliendo conservan la chapa', () => {
    expect(estadoDeFila('punto', ['servido', 'servido'])).toBe('servida')
    expect(estadoDeFila('cruda', ['pendiente'])).toBe('por-salir')
    expect(estadoDeFila('sellada', ['saliendo'])).toBe('saliendo')
  })

  it('lo quemado, en todas o en parte, no se aplana nunca', () => {
    expect(estadoDeFila('quemada', ['quemado'])).toBe('quemada')
    expect(estadoDeFila('parcial', ['servido', 'quemado'])).toBe('quemada')
  })

  it('lo que pide atención tampoco, aunque la red ya lo tenga: la bandeja de TikTok', () => {
    expect(estadoDeFila('punto', ['bandeja'])).toBe('atencion')
    expect(estadoDeFila('cruda', ['reintento'])).toBe('atencion')
    expect(estadoDeFila('cruda', ['frio'])).toBe('atencion')
  })
})

describe('resumenDelDia', () => {
  it('cuenta por la cocción: salido en todas, quemado en alguna, y lo demás por salir', () => {
    expect(resumenDelDia(['punto', 'punto', 'parcial', 'quemada', 'cruda', 'sellada'])).toEqual({
      servidos: 2,
      fallaron: 2,
      porSalir: 2,
    })
    expect(resumenDelDia([])).toEqual({ servidos: 0, fallaron: 0, porSalir: 0 })
  })
})

describe('mezclaDeRedes', () => {
  it('los destinos de cada red, en el orden de siempre: uno a dos redes pinta en las dos', () => {
    const items = [
      { targets: [{ network: 'facebook' }] },
      { targets: [{ network: 'instagram' }, { network: 'facebook' }] },
      { targets: [{ network: 'tiktok' }, { network: 'tiktok' }] },
    ]
    expect(mezclaDeRedes(items)).toEqual([
      { red: 'instagram', destinos: 1 },
      { red: 'tiktok', destinos: 2 },
      { red: 'facebook', destinos: 2 },
    ])
  })
})

describe('dondeVaAhora', () => {
  it('después de las que ya tienen su hora encima, contando la de este mismo minuto', () => {
    const horas = [100, 200, 300]
    expect(dondeVaAhora(horas, 50)).toBe(0)
    expect(dondeVaAhora(horas, 200)).toBe(2)
    expect(dondeVaAhora(horas, 999)).toBe(3)
    expect(dondeVaAhora([], 999)).toBe(0)
  })
})
