import { describe, expect, it, vi } from 'vitest'
import type { OpcionesDestino } from './opciones'

/**
 * Doble mínimo de `getDb()` para probar `crearPostProgramado` sin una base real. Solo
 * cubre lo que hace `crear.ts` dentro de su transacción: borrar el borrador
 * (`delete(borradores).where().returning()`) y las cuatro inserciones
 * (`insert(scheduledPosts).values().returning()`, `insert(scheduledPostMedia).values()`,
 * `insert(scheduledPostTargets).values()` e `insert(reglasClave).values()`), con el mismo
 * estado mutable que los tests llenan y leen. La transacción no revierte nada: lo que se
 * prueba es que con el borrador ya consumido no se llegue a insertar. Que una transacción de
 * verdad revierta lo prueba `crear.integracion.test.ts`. Mismo patrón que
 * `src/lib/usuarios.test.ts`. `vi.hoisted` porque `vi.mock` se sube al principio del archivo
 * y necesita verlo ya listo.
 */
const db = vi.hoisted(() => ({
  postInsertado: { id: 'post-1' } as { id: string },
  media: [] as unknown[],
  targets: [] as unknown[],
  reglas: [] as unknown[],
  posts: 0,
  borradoresBorrados: [] as unknown[],
  borradorExiste: true,
}))

vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  const tx = {
    delete: (tabla: unknown) => ({
      where: (condicion: unknown) => ({
        returning: async () => {
          if (tabla !== real.borradores) throw new Error('tabla inesperada en el doble')
          db.borradoresBorrados.push(condicion)
          return db.borradorExiste ? [{ id: 'borrador-1' }] : []
        },
      }),
    }),
    insert: (tabla: unknown) => ({
      values: (v: unknown) => {
        if (tabla === real.scheduledPosts) {
          db.posts += 1
          return { returning: async () => [db.postInsertado] }
        }
        if (tabla === real.scheduledPostMedia) {
          db.media.push(...(v as unknown[]))
          return Promise.resolve()
        }
        if (tabla === real.scheduledPostTargets) {
          db.targets.push(...(v as unknown[]))
          return Promise.resolve()
        }
        if (tabla === real.reglasClave) {
          db.reglas.push(v)
          return Promise.resolve()
        }
        throw new Error('tabla inesperada en el doble')
      },
    }),
  }
  return { ...real, getDb: () => ({ transaction: async (cb: (t: typeof tx) => unknown) => cb(tx) }) }
})

const { crearPostProgramado } = await import('./crear')

/**
 * Envuelve `crearPostProgramado` con datos mínimos y devuelve lo que quedó en
 * `scheduled_post_targets`, ya sin `postId` (siempre el mismo, no aporta al test).
 */
async function crearConDobleFalso(
  cuentas: Array<{ id: string; network: string; handle: string | null }>,
  opciones?: Record<string, OpcionesDestino>,
): Promise<{ destinos: Array<{ network: string; accountId: string; opciones: unknown }> }> {
  db.targets.length = 0
  await crearPostProgramado('owner-1', {
    caption: 'hola',
    scheduledAt: new Date('2026-10-01T12:00:00Z'),
    media: [],
    cuentas,
    opciones,
  })
  const destinos = (db.targets as Array<{ network: string; accountId: string; opciones: unknown }>).map((t) => ({
    network: t.network,
    accountId: t.accountId,
    opciones: t.opciones,
  }))
  return { destinos }
}

describe('crearPostProgramado desde un borrador', () => {
  const base = {
    caption: 'hola',
    scheduledAt: new Date('2026-10-01T12:00:00Z'),
    media: [],
    cuentas: [{ id: 'ig-1', network: 'instagram', handle: '@vicente' }],
  }

  it('consume el borrador antes de crear el post, en la misma transacción', async () => {
    db.posts = 0
    db.borradoresBorrados.length = 0
    db.borradorExiste = true
    const { crearPostProgramado: crear } = await import('./crear')
    expect(await crear('owner-1', { ...base, borradorId: 'borrador-1' })).toBe('post-1')
    expect(db.borradoresBorrados).toHaveLength(1)
    expect(db.posts).toBe(1)
  })

  it('si el borrador ya no estaba, no crea nada: otro envío lo programó', async () => {
    db.posts = 0
    db.borradorExiste = false
    const { crearPostProgramado: crear, BorradorConsumido } = await import('./crear')
    await expect(crear('owner-1', { ...base, borradorId: 'borrador-1' })).rejects.toBeInstanceOf(BorradorConsumido)
    expect(db.posts).toBe(0)
    db.borradorExiste = true
  })

  it('sin borrador no toca la tabla de borradores', async () => {
    db.borradoresBorrados.length = 0
    const { crearPostProgramado: crear } = await import('./crear')
    await crear('owner-1', base)
    expect(db.borradoresBorrados).toHaveLength(0)
  })
})

describe('crearPostProgramado', () => {
  it('crea un destino por cuenta, incluso dos de la misma red', async () => {
    const cuentas = [
      { id: 'ig-1', network: 'instagram', handle: '@vicente' },
      { id: 'ig-2', network: 'instagram', handle: '@vicenteclips' },
    ]
    const { destinos } = await crearConDobleFalso(cuentas)
    expect(destinos).toEqual([
      { network: 'instagram', accountId: 'ig-1', opciones: null },
      { network: 'instagram', accountId: 'ig-2', opciones: null },
    ])
  })

  // La Tarea 2 entera existe para que dos cuentas de la misma red puedan tener
  // privacidades distintas: si `crear.ts` llaveara `opciones` por red en vez de por
  // cuenta, esto no se notaría hasta publicar. Ver `opcionesDesdeFormularioPorCuenta`.
  it('cada cuenta guarda sus propias opciones, no las de otra cuenta de la misma red', async () => {
    const cuentas = [
      { id: 'tt-1', network: 'tiktok', handle: '@vicente' },
      { id: 'tt-2', network: 'tiktok', handle: '@vicenteclips' },
    ]
    const opciones: Record<string, OpcionesDestino> = {
      'tt-1': { modo: 'borrador' },
      'tt-2': {
        modo: 'directo',
        privacidad: 'SELF_ONLY',
        comentarios: true,
        duo: false,
        pegar: false,
        comercial: 'no',
      },
    }
    const { destinos } = await crearConDobleFalso(cuentas, opciones)
    expect(destinos).toEqual([
      { network: 'tiktok', accountId: 'tt-1', opciones: opciones['tt-1'] },
      { network: 'tiktok', accountId: 'tt-2', opciones: opciones['tt-2'] },
    ])
  })
})
