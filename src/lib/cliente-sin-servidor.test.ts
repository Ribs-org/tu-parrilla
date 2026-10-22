import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Lo que corre en el navegador no puede alcanzar código de servidor. No es solo peso: el ORM o
// un reemplazo de `node:crypto` en el paquete del navegador son cientos de KB en cada página,
// y un `server-only` alcanzado rompe el build. Pasó tres veces sin que nada avisara: Los
// Fierros mandaban `drizzle-orm` al navegador por una lista de redes, el calendario también, y
// la página de entrada llevaba `crypto-browserify` por una frase.
//
// Esto recorre, desde cada archivo `'use client'`, sus importaciones de valor dentro de `src/`
// —las de solo tipos se borran al compilar y no cuentan— y falla si alguna llega a lo de abajo.
// Se detiene en los módulos `'use server'`: el navegador recibe una referencia a sus acciones,
// no su código.

const PROHIBIDOS = [/^drizzle-orm(\/|$)/, /^postgres$/, /^server-only$/, /^next\/headers$/, /^node:/, /^@\/db(\/|$)/]

const SRC = resolve('src')

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name)
    if (entrada.isDirectory()) return archivos(ruta)
    return /\.tsx?$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name) ? [ruta] : []
  })
}

const directiva = (codigo: string, cual: 'use client' | 'use server') =>
  new RegExp(`^(?:\\s*//[^\\n]*\\n|\\s*/\\*[\\s\\S]*?\\*/)*\\s*['"]${cual}['"]`).test(codigo)

/** Las importaciones de valor de un archivo, con lo que nombran. */
function importaciones(codigo: string): string[] {
  const salida: string[] = []
  for (const m of codigo.matchAll(/^(?:import|export)\s+(type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]/gm)) {
    if (m[1]) continue
    const nombres = m[2]!.trim()
    // `import { type A, type B } from …`: todo tipos, también se borra.
    const llaves = nombres.match(/^\{([\s\S]*)\}$/)
    if (llaves) {
      const partes = llaves[1]!.split(',').map((p) => p.trim()).filter(Boolean)
      if (partes.length > 0 && partes.every((p) => p.startsWith('type '))) continue
    }
    salida.push(m[3]!)
  }
  for (const m of codigo.matchAll(/^import\s+['"]([^'"]+)['"]/gm)) salida.push(m[1]!)
  for (const m of codigo.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) salida.push(m[1]!)
  return salida
}

function resolver(desde: string, especificador: string): string | null {
  const base = especificador.startsWith('@/')
    ? join(SRC, especificador.slice(2))
    : especificador.startsWith('.')
      ? resolve(dirname(desde), especificador)
      : null
  if (!base) return null
  for (const extension of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const ruta = base + extension
    if (existsSync(ruta) && statSync(ruta).isFile()) return ruta
  }
  return null
}

/** Desde un archivo del navegador, cada importación prohibida que alcanza y el camino hasta ella. */
function alcanzados(inicio: string): string[] {
  const vistos = new Set<string>([inicio])
  const cola: Array<{ ruta: string; camino: string[] }> = [{ ruta: inicio, camino: [relative(SRC, inicio)] }]
  const problemas: string[] = []
  while (cola.length > 0) {
    const { ruta, camino } = cola.shift()!
    const codigo = readFileSync(ruta, 'utf8')
    for (const especificador of importaciones(codigo)) {
      if (PROHIBIDOS.some((p) => p.test(especificador))) {
        problemas.push(`${camino.join(' → ')} → ${especificador}`)
        continue
      }
      const siguiente = resolver(ruta, especificador)
      if (!siguiente || vistos.has(siguiente)) continue
      vistos.add(siguiente)
      if (directiva(readFileSync(siguiente, 'utf8'), 'use server')) continue
      cola.push({ ruta: siguiente, camino: [...camino, relative(SRC, siguiente)] })
    }
  }
  return problemas
}

describe('lo del navegador no alcanza código de servidor', () => {
  const delNavegador = archivos(SRC).filter((ruta) => directiva(readFileSync(ruta, 'utf8'), 'use client'))

  it('encontró archivos del navegador para revisar', () => {
    // Sin esto, una regex rota daría «cero problemas» sin haber mirado nada.
    expect(delNavegador.length).toBeGreaterThan(20)
  })

  // Recorre cada archivo del sitio, así que tarda lo que crece el repositorio: bajo la carga de la
  // suite entera pasaba los 5 segundos de siempre (`docs/deuda-tecnica.md`, la suite que falla).
  it('ninguno alcanza el ORM, la base, node:, server-only, postgres ni next/headers', () => {
    expect(delNavegador.flatMap(alcanzados)).toEqual([])
  }, 20_000)
})
