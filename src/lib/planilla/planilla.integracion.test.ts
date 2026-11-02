import { writeFileSync } from 'node:fs'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import readXlsxFile from 'read-excel-file/node'
import { prepararBase, URL_PRUEBAS } from '@/lib/pruebas/base-de-pruebas'
import { archivosDelZip } from '@/lib/pruebas/zip'

// La planilla de «Llevar para la casa» contra una Postgres de verdad: dos dueños con de todo, y
// la planilla de uno abierta con otro lector. Lo que importa lo decide el SQL: que no se cuele
// nada del otro dueño, que lo de YouTube vencido no vuelva, que un texto con forma de fórmula
// llegue como texto, y que una hoja que pasa su tope lo diga en «Léeme».
//
// Con `PLANILLA_GUARDAR=<ruta>` deja el archivo en esa ruta, para abrirlo en Excel a mano.

vi.mock('server-only', () => ({}))
// El tope de «Visitas» en 2, para ver una hoja cortada sin escribir cien mil filas.
vi.mock('./hojas', async (original) => {
  const real = await original<typeof import('./hojas')>()
  return { ...real, TOPES: { ...real.TOPES, visitas: 2 } }
})

const esquema = () => import('@/db')
const db = async () => (await esquema()).getDb()

const DIA = 864e5
const ahora = new Date()
const hace = (dias: number) => new Date(ahora.getTime() - dias * DIA)
const diaDeHace = (dias: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(hace(dias))

let ana = ''
let bea = ''
let hojas: Array<{ sheet: string; data: unknown[][] }> = []
let archivos = new Map<string, string>()

/** Las filas de una hoja como objetos, por el título de cada columna. */
function filas(nombre: string): Array<Record<string, unknown>> {
  const hoja = hojas.find((h) => h.sheet === nombre)
  if (!hoja) throw new Error(`No está la hoja ${nombre}`)
  const [titulos, ...resto] = hoja.data as [string[], ...unknown[][]]
  return resto.map((fila) => Object.fromEntries(titulos.map((t, i) => [t, fila[i] ?? null])))
}

async function sembrar() {
  const s = await esquema()
  const d = await db()
  const [a, b] = await d
    .insert(s.users)
    .values([{ correo: `ana-${crypto.randomUUID()}@ejemplo.cl` }, { correo: `bea-${crypto.randomUUID()}@ejemplo.cl` }])
    .returning()
  ana = a!.id
  bea = b!.id

  const [paginaAna, paginaBea] = await d
    .insert(s.profiles)
    .values([
      { ownerId: ana, slug: `ana-${crypto.randomUUID().slice(0, 8)}`, displayName: 'Ana' },
      { ownerId: bea, slug: `bea-${crypto.randomUUID().slice(0, 8)}`, displayName: 'Bea' },
    ])
    .returning()
  const [linkAna, linkBea] = await d
    .insert(s.links)
    .values([
      { profileId: paginaAna!.id, label: 'Mi tienda', url: 'https://ana.example' },
      { profileId: paginaBea!.id, label: 'Lo de Bea', url: 'https://bea.example' },
    ])
    .returning()

  const [igAna, ytAna, igBea] = await d
    .insert(s.socialAccounts)
    .values([
      { ownerId: ana, network: 'instagram', handle: '@ana', externalId: crypto.randomUUID(), accessToken: 't' },
      { ownerId: ana, network: 'youtube', handle: '@anacanal', externalId: crypto.randomUUID(), accessToken: 't' },
      { ownerId: bea, network: 'instagram', handle: '@bea', externalId: crypto.randomUUID(), accessToken: 't' },
    ])
    .returning()

  const [reel, videoViejo, videoNuevo, reelBea] = await d
    .insert(s.socialPosts)
    .values([
      {
        ownerId: ana,
        accountId: igAna!.id,
        network: 'instagram',
        externalId: 'ig-ana-1',
        campaign: `ana-reel-${crypto.randomUUID().slice(0, 6)}`,
        caption: '=HYPERLINK("http://malo.example","gana")',
        publishedAt: hace(10),
      },
      {
        ownerId: ana,
        accountId: ytAna!.id,
        network: 'youtube',
        externalId: 'yt-viejo',
        campaign: `ana-yt-viejo-${crypto.randomUUID().slice(0, 6)}`,
        caption: 'Título que ya venció',
        publishedAt: hace(60),
        updatedAt: hace(35),
      },
      {
        ownerId: ana,
        accountId: ytAna!.id,
        network: 'youtube',
        externalId: 'yt-nuevo',
        campaign: `ana-yt-nuevo-${crypto.randomUUID().slice(0, 6)}`,
        caption: 'Video nuevo',
        publishedAt: hace(5),
      },
      {
        ownerId: bea,
        accountId: igBea!.id,
        network: 'instagram',
        externalId: 'ig-bea-1',
        campaign: `bea-reel-${crypto.randomUUID().slice(0, 6)}`,
        caption: 'De Bea',
        publishedAt: hace(10),
      },
    ])
    .returning()

  await d.insert(s.postMetrics).values([
    { postId: reel!.id, day: diaDeHace(9), views: 100, likes: 1, comments: 0, capturedAt: hace(9) },
    { postId: reel!.id, day: diaDeHace(2), views: 500, likes: 9, comments: 2, capturedAt: hace(2) },
    // Una lectura de YouTube de hace 35 días: la limpieza diaria no corrió todavía.
    { postId: videoViejo!.id, day: diaDeHace(35), views: 999, likes: 9, comments: 9, capturedAt: hace(35) },
    { postId: videoNuevo!.id, day: diaDeHace(3), views: 40, likes: 4, comments: 1, capturedAt: hace(3) },
    { postId: videoNuevo!.id, day: diaDeHace(1), views: 70, likes: 6, comments: 2, capturedAt: hace(1) },
    { postId: reelBea!.id, day: diaDeHace(2), views: 777, capturedAt: hace(2) },
  ])

  await d.insert(s.accountMetrics).values([
    // Antes del período: la vara de lo ganado en él.
    { network: 'instagram', accountId: igAna!.id, day: diaDeHace(100), followers: 90, capturedAt: hace(100) },
    { network: 'instagram', accountId: igAna!.id, day: diaDeHace(5), followers: 100, capturedAt: hace(5) },
    { network: 'instagram', accountId: igAna!.id, day: diaDeHace(1), followers: 110, profileViews: 7, reach: 300, capturedAt: hace(1) },
    { network: 'youtube', accountId: ytAna!.id, day: diaDeHace(40), followers: 40, capturedAt: hace(40) },
    { network: 'youtube', accountId: ytAna!.id, day: diaDeHace(3), followers: 48, capturedAt: hace(3) },
    { network: 'youtube', accountId: ytAna!.id, day: diaDeHace(2), followers: 50, capturedAt: hace(2) },
    { network: 'instagram', accountId: igBea!.id, day: diaDeHace(1), followers: 9999, capturedAt: hace(1) },
  ])

  const visita = (profileId: string, dias: number, extra: Record<string, unknown> = {}) => ({
    profileId,
    createdAt: hace(dias),
    visitorHash: crypto.randomUUID(),
    ...extra,
  })
  const [v1] = await d
    .insert(s.visits)
    .values([
      visita(paginaAna!.id, 1, { campaign: reel!.campaign, utmSource: '+ig', referrer: '-malo', referrerNetwork: 'instagram', country: 'CL', city: 'Santiago', deviceType: 'mobile' }),
      visita(paginaAna!.id, 2, { campaign: videoViejo!.campaign }),
      visita(paginaAna!.id, 3),
      visita(paginaAna!.id, 3, { isBot: true }),
      visita(paginaBea!.id, 1, { campaign: reelBea!.campaign, utmSource: 'bea-utm' }),
      visita(paginaBea!.id, 2),
    ])
    .returning()
  await d.insert(s.clicks).values([
    { visitId: v1!.id, linkId: linkAna!.id, profileId: paginaAna!.id, createdAt: hace(1), msOnPage: 4200, position: 0 },
    { linkId: linkBea!.id, profileId: paginaBea!.id, createdAt: hace(1) },
  ])

  await d.insert(s.postComments).values([
    { accountId: igAna!.id, network: 'instagram', postExternalId: 'ig-ana-1', externalId: crypto.randomUUID(), author: '@alguien', text: '=cmd|"/C calc"!A0', publishedAt: hace(2) },
    { accountId: ytAna!.id, network: 'youtube', postExternalId: 'yt-nuevo', externalId: crypto.randomUUID(), author: 'Fan', text: 'Buen video', publishedAt: hace(2) },
    { accountId: ytAna!.id, network: 'youtube', postExternalId: 'yt-viejo', externalId: crypto.randomUUID(), author: 'Viejo', text: 'Comentario vencido', publishedAt: hace(40), createdAt: hace(40) },
    { accountId: igBea!.id, network: 'instagram', postExternalId: 'ig-bea-1', externalId: crypto.randomUUID(), author: 'x', text: 'Comentario de Bea', publishedAt: hace(2) },
  ])

  const [quemado, futuro, deBea] = await d
    .insert(s.scheduledPosts)
    .values([
      { ownerId: ana, caption: 'Se me quemó', scheduledAt: hace(4), atributos: { hook: 'pregunta' } },
      { ownerId: ana, caption: 'Para la otra semana', scheduledAt: new Date(ahora.getTime() + 5 * DIA) },
      { ownerId: bea, caption: 'Lo de Bea', scheduledAt: hace(4) },
    ])
    .returning()
  await d.insert(s.scheduledPostTargets).values([
    { postId: quemado!.id, accountId: igAna!.id, network: 'instagram', status: 'failed', lastError: 'Instagram rechazó la publicación.', attemptCount: 3 },
    { postId: futuro!.id, accountId: igAna!.id, network: 'instagram', status: 'scheduled' },
    { postId: deBea!.id, accountId: igBea!.id, network: 'instagram', status: 'published', externalId: 'ig-bea-1' },
  ])
}

describe.skipIf(!URL_PRUEBAS)('la planilla de Los Números, contra una Postgres de verdad', () => {
  beforeAll(async () => {
    await prepararBase('pruebas_planilla')
    await sembrar()
    const { armarPlanilla } = await import('./armar')
    const { parseFilters } = await import('@/lib/filters')
    const { getCuentas } = await import('@/lib/posts')
    const partes: Uint8Array[] = []
    for await (const parte of armarPlanilla({
      filters: parseFilters({ range: '90d' }, ana, 'America/Santiago'),
      cuentas: await getCuentas(ana),
      cuenta: null,
      pagina: null,
      ahora,
      terminarAntesDe: Date.now() + 60_000,
    })) {
      partes.push(parte)
    }
    const archivo = Buffer.concat(partes)
    if (process.env.PLANILLA_GUARDAR) writeFileSync(process.env.PLANILLA_GUARDAR, archivo)
    archivos = archivosDelZip(archivo)
    hojas = (await readXlsxFile(archivo)) as typeof hojas
  }, 120_000)

  it('trae las hojas en orden, con «Léeme» primero, y ninguna fórmula', async () => {
    const { CLAVES_DE_HOJA, nombreDeHoja } = await import('./hojas')
    expect(hojas.map((h) => h.sheet)).toEqual(CLAVES_DE_HOJA.map(nombreDeHoja))
    for (const [nombre, xml] of archivos) expect(xml, nombre).not.toMatch(/<f[ >]/)
  })

  it('no trae nada de otro dueño', () => {
    const todo = JSON.stringify(hojas)
    for (const ajeno of ['"bea"', 'De Bea', 'Lo de Bea', 'Comentario de Bea', 'bea-utm', 'bea.example', 'ig-bea-1', '9999', '777']) {
      expect(todo, ajeno).not.toContain(ajeno)
    }
    expect(filas('Cuentas').map((c) => c['Cuenta'])).toEqual(expect.arrayContaining(['ana', 'anacanal']))
    expect(filas('Cuentas')).toHaveLength(2)
    expect(filas('Clicks')).toHaveLength(1)
    expect(filas('Clicks')[0]!['Link']).toBe('Mi tienda')
  })

  it('un texto con forma de fórmula llega como texto', () => {
    const reel = filas('Publicaciones').find((p) => p['Id en la red'] === 'ig-ana-1')!
    expect(reel['Texto']).toBe(`'=HYPERLINK("http://malo.example","gana")`)
    expect(filas('Comentarios').map((c) => c['Comentario'])).toContain(`'=cmd|"/C calc"!A0`)
    const conUtm = filas('Etiquetas y UTM').find((e) => e['utm_source'] !== null)!
    expect(conUtm['utm_source']).toBe(`'+ig`)
    expect(filas('Visitas').map((v) => v['Referrer'])).toContain(`'-malo`)
  })

  it('YouTube: sin lo vencido y sin nada calculado', () => {
    const publicaciones = filas('Publicaciones')
    const viejo = publicaciones.find((p) => p['Id en la red'] === 'yt-viejo')!
    expect(viejo['Texto']).toBeNull()
    expect(viejo['Views']).toBeNull()
    const nuevo = publicaciones.find((p) => p['Id en la red'] === 'yt-nuevo')!
    expect(nuevo['Texto']).toBe('Video nuevo')
    expect(nuevo['Views']).toBe(70)
    expect(nuevo['Views ganadas']).toBeNull()
    expect(nuevo['Arrastre']).toBeNull()
    const reel = publicaciones.find((p) => p['Id en la red'] === 'ig-ana-1')!
    expect(typeof reel['Views ganadas']).toBe('number')

    expect(filas('Lecturas diarias').map((l) => l['Id en la red'])).not.toContain('yt-viejo')
    expect(filas('Lecturas diarias').filter((l) => l['Id en la red'] === 'yt-nuevo')).toHaveLength(2)

    const seguidores = filas('Seguidores')
    const deYoutube = seguidores.filter((s) => s['Red'] === 'YouTube')
    expect(deYoutube.map((s) => s['Seguidores']).sort()).toEqual([48, 50])
    expect(deYoutube.every((s) => s['Ganados desde la lectura anterior'] === null)).toBe(true)
    const ultimaDeInstagram = seguidores.find((s) => s['Red'] === 'Instagram' && s['Seguidores'] === 110)!
    expect(ultimaDeInstagram['Ganados desde la lectura anterior']).toBe(10)

    const cuentaYoutube = filas('Cuentas').find((c) => c['Cuenta'] === 'anacanal')!
    expect(cuentaYoutube['Seguidores']).toBe(50)
    expect(cuentaYoutube['Seguidores ganados']).toBeNull()

    const comentarios = filas('Comentarios').map((c) => c['Comentario'])
    expect(comentarios).toContain('Buen video')
    expect(comentarios).not.toContain('Comentario vencido')
  })

  it('lo programado, lo publicado y lo quemado, con lo que viene', () => {
    const programado = filas('Programado')
    expect(programado.map((p) => p['Estado']).sort()).toEqual(['Programado', 'Se quemó'])
    const quemado = programado.find((p) => p['Estado'] === 'Se quemó')!
    expect(quemado['Motivo']).toBe('Instagram rechazó la publicación.')
    expect(quemado['Intentos']).toBe(3)
    expect(quemado['Atributos']).toBe('{"hook":"pregunta"}')
  })

  it('las visitas sin bots, cortadas en su tope, y «Léeme» lo dice', () => {
    const visitas = filas('Visitas')
    expect(visitas).toHaveLength(2)
    expect(visitas.every((v) => v['Bot'] === 'No')).toBe(true)
    const leeme = JSON.stringify(hojas[0]!.data)
    expect(leeme).toContain('Visitas: lleva las más recientes, 2 de 3.')
    expect(leeme).toContain('America/Santiago')
  })

  it('el resumen cuenta lo mismo que las hojas', () => {
    const resumen = filas('Resumen')
    const valor = (metrica: string) => resumen.find((r) => r['Métrica'] === metrica)!['Valor']
    expect(valor('Visitas')).toBe(3)
    expect(valor('Clicks en tus links')).toBe(1)
    expect(valor('Seguidores ganados')).toBe(20)
    const dias = filas('Día a día')
    expect(dias.reduce((t, d) => t + (d['Visitas'] as number), 0)).toBe(3)
  })

  it('el adelanto avisa lo que no cabe', async () => {
    const { adelantoDePlanilla } = await import('./armar')
    const { parseFilters } = await import('@/lib/filters')
    const { getCuentas } = await import('@/lib/posts')
    const adelanto = await adelantoDePlanilla({
      filters: parseFilters({ range: '90d' }, ana, 'America/Santiago'),
      cuentas: await getCuentas(ana),
      cuenta: null,
      pagina: null,
      ahora,
    })
    expect(adelanto.noCaben).toEqual([{ hoja: 'Visitas', total: 3, tope: 2, cuales: 'las más recientes' }])
    expect(adelanto.archivo).toMatch(/^tu-parrilla-numeros-\d{4}-\d{2}-\d{2}-al-\d{4}-\d{2}-\d{2}\.xlsx$/)
  })

  it('con una cuenta elegida, las hojas de las redes son solo de esa cuenta', async () => {
    const { armarPlanilla } = await import('./armar')
    const { parseFilters } = await import('@/lib/filters')
    const { getCuentas } = await import('@/lib/posts')
    const cuentas = await getCuentas(ana)
    const youtube = cuentas.find((c) => c.network === 'youtube')!
    const partes: Uint8Array[] = []
    for await (const parte of armarPlanilla({
      filters: parseFilters({ range: '90d', cuenta: youtube.id }, ana, 'America/Santiago'),
      cuentas,
      cuenta: youtube,
      pagina: null,
      ahora,
      terminarAntesDe: Date.now() + 60_000,
    })) {
      partes.push(parte)
    }
    const deUna = (await readXlsxFile(Buffer.concat(partes))) as typeof hojas
    const publicaciones = deUna.find((h) => h.sheet === 'Publicaciones')!.data.slice(1)
    expect(publicaciones.every((f) => f[0] === 'YouTube')).toBe(true)
    expect(deUna.find((h) => h.sheet === 'Cuentas')!.data).toHaveLength(2)
    expect(JSON.stringify(deUna[0]!.data)).toContain('YouTube · @anacanal')
  })
})
