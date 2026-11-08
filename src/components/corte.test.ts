import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { MAX_HUESOS, type Formato } from '@/lib/parrilla'
import { MOTAS, SILUETA, posiciones } from './corte'

/**
 * La copia de la app (`mobile/src/lib/corte.ts`), compilada acá y corrida aparte, como la de la
 * pieza de sushi: `mobile/` tiene su propio tsconfig y en el CI del sitio la app no está instalada.
 * La copia no importa nada más que tipos, así que se corre sola.
 */
const movil = (() => {
  const fuente = readFileSync(new URL('../../mobile/src/lib/corte.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(fuente, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const exports: Record<string, unknown> = {}
  runInNewContext(outputText, { exports })
  return exports as { SILUETA: typeof SILUETA; MOTAS: typeof MOTAS; posiciones: typeof posiciones }
})()

// Por JSON: lo que corre en otro contexto trae sus propios `Array` y `Object`.
const igual = (a: unknown, b: unknown) => expect(JSON.parse(JSON.stringify(a))).toEqual(b)

/*
 * Desde la 1.2.0 la app dibuja el corte con `react-native-svg` y las curvas del panel. Antes lo
 * armaba con vistas de bordes redondeados y la entraña de un video salía con la forma del chori. Una
 * copia sin guardia se separa sola: este test es lo que evita que vuelva a pasar.
 */
describe('el corte del teléfono tiene las curvas del panel', () => {
  it('las mismas siluetas, formato por formato', () => {
    igual(movil.SILUETA, SILUETA)
  })

  it('las mismas motas del chori', () => {
    igual(movil.MOTAS, MOTAS)
  })

  it('las marcas de cada destino caen en el mismo lugar', () => {
    for (const formato of Object.keys(SILUETA) as Formato[]) {
      for (let n = 0; n <= MAX_HUESOS; n++) igual(movil.posiciones(n, formato), posiciones(n, formato))
    }
  })
})
