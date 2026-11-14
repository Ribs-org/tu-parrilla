import { describe, expect, it } from 'vitest'
import {
  codigoNuevo,
  comentarioNuevo,
  criticaEnTexto,
  cuandoEnTexto,
  rolDelCodigo,
  tiempoEnTexto,
  zonaDe,
  zonaEnTexto,
  type PaseParaLaApi,
} from './reglas'

// El Pase sin base: los códigos, los tiempos, lo que vale una crítica y la crítica en texto para una IA.

describe('los códigos', () => {
  it('dicen su rol en el prefijo, y lo que no tiene forma de código no es de nadie', () => {
    const r = codigoNuevo('revisor')
    const e = codigoNuevo('editor')
    expect(r).toMatch(/^rev_[A-Za-z0-9_-]{20}$/)
    expect(e).toMatch(/^edi_[A-Za-z0-9_-]{20}$/)
    expect(rolDelCodigo(r)).toBe('revisor')
    expect(rolDelCodigo(e)).toBe('editor')
    expect(rolDelCodigo('rev_corto')).toBeNull()
    expect(rolDelCodigo(`xyz_${'a'.repeat(20)}`)).toBeNull()
    expect(codigoNuevo('revisor')).not.toBe(r)
  })
})

describe('los tiempos', () => {
  it('minutos, segundos y décimas; con hora si pasa de una', () => {
    expect(tiempoEnTexto(0)).toBe('0:00.0')
    expect(tiempoEnTexto(20_340)).toBe('0:20.3')
    expect(tiempoEnTexto(125_999)).toBe('2:05.9')
    expect(tiempoEnTexto(3_723_400)).toBe('1:02:03.4')
    expect(cuandoEnTexto(20_300, null)).toBe('0:20.3')
    expect(cuandoEnTexto(20_300, 22_000)).toBe('0:20.3–0:22.0')
    expect(cuandoEnTexto(null, null)).toBeNull()
  })
})

describe('una crítica nueva', () => {
  const base = { pieza: 'p-1', autor: 'Vicente', texto: 'La transición corta la frase' }

  it('un momento, un tramo, una zona, o general; los segundos se guardan en milisegundos', () => {
    expect(comentarioNuevo({ ...base, desde: 20.3 })).toEqual({
      comentario: { piezaId: 'p-1', autor: 'Vicente', texto: base.texto, etiqueta: 'otro', desdeMs: 20_300, hastaMs: null, zona: null },
    })
    const tramo = comentarioNuevo({ ...base, desde: 20, hasta: 22.5, etiqueta: 'transicion', zona: { x: 0.1, y: 0.6, ancho: 0.8, alto: 0.2 } })
    expect(tramo).toMatchObject({ comentario: { desdeMs: 20_000, hastaMs: 22_500, etiqueta: 'transicion', zona: { x: 0.1, y: 0.6, ancho: 0.8, alto: 0.2 } } })
    expect(comentarioNuevo(base)).toMatchObject({ comentario: { desdeMs: null, hastaMs: null, zona: null } })
  })

  it('rechaza lo que no se entiende, con su frase', () => {
    expect(comentarioNuevo({ ...base, autor: ' ' })).toMatchObject({ error: expect.stringContaining('tu nombre') })
    expect(comentarioNuevo({ ...base, texto: '' })).toMatchObject({ error: expect.stringContaining('comentario') })
    expect(comentarioNuevo({ ...base, etiqueta: 'brillo' })).toMatchObject({ error: expect.stringContaining('etiqueta') })
    expect(comentarioNuevo({ ...base, desde: -1 })).toMatchObject({ error: expect.stringContaining('segundos') })
    expect(comentarioNuevo({ ...base, hasta: 3 })).toMatchObject({ error: expect.stringContaining('segundos') })
    expect(comentarioNuevo({ ...base, desde: 5, hasta: 4 })).toMatchObject({ error: expect.stringContaining('segundos') })
    expect(comentarioNuevo({ ...base, zona: { x: 0.9, y: 0, ancho: 0.5, alto: 0.5 } })).toMatchObject({ error: expect.stringContaining('zona') })
    expect(comentarioNuevo('no')).toMatchObject({ error: expect.any(String) })
  })

  it('la zona: fracciones dentro del cuadro, no un punto', () => {
    expect(zonaDe(undefined)).toBeNull()
    expect(zonaDe({ x: 0, y: 0, ancho: 1, alto: 1 })).toEqual({ x: 0, y: 0, ancho: 1, alto: 1 })
    expect(zonaDe({ x: 0.5, y: 0.5, ancho: 0, alto: 0.2 })).toBe('invalida')
    expect(zonaDe({ x: '0', y: 0, ancho: 1, alto: 1 })).toBe('invalida')
    expect(zonaEnTexto({ x: 0.1, y: 0.7, ancho: 0.8, alto: 0.2 })).toBe('zona abajo, centro (x 10 %, y 70 %, 80 % de ancho y 20 % de alto)')
  })
})

describe('la crítica en texto, para una IA', () => {
  const pase: PaseParaLaApi = {
    rol: 'editor',
    titulo: 'Shorts de la semana',
    instrucciones: 'Que se entienda sin sonido.',
    piezas: [
      {
        id: 'p-1',
        grupo: 'g-1',
        version: 2,
        variante: 'B',
        titulo: 'La visa secreta',
        tipo: 'video',
        url: 'https://media.ejemplo.cl/pase/a.mp4',
        notas: 'Subí el ritmo del principio.',
        respondeA: 'p-0',
        estado: 'cambios',
        estadoPor: 'Vicente',
        creadaEn: '2026-11-13T10:00:00-03:00',
        comentarios: [
          { id: 'c-3', autor: 'Vicente', etiqueta: 'otro', texto: 'Ya está', desde: null, hasta: null, cuando: null, zona: null, estado: 'resuelto', respuesta: 'Hecho', resueltoEn: 'p-1', creadoEn: '' },
          { id: 'c-2', autor: 'Vicente', etiqueta: 'subtitulos', texto: 'Tapa la cara', desde: 20.3, hasta: 22, cuando: '0:20.3–0:22.0', zona: { x: 0.1, y: 0.7, ancho: 0.8, alto: 0.2 }, estado: 'abierto', respuesta: null, resueltoEn: null, creadoEn: '' },
          { id: 'c-1', autor: 'Ana', etiqueta: 'audio', texto: 'La música tapa la voz', desde: null, hasta: null, cuando: null, zona: null, estado: 'abierto', respuesta: null, resueltoEn: null, creadoEn: '' },
        ],
      },
    ],
  }

  it('por pieza: lo abierto primero, en orden de tiempo, con dónde, qué y quién; lo resuelto tachado', () => {
    const texto = criticaEnTexto(pase, 'https://tu-parrilla.cl/api/pase/edi_x')
    expect(texto).toContain('# Shorts de la semana')
    expect(texto).toContain('Lo que pide quien revisa: Que se entienda sin sonido.')
    expect(texto).toContain('1 piezas, 2 críticas abiertas.')
    expect(texto).toContain('## «La visa secreta» v2 B — Pide cambios')
    const lineas = texto.split('\n').filter((l) => l.startsWith('- ['))
    expect(lineas).toEqual([
      '- [ ] [general] (Audio y música) La música tapa la voz — Ana · id c-1',
      '- [ ] [0:20.3–0:22.0] zona abajo, centro (x 10 %, y 70 %, 80 % de ancho y 20 % de alto) (Subtítulos y texto) Tapa la cara — Vicente · id c-2',
      '- [x] [general] (Otro) ~~Ya está~~ — Vicente · id c-3',
    ])
    expect(texto).toContain('  - Respuesta del editor: Hecho')
  })
})
