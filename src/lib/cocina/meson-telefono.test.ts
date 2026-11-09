import { describe, expect, it } from 'vitest'
import type { ComandaEnElMeson, CreativoDelMeson } from './meson'
import { mesonParaElTelefono } from './meson-telefono'
import { MAX_NOTA_DESCARTE, MOTIVOS_DESCARTE, NOMBRE_MOTIVO } from './meson-motivos'

const AHORA = new Date('2026-11-07T15:00:00Z')

function creativo(cambios: Partial<CreativoDelMeson> = {}): CreativoDelMeson {
  return {
    id: 'cr-1',
    comandaId: 'c-1',
    pieza: 'video9/08',
    tanda: null,
    tipo: 'video',
    texto: 'El texto',
    tituloYoutube: 'El título',
    estilo: 'golpes',
    atributos: { estilo: 'golpes', pieza: 'video9/08', fuentes: 'revista', subtitulos: true },
    duracionS: 42.4,
    portadaUrl: 'https://cdn/p.jpg',
    media: [{ url: 'https://cdn/v.mp4', mediaType: 'video' }],
    expiraEn: null,
    ...cambios,
  }
}

const meson = (c: CreativoDelMeson): ComandaEnElMeson[] => [
  {
    id: 'c-1',
    principal: 'El podcast',
    creadaEn: new Date('2026-11-01T12:00:00Z'),
    piezas: [{ pieza: c.pieza, creativos: [c] }],
    estado: 'lista',
    tandasServidas: 1,
    tandasTotal: 1,
    entrega: null,
  },
]

describe('el mesón en el teléfono', () => {
  it('cada creativo con lo que muestra la tarjeta del panel: los atributos sin el estilo ni la pieza', () => {
    const r = mesonParaElTelefono(meson(creativo()), 2, AHORA, 'America/Santiago', 7)
    expect(r.enBorradores).toBe(2)
    expect(r.comandas[0]).toMatchObject({ id: 'c-1', principal: 'El podcast', creadaEn: '2026-11-01T12:00:00.000Z' })
    expect(r.comandas[0]!.piezas[0]!.creativos[0]).toEqual({
      id: 'cr-1',
      tipo: 'video',
      texto: 'El texto',
      tituloYoutube: 'El título',
      estilo: 'golpes',
      duracionS: 42.4,
      portadaUrl: 'https://cdn/p.jpg',
      media: [{ url: 'https://cdn/v.mp4', mediaType: 'video' }],
      atributos: ['fuentes: revista', 'subtitulos: true'],
      seBorra: null,
    })
  })

  it('en su última semana dice cuándo se borra, en la zona de la cuenta; antes, nada', () => {
    const pronto = creativo({ expiraEn: new Date('2026-11-10T02:00:00Z') })
    const [c] = mesonParaElTelefono(meson(pronto), 0, AHORA, 'America/Santiago', 7).comandas
    // En Santiago el 10 a las 02:00 UTC todavía es el 9.
    expect(c!.piezas[0]!.creativos[0]!.seBorra).toBe('Se borra el 09-11-2026 si no lo programas.')
    const lejos = creativo({ expiraEn: new Date('2026-12-01T12:00:00Z') })
    expect(mesonParaElTelefono(meson(lejos), 0, AHORA, 'America/Santiago', 7).comandas[0]!.piezas[0]!.creativos[0]!.seBorra).toBeNull()
  })

  it('los motivos de un descarte viajan con sus nombres, los del panel', () => {
    const r = mesonParaElTelefono([], 0, AHORA, 'America/Santiago', 7)
    expect(r.comandas).toEqual([])
    expect(r.motivos).toEqual(MOTIVOS_DESCARTE.map((valor) => ({ valor, nombre: NOMBRE_MOTIVO[valor] })))
    expect(r.maxNota).toBe(MAX_NOTA_DESCARTE)
  })
})
