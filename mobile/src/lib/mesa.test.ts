import { describe, expect, it } from 'vitest'
import {
  botonDeBorrador,
  esEditable,
  esServidorSinLaMesa,
  hace,
  lineaDelPrivado,
  pedidoDeLaMesa,
  seCorrigio,
} from './mesa'

describe('La Mesa en el teléfono', () => {
  it('cada filtro pide su ruta y se guarda con su clave', () => {
    expect(pedidoDeLaMesa('pendientes', null)).toEqual({ clave: 'mesa:pendientes:todas', ruta: '/api/mobile/comentarios?estado=pendientes' })
    expect(pedidoDeLaMesa('automaticas', 'instagram')).toEqual({
      clave: 'mesa:automaticas:instagram',
      ruta: '/api/mobile/comentarios?estado=automaticas&red=instagram',
    })
  })

  it('«hace» como el panel', () => {
    const ahora = Date.parse('2026-11-07T12:00:00Z')
    expect(hace('2026-11-07T11:45:00Z', ahora)).toBe('recién')
    expect(hace('2026-11-07T11:00:00Z', ahora)).toBe('hace 1 hora')
    expect(hace('2026-11-07T09:00:00Z', ahora)).toBe('hace 3 horas')
    expect(hace('2026-11-06T12:00:00Z', ahora)).toBe('ayer')
    expect(hace('2026-11-05T12:00:00Z', ahora)).toBe('anteayer')
    expect(hace('2026-11-02T12:00:00Z', ahora)).toBe('hace 5 días')
  })

  it('solo lo que espera o falló tiene botones; la automática no pide otro borrador', () => {
    expect(esEditable({ estado: 'pendiente' })).toBe(true)
    expect(esEditable({ estado: 'fallido' })).toBe(true)
    expect(esEditable({ estado: 'enviado' })).toBe(false)
    expect(esEditable({ estado: 'en_la_red' })).toBe(false)
    expect(botonDeBorrador({ automatico: false, borrador: null })).toBe('Reintentar borrador')
    expect(botonDeBorrador({ automatico: false, borrador: '¡Gracias!' })).toBe('Escribir otro borrador')
    expect(botonDeBorrador({ automatico: true, borrador: 'GUIA: https://…' })).toBeNull()
  })

  it('pregunta antes de pisar lo corregido a mano, no lo que quedó igual o vacío', () => {
    expect(seCorrigio('¡Gracias!', '¡Gracias!')).toBe(false)
    expect(seCorrigio('   ', '¡Gracias!')).toBe(false)
    expect(seCorrigio('¡Gracias, Ana!', '¡Gracias!')).toBe(true)
    expect(seCorrigio('Hola', null)).toBe(true)
  })

  it('la línea del privado, como el panel', () => {
    expect(lineaDelPrivado(null)).toBeNull()
    expect(lineaDelPrivado({ estado: 'enviado', error: null })).toBe('Privado: enviado')
    expect(lineaDelPrivado({ estado: 'fallido', error: 'No se pudo mandar el privado.' })).toBe(
      'Privado: no salió · No se pudo mandar el privado.',
    )
  })

  it('un 404 sin frase es un servidor de antes; con frase, no', () => {
    expect(esServidorSinLaMesa(new Error('HTTP 404'))).toBe(true)
    expect(esServidorSinLaMesa(new Error('HTTP 500'))).toBe(false)
    expect(esServidorSinLaMesa(new Error('El comentario ya no está en la red.'))).toBe(false)
  })
})
