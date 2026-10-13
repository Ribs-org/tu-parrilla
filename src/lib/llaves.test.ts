import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mismo arreglo que en `usuarios.test.ts`: `server-only` solo lo entiende el bundler de Next.
vi.mock('server-only', () => ({}))
vi.mock('./usuarios', () => ({ adminId: async () => 'admin-1' }))

/**
 * Doble mínimo de `getDb()`: solo las tres formas que usa este módulo. El aislamiento por
 * dueño de cada consulta lo prueba `aislamiento.test.ts` sobre el SQL real; acá importa qué
 * hace la función con lo que la base responde.
 */
const db = vi.hoisted(() => ({
  // Lo que devuelve el `UPDATE … RETURNING` de `duenoDeLaLlave`: la fila de la llave, o nada.
  filaLlave: [] as { ownerId: string }[],
  // Cuántas llaves tiene ya el dueño, para el tope de `crearLlave`.
  total: 0,
  insertadas: [] as Record<string, unknown>[],
  consultas: 0,
}))

vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  return {
    ...real,
    getDb: () => ({
      update: () => ({
        set: () => ({
          where: () => {
            db.consultas++
            return { returning: async () => db.filaLlave }
          },
        }),
      }),
      select: () => ({
        from: () => ({
          where: async () => {
            db.consultas++
            return [{ total: db.total }]
          },
        }),
      }),
      insert: () => ({
        values: async (v: Record<string, unknown>) => {
          db.consultas++
          db.insertadas.push(v)
        },
      }),
    }),
  }
})

const { crearLlave, duenoDeLaLlave } = await import('./llaves')
const { DEMASIADAS_LLAVES, MAX_LLAVES, NOMBRE_VACIO, hashLlave } = await import('./llaves-api')

function peticion(auth: string | null): Request {
  return new Request('https://ejemplo.cl/api/schedule/posts', { headers: auth ? { authorization: auth } : {} })
}

beforeEach(() => {
  db.filaLlave = []
  db.total = 0
  db.insertadas = []
  db.consultas = 0
  vi.stubEnv('SCHEDULE_API_KEY', 'llave-del-despliegue')
})
afterEach(() => vi.unstubAllEnvs())

describe('duenoDeLaLlave', () => {
  it('la llave del despliegue entra como el admin, sin consultar la tabla', async () => {
    expect(await duenoDeLaLlave(peticion('Bearer llave-del-despliegue'))).toBe('admin-1')
    expect(db.consultas).toBe(0)
  })

  it('una llave de usuario entra como su dueño', async () => {
    db.filaLlave = [{ ownerId: 'usuario-7' }]
    expect(await duenoDeLaLlave(peticion('Bearer tp_abc'))).toBe('usuario-7')
    expect(db.consultas).toBe(1)
  })

  it('una llave de usuario revocada (sin fila) no entra', async () => {
    expect(await duenoDeLaLlave(peticion('Bearer tp_abc'))).toBeNull()
  })

  it('sin header, sin Bearer o con algo que no tiene el prefijo, no entra ni consulta', async () => {
    expect(await duenoDeLaLlave(peticion(null))).toBeNull()
    expect(await duenoDeLaLlave(peticion('tp_abc'))).toBeNull()
    expect(await duenoDeLaLlave(peticion('Bearer otra'))).toBeNull()
    expect(db.consultas).toBe(0)
  })

  it('sin SCHEDULE_API_KEY, un Bearer vacío no es la del despliegue', async () => {
    vi.stubEnv('SCHEDULE_API_KEY', '')
    expect(await duenoDeLaLlave(peticion('Bearer '))).toBeNull()
  })

  it('sin SCHEDULE_API_KEY las llaves de usuario siguen entrando', async () => {
    vi.stubEnv('SCHEDULE_API_KEY', '')
    db.filaLlave = [{ ownerId: 'usuario-7' }]
    expect(await duenoDeLaLlave(peticion('Bearer tp_abc'))).toBe('usuario-7')
  })
})

describe('crearLlave', () => {
  it('guarda el hash y el final, nunca la llave, y devuelve la llave entera', async () => {
    const r = await crearLlave('usuario-7', '  Editor de videos ')
    if (!('llave' in r)) throw new Error('debía crearla')
    expect(db.insertadas).toHaveLength(1)
    const fila = db.insertadas[0]!
    expect(fila).toEqual({
      ownerId: 'usuario-7',
      nombre: 'Editor de videos',
      hash: hashLlave(r.llave),
      final: r.llave.slice(-4),
    })
    expect(Object.values(fila)).not.toContain(r.llave)
  })

  it('sin nombre no consulta nada', async () => {
    expect(await crearLlave('usuario-7', '  ')).toEqual({ error: NOMBRE_VACIO })
    expect(db.consultas).toBe(0)
  })

  it('en el tope no crea otra', async () => {
    db.total = MAX_LLAVES
    expect(await crearLlave('usuario-7', 'Una más')).toEqual({ error: DEMASIADAS_LLAVES })
    expect(db.insertadas).toHaveLength(0)
  })

  it('una por debajo del tope todavía crea', async () => {
    db.total = MAX_LLAVES - 1
    expect('llave' in (await crearLlave('usuario-7', 'La última'))).toBe(true)
  })
})
