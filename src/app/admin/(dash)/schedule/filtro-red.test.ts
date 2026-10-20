import { describe, expect, it } from 'vitest'
import {
  borradoresDelFiltro,
  cabeEnElFiltro,
  conAlguno,
  filtroDeLaUrl,
  hayQueFiltrar,
  opcionesDelFiltro,
  recortar,
  type CuentaDelFiltro,
} from './filtro-red'

const IG: CuentaDelFiltro = { id: 'ig', network: 'instagram', handle: '@ig' }
const FB: CuentaDelFiltro = { id: 'fb', network: 'facebook', handle: 'Página' }
const TT1: CuentaDelFiltro = { id: 'tt1', network: 'tiktok', handle: 'uno' }
const TT2: CuentaDelFiltro = { id: 'tt2', network: 'tiktok', handle: 'dos' }
// En el orden de Los Fierros, que es alfabético por red: el filtro no lo copia.
const CUENTAS = [FB, IG, TT1, TT2]

const a = (cuenta: CuentaDelFiltro) => ({ accountId: cuenta.id, network: cuenta.network })
const corte = (id: string, ...cuentas: CuentaDelFiltro[]) => ({ id, targets: cuentas.map(a) })

describe('filtroDeLaUrl', () => {
  it('una red en la que el dueño tiene cuentas', () => {
    expect(filtroDeLaUrl('tiktok', CUENTAS)).toEqual({ red: 'tiktok', cuenta: null })
  })

  it('el id de una de sus cuentas, con su red', () => {
    expect(filtroDeLaUrl('tt2', CUENTAS)).toEqual({ red: 'tiktok', cuenta: 'tt2' })
  })

  it('lo demás es «Todas»: una red sin cuentas, un id ajeno, nada', () => {
    expect(filtroDeLaUrl('youtube', CUENTAS)).toBeNull()
    expect(filtroDeLaUrl('de-otro', CUENTAS)).toBeNull()
    expect(filtroDeLaUrl('', CUENTAS)).toBeNull()
  })
})

describe('cabeEnElFiltro', () => {
  it('por red, cualquier cuenta de la red; por cuenta, solo esa', () => {
    expect(cabeEnElFiltro(a(TT1), { red: 'tiktok', cuenta: null })).toBe(true)
    expect(cabeEnElFiltro(a(TT1), { red: 'tiktok', cuenta: 'tt2' })).toBe(false)
    expect(cabeEnElFiltro(a(IG), { red: 'tiktok', cuenta: null })).toBe(false)
  })
})

describe('recortar y conAlguno', () => {
  const items = [corte('solo-ig', IG), corte('ig-y-fb', IG, FB), corte('dos-tiktok', TT1, TT2)]

  it('sin filtro, todos enteros', () => {
    expect(recortar(items, null)).toEqual(items)
    expect(conAlguno(items, null)).toEqual(items)
  })

  it('recortar deja de cada corte solo lo del filtro, y saca el que no tiene nada', () => {
    expect(recortar(items, { red: 'facebook', cuenta: null })).toEqual([{ id: 'ig-y-fb', targets: [a(FB)] }])
    expect(recortar(items, { red: 'tiktok', cuenta: 'tt2' })).toEqual([{ id: 'dos-tiktok', targets: [a(TT2)] }])
  })

  it('conAlguno deja el corte entero: en la lista se borra y se sube completo', () => {
    expect(conAlguno(items, { red: 'facebook', cuenta: null })).toEqual([items[1]])
  })
})

describe('borradoresDelFiltro', () => {
  const borradores = [
    { id: 'a-ig', cuentas: ['ig'] },
    { id: 'a-tt1', cuentas: ['tt1'] },
    { id: 'sin-cuenta', cuentas: [] },
  ]

  it('sin filtro, todos; con filtro, los que marcaron una cuenta de esa red o esa cuenta', () => {
    expect(borradoresDelFiltro(borradores, null, CUENTAS)).toEqual(borradores)
    expect(borradoresDelFiltro(borradores, { red: 'tiktok', cuenta: null }, CUENTAS).map((b) => b.id)).toEqual(['a-tt1'])
    expect(borradoresDelFiltro(borradores, { red: 'tiktok', cuenta: 'tt2' }, CUENTAS)).toEqual([])
  })
})

describe('opcionesDelFiltro', () => {
  const items = [corte('1', IG), corte('2', IG, FB), corte('3', TT1), corte('4', TT1, TT2)]

  it('cada red en el orden de siempre, con los cortes que la tienen: uno a dos redes cuenta en las dos', () => {
    const { todas, redes } = opcionesDelFiltro(items, CUENTAS)
    expect(todas).toBe(4)
    expect(redes.map((r) => [r.red, r.cuantos])).toEqual([
      ['instagram', 2],
      ['tiktok', 2],
      ['facebook', 1],
    ])
  })

  it('solo una red con varias cuentas trae sus cuentas, cada una con lo suyo', () => {
    const { redes } = opcionesDelFiltro(items, CUENTAS)
    expect(redes.find((r) => r.red === 'instagram')!.cuentas).toEqual([])
    expect(redes.find((r) => r.red === 'tiktok')!.cuentas).toEqual([
      { id: 'tt1', handle: 'uno', cuantos: 2 },
      { id: 'tt2', handle: 'dos', cuantos: 1 },
    ])
  })

  it('una red sin nada en lo que se mira sigue con su botón, en cero', () => {
    expect(opcionesDelFiltro([], [IG, FB]).redes.map((r) => r.cuantos)).toEqual([0, 0])
  })
})

describe('hayQueFiltrar', () => {
  it('con dos redes, o con una sola de varias cuentas; con una cuenta sola, no', () => {
    expect(hayQueFiltrar(opcionesDelFiltro([], [IG, FB]).redes)).toBe(true)
    expect(hayQueFiltrar(opcionesDelFiltro([], [TT1, TT2]).redes)).toBe(true)
    expect(hayQueFiltrar(opcionesDelFiltro([], [IG]).redes)).toBe(false)
  })
})
