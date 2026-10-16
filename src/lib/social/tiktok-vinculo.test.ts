import { describe, expect, it } from 'vitest'
import { emparejarVideos, mismoTexto, normalizarTexto, type DestinoSinId, type VideoSinDueno } from './tiktok-vinculo'

const hora = (h: number, dia = 10) => new Date(Date.UTC(2026, 9, dia, h, 0, 0))
const destino = (id: string, caption: string, scheduledAt: Date, borrador = false): DestinoSinId => ({ id, caption, scheduledAt, borrador })
const video = (externalId: string, caption: string | null, publishedAt: Date): VideoSinDueno => ({ externalId, caption, publishedAt })

describe('normalizarTexto y mismoTexto', () => {
  it('compara sin mayúsculas, tildes, emojis ni signos', () => {
    expect(normalizarTexto('¡Así armé mi SETUP! 🎥 #streaming')).toBe('asi arme mi setup streaming')
  })

  it('un texto recortado sigue siendo el mismo post', () => {
    const largo = normalizarTexto('Cómo armé mi setup de streaming por US$ 300, paso a paso')
    expect(mismoTexto(normalizarTexto('Cómo armé mi setup de streaming'), largo)).toBe(true)
  })

  it('un comienzo demasiado corto no alcanza', () => {
    expect(mismoTexto('hola', 'hola a todos los que miran')).toBe(false)
  })
})

describe('emparejarVideos', () => {
  it('cruza por texto dentro de la ventana', () => {
    const pares = emparejarVideos(
      [destino('d1', 'Cómo armé mi setup de streaming', hora(20))],
      [video('7001', 'Cómo armé mi setup de streaming #setup', hora(20)), video('7002', 'Otra cosa distinta del todo', hora(20))],
    )
    expect([...pares]).toEqual([['d1', '7001']])
  })

  // El caso del torneo: dos versiones de la misma idea con el mismo texto, a horas distintas.
  it('dos versiones con el mismo texto quedan cada una con su video, por la hora', () => {
    const texto = 'Tres errores que cometí al lanzar mi producto'
    const pares = emparejarVideos(
      [destino('v1', texto, hora(9)), destino('v2', texto, hora(19))],
      [video('7019', texto, hora(19)), video('7009', texto, hora(9))],
    )
    expect(pares.get('v1')).toBe('7009')
    expect(pares.get('v2')).toBe('7019')
  })

  it('un video fuera de la ventana no cruza', () => {
    const texto = 'Tres errores que cometí al lanzar mi producto'
    expect(emparejarVideos([destino('d', texto, hora(9))], [video('1', texto, hora(9, 13))]).size).toBe(0)
    expect(emparejarVideos([destino('d', texto, hora(9))], [video('1', texto, hora(6))]).size).toBe(0)
  })

  it('un borrador puede salir semanas después, cuando el dueño lo termina', () => {
    const texto = 'Tres errores que cometí al lanzar mi producto'
    const pares = emparejarVideos([destino('d', texto, hora(9), true)], [video('1', `${texto} y lo que aprendí`, hora(9, 25))])
    expect(pares.get('d')).toBe('1')
  })

  it('sin texto, solo un video sin texto y cercano en la hora', () => {
    expect(emparejarVideos([destino('d', '', hora(9))], [video('1', null, hora(10))]).get('d')).toBe('1')
    expect(emparejarVideos([destino('d', '', hora(9))], [video('1', null, hora(15))]).size).toBe(0)
    expect(emparejarVideos([destino('d', '', hora(9))], [video('1', 'Un video con su texto propio', hora(9))]).size).toBe(0)
  })

  it('un video no se le da a dos destinos', () => {
    const texto = 'Tres errores que cometí al lanzar mi producto'
    const pares = emparejarVideos([destino('a', texto, hora(9)), destino('b', texto, hora(10))], [video('1', texto, hora(9))])
    expect(pares.size).toBe(1)
    expect(pares.get('a')).toBe('1')
  })
})
