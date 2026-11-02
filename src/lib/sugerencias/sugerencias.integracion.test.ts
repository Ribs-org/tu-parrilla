import { beforeAll, describe, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'
import type { ClienteGithub, IssueNuevo } from './github'

// El libro de sugerencias contra una Postgres de verdad, con un doble del cliente de GitHub:
// que se guarde antes de mandar, que lo que falló quede pendiente y lo mande el reintento, que
// dos corridas a la vez no abran dos issues, y el tope del día. Ninguna prueba toca GitHub.

vi.mock('server-only', () => ({}))

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()
const MINUTO = 60_000

async function usuario(rol: 'admin' | 'usuario' = 'usuario') {
  const { users } = await esquema()
  const [u] = await (await db())
    .insert(users)
    .values({ correo: `s-${crypto.randomUUID()}@ejemplo.cl`, rol, tema: 'dia' })
    .returning()
  return u!
}

/** Un GitHub de mentira: anota cada issue, o falla mientras `falla` sea verdad. */
function githubDoble(opciones: { falla?: boolean; demora?: number } = {}) {
  const issues: IssueNuevo[] = []
  const cliente: ClienteGithub = {
    async crearIssue(issue) {
      if (opciones.demora) await new Promise((r) => setTimeout(r, opciones.demora))
      if (opciones.falla) throw new Error('GitHub respondió 502 al abrir el issue: Bad Gateway')
      issues.push(issue)
      return { numero: 100 + issues.length, url: `https://github.com/Ribs-org/tu-parrilla/issues/${100 + issues.length}` }
    },
  }
  return { cliente, issues, opciones }
}

const ORIGEN = { origen: 'panel' as const, pantalla: '/admin/schedule', navegador: 'Chrome 131 en Windows' }

describe.skipIf(!URL_PRUEBAS)('el libro de sugerencias contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_sugerencias')
  }, 60_000)

  it('guarda primero, con sus metadatos, y sin token queda pendiente', async () => {
    const { socialAccounts, sugerencias } = await esquema()
    const { recibirSugerencia, mandarSugerencia } = await import('./guardar')
    const u = await usuario('admin')
    await (await db()).insert(socialAccounts).values([
      { ownerId: u.id, network: 'instagram', externalId: crypto.randomUUID() },
      { ownerId: u.id, network: 'instagram', externalId: crypto.randomUUID() },
      { ownerId: u.id, network: 'youtube', externalId: crypto.randomUUID() },
    ])
    vi.stubEnv('VERCEL_GIT_COMMIT_SHA', '46b4f9d0123456789abcdef')

    const r = await recibirSugerencia(u, { tipo: 'idea', texto: 'Quiero X cuando apriete Y' }, ORIGEN)
    vi.unstubAllEnvs()
    expect(r).toHaveProperty('id')
    const id = (r as { id: string }).id

    expect(await mandarSugerencia(id, null)).toBe('pendiente')
    const [fila] = await (await db()).select().from(sugerencias).where(eq(sugerencias.id, id))
    expect(fila).toMatchObject({ ownerId: u.id, tipo: 'idea', texto: 'Quiero X cuando apriete Y', enviadaEn: null, issueNumero: null })
    expect(fila!.ultimoError).toMatch(/SUGERENCIAS_GITHUB_TOKEN/)
    // Sin token no cuenta como intento: el cron la toma igual al día siguiente.
    expect(fila!.intentos).toBe(0)
    expect(fila!.contexto).toEqual({
      origen: 'panel',
      pantalla: '/admin/schedule',
      navegador: 'Chrome 131 en Windows',
      zona: 'America/Santiago',
      modo: 'dia',
      cuentasPorRed: { instagram: 2, youtube: 1 },
      esAdmin: true,
      commit: '46b4f9d0123456789abcdef',
    })
    // Nada del correo en lo que se guarda para el issue.
    expect(JSON.stringify(fila!.contexto)).not.toContain(u.correo)
  })

  it('si GitHub falla queda pendiente con su error, y el reintento la manda una sola vez', async () => {
    const { sugerencias } = await esquema()
    const { recibirSugerencia, mandarSugerencia, reintentarSugerencias, RECLAMO_MS } = await import('./guardar')
    const u = await usuario()
    const ahora = new Date('2030-01-01T12:00:00Z')
    const { id } = (await recibirSugerencia(u, { tipo: 'problema', texto: 'No me deja @alguien #4' }, ORIGEN, ahora)) as { id: string }

    const caido = githubDoble({ falla: true })
    expect(await mandarSugerencia(id, caido.cliente, ahora)).toBe('pendiente')
    let [fila] = await (await db()).select().from(sugerencias).where(eq(sugerencias.id, id))
    expect(fila).toMatchObject({ intentos: 1, enviadaEn: null })
    expect(fila!.ultimoError).toContain('502')

    // Recién intentada, está reclamada: un reintento inmediato no la toca.
    const vivo = githubDoble()
    await reintentarSugerencias(vivo.cliente, new Date(ahora.getTime() + MINUTO))
    expect(vivo.issues.some((i) => i.cuerpo.includes(id))).toBe(false)

    // Pasado el reclamo, el cron la manda.
    const despues = new Date(ahora.getTime() + RECLAMO_MS + MINUTO)
    const reporte = await reintentarSugerencias(vivo.cliente, despues)
    expect(reporte.enviadas).toBeGreaterThanOrEqual(1)
    const issue = vivo.issues.find((i) => i.cuerpo.includes(id))
    expect(issue).toBeDefined()
    expect(issue!.titulo.startsWith('Sugerencia · Algo no funciona: ')).toBe(true)
    expect(issue!.etiquetas).toEqual(['sugerencia', 'sugerencia: no funciona'])
    expect(issue!.cuerpo).not.toContain(u.correo)
    ;[fila] = await (await db()).select().from(sugerencias).where(eq(sugerencias.id, id))
    expect(fila).toMatchObject({ intentos: 2, ultimoError: null })
    expect(fila!.issueNumero).toBeGreaterThan(100)
    expect(fila!.issueUrl).toMatch(/^https:\/\/github\.com\/Ribs-org\/tu-parrilla\/issues\/\d+$/)
    expect(fila!.enviadaEn).not.toBeNull()

    // Ya enviada, ningún reintento vuelve a abrirla.
    const otro = githubDoble()
    await reintentarSugerencias(otro.cliente, new Date(despues.getTime() + RECLAMO_MS * 10))
    expect(otro.issues.some((i) => i.cuerpo.includes(id))).toBe(false)
  })

  it('dos envíos a la vez de la misma sugerencia abren un solo issue', async () => {
    const { recibirSugerencia, mandarSugerencia } = await import('./guardar')
    const u = await usuario()
    const ahora = new Date('2031-01-01T12:00:00Z')
    const { id } = (await recibirSugerencia(u, { tipo: 'otra', texto: 'Hola' }, ORIGEN, ahora)) as { id: string }
    const lento = githubDoble({ demora: 50 })
    const resultados = await Promise.all([
      mandarSugerencia(id, lento.cliente, ahora),
      mandarSugerencia(id, lento.cliente, ahora),
      mandarSugerencia(id, lento.cliente, ahora),
    ])
    expect(resultados.filter((r) => r === 'enviada')).toHaveLength(1)
    expect(resultados.filter((r) => r === 'ocupada')).toHaveLength(2)
    expect(lento.issues).toHaveLength(1)
  })

  it('el tope del día es por persona, y en 24 horas se renueva', async () => {
    const { recibirSugerencia } = await import('./guardar')
    const { SUGERENCIA_TOPE, TOPE_DIARIO } = await import('./formato')
    const a = await usuario()
    const b = await usuario()
    const ahora = new Date('2032-06-01T12:00:00Z')
    for (let i = 0; i < TOPE_DIARIO; i++) {
      expect(await recibirSugerencia(a, { tipo: 'idea', texto: `idea ${i}` }, ORIGEN, ahora)).toHaveProperty('id')
    }
    expect(await recibirSugerencia(a, { tipo: 'idea', texto: 'una más' }, ORIGEN, ahora)).toEqual({ error: SUGERENCIA_TOPE })
    // Otra persona no carga con el tope de la primera.
    expect(await recibirSugerencia(b, { tipo: 'idea', texto: 'la mía' }, ORIGEN, ahora)).toHaveProperty('id')
    // Al día siguiente, de nuevo.
    const manana = new Date(ahora.getTime() + 24 * 60 * MINUTO + MINUTO)
    expect(await recibirSugerencia(a, { tipo: 'idea', texto: 'otra' }, ORIGEN, manana)).toHaveProperty('id')
  })

  it('lo que no pasa la revisión no se guarda', async () => {
    const { sugerencias } = await esquema()
    const { recibirSugerencia } = await import('./guardar')
    const { SUGERENCIA_VACIA } = await import('./formato')
    const u = await usuario()
    expect(await recibirSugerencia(u, { tipo: 'idea', texto: '  ' }, ORIGEN)).toEqual({ error: SUGERENCIA_VACIA })
    expect(await (await db()).select().from(sugerencias).where(eq(sugerencias.ownerId, u.id))).toEqual([])
  })
})
