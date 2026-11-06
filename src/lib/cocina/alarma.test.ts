import { describe, expect, it } from 'vitest'
import { correoDeAlarma, motivoDeAlarma, tiempoEnPalabras, type ComandaEnAlarma, type ParaLaAlarma } from './alarma'

const AHORA = new Date('2026-11-06T15:00:00Z')
const hace = (minutos: number) => new Date(AHORA.getTime() - minutos * 60_000)
const base: ParaLaAlarma = { estado: 'recibida', creadaEn: hace(10), eta: null, alarmaRecibidaEn: null, alarmaEta: null }

describe('cuándo suena la alarma de la cocina', () => {
  it('sin tomar: a los treinta minutos en «Comanda colgada», una vez', () => {
    expect(motivoDeAlarma({ ...base, creadaEn: hace(30) }, AHORA)).toBeNull()
    expect(motivoDeAlarma({ ...base, creadaEn: hace(31) }, AHORA)).toBe('sin-tomar')
    // La de Daniel Máximo, cuatro días después: si ya sonó, no vuelve a sonar.
    expect(motivoDeAlarma({ ...base, creadaEn: hace(4 * 24 * 60), alarmaRecibidaEn: hace(4 * 24 * 60 - 31) }, AHORA)).toBeNull()
  })

  it('atrasada: una hora después de su hora estimada, mientras la tiene el chef', () => {
    for (const estado of ['revisando', 'en_preparacion', 'en_el_horno', 'sirviendo'] as const) {
      expect(motivoDeAlarma({ ...base, estado, eta: hace(61) }, AHORA), estado).toBe('atrasada')
      expect(motivoDeAlarma({ ...base, estado, eta: hace(59) }, AHORA), estado).toBeNull()
    }
  })

  it('una vez por hora estimada: si el chef da otra y también pasa, vuelve a sonar', () => {
    const eta = hace(90)
    expect(motivoDeAlarma({ ...base, estado: 'en_el_horno', eta, alarmaEta: new Date(eta) }, AHORA)).toBeNull()
    expect(motivoDeAlarma({ ...base, estado: 'en_el_horno', eta, alarmaEta: hace(300) }, AHORA)).toBe('atrasada')
  })

  it('no suena lo que espera al dueño, lo terminado ni lo que no tiene hora estimada', () => {
    for (const estado of ['pregunta', 'probando', 'lista', 'servida', 'rechazada', 'cancelada', 'fallida'] as const) {
      expect(motivoDeAlarma({ ...base, estado, creadaEn: hace(600), eta: hace(600) }, AHORA), estado).toBeNull()
    }
    expect(motivoDeAlarma({ ...base, estado: 'revisando', creadaEn: hace(600) }, AHORA)).toBeNull()
  })
})

describe('el correo de la alarma', () => {
  it('cuánto lleva, de un vistazo', () => {
    expect(tiempoEnPalabras(45 * 60_000)).toBe('45 min')
    expect(tiempoEnPalabras(80 * 60_000)).toBe('1 h 20 min')
    expect(tiempoEnPalabras(120 * 60_000)).toBe('2 h')
    expect(tiempoEnPalabras(4 * 24 * 3_600_000)).toBe('4 días')
  })

  const sinTomar: ComandaEnAlarma = {
    id: '0590096c-0000-4000-8000-000000000000',
    motivo: 'sin-tomar',
    estado: 'recibida',
    cliente: { nombre: 'Daniel Máximo', correo: 'daniel@ejemplo.cl' },
    creadaEn: hace(45),
    eta: null,
    principal: 'video23s.mp4',
    instruccion: 'Borrar los subtítulos.',
  }
  const atrasada: ComandaEnAlarma = {
    ...sinTomar,
    id: 'c0ffee00-0000-4000-8000-000000000000',
    motivo: 'atrasada',
    estado: 'en_el_horno',
    cliente: { nombre: null, correo: null },
    creadaEn: hace(600),
    eta: hace(80),
    principal: null,
    instruccion: null,
  }

  it('el cliente, la comanda, lo que pidió y cuánto lleva, con dónde mirar', () => {
    const { subject, text } = correoDeAlarma([sinTomar, atrasada], AHORA, 'https://tu-parrilla.cl')
    expect(subject).toBe('La Cocina: una comanda sin tomar y una comanda atrasada')
    expect(text).toContain('- Sin tomar hace 45 min: Daniel Máximo (daniel@ejemplo.cl), comanda 0590096c («video23s.mp4»).')
    expect(text).toContain('  Pidió: «Borrar los subtítulos.».')
    expect(text).toContain('  Id: 0590096c-0000-4000-8000-000000000000')
    expect(text).toContain('- Pasó su hora estimada hace 1 h 20 min, en «Al fuego»: Sin nombre, comanda c0ffee00.')
    expect(text).toContain('  Pidió: sin instrucción al chef.')
    expect(text).toContain('https://tu-parrilla.cl/admin/usuarios')
    expect(text).toContain('Llega una vez por comanda y por motivo')
  })

  it('el asunto cuenta cuántas de cada una', () => {
    expect(correoDeAlarma([sinTomar, { ...sinTomar, id: 'x' }], AHORA, '').subject).toBe('La Cocina: 2 comandas sin tomar')
    expect(correoDeAlarma([atrasada], AHORA, '').subject).toBe('La Cocina: una comanda atrasada')
  })
})
