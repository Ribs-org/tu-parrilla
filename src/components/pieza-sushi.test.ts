import { describe, expect, it } from 'vitest'
import { MAX_HUESOS, ORDEN_CARNE } from '@/lib/parrilla'
import { contraste, simular } from './charts/color'
import { PESCADO, posicionesMaki, rodajas, siluetaDe } from './pieza-sushi'

/*
 * La pieza de sushi dice la cocción como la dice la carne del corte: por luminosidad, de clara a
 * oscura. Es lo que la deja leer con daltonismo, donde el salmón y el aburi se vuelven pardos
 * pero siguen ordenados. Los mismos pisos que `parrilla.test.ts` le pide a `CARNE`.
 */
describe('el pescado de la pieza', () => {
  const medio = (carne: (typeof ORDEN_CARNE)[number]) => PESCADO[carne].medio
  // `contraste` contra negro es una lectura directa de la luminosidad relativa.
  const luz = (color: string) => contraste(color, '#000000')

  it('va de claro a oscuro en el orden de la cocción', () => {
    const luces = ORDEN_CARNE.map((c) => luz(medio(c)))
    for (let i = 1; i < luces.length; i++) {
      expect(luces[i], `${ORDEN_CARNE[i]} no es más oscuro que el anterior`).toBeLessThan(luces[i - 1]!)
    }
  })

  it('cada degradado va de su claro a su hondo', () => {
    for (const carne of ORDEN_CARNE) {
      const { claro, medio: m, hondo } = PESCADO[carne]
      expect(luz(claro), carne).toBeGreaterThan(luz(m))
      expect(luz(m), carne).toBeGreaterThan(luz(hondo))
    }
  })

  it('entre vecinas, al menos 1,5:1; entre los extremos, 8:1', () => {
    for (let i = 1; i < ORDEN_CARNE.length; i++) {
      const ratio = contraste(medio(ORDEN_CARNE[i - 1]!), medio(ORDEN_CARNE[i]!))
      expect(ratio, `${ORDEN_CARNE[i - 1]} vs ${ORDEN_CARNE[i]}`).toBeGreaterThanOrEqual(1.5)
    }
    expect(contraste(PESCADO.cruda.medio, PESCADO.quemada.medio)).toBeGreaterThanOrEqual(8)
  })

  it.each(['protan', 'deutan', 'tritan'] as const)('el orden sobrevive a %s', (tipo) => {
    const luces = ORDEN_CARNE.map((c) => luz(simular(medio(c), tipo)))
    for (let i = 1; i < luces.length; i++) {
      expect(luces[i], `${ORDEN_CARNE[i]} bajo ${tipo}`).toBeLessThan(luces[i - 1]!)
    }
    expect(contraste(simular(PESCADO.cruda.medio, tipo), simular(PESCADO.quemada.medio, tipo))).toBeGreaterThanOrEqual(5)
  })
})

describe('las siluetas', () => {
  it('cada formato tiene la suya, y el maki una por cantidad de rodajas', () => {
    for (const formato of ['entrana', 'bife', 'chori'] as const) expect(siluetaDe(formato, 0)).toMatch(/^M/)
    const largos = new Set(Array.from({ length: MAX_HUESOS - 1 }, (_, i) => siluetaDe('tira', i + 2)))
    expect(largos.size).toBe(MAX_HUESOS - 1)
  })
})

describe('las bandas del maki', () => {
  it('cada una cruza una rodaja cerca de su centro, nunca la juntura de dos', () => {
    for (let huesos = 2; huesos <= MAX_HUESOS; huesos++) {
      const discos = rodajas(huesos)
      for (let bandas = 1; bandas <= 6; bandas++) {
        for (const x of posicionesMaki(bandas, huesos)) {
          const adentro = discos.some((d) => Math.abs(x - d.cx) <= d.r * 0.5)
          expect(adentro, `${bandas} bandas en ${huesos} rodajas: una cae en ${x.toFixed(1)}`).toBe(true)
        }
      }
    }
  })

  it('con tantas bandas como rodajas o menos, una por rodaja', () => {
    const xs = posicionesMaki(3, 4)
    expect(new Set(xs).size).toBe(3)
  })
})
