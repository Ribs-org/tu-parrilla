import { beforeEach, describe, expect, it, vi } from 'vitest'

// `vigilarConexiones` contra una base de mentira: `cuentas` es lo que devuelve la lectura de
// las cuentas con el correo de su dueño, `escrituras` anota cada `update` (lo que pone), y
// `enviarAviso` se reemplaza para decidir si el correo sale. Lo que se prueba es la regla
// de «un correo por caída»: cuándo se marca, cuándo se suelta y cuándo se olvida.
const { cuentas, escrituras, enviados, envio, tomada } = vi.hoisted(() => ({
  cuentas: [] as Array<Record<string, unknown>>,
  escrituras: [] as Array<Record<string, unknown>>,
  enviados: [] as Array<{ to: string; subject: string; text: string }>,
  envio: { sale: true },
  tomada: { otraCorrida: false },
}))

vi.mock('@/db', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/db')>()
  return {
    ...real,
    getDb: () => ({
      select: () => ({
        from: () => ({
          leftJoin: async () => cuentas,
          // El conteo de lo que la cuenta tiene por salir.
          where: async () => [{ pendientes: 4 }],
        }),
      }),
      update: () => ({
        set: (valores: Record<string, unknown>) => ({
          where: () => {
            escrituras.push(valores)
            const hecho = Promise.resolve(undefined)
            return Object.assign(hecho, {
              returning: async () => (tomada.otraCorrida ? [] : [{ id: 'cuenta' }]),
            })
          },
        }),
      }),
    }),
  }
})

vi.mock('@/lib/social/publish/alert', () => ({
  destinatario: (correo?: string) => correo?.trim() || undefined,
  enviarAviso: async (to: string, aviso: { subject: string; text: string }) => {
    enviados.push({ to, ...aviso })
    return envio.sale
  },
}))

const { vigilarConexiones } = await import('./run')

const AHORA = new Date('2026-10-17T12:00:00Z')

function cuenta(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tt-1',
    ownerId: 'owner-1',
    network: 'tiktok',
    handle: '@vicente',
    conCredencial: true,
    expiresAt: null,
    lastSyncError: null,
    caidaAvisadaEn: null,
    correo: 'dueno@ejemplo.cl',
    ...overrides,
  }
}

beforeEach(() => {
  cuentas.length = 0
  escrituras.length = 0
  enviados.length = 0
  envio.sale = true
  tomada.otraCorrida = false
})

describe('vigilarConexiones', () => {
  it('una cuenta que se cayó y no se avisó: un correo a su dueño, y queda marcada', async () => {
    cuentas.push(cuenta({ lastSyncError: 'Reconecta TikTok para autorizar la publicación.' }))
    expect(await vigilarConexiones(AHORA)).toEqual({ avisadas: 1, recuperadas: 0 })
    expect(enviados).toHaveLength(1)
    expect(enviados[0]!.to).toBe('dueno@ejemplo.cl')
    expect(enviados[0]!.subject).toBe('Se cayó la conexión con TikTok · @vicente')
    expect(enviados[0]!.text).toContain('Tiene 4 publicaciones por salir ahí')
    expect(escrituras).toEqual([{ caidaAvisadaEn: AHORA }])
  })

  it('una caída ya avisada no vuelve a mandar nada', async () => {
    cuentas.push(cuenta({ lastSyncError: 'x', caidaAvisadaEn: new Date('2026-10-16T12:00:00Z') }))
    expect(await vigilarConexiones(AHORA)).toEqual({ avisadas: 0, recuperadas: 0 })
    expect(enviados).toEqual([])
    expect(escrituras).toEqual([])
  })

  it('la que volvió a calentarse se olvida, para que la próxima caída avise de nuevo', async () => {
    cuentas.push(cuenta({ caidaAvisadaEn: new Date('2026-10-16T12:00:00Z') }))
    expect(await vigilarConexiones(AHORA)).toEqual({ avisadas: 0, recuperadas: 1 })
    expect(escrituras).toEqual([{ caidaAvisadaEn: null }])
    expect(enviados).toEqual([])
  })

  it('una desconectada a propósito no es una caída', async () => {
    cuentas.push(cuenta({ conCredencial: false }))
    expect(await vigilarConexiones(AHORA)).toEqual({ avisadas: 0, recuperadas: 0 })
    expect(enviados).toEqual([])
  })

  it('si el correo no sale, la marca se suelta y la pasada siguiente lo intenta otra vez', async () => {
    envio.sale = false
    cuentas.push(cuenta({ lastSyncError: 'x' }))
    expect(await vigilarConexiones(AHORA)).toEqual({ avisadas: 0, recuperadas: 0 })
    expect(escrituras).toEqual([{ caidaAvisadaEn: AHORA }, { caidaAvisadaEn: null }])
  })

  it('si otra corrida ya tomó la caída, esta no manda un segundo correo', async () => {
    tomada.otraCorrida = true
    cuentas.push(cuenta({ lastSyncError: 'x' }))
    expect(await vigilarConexiones(AHORA)).toEqual({ avisadas: 0, recuperadas: 0 })
    expect(enviados).toEqual([])
  })

  it('una cuenta sin dueño ni correo de respaldo no avisa a nadie', async () => {
    cuentas.push(cuenta({ lastSyncError: 'x', correo: null, ownerId: null }))
    expect(await vigilarConexiones(AHORA)).toEqual({ avisadas: 0, recuperadas: 0 })
    expect(escrituras).toEqual([])
  })
})
