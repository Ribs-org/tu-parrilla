import { describe, expect, it } from 'vitest'
import {
  COMO_VIENE,
  FALTA_ACORTAR,
  FALTA_FORMATO,
  FALTA_MARCA,
  FALTA_NOMBRE_DE_MARCA,
  FALTA_SUBIR,
  FALTA_VIDEO,
  MAX_INSTRUCCION,
  RIEL_VACIO,
  alternarFormato,
  antesEnLaFila,
  cambiarRol,
  colgar,
  cuerpoDeLaComanda,
  enMarchaEnPalabras,
  etiquetaDe,
  filtrosDeClase,
  resumenDeLaComanda,
  rielQueSigue,
  soltar,
  type OpcionesDelPedido,
  type Riel,
  duracionEnPalabras,
  estadoDeLaCuota,
  faltaParaMandar,
  ganchosOcupados,
  leerPendientes,
  nombreDeLoGrabado,
  nuevaRef,
  paraLaCamara,
  pesoEnPalabras,
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

const OPCIONES: OpcionesDelPedido = {
  subtipos: [
    { valor: 'largo', nombre: 'Un video largo' },
    { valor: 'podcast', nombre: 'Un podcast en videollamada' },
  ],
  roles: [
    { valor: 'imagen', nombre: 'Para intercalar' },
    { valor: 'camara', nombre: 'Otra cámara' },
    { valor: 'pantalla', nombre: 'La pantalla' },
  ],
  formatos: [
    { valor: 'clips', nombre: 'Clips verticales' },
    { valor: 'carruseles', nombre: 'Carruseles' },
  ],
  cantidades: [
    { valor: 'lo-que-de', nombre: 'Lo que dé el material' },
    { valor: 'unos-10', nombre: 'Unos 10' },
  ],
  usos: [
    { valor: 'crudo', nombre: 'Material crudo' },
    { valor: 'intro', nombre: 'Intro' },
  ],
  maxAcompanamientos: 20,
}
const MARCA = { nombre: 'La Marca', handle: '@marca', acento: '#3D7BFF', ctaTexto: null }

describe('la comanda', () => {
  const materiales = [material('foto', 'imagen'), material('v1', 'video'), material('v2', 'video')]
  const armar = (...ids: string[]): Riel => ids.reduce((r, id) => colgar(r, id, materiales), RIEL_VACIO)

  it('el plato principal es el primer video que se cuelga; lo demás va para intercalar', () => {
    expect(armar('foto', 'v2', 'v1')).toEqual({
      elegidos: [
        { id: 'foto', rol: 'imagen' },
        { id: 'v2', rol: 'imagen' },
        { id: 'v1', rol: 'imagen' },
      ],
      principal: 'v2',
    })
    expect(armar('foto').principal).toBeNull()
    expect(colgar(armar('v1'), 'v1', materiales)).toEqual(armar('v1'))
    expect(colgar(armar('v1', 'v2'), 'foto', materiales, 1)).toEqual(armar('v1', 'v2'))
  })

  it('soltar el principal, o pasarlo a acompañar, deja de principal al siguiente video', () => {
    expect(soltar(armar('v1', 'v2'), 'v1', materiales).principal).toBe('v2')
    expect(soltar(armar('v1', 'foto'), 'v1', materiales).principal).toBeNull()
    const r = cambiarRol(armar('v1', 'v2'), 'v1', 'camara', materiales)
    expect(r.principal).toBe('v2')
    expect(r.elegidos[0]).toEqual({ id: 'v1', rol: 'camara' })
    expect(cambiarRol(r, 'v1', 'principal', materiales).principal).toBe('v1')
    expect(cambiarRol(r, 'foto', 'principal', materiales)).toEqual(r)
  })

  it('lo que se sacó de la cámara se cae del riel, y el principal pasa a otro', () => {
    expect(rielQueSigue(armar('v1', 'v2'), materiales.filter((m) => m.id !== 'v1'))).toEqual({ elegidos: [{ id: 'v2', rol: 'imagen' }], principal: 'v2' })
  })

  it('el cuerpo, contra un servidor de antes: los ids de lo que acompaña y la instrucción', () => {
    const riel = { ...armar('foto', 'v2', 'v1'), elegidos: [...armar('foto', 'v2', 'v1').elegidos, { id: 'se-fue', rol: 'imagen' as const }] }
    expect(cuerpoDeLaComanda('r', riel, materiales, '  corto  ')).toEqual({ ref: 'r', principal: 'v2', acompanamientos: ['foto', 'v1'], instruccion: 'corto' })
  })

  it('el cuerpo completo: el rol de cada uno, lo que se pide y la marca limpia', () => {
    const riel = cambiarRol(armar('v1', 'v2', 'foto'), 'v2', 'pantalla', materiales)
    const elegidas = { ...COMO_VIENE, subtipo: 'podcast', formatos: ['clips', 'carruseles'], paraCuando: '2026-11-10', marca: { ...MARCA, handle: '  ', ctaTexto: ' Sígueme ' } }
    expect(cuerpoDeLaComanda('r', riel, materiales, 'x', elegidas)).toEqual({
      ref: 'r',
      principal: 'v1',
      instruccion: 'x',
      subtipo: 'podcast',
      acompanamientos: [
        { id: 'v2', rol: 'pantalla' },
        { id: 'foto', rol: 'imagen' },
      ],
      formatos: ['clips', 'carruseles'],
      cantidad: 'lo-que-de',
      paraCuando: '2026-11-10',
      marca: { nombre: 'La Marca', handle: null, acento: '#3D7BFF', ctaTexto: 'Sígueme' },
    })
  })

  it('lo que falta para mandarla, en orden', () => {
    const base = { riel: armar('v1'), materiales, subiendo: 0, instruccion: '', marca: 'Marca' }
    expect(faltaParaMandar({ ...base, subiendo: 1 })).toBe(FALTA_SUBIR)
    expect(faltaParaMandar({ ...base, riel: armar('foto') })).toBe(FALTA_VIDEO)
    expect(faltaParaMandar({ ...base, instruccion: 'a'.repeat(MAX_INSTRUCCION + 1) })).toBe(FALTA_ACORTAR)
    expect(faltaParaMandar({ ...base, marca: null })).toBe(FALTA_MARCA)
    expect(faltaParaMandar(base)).toBeNull()
    const completo = { ...base, marca: null, opciones: { ...COMO_VIENE, marca: MARCA } }
    expect(faltaParaMandar(completo)).toBeNull()
    expect(faltaParaMandar({ ...completo, opciones: { ...completo.opciones, formatos: [] } })).toBe(FALTA_FORMATO)
    expect(faltaParaMandar({ ...completo, opciones: { ...completo.opciones, marca: { ...MARCA, nombre: ' ' } } })).toBe(FALTA_NOMBRE_DE_MARCA)
  })

  it('los formatos se marcan y desmarcan en el orden del panel', () => {
    expect(alternarFormato(['carruseles'], 'clips', OPCIONES.formatos)).toEqual(['clips', 'carruseles'])
    expect(alternarFormato(['clips', 'carruseles'], 'clips', OPCIONES.formatos)).toEqual(['carruseles'])
  })

  it('«Confirmar», un renglón por cosa, como el panel', () => {
    const riel = cambiarRol(armar('v1', 'v2', 'foto'), 'v2', 'camara', materiales)
    const elegidas = { ...COMO_VIENE, paraCuando: '2026-11-10', marca: MARCA }
    expect(resumenDeLaComanda(riel, materiales, elegidas, OPCIONES, (d) => `el ${d}`)).toEqual([
      'Plato principal: v1.x (Un video largo)',
      'Lo acompañan: v2.x (otra cámara), foto.x (para intercalar)',
      'Qué sale: Clips verticales · Lo que dé el material',
      'Los estilos: los elige el chef',
      'Para cuándo: el 2026-11-10',
      'Tu marca: La Marca · @marca',
    ])
    expect(antesEnLaFila(0)).toBe('Es la próxima en la fila.')
    expect(antesEnLaFila(3)).toBe('Hay 3 comandas antes que la tuya.')
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

describe('la cámara por dentro', () => {
  it('los filtros, solo con más de una clase, con cuántos hay', () => {
    expect(filtrosDeClase([material('a', 'video')])).toEqual([])
    expect(filtrosDeClase([material('a', 'video'), material('b', 'imagen'), material('c', 'video')]).map((f) => f.texto)).toEqual([
      'Todo (3)',
      'Videos (2)',
      'Imágenes (1)',
    ])
  })

  it('la etiqueta: su uso con el nombre del panel o, sin uso, lo que es; y lo que no deja sacarlo', () => {
    expect(etiquetaDe({ uso: 'intro', clase: 'video' }, OPCIONES.usos)).toBe('Intro')
    expect(etiquetaDe({ uso: null, clase: 'otro' }, OPCIONES.usos)).toBe('Otro archivo')
    expect(enMarchaEnPalabras(1)).toBe('En una comanda en marcha')
    expect(enMarchaEnPalabras(2)).toBe('En 2 comandas en marcha')
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
