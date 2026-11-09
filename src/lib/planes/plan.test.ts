import { describe, expect, it } from 'vitest'
import {
  PLAN_ILEGIBLE,
  SIN_TOKENS,
  cabe,
  claveQueRige,
  cuotaDeLaCamara,
  enPesos,
  leerPlan,
  mesDelDueno,
  planEnPalabras,
  topeDeCuentas,
  topeEnLaParrilla,
} from './plan'

const ahora = new Date('2026-11-08T12:00:00Z')
const ayer = new Date('2026-11-07T12:00:00Z')
const manana = new Date('2026-11-09T12:00:00Z')

describe('claveQueRige', () => {
  it('el gratis es el gratis', () => {
    expect(claveQueRige({ plan: 'gratis', planHasta: null, planOrigen: null }, ahora)).toBe('gratis')
  })

  it('el pagado rige sin fecha o mientras su fecha no pase', () => {
    expect(claveQueRige({ plan: 'pagado', planHasta: null, planOrigen: 'cortesia' }, ahora)).toBe('pagado')
    expect(claveQueRige({ plan: 'pagado', planHasta: manana, planOrigen: 'suscripcion' }, ahora)).toBe('pagado')
  })

  it('pasada la fecha vuelve solo al gratis, sin que nadie lo escriba', () => {
    expect(claveQueRige({ plan: 'pagado', planHasta: ayer, planOrigen: 'suscripcion' }, ahora)).toBe('gratis')
    // Justo en el instante en que vence, ya no rige.
    expect(claveQueRige({ plan: 'pagado', planHasta: ahora, planOrigen: 'cortesia' }, ahora)).toBe('gratis')
  })
})

describe('cuotaDeLaCamara', () => {
  it('la que el admin puso a mano gana sobre la del plan', () => {
    expect(cuotaDeLaCamara({ bodegaBytes: 5 }, { bodegaBytes: 100 })).toBe(5)
    expect(cuotaDeLaCamara({ bodegaBytes: null }, { bodegaBytes: 100 })).toBe(100)
  })
})

describe('mesDelDueno', () => {
  it('el mes es el de la zona del dueño, no el del servidor', () => {
    // 1 de diciembre a las 01:00 UTC es todavía 30 de noviembre en Santiago.
    expect(mesDelDueno(new Date('2026-12-01T01:00:00Z'), 'America/Santiago')).toBe('2026-11')
    expect(mesDelDueno(new Date('2026-12-01T01:00:00Z'), 'Europe/Madrid')).toBe('2026-12')
  })
})

describe('cabe', () => {
  it('sin tope siempre cabe; con tope, lo usado más lo nuevo no lo pasa', () => {
    expect(cabe(1000, 1, null)).toBe(true)
    expect(cabe(9, 1, 10)).toBe(true)
    expect(cabe(10, 1, 10)).toBe(false)
    expect(cabe(8, 3, 10)).toBe(false)
  })
})

describe('las frases de los topes', () => {
  it('nombran el plan y el tope, en singular o plural', () => {
    expect(topeDeCuentas({ nombre: 'Gratis', cuentasMax: 7 })).toBe(
      'Tu plan Gratis conecta hasta 7 cuentas: desconecta una en Los Fierros para conectar esta.',
    )
    expect(topeDeCuentas({ nombre: 'Gratis', cuentasMax: 1 })).toBe(
      'Tu plan Gratis conecta hasta 1 cuenta: desconecta una en Los Fierros para conectar esta.',
    )
    expect(topeEnLaParrilla({ nombre: 'Gratis', enLaParrillaMax: 50 })).toBe(
      'Tu plan Gratis deja hasta 50 publicaciones esperando a la vez: espera a que salga alguna o borra una.',
    )
    expect(SIN_TOKENS).toBe('Se acabaron los tokens de IA de tu plan este mes.')
    expect(enPesos(34990)).toBe('$34.990')
  })
})

describe('leerPlan', () => {
  const campos = {
    nombre: ' Maestro Parrillero ',
    precioClp: '34.990',
    diasDePrueba: '7',
    cuentasMax: '15',
    enLaParrillaMax: '',
    tokensMes: '2.000.000',
    bodegaGb: '200',
    prioridad: '1',
  }

  it('lee los números con o sin puntos de miles, y un tope vacío es sin tope', () => {
    expect(leerPlan('pagado', campos)).toEqual({
      nombre: 'Maestro Parrillero',
      precioClp: 34990,
      diasDePrueba: 7,
      cuentasMax: 15,
      enLaParrillaMax: null,
      tokensMes: 2_000_000,
      bodegaBytes: 200 * 1024 ** 3,
      prioridad: 1,
    })
  })

  it('en el gratis el precio y la prueba son cero, escriba lo que escriba', () => {
    const gratis = leerPlan('gratis', { ...campos, precioClp: '5000', diasDePrueba: '30' })
    expect(gratis).toMatchObject({ precioClp: 0, diasDePrueba: 0 })
  })

  it('rechaza lo que no es razonable, con la frase de por qué', () => {
    expect(leerPlan('pagado', { ...campos, nombre: '' })).toEqual({ error: PLAN_ILEGIBLE.nombre })
    expect(leerPlan('pagado', { ...campos, precioClp: '34990,5' })).toEqual({ error: PLAN_ILEGIBLE.precio })
    expect(leerPlan('pagado', { ...campos, diasDePrueba: '90' })).toEqual({ error: PLAN_ILEGIBLE.prueba })
    expect(leerPlan('pagado', { ...campos, cuentasMax: '0' })).toEqual({ error: PLAN_ILEGIBLE.tope })
    expect(leerPlan('pagado', { ...campos, cuentasMax: '-3' })).toEqual({ error: PLAN_ILEGIBLE.tope })
    expect(leerPlan('pagado', { ...campos, bodegaGb: '' })).toEqual({ error: PLAN_ILEGIBLE.bodega })
    expect(leerPlan('pagado', { ...campos, prioridad: '12' })).toEqual({ error: PLAN_ILEGIBLE.prioridad })
  })
})

describe('planEnPalabras', () => {
  const planes = { gratis: { nombre: 'Gratis' }, pagado: { nombre: 'Maestro Parrillero' } }
  const fecha = (d: Date) => d.toISOString().slice(0, 10)

  it('dice el plan, de dónde sale y hasta cuándo', () => {
    expect(planEnPalabras({ plan: 'gratis', planHasta: null, planOrigen: null }, planes, ahora, fecha)).toBe('Gratis')
    expect(planEnPalabras({ plan: 'pagado', planHasta: null, planOrigen: 'cortesia' }, planes, ahora, fecha)).toBe(
      'Maestro Parrillero · cortesía',
    )
    expect(planEnPalabras({ plan: 'pagado', planHasta: manana, planOrigen: 'cortesia' }, planes, ahora, fecha)).toBe(
      'Maestro Parrillero · cortesía hasta el 2026-11-09',
    )
    expect(planEnPalabras({ plan: 'pagado', planHasta: manana, planOrigen: 'suscripcion' }, planes, ahora, fecha)).toBe(
      'Maestro Parrillero · lo paga hasta el 2026-11-09',
    )
  })

  it('si venció, dice que rige el gratis y desde cuándo', () => {
    expect(planEnPalabras({ plan: 'pagado', planHasta: ayer, planOrigen: 'cortesia' }, planes, ahora, fecha)).toBe(
      'Gratis · su plan Maestro Parrillero venció el 2026-11-07',
    )
  })
})
