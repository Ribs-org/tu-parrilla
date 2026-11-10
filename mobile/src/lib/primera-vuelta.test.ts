import { describe, expect, it } from 'vitest'
import {
  APERTURA_DEL_CHEF,
  AUSENCIA_QUE_CUENTA_MS,
  VUELTA_NUEVA,
  alArrancar,
  alEntrar,
  alSalir,
  alVolver,
  bienvenidaVista,
  chefPresentado,
  cocinaConocida,
  leerVuelta,
  puedePresentarAlChef,
  tocaElChef,
} from './primera-vuelta'

describe('la bienvenida', () => {
  it('sale al entrar sin redes, y no con redes', () => {
    expect(alEntrar(true)).toEqual({ ...VUELTA_NUEVA, aperturas: 1, bienvenida: 'abierta' })
    expect(alEntrar(false).bienvenida).toBeNull()
  })

  it('a medias sigue abierta al arrancar de nuevo, y vista no vuelve', () => {
    expect(alArrancar(alEntrar(true)).bienvenida).toBe('abierta')
    expect(alArrancar(bienvenidaVista(alEntrar(true))).bienvenida).toBe('vista')
  })
})

describe('las aperturas', () => {
  it('arrancar cuenta una', () => {
    expect(alArrancar(alEntrar(false)).aperturas).toBe(2)
  })

  it('volver cuenta solo después de media hora fuera', () => {
    const fuera = alSalir(alEntrar(false), 1_000)
    expect(alVolver(fuera, 1_000 + AUSENCIA_QUE_CUENTA_MS - 1).aperturas).toBe(1)
    expect(alVolver(fuera, 1_000 + AUSENCIA_QUE_CUENTA_MS).aperturas).toBe(2)
    expect(alVolver(fuera, 1_000 + AUSENCIA_QUE_CUENTA_MS).salioEn).toBeNull()
  })

  it('volver sin haber salido no cuenta', () => {
    expect(alVolver(alEntrar(false), 10 * AUSENCIA_QUE_CUENTA_MS).aperturas).toBe(1)
  })
})

describe('el chef', () => {
  const quinta = { ...alEntrar(false), aperturas: APERTURA_DEL_CHEF }

  it('se presenta a la quinta, con La Cocina encendida y sin comandas', () => {
    expect(APERTURA_DEL_CHEF).toBe(5)
    expect(tocaElChef({ ...quinta, aperturas: 4 }, { encendida: true, comandas: 0 })).toBe(false)
    expect(tocaElChef(quinta, { encendida: true, comandas: 0 })).toBe(true)
  })

  it('no con La Cocina apagada, con comandas o sin saber de ella', () => {
    expect(tocaElChef(quinta, { encendida: false, comandas: 0 })).toBe(false)
    expect(tocaElChef(quinta, { encendida: true, comandas: 2 })).toBe(false)
    expect(tocaElChef(quinta, null)).toBe(false)
  })

  it('una vez: ni después de presentarlo ni si ya abrió La Cocina', () => {
    expect(puedePresentarAlChef(chefPresentado(quinta))).toBe(false)
    expect(puedePresentarAlChef(cocinaConocida(quinta))).toBe(false)
    // Conocer La Cocina después de presentado no cambia nada.
    expect(cocinaConocida(chefPresentado(quinta)).chef).toBe('presentado')
  })
})

describe('leerVuelta', () => {
  it('nada o algo que no se entiende es una vuelta nueva', () => {
    expect(leerVuelta(null)).toEqual(VUELTA_NUEVA)
    expect(leerVuelta('no es json')).toEqual(VUELTA_NUEVA)
  })

  it('lo que no calza se descarta campo por campo', () => {
    expect(leerVuelta(JSON.stringify({ bienvenida: 'otra', aperturas: -3, salioEn: 'ayer', chef: 'x' }))).toEqual(VUELTA_NUEVA)
    const guardada = { bienvenida: 'abierta', aperturas: 3, salioEn: 5, chef: 'conocido' }
    expect(leerVuelta(JSON.stringify(guardada))).toEqual(guardada)
  })
})
