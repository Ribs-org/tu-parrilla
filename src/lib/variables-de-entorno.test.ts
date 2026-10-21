import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Una variable de entorno vive en tres lugares: el código que la lee, `.env.example` y la tabla
 * de «Variables de entorno» del README. Separarlos es fácil —se agrega una al código y nadie la
 * anota— y sale caro: quien despliega su copia no sabe que existe, o la busca con un nombre que
 * ya no se lee. AGENTS.md pide tocar los tres juntos; esto lo comprueba.
 */

const RAIZ = process.cwd()

/** Las que pone la plataforma —Node, Vercel—: nadie las configura, así que no van en la plantilla. */
const DE_LA_PLATAFORMA = new Set(['NODE_ENV', 'VERCEL_ENV', 'VERCEL_OIDC_TOKEN', 'VERCEL_PROJECT_PRODUCTION_URL'])

function archivosDeCodigo(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre)
    if (statSync(ruta).isDirectory()) return archivosDeCodigo(ruta)
    return /\.(ts|tsx|mjs)$/.test(nombre) && !/\.test\.tsx?$/.test(nombre) ? [ruta] : []
  })
}

/** Lo que lee el código del sitio: `env('X')` (`src/lib/env.ts`), `process.env.X` y `process.env['X']`. */
const enElCodigo = (() => {
  const archivos = [
    ...archivosDeCodigo(join(RAIZ, 'src')),
    ...archivosDeCodigo(join(RAIZ, 'scripts')),
    join(RAIZ, 'next.config.ts'),
    join(RAIZ, 'drizzle.config.ts'),
  ]
  const nombres = new Set<string>()
  for (const archivo of archivos) {
    const texto = readFileSync(archivo, 'utf8')
    for (const m of texto.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)|process\.env\[['"]([A-Z][A-Z0-9_]+)['"]\]|\benv\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g)) {
      nombres.add((m[1] ?? m[2] ?? m[3])!)
    }
  }
  return new Set([...nombres].filter((n) => !DE_LA_PLATAFORMA.has(n)))
})()

/** Las de la plantilla: cada `NOMBRE=`, comentada o no. */
const enLaPlantilla = new Set(
  [...readFileSync(join(RAIZ, '.env.example'), 'utf8').matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]!),
)

/** Las filas de la tabla, en la sección «Variables de entorno» del README. */
const enElReadme = (() => {
  const readme = readFileSync(join(RAIZ, 'README.md'), 'utf8')
  const desde = readme.indexOf('## Variables de entorno')
  const hasta = readme.indexOf('\n## ', desde + 1)
  return new Set([...readme.slice(desde, hasta).matchAll(/^\| `([A-Z][A-Z0-9_]+)`/gm)].map((m) => m[1]!))
})()

const faltan = (de: Set<string>, en: Set<string>) => [...de].filter((n) => !en.has(n)).sort()

describe('las variables de entorno', () => {
  it('el código lee unas cuantas: la búsqueda encontró algo', () => {
    expect(enElCodigo.size).toBeGreaterThan(30)
    expect(enElCodigo.has('DATABASE_URL')).toBe(true)
  })

  it('cada una que lee el código está en .env.example', () => {
    expect(faltan(enElCodigo, enLaPlantilla)).toEqual([])
  })

  it('cada una que lee el código tiene su fila en la tabla del README', () => {
    expect(faltan(enElCodigo, enElReadme)).toEqual([])
  })

  it('.env.example y el README no nombran ninguna que el código ya no lea', () => {
    expect(faltan(enLaPlantilla, enElCodigo)).toEqual([])
    expect(faltan(enElReadme, enElCodigo)).toEqual([])
  })
})
