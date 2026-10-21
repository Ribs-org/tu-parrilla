import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SIN_MIGRACIONES, decidirMigracion, filaBaseline } from './migraciones'

describe('decidirMigracion', () => {
  it('sin DATABASE_URL se salta: es el build del CI', () => {
    expect(decidirMigracion({})).toEqual({ accion: 'saltar', motivo: 'sin DATABASE_URL: build sin base, como el CI' })
  })

  it('sin DATABASE_URL en producción es una base mal configurada: falla en vez de saltarse', () => {
    expect(() => decidirMigracion({ vercelEnv: 'production' })).toThrow('build de producción sin DATABASE_URL')
    expect(() => decidirMigracion({ databaseUrl: '', vercelEnv: 'production' })).toThrow('build de producción sin DATABASE_URL')
  })

  it('un preview solo migra con la bandera encendida', () => {
    expect(decidirMigracion({ databaseUrl: 'postgres://x', vercelEnv: 'preview' })).toEqual({
      accion: 'saltar',
      motivo: 'preview sin base propia (MIGRAR_PREVIEWS no es 1)',
    })
    expect(decidirMigracion({ databaseUrl: 'postgres://x', vercelEnv: 'preview', migrarPreviews: '1' })).toEqual({ accion: 'migrar' })
  })

  it('producción, development y local migran', () => {
    expect(decidirMigracion({ databaseUrl: 'postgres://x', vercelEnv: 'production' })).toEqual({ accion: 'migrar' })
    expect(decidirMigracion({ databaseUrl: 'postgres://x', vercelEnv: 'development' })).toEqual({ accion: 'migrar' })
    expect(decidirMigracion({ databaseUrl: 'postgres://x' })).toEqual({ accion: 'migrar' })
  })
})

describe('filaBaseline', () => {
  it('es la primera migración por marca de tiempo', () => {
    expect(
      filaBaseline([
        { hash: 'b', folderMillis: 200 },
        { hash: 'a', folderMillis: 100 },
      ]),
    ).toEqual({ hash: 'a', folderMillis: 100 })
  })

  it('sin migraciones lanza con la frase', () => {
    expect(() => filaBaseline([])).toThrow(SIN_MIGRACIONES)
  })
})

/*
 * El migrador de Drizzle no mira los nombres: aplica una migración solo si su `when` del journal
 * es mayor que el de la última aplicada (`pg-core/dialect.js`, `migrate`). Una migración con un
 * `when` más viejo que la anterior —dos ramas que generaron a la vez, y la segunda se renumeró a
 * mano sin regenerar— no se aplica nunca, y nada avisa: el build pasa y el esquema queda corto.
 */
describe('el journal de drizzle/', () => {
  const carpeta = join(process.cwd(), 'drizzle')
  const { entries } = JSON.parse(readFileSync(join(carpeta, 'meta', '_journal.json'), 'utf8')) as {
    entries: Array<{ idx: number; when: number; tag: string }>
  }

  it('numera las migraciones de corrido, desde cero', () => {
    expect(entries.map((e) => e.idx)).toEqual(entries.map((_, i) => i))
  })

  it('cada una es más nueva que la anterior: si no, el migrador la salta en silencio', () => {
    for (const [i, entrada] of entries.entries()) {
      if (i === 0) continue
      expect(entrada.when, `${entrada.tag} tiene que ser posterior a ${entries[i - 1]!.tag}`).toBeGreaterThan(entries[i - 1]!.when)
    }
  })

  it('cada entrada tiene su archivo, y cada archivo su entrada', () => {
    for (const { tag } of entries) expect(existsSync(join(carpeta, `${tag}.sql`)), `${tag}.sql`).toBe(true)
    const archivos = readdirSync(carpeta).filter((nombre) => nombre.endsWith('.sql')).map((nombre) => nombre.slice(0, -4))
    expect(archivos.sort()).toEqual(entries.map((e) => e.tag).sort())
  })

  it('el número del archivo es el de su lugar en el journal', () => {
    for (const { idx, tag } of entries) expect(tag.slice(0, 4), tag).toBe(String(idx).padStart(4, '0'))
  })
})

/*
 * La base es Supabase, que publica una API de datos con una llave pública por diseño. La app no
 * la usa: `0005_rls.sql` les quitó los permisos a sus roles y encendió RLS, sin políticas, en
 * cada tabla, y las que vinieron después lo encienden en su propia migración. Una tabla nueva que
 * lo olvide queda cuidada solo por los permisos, y el asesor de seguridad de Supabase la marca.
 */
describe('RLS en cada tabla', () => {
  const carpeta = join(process.cwd(), 'drizzle')
  const sql = readdirSync(carpeta)
    .filter((nombre) => nombre.endsWith('.sql'))
    .sort()
    .map((nombre) => readFileSync(join(carpeta, nombre), 'utf8'))
    .join('\n')
  const borradas = new Set([...sql.matchAll(/DROP TABLE (?:IF EXISTS )?"([a-z_]+)"/g)].map((m) => m[1]))
  const creadas = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"([a-z_]+)"/g)].map((m) => m[1]!).filter((t) => !borradas.has(t))
  const conRls = new Set([...sql.matchAll(/ALTER TABLE "([a-z_]+)" ENABLE ROW LEVEL SECURITY/g)].map((m) => m[1]))

  it('las migraciones crean tablas: la búsqueda encontró algo', () => {
    expect(creadas.length).toBeGreaterThan(15)
  })

  it('cada tabla que crean las migraciones tiene RLS encendido', () => {
    expect(creadas.filter((tabla) => !conRls.has(tabla))).toEqual([])
  })

  it('y ninguna migración lo apaga', () => {
    expect(sql).not.toMatch(/DISABLE ROW LEVEL SECURITY/)
  })
})
