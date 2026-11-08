import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// La corrida de publicación, sin red y sin base: cada fase es de mentira. Lo que se prueba es lo
// que decide la ruta: quién entra, que los barridos —el de huérfanos y el de las subidas de la
// cocina— vayan una vez por hora, en la corrida de los primeros cinco minutos, y que las preguntas
// vencidas y la alarma de la cocina vayan en todas.

vi.mock('@/lib/social/publish/run', () => ({ publishDue: vi.fn(async () => ({ publicados: 0 })) }))
vi.mock('@/lib/avisos/run', () => ({ vigilarConexiones: vi.fn(async () => ({ avisadas: 0 })) }))
vi.mock('@/lib/social/comentarios/run', () => ({
  sondearComentarios: vi.fn(async () => ({ cuentas: [], sinSondear: 0, redaccion: { redactados: 0, fallidos: 0, sinPasarela: false } })),
}))
vi.mock('@/lib/storage-gc', () => ({ barrerHuerfanos: vi.fn(async () => ({ borrados: 2, bytes: 10 })) }))
vi.mock('@/lib/cocina/subidas', () => ({ barrerSubidas: vi.fn(async () => ({ abortadas: 1 })) }))
vi.mock('@/lib/cocina/barrido', () => ({ barrerCocina: vi.fn(async () => ({ crudos: 2, vencidos: 1, servidas: 0 })) }))
vi.mock('@/lib/cocina/preguntar', () => ({ vencerPreguntas: vi.fn(async () => 1) }))
vi.mock('@/lib/cocina/alarma', () => ({ vigilarLaCocina: vi.fn(async () => ({ avisadas: 2 })) }))
vi.mock('@/lib/push/comentarios', () => ({ resumirComentarios: vi.fn(async () => ({ avisados: 3 })) }))

const { GET } = await import('./route')
const { barrerHuerfanos } = await import('@/lib/storage-gc')
const { barrerSubidas } = await import('@/lib/cocina/subidas')
const { barrerCocina } = await import('@/lib/cocina/barrido')
const { vencerPreguntas } = await import('@/lib/cocina/preguntar')
const { vigilarLaCocina } = await import('@/lib/cocina/alarma')
const { resumirComentarios } = await import('@/lib/push/comentarios')

const corrida = (authorization?: string) =>
  GET(new Request('https://tu-parrilla.cl/api/cron/publish-social', authorization ? { headers: { authorization } } : {}))

describe('la corrida de publicación', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'secreto-del-cron')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('sin el secreto del cron, no corre nada', async () => {
    expect((await corrida()).status).toBe(401)
    expect((await corrida('Bearer otro')).status).toBe(401)
  })

  it('en los primeros cinco minutos de la hora barre los huérfanos, las subidas de la cocina y lo vencido', async () => {
    vi.setSystemTime(new Date('2026-10-23T12:02:00Z'))
    const r = await corrida('Bearer secreto-del-cron')
    expect(barrerHuerfanos).toHaveBeenCalledTimes(1)
    expect(barrerSubidas).toHaveBeenCalledTimes(1)
    expect(barrerCocina).toHaveBeenCalledTimes(1)
    expect(await r.json()).toMatchObject({ barrido: { borrados: 2 }, subidas: { abortadas: 1 }, cocina: { crudos: 2, vencidos: 1 } })
  })

  it('el resto de la hora no barre ninguno', async () => {
    vi.setSystemTime(new Date('2026-10-23T12:35:00Z'))
    const r = await corrida('Bearer secreto-del-cron')
    expect(barrerHuerfanos).not.toHaveBeenCalled()
    expect(barrerSubidas).not.toHaveBeenCalled()
    expect(barrerCocina).not.toHaveBeenCalled()
    expect(await r.json()).toMatchObject({ barrido: null, subidas: null, cocina: null })
  })

  it('las preguntas vencidas y la alarma de la cocina van en cada corrida, no una vez por hora', async () => {
    vi.setSystemTime(new Date('2026-10-23T12:35:00Z'))
    const r = await corrida('Bearer secreto-del-cron')
    expect(vencerPreguntas).toHaveBeenCalledTimes(1)
    expect(vigilarLaCocina).toHaveBeenCalledTimes(1)
    expect(await r.json()).toMatchObject({ preguntas: 1, alarma: { avisadas: 2 } })
  })

  it('el resumen de comentarios al teléfono va en cada corrida, después del sondeo', async () => {
    vi.setSystemTime(new Date('2026-10-23T12:35:00Z'))
    const r = await corrida('Bearer secreto-del-cron')
    expect(resumirComentarios).toHaveBeenCalledTimes(1)
    expect(await r.json()).toMatchObject({ alTelefono: { avisados: 3 } })
  })
})
