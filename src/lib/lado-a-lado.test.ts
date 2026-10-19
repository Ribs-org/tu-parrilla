import { describe, expect, it } from 'vitest'
import { DIAS_DE_LA_CURVA, atributosLadoALado, curvaLadoALado, idPedido } from './lado-a-lado'

const HORA = 60 * 60 * 1000
const DIA = 24 * HORA

describe('curvaLadoALado', () => {
  // A salió en agosto de noche; B, un mes después de madrugada: se comparan por edad, no por fecha.
  const a = { id: 'a', network: 'instagram', publishedAt: new Date('2026-08-01T22:00:00Z') }
  const b = { id: 'b', network: 'tiktok', publishedAt: new Date('2026-09-01T05:00:00Z') }
  const lectura = (postId: string, desde: Date, edad: number, views: number | null) => ({
    postId,
    capturedAt: new Date(desde.getTime() + edad),
    views,
  })

  it('pone a las dos en días cumplidos desde que salieron', () => {
    const puntos = curvaLadoALado(a, b, [
      lectura('a', a.publishedAt, 11 * HORA, 100),
      lectura('a', a.publishedAt, DIA + 11 * HORA, 300),
      lectura('b', b.publishedAt, 4 * HORA, 50),
      lectura('b', b.publishedAt, 2 * DIA + 4 * HORA, 900),
    ])
    expect(puntos).toEqual([
      { dia: 0, a: 100, b: 50 },
      { dia: 1, a: 300, b: null },
      { dia: 2, a: null, b: 900 },
    ])
  })

  it('dos lecturas el mismo día cumplido: la más alta', () => {
    const puntos = curvaLadoALado(a, null, [lectura('a', a.publishedAt, 2 * HORA, 40), lectura('a', a.publishedAt, 20 * HORA, 90)])
    expect(puntos).toEqual([{ dia: 0, a: 90, b: null }])
  })

  it(`hasta los ${DIAS_DE_LA_CURVA} días, y sin las lecturas en null`, () => {
    const puntos = curvaLadoALado(a, null, [
      lectura('a', a.publishedAt, DIA, null),
      lectura('a', a.publishedAt, 40 * DIA, 5000),
    ])
    expect(puntos).toEqual([])
  })

  it('YouTube no entra', () => {
    const youtube = { ...b, network: 'youtube' }
    const puntos = curvaLadoALado(a, youtube, [lectura('a', a.publishedAt, 3 * HORA, 10), lectura('b', b.publishedAt, 3 * HORA, 99)])
    expect(puntos).toEqual([{ dia: 0, a: 10, b: null }])
  })
})

describe('atributosLadoALado', () => {
  it('clave por clave: lo que comparten, lo que cambia y lo que falta en una, sin la pieza', () => {
    expect(
      atributosLadoALado(
        { hook: 'pregunta', ritmo: 'rapido', pieza: 'x', color: 'calido' },
        { hook: 'lista', ritmo: 'rapido', pieza: 'x' },
      ),
    ).toEqual([
      { clave: 'color', a: 'calido', b: '—', igual: false },
      { clave: 'hook', a: 'pregunta', b: 'lista', igual: false },
      { clave: 'ritmo', a: 'rapido', b: 'rapido', igual: true },
    ])
  })

  it('sin atributos en ninguna, nada', () => {
    expect(atributosLadoALado(null, null)).toEqual([])
  })
})

describe('idPedido', () => {
  it('acepta un id y deja fuera lo demás, que la URL puede traer cualquier cosa', () => {
    expect(idPedido('3f2a1b0c-0000-4000-8000-000000000000')).toBe('3f2a1b0c-0000-4000-8000-000000000000')
    expect(idPedido('drop table')).toBeNull()
    expect(idPedido(['3f2a1b0c-0000-4000-8000-000000000000'])).toBeNull()
    expect(idPedido(undefined)).toBeNull()
  })
})
