import { describe, expect, it } from 'vitest'
import {
  alternarSeccion,
  cuentaElegida,
  numerosHref,
  seccionesAbiertas,
  seguidoresGanados,
} from './tablero'

const cuentas = [
  { id: 'a', network: 'instagram' },
  { id: 'b', network: 'instagram' },
]

describe('cuentaElegida', () => {
  it('la cuenta de la URL, si es del dueño', () => {
    expect(cuentaElegida({ cuenta: 'b' }, cuentas)?.id).toBe('b')
  })

  it('sin cuenta, o con una ajena o inventada, son todas', () => {
    expect(cuentaElegida({}, cuentas)).toBeNull()
    expect(cuentaElegida({ cuenta: 'de-otro' }, cuentas)).toBeNull()
  })
})

describe('las secciones del «⋯ Más»', () => {
  it('lee las abiertas e ignora lo que no es una sección', () => {
    expect([...seccionesAbiertas({ mas: ['redes', 'otra'] })]).toEqual(['redes'])
    expect(seccionesAbiertas({}).size).toBe(0)
  })

  it('alternar abre la cerrada y cierra la abierta, sin tocar la otra', () => {
    expect(alternarSeccion({}, 'pagina')).toEqual(['pagina'])
    expect(alternarSeccion({ mas: ['redes', 'pagina'] }, 'redes')).toEqual(['pagina'])
  })
})

describe('seguidoresGanados', () => {
  it('suma lo que se sabe', () => {
    expect(seguidoresGanados([{ followersChange: 40 }, { followersChange: null }, { followersChange: 20 }])).toBe(60)
  })

  it('una baja resta: no se esconde', () => {
    expect(seguidoresGanados([{ followersChange: 40 }, { followersChange: -10 }])).toBe(30)
  })

  it('si ninguna tarjeta lo sabe, no se sabe: null y no cero', () => {
    expect(seguidoresGanados([{ followersChange: null }])).toBeNull()
    expect(seguidoresGanados([])).toBeNull()
  })
})

describe('numerosHref', () => {
  it('acarrea los filtros y cambia lo pedido', () => {
    expect(numerosHref('/admin/analytics', { range: '7d', cuenta: 'a' }, { cuenta: 'b' })).toBe(
      '/admin/analytics?range=7d&cuenta=b',
    )
  })

  it('null borra, una lista se repite, y «mensaje» no viaja', () => {
    expect(numerosHref('/admin/analytics', { cuenta: 'a', mensaje: 'x' }, { cuenta: null, mas: ['redes', 'pagina'] })).toBe(
      '/admin/analytics?mas=redes&mas=pagina',
    )
  })

  it('sin nada, la ruta pelada', () => {
    expect(numerosHref('/admin/analytics', {}, {})).toBe('/admin/analytics')
  })
})
