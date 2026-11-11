import { describe, expect, it } from 'vitest'
import {
  avisoDeComanda,
  avisoDeComentarios,
  avisoDeHito,
  avisoDelDia,
  avisoDeFierro,
  avisoDePregunta,
  avisoDeQuemado,
  avisoDeRespuesta,
} from './avisos'

describe('lo que dice cada aviso al teléfono', () => {
  it('La Mesa: cuántos y en qué redes, sin el texto de nadie', () => {
    expect(avisoDeComentarios(1, ['instagram'])).toEqual({
      titulo: 'Un comentario nuevo en La Mesa',
      cuerpo: 'Espera tu respuesta, en Instagram.',
      tipo: 'comentarios',
    })
    expect(avisoDeComentarios(5, ['youtube', 'instagram', 'facebook', 'instagram']).cuerpo).toBe(
      'Esperan tu respuesta, en Facebook, Instagram y YouTube.',
    )
    expect(avisoDeComentarios(5, ['youtube']).titulo).toBe('5 comentarios nuevos en La Mesa')
  })

  it('lo quemado, con la palabra del modo', () => {
    const p = { postId: 'p-1', red: 'instagram', handle: '@vicente', texto: 'El asado del domingo', motivo: 'El video es muy largo.' }
    expect(avisoDeQuemado(p, 'noche')).toEqual({
      titulo: 'Se quemó: Instagram · @vicente',
      cuerpo: '«El asado del domingo» no salió. El video es muy largo.',
      tipo: 'quemado',
      id: 'p-1',
    })
    expect(avisoDeQuemado(p, 'dia').titulo).toBe('Se echó a perder: Instagram · @vicente')
  })

  it('el fierro que se enfría o se apaga; de día, el cuchillo', () => {
    expect(avisoDeFierro({ red: 'facebook', handle: 'Mi página', estado: 'enfriandose' }, 'noche')).toEqual({
      titulo: 'Facebook · Mi página se enfría',
      cuerpo: 'Su permiso vence esta semana. Reconéctala en Los Fierros, en el panel, antes de que se apague.',
      tipo: 'fierro',
    })
    expect(avisoDeFierro({ red: 'facebook', handle: null, estado: 'enfriandose' }, 'dia').titulo).toBe('Facebook se desafila')
    expect(avisoDeFierro({ red: 'tiktok', handle: '@v', estado: 'frio' }, 'noche').titulo).toBe('Se apagó TikTok · @v')
    expect(avisoDeFierro({ red: 'tiktok', handle: '@v', estado: 'frio' }, 'dia')).toMatchObject({
      titulo: 'TikTok · @v quedó sin filo',
      cuerpo: expect.stringContaining('Los Cuchillos'),
    })
  })

  it('la pregunta del chef y la comanda que terminó', () => {
    expect(avisoDePregunta({ comandaId: 'c-1', principal: 'video9.mp4', texto: '¿Con música o sin?' })).toEqual({
      titulo: 'El chef te pregunta: «video9.mp4»',
      cuerpo: '¿Con música o sin?',
      tipo: 'pregunta',
      id: 'c-1',
    })
    const lista = { id: 'c-1', estado: 'lista' as const, principal: 'video9.mp4', motivo: null, enElMeson: 3 }
    expect(avisoDeComanda({ ...lista, estado: 'sirviendo' }, 'noche')).toEqual({
      titulo: 'Salió la primera tanda: «video9.mp4»',
      cuerpo: 'El chef te dejó 3 cortes en el mesón; lo demás sigue en la cocina.',
      tipo: 'comanda',
      id: 'c-1',
    })
    expect(avisoDeComanda({ ...lista, estado: 'sirviendo', enElMeson: 0 }, 'dia').cuerpo).toBe(
      'Lo primero está llegando a la bandeja; lo demás sigue en la cocina.',
    )
    expect(avisoDeComanda(lista, 'noche')).toMatchObject({
      titulo: 'Lista en el mesón: «video9.mp4»',
      cuerpo: 'El chef te dejó 3 cortes en el mesón, para programar en el panel.',
    })
    expect(avisoDeComanda(lista, 'dia').cuerpo).toBe('El chef te dejó 3 piezas en la bandeja, para programar en el panel.')
    expect(avisoDeComanda({ ...lista, estado: 'rechazada', principal: null, motivo: 'No se oye nada.' }, 'noche')).toMatchObject({
      titulo: 'No se puede cocinar: tu comanda',
      cuerpo: 'No se oye nada.',
    })
  })

  it('la respuesta del equipo, en el libro o en la caja', () => {
    expect(avisoDeRespuesta({ id: 's-1', respuesta: 'Ya quedó.' }, 'noche')).toEqual({
      titulo: 'Te respondimos en el libro de sugerencias',
      cuerpo: 'Ya quedó.',
      tipo: 'sugerencia',
      id: 's-1',
    })
    expect(avisoDeRespuesta({ id: 's-1', respuesta: 'Ya quedó.' }, 'dia').titulo).toBe('Te respondimos en la caja de sugerencias')
  })
})

describe('los avisos de lo bueno', () => {
  it('un hito: corte de noche, pieza de día, con el comienzo del texto, y lleva al corte', () => {
    expect(avisoDeHito({ postId: 'c-1', umbral: 1000, texto: 'El asado del domingo' }, 'noche')).toEqual({
      titulo: 'Tu corte pasó las 1.000 vistas',
      cuerpo: '«El asado del domingo». Míralo en Lo que trajo.',
      tipo: 'hito',
      id: 'c-1',
    })
    expect(avisoDeHito({ postId: 'c-1', umbral: 1_000_000, texto: '' }, 'dia')).toMatchObject({
      titulo: 'Tu pieza pasó el millón de vistas',
      cuerpo: 'Míralo en Lo que trajo.',
    })
  })

  it('lo del día: solo lo que subió, en singular cuando es uno', () => {
    expect(avisoDelDia({ meGusta: 1200, comentarios: 9 }, 'noche')).toEqual({
      titulo: 'Lo que trajo hoy',
      cuerpo: 'Hoy: +1.200 me gusta y +9 comentarios en tus cortes.',
      tipo: 'bueno',
    })
    expect(avisoDelDia({ meGusta: 0, comentarios: 1 }, 'dia').cuerpo).toBe('Hoy: +1 comentario en tus piezas.')
  })
})
