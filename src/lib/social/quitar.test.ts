import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'

// `server-only` no está en `node_modules`: mismo doble que `meta-bajas.test.ts`.
vi.mock('server-only', () => ({}))

const { fraseConPendientes, pasosParaQuitar, quitarCuenta, CUENTA_NO_ESTA } = await import('./quitar')

const DUENO = 'owner-1'
const CUENTA = '9692387a-41cc-4a81-9f8f-7b07135d742a'

describe('pasosParaQuitar', () => {
  const dialecto = new PgDialect()
  const pasos = pasosParaQuitar(DUENO, CUENTA).map((p) => dialecto.sqlToQuery(p))

  it('borra lo que cuelga de la cuenta antes que la cuenta, en el orden del borrado de Meta', () => {
    const tablas = pasos.map((p) => /delete from\s+"?([a-z_]+)"?/i.exec(p.sql)?.[1])
    expect(tablas).toEqual([
      'post_metrics',
      'post_comments',
      'social_posts',
      'account_metrics',
      'scheduled_post_targets',
      'social_accounts',
    ])
  })

  it('cada paso lleva la cuenta como parámetro, nunca en el texto', () => {
    for (const p of pasos) {
      expect(p.params).toContain(CUENTA)
      expect(p.sql).not.toContain(CUENTA)
    }
  })

  it('el último, el que borra la cuenta, también exige al dueño', () => {
    const ultimo = pasos.at(-1)!
    expect(ultimo.sql).toMatch(/owner_id = \$\d/)
    expect(ultimo.params).toContain(DUENO)
  })
})

describe('fraseConPendientes', () => {
  it('dice cuántas y qué hacer', () => {
    expect(fraseConPendientes(1)).toBe(
      'Tiene una publicación programada hacia esta cuenta: bórrala en La Parrilla, o espera a que salga, antes de quitarla.',
    )
    expect(fraseConPendientes(3)).toBe(
      'Tiene 3 publicaciones programadas hacia esta cuenta: bórralas en La Parrilla, o espera a que salgan, antes de quitarla.',
    )
  })
})

describe('quitarCuenta', () => {
  it('un id sin forma de id no llega a la base', async () => {
    expect(await quitarCuenta(DUENO, 'nada')).toEqual({ error: CUENTA_NO_ESTA })
  })
})
