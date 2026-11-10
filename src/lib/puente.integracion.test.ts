import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'

// El puente del teléfono al panel contra una Postgres de verdad: que la llave abra la sesión de
// su dueño una sola vez, que venza a los dos minutos y que no se guarde tal cual.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const { VIGENCIA_DEL_PUENTE_MS, abrirPuente, cruzarPuente, mirarPuente } = await import('./puente')

async function usuario() {
  const { users } = await esquema()
  const [u] = await (await db())
    .insert(users)
    .values({ correo: `p-${crypto.randomUUID()}@ejemplo.cl`, zona: 'America/Santiago' })
    .returning()
  return u!
}

describe.skipIf(!URL_PRUEBAS)('el puente del teléfono al panel, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_puente')
  }, 60_000)

  it('mirar muestra el correo sin gastarla; cruzar abre la sesión de su dueño una sola vez', async () => {
    const u = await usuario()
    const llave = await abrirPuente(u.id)
    expect(llave).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(await mirarPuente(llave)).toBe(u.correo)
    expect(await mirarPuente(llave)).toBe(u.correo)
    expect((await cruzarPuente(llave))?.id).toBe(u.id)
    expect(await cruzarPuente(llave)).toBeNull()
    expect(await mirarPuente(llave)).toBeNull()
  })

  it('vence a los dos minutos', async () => {
    const u = await usuario()
    const ahora = new Date()
    const llave = await abrirPuente(u.id, ahora)
    const vencida = new Date(ahora.getTime() + VIGENCIA_DEL_PUENTE_MS + 1)
    expect(await mirarPuente(llave, vencida)).toBeNull()
    expect(await cruzarPuente(llave, vencida)).toBeNull()
  })

  it('la llave no se guarda tal cual, y una inventada no abre nada', async () => {
    const { puentes } = await esquema()
    const u = await usuario()
    const llave = await abrirPuente(u.id)
    const filas = await (await db()).select().from(puentes).where(eq(puentes.userId, u.id))
    expect(filas).toHaveLength(1)
    expect(filas[0]!.hash).not.toContain(llave)
    expect(await cruzarPuente('x'.repeat(43))).toBeNull()
    expect(await cruzarPuente('corta')).toBeNull()
  })

  it('pedir otra barre las vencidas del mismo usuario', async () => {
    const { puentes } = await esquema()
    const u = await usuario()
    const antes = new Date(Date.now() - 10 * 60_000)
    await abrirPuente(u.id, antes)
    await abrirPuente(u.id)
    const filas = await (await db()).select().from(puentes).where(eq(puentes.userId, u.id))
    expect(filas).toHaveLength(1)
  })
})
