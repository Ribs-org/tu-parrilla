import { describe, expect, it } from 'vitest'
import { MAX_HUESOS, ORDEN_CARNE } from '@/lib/parrilla'
import { contraste, simular } from './charts/color'
import * as movil from '../../mobile/src/lib/pieza-sushi'
import { PESCADO, posicionesMaki, rodajas, rollCortado, rollEntero, siluetaDe } from './pieza-sushi'

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

  // De día lo que falló no se quema, se echa a perder (2026-10-19): el pescado del extremo es
  // verde gris, no carbón. Más verde que rojo en sus tres tonos, que es lo que lo aparta del
  // salmón y del aburi aunque sea igual de oscuro que el carbón.
  it('lo que falló es pescado pasado: verde gris, no carbón', () => {
    const canales = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    for (const tono of Object.values(PESCADO.quemada)) {
      const [r, g] = canales(tono)
      expect(g, tono).toBeGreaterThan(r!)
    }
  })
})

describe('las siluetas', () => {
  it('cada formato tiene la suya, y el roll una por cantidad de rodajas, entero y cortado', () => {
    for (const formato of ['entrana', 'bife', 'chori'] as const) expect(siluetaDe(formato, 0)).toMatch(/^M/)
    const ns = Array.from({ length: MAX_HUESOS - 1 }, (_, i) => i + 2)
    const todas = new Set(ns.flatMap((n) => [siluetaDe('tira', n), siluetaDe('tira', n, false)]))
    expect(todas.size).toBe(2 * ns.length)
  })
})

// El roll va entero mientras no se sirvió y en rodajas cuando salió (lo pidió el dueño el
// 2026-10-19). Entero también cuenta los archivos: una línea de corte menos que rodajas.
describe('el roll, entero o en rodajas', () => {
  it('se corta solo cuando se sirvió: a punto, o a punto en lo que no falló', () => {
    expect(ORDEN_CARNE.filter(rollCortado)).toEqual(['punto'])
  })

  it('entero, ocupa lo mismo que sus rodajas, y lleva una línea de corte entre cada dos', () => {
    for (let n = 2; n <= MAX_HUESOS; n++) {
      const discos = rodajas(n)
      const { x0, x1, cortes } = rollEntero(n)
      expect(x0).toBeCloseTo(discos[0]!.cx - discos[0]!.r)
      expect(x1).toBeCloseTo(discos[n - 1]!.cx + discos[n - 1]!.r)
      expect(cortes).toHaveLength(n - 1)
      cortes.forEach((x, i) => {
        expect(x).toBeGreaterThan(discos[i]!.cx)
        expect(x).toBeLessThan(discos[i + 1]!.cx)
      })
    }
  })

  // La app del teléfono copia estas medidas (`mobile/src/lib/pieza-sushi.ts`): Metro no sale de
  // `mobile/`. Una copia sin guardia se separa sola, y la misma publicación saldría en rodajas
  // en el panel y entera en el teléfono.
  it('la app del teléfono mide el roll igual que el panel', () => {
    for (let n = 2; n <= MAX_HUESOS; n++) {
      expect(movil.rodajas(n)).toEqual(rodajas(n))
      expect(movil.rollEntero(n)).toEqual(rollEntero(n))
      for (let bandas = 1; bandas <= 6; bandas++) expect(movil.posicionesMaki(bandas, n)).toEqual(posicionesMaki(bandas, n))
    }
    for (const carne of ORDEN_CARNE) expect(movil.rollCortado(carne)).toBe(rollCortado(carne))
  })

  it('sus bandas caen sobre el roll entero, donde van a quedar las rodajas', () => {
    for (let n = 2; n <= MAX_HUESOS; n++) {
      const { x0, x1 } = rollEntero(n)
      for (const x of posicionesMaki(3, n)) {
        expect(x).toBeGreaterThan(x0)
        expect(x).toBeLessThan(x1)
      }
    }
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
