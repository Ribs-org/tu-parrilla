import { describe, expect, it } from 'vitest'
import {
  FALTA_ACORTAR,
  FALTA_MARCA,
  FALTA_SUBIR,
  FALTA_VIDEO,
  MAX_INSTRUCCION,
  cuerpoDeLaComanda,
  duracionEnPalabras,
  estadoDeLaCuota,
  faltaParaMandar,
  ganchosOcupados,
  leerPendientes,
  nombreDeLoGrabado,
  nuevaRef,
  paraLaCamara,
  pesoEnPalabras,
  principalDe,
  sumarEjemplo,
  type Material,
  faltaParaResponder,
  lineaDeLaCocina,
} from './cocina'

const material = (id: string, clase: Material['clase']): Material => ({
  id,
  nombre: `${id}.x`,
  uso: null,
  bytes: 1000,
  duracionS: null,
  tipoArchivo: clase === 'video' ? 'video/mp4' : 'image/jpeg',
  clase,
  creadoEn: '2026-11-02T17:00:00.000Z',
  enMarcha: 0,
})

describe('lo que se graba o se elige', () => {
  const ahora = new Date(2026, 10, 2, 14, 5)

  it('lo grabado se nombra con el día y la hora, con la extensión de su tipo', () => {
    expect(nombreDeLoGrabado('video', 'video/mp4', ahora)).toBe('Video del 2 de nov, 14.05.mp4')
    expect(nombreDeLoGrabado('video', 'video/quicktime', ahora)).toBe('Video del 2 de nov, 14.05.mov')
    expect(nombreDeLoGrabado('imagen', 'image/jpeg', ahora)).toBe('Foto del 2 de nov, 14.05.jpg')
  })

  it('un video grabado: su tipo, uso crudo y la duración en segundos', () => {
    expect(paraLaCamara({ uri: 'file:///cache/ImagePicker/abc.mp4', mimeType: 'video/mp4', duration: 95_000, type: 'video' }, true, ahora)).toEqual({
      nombre: 'Video del 2 de nov, 14.05.mp4',
      tipo: 'video/mp4',
      clase: 'video',
      uso: 'crudo',
      duracionS: 95,
    })
  })

  it('de la galería conserva su nombre; sin tipo, sale de la extensión', () => {
    expect(paraLaCamara({ uri: 'file:///x/IMG_1.MOV', fileName: 'IMG_1.MOV', mimeType: null }, false, ahora)).toMatchObject({
      nombre: 'IMG_1.MOV',
      tipo: 'video/quicktime',
      clase: 'video',
    })
    expect(paraLaCamara({ uri: 'file:///x/foto.jpg', fileName: 'foto.jpg', mimeType: 'image/jpg' }, false, ahora)).toMatchObject({
      tipo: 'image/jpeg',
      clase: 'imagen',
      uso: null,
      duracionS: null,
    })
  })
})

describe('la cuota y los pesos, como el panel', () => {
  it('el peso en palabras', () => {
    expect(pesoEnPalabras(4.2 * 1024 ** 3)).toBe('4,2 GB')
    expect(pesoEnPalabras(350.2 * 1024 ** 2)).toBe('350,2 MB')
    expect(pesoEnPalabras(20 * 1024 ** 3)).toBe('20 GB')
    expect(pesoEnPalabras(1000)).toBe('0,1 MB')
  })

  it('los ganchos y el estado de la cuota', () => {
    const cuota = 20 * 1024 ** 3
    expect(ganchosOcupados(0, cuota)).toBe(0)
    expect(ganchosOcupados(1, cuota)).toBe(1)
    expect(ganchosOcupados(cuota / 2, cuota)).toBe(5)
    expect(ganchosOcupados(cuota * 2, cuota)).toBe(10)
    expect(estadoDeLaCuota(cuota * 0.5, cuota)).toBe('holgada')
    expect(estadoDeLaCuota(cuota * 0.9, cuota)).toBe('llenandose')
    expect(estadoDeLaCuota(cuota, cuota)).toBe('llena')
  })

  it('la duración', () => {
    expect(duracionEnPalabras(95)).toBe('1:35')
    expect(duracionEnPalabras(3730)).toBe('1:02:10')
    expect(duracionEnPalabras(null)).toBeNull()
  })
})

describe('la comanda', () => {
  const materiales = [material('foto', 'imagen'), material('v1', 'video'), material('v2', 'video')]

  it('el plato principal es el primer video elegido; lo demás acompaña, sin lo que ya no está', () => {
    expect(principalDe(['foto', 'v2', 'v1'], materiales)).toBe('v2')
    expect(principalDe(['foto'], materiales)).toBeNull()
    expect(cuerpoDeLaComanda('r', ['foto', 'v2', 'se-fue', 'v1'], materiales, '  corto  ')).toEqual({
      ref: 'r',
      principal: 'v2',
      acompanamientos: ['foto', 'v1'],
      instruccion: 'corto',
    })
  })

  it('lo que falta para mandarla, en orden', () => {
    const base = { elegidos: ['v1'], materiales, subiendo: 0, instruccion: '', marca: 'Marca' }
    expect(faltaParaMandar({ ...base, subiendo: 1 })).toBe(FALTA_SUBIR)
    expect(faltaParaMandar({ ...base, elegidos: ['foto'] })).toBe(FALTA_VIDEO)
    expect(faltaParaMandar({ ...base, instruccion: 'a'.repeat(MAX_INSTRUCCION + 1) })).toBe(FALTA_ACORTAR)
    expect(faltaParaMandar({ ...base, marca: null })).toBe(FALTA_MARCA)
    expect(faltaParaMandar(base)).toBeNull()
  })

  it('un ejemplo se suma en su renglón y no se repite', () => {
    expect(sumarEjemplo('', 'Clips cortos.')).toBe('Clips cortos.')
    expect(sumarEjemplo('Hola  ', 'Clips cortos.')).toBe('Hola\nClips cortos.')
    expect(sumarEjemplo('Clips cortos.', 'Clips cortos.')).toBe('Clips cortos.')
  })

  it('la ref es un uuid v4, que el servidor acepta', () => {
    expect(nuevaRef()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})

describe('lo que quedó subiendo', () => {
  it('se lee con cuidado: lo que no tiene forma de pendiente se descarta', () => {
    const bien = { clave: 's1', nombre: 'v.mp4', clase: 'video', uri: 'file:///d/cocina/v.mp4', tipo: 'video/mp4', bytes: 10, uso: 'crudo', duracionS: 5, subidaId: 'x', propio: true }
    expect(leerPendientes(JSON.stringify([bien, { clave: 's2' }, null, { ...bien, bytes: 0 }]))).toEqual([bien])
    expect(leerPendientes(null)).toEqual([])
    expect(leerPendientes('{roto')).toEqual([])
    expect(leerPendientes('{}')).toEqual([])
  })
})

describe('cómo atiende la cocina', () => {
  it('la frase la manda el servidor; el punto es verde solo si atiende sola', () => {
    const aMano = 'La cocina atiende a mano: una persona toma las comandas, así que la tuya puede tardar hasta el próximo día hábil.'
    expect(lineaDeLaCocina({ abierta: true, atiende: 'a-mano', cocina: aMano })).toEqual({ texto: aMano, tono: 'ambar' })
    expect(lineaDeLaCocina({ abierta: true, atiende: 'sola', cocina: 'La cocina está abierta: x' })).toEqual({ texto: 'La cocina está abierta: x', tono: 'verde' })
  })

  it('un servidor de antes solo decía si latía', () => {
    expect(lineaDeLaCocina({ abierta: true })).toEqual({ texto: 'La cocina está abierta.', tono: 'verde' })
    expect(lineaDeLaCocina({ abierta: false })).toEqual({ texto: 'La cocina está cerrada por ahora: lo que pidas espera su turno.', tono: 'ambar' })
  })
})

describe('contestarle al chef', () => {
  it('una respuesta libre: no vacía, y hasta 500 caracteres', () => {
    expect(faltaParaResponder('   ')).toBe('Escribe tu respuesta al chef.')
    expect(faltaParaResponder('a'.repeat(501))).toBe('Tu respuesta llega hasta 500 caracteres.')
    expect(faltaParaResponder('Destaca los precios.')).toBeNull()
  })
})
