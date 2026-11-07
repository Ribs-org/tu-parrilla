import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'

// `server-only` no está en `node_modules`: mismo doble que `quitar.test.ts`.
vi.mock('server-only', () => ({}))

const { pasosDeTraspaso, traspasarCuenta, DESTINO_NO_ESTA } = await import('./traspasar')
const { CUENTA_NO_ESTA } = await import('./quitar')

const CUENTA = '9692387a-41cc-4a81-9f8f-7b07135d742a'
const DESTINO = '1f0c2a4e-5b6d-4c3e-9a8b-7d6e5f4a3b2c'

describe('pasosDeTraspaso', () => {
  const dialecto = new PgDialect()
  const pasos = pasosDeTraspaso(CUENTA, DESTINO).map((p) => dialecto.sqlToQuery(p))

  it('solo actualiza: un traspaso no borra nada', () => {
    const tablas = pasos.map((p) => /update\s+"?([a-z_]+)"?/i.exec(p.sql)?.[1])
    expect(tablas).toEqual(['social_posts', 'scheduled_posts', 'social_accounts', 'ajustes'])
    expect(pasos.some((p) => /\bdelete\b/i.test(p.sql))).toBe(false)
  })

  it('la cuenta y el destino van como parámetros, nunca en el texto', () => {
    for (const p of pasos) {
      expect(p.params).toEqual(expect.arrayContaining([CUENTA, DESTINO]))
      expect(p.sql).not.toContain(CUENTA)
      expect(p.sql).not.toContain(DESTINO)
    }
  })
})

describe('traspasarCuenta', () => {
  it('rechaza un id de cuenta o de persona mal formado antes de tocar la base', async () => {
    expect(await traspasarCuenta('no-es-un-id', DESTINO)).toEqual({ error: CUENTA_NO_ESTA })
    expect(await traspasarCuenta(CUENTA, 'no-es-un-id')).toEqual({ error: DESTINO_NO_ESTA })
  })
})
