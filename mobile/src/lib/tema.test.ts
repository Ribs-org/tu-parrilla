import { describe, expect, it } from 'vitest'
import {
  LA_PARRILLA,
  LOS_FIERROS,
  ROTULO_CALOR,
  SE_QUEMO,
  fraseDelAviso,
  otroTema,
  servidos,
  temaDe,
  temaDeLaRespuesta,
} from './tema'

describe('el modo de la app', () => {
  it('lo que no es el día es la noche, la de entrada', () => {
    expect(temaDe('dia')).toBe('dia')
    for (const otro of ['noche', 'DIA', '', null, undefined, 1]) expect(temaDe(otro)).toBe('noche')
  })

  it('el botón de Ajustes lleva al otro', () => {
    expect(otroTema('noche')).toBe('dia')
    expect(otroTema('dia')).toBe('noche')
  })

  it('de la cuenta, solo un modo que vino de verdad: un servidor de antes no cambia nada', () => {
    expect(temaDeLaRespuesta({ tema: 'dia' })).toBe('dia')
    expect(temaDeLaRespuesta({ tema: 'noche' })).toBe('noche')
    for (const cuerpo of [null, 'dia', {}, { tema: 'DIA' }, { error: 'No autorizado' }]) expect(temaDeLaRespuesta(cuerpo)).toBeNull()
  })

  it('de día, lo que falló se echó a perder', () => {
    expect(SE_QUEMO).toEqual({ noche: 'Se quemó', dia: 'Se echó a perder' })
  })

  it('de día, La Parrilla es La Barra y Los Fierros son Los Cuchillos, como en el panel', () => {
    expect(LA_PARRILLA).toEqual({ noche: 'La Parrilla', dia: 'La Barra' })
    expect(LOS_FIERROS).toEqual({ noche: 'Los Fierros', dia: 'Los Cuchillos' })
    expect(ROTULO_CALOR.dia).toEqual({ apagada: 'Vacía', prendida: 'Con piezas', llena: 'Tabla llena' })
  })

  it('el aviso de Ajustes, en cada modo: de día el fierro se desafila o queda sin filo', () => {
    expect(fraseDelAviso({ nivel: 'enfriandose', cuantos: 1 }, 'noche')).toBe('1 se enfría')
    expect(fraseDelAviso({ nivel: 'apagado', cuantos: 2 }, 'noche')).toBe('2 se apagaron')
    expect(fraseDelAviso({ nivel: 'enfriandose', cuantos: 1 }, 'dia')).toBe('1 se desafila')
    expect(fraseDelAviso({ nivel: 'enfriandose', cuantos: 3 }, 'dia')).toBe('3 se desafilan')
    expect(fraseDelAviso({ nivel: 'apagado', cuantos: 2 }, 'dia')).toBe('2 sin filo')
  })

  it('lo que salió: cortes de noche, piezas de día', () => {
    expect(servidos(1, 'noche')).toBe('1 corte servido')
    expect(servidos(2, 'dia')).toBe('2 piezas servidas')
  })
})
