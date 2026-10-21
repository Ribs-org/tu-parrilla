import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Doble mínimo de `getDb()`: la transacción corre su callback con un `tx` cuya lectura de
 * destinos (`select().from().where().for()`) entrega las filas que el test puso, y cuyo
 * `delete().where().returning()` anota que corrió y devuelve la fila solo si el post es del
 * dueño. Lo que se prueba es la regla —que un post publicado, o en manos de una corrida, no
 * se borre; que uno ajeno no se borre—, no la consulta: que ate las dos cosas al dueño lo
 * vigila `aislamiento.test.ts`, y que el bloqueo frene a una corrida de verdad,
 * `run.integracion.test.ts`.
 */
const db = vi.hoisted(() => ({
  destinos: [] as unknown[],
  delDueno: true,
  deleteCalls: 0,
  bloqueos: [] as unknown[],
}))

vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  const tx = {
    select: () => ({
      from: () => ({
        where: () => ({
          for: async (modo: unknown) => {
            db.bloqueos.push(modo)
            return db.destinos
          },
        }),
      }),
    }),
    delete: () => ({
      where: () => ({
        returning: async () => {
          db.deleteCalls += 1
          return db.delDueno ? [{ id: 'p1' }] : []
        },
      }),
    }),
  }
  return { ...real, getDb: () => ({ transaction: async (cb: (t: typeof tx) => unknown) => cb(tx) }) }
})

const { borrarPostProgramado } = await import('./borrar')

beforeEach(() => {
  db.destinos = []
  db.delDueno = true
  db.deleteCalls = 0
  db.bloqueos = []
})

describe('borrarPostProgramado', () => {
  it('un post del dueño con destinos programados o fallidos se borra', async () => {
    db.destinos = [
      { status: 'scheduled', reclamadoHasta: null },
      { status: 'failed', reclamadoHasta: null },
    ]
    expect(await borrarPostProgramado('owner-1', 'p1')).toBe('borrado')
    expect(db.deleteCalls).toBe(1)
  })

  it('un post sin destinos también: no hay nada que lo impida', async () => {
    expect(await borrarPostProgramado('owner-1', 'p1')).toBe('borrado')
    expect(db.deleteCalls).toBe(1)
  })

  it('un post que no existe (o no es del dueño) es «no-existe»: el DELETE no encontró nada', async () => {
    db.delDueno = false
    expect(await borrarPostProgramado('owner-1', 'p1')).toBe('no-existe')
  })

  it('con algún destino publicado o publicando no se borra, y lo dice', async () => {
    db.destinos = [
      { status: 'scheduled', reclamadoHasta: null },
      { status: 'published', reclamadoHasta: null },
    ]
    expect(await borrarPostProgramado('owner-1', 'p1')).toBe('publicado')
    expect(db.deleteCalls).toBe(0)

    db.destinos = [{ status: 'publishing', reclamadoHasta: null }]
    expect(await borrarPostProgramado('owner-1', 'p1')).toBe('publicado')
    expect(db.deleteCalls).toBe(0)
  })

  it('con un destino que una corrida tiene entre manos tampoco: sigue diciendo scheduled, pero está saliendo', async () => {
    db.destinos = [{ status: 'scheduled', reclamadoHasta: new Date(Date.now() + 60_000) }]
    expect(await borrarPostProgramado('owner-1', 'p1')).toBe('publicado')
    expect(db.deleteCalls).toBe(0)
  })

  it('un reclamo vencido no impide nada: la corrida que lo tenía murió', async () => {
    db.destinos = [{ status: 'scheduled', reclamadoHasta: new Date(Date.now() - 60_000) }]
    expect(await borrarPostProgramado('owner-1', 'p1')).toBe('borrado')
  })

  it('los destinos se leen bloqueados, para que ninguna corrida los reclame entre revisar y borrar', async () => {
    await borrarPostProgramado('owner-1', 'p1')
    expect(db.bloqueos).toEqual(['update'])
  })
})
