import { describe, expect, it } from 'vitest'
import type { PostRow } from '../posts-kpis'
import {
  CLAVES_DE_HOJA,
  definicion,
  filaDeComentario,
  filaDeCuenta,
  filaDeDestino,
  filaDePublicacion,
  filaDeSeguidores,
  filaDeVisita,
  filasDelMapa,
  filasDelResumen,
  nombreDeHoja,
  type DestinoProgramado,
} from './hojas'
import { filasDelLeeme, fraseDeRecorte } from './leeme'

function fila(overrides: Partial<PostRow>): PostRow {
  return {
    id: 'post-1',
    network: 'instagram',
    accountId: 'acc-1',
    externalId: 'ext-1',
    permalink: 'https://instagram.com/p/1',
    caption: 'hola',
    thumbnailUrl: null,
    mediaType: 'VIDEO',
    publishedLabel: '1 ago',
    publishedAt: new Date('2026-10-01T12:00:00Z'),
    campaign: 'reel-1',
    archived: false,
    views: 1000,
    viewsChange: 400,
    viewsA7Dias: 300,
    viewsA48h: null,
    likesChange: 10,
    commentsChange: 2,
    sharesChange: null,
    isNew: false,
    likes: 50,
    comments: 5,
    shares: null,
    saves: 3,
    reach: 900,
    visits: 20,
    uniques: 18,
    clicks: 5,
    ctr: 25,
    pull: 5,
    ...overrides,
  }
}

const cuenta = {
  id: 'acc-1',
  network: 'instagram',
  handle: '@prueba',
  externalId: '123',
  connected: true,
  lastSyncedAt: '2026-11-01T12:00:00.000Z',
  lastSyncError: null,
  expiresAt: null,
}

const COLUMNA = (clave: Parameters<typeof definicion>[0], titulo: string) =>
  definicion(clave).columnas.findIndex((c) => c.titulo === titulo)

describe('cada hoja dice lo que lleva', () => {
  it('cada hoja de datos tiene nombre válido, qué tiene y la descripción de cada columna', () => {
    const nombres = new Set<string>()
    for (const clave of CLAVES_DE_HOJA) {
      const nombre = nombreDeHoja(clave)
      expect(nombre.length).toBeLessThanOrEqual(31)
      expect(nombre).not.toMatch(/[:\\/?*[\]]/)
      nombres.add(nombre)
      if (clave === 'leeme') continue
      const d = definicion(clave)
      expect(d.queTiene.length, clave).toBeGreaterThan(20)
      if (d.tope !== null) expect(d.cuales, `${clave} tiene tope y no dice cuáles quedan`).toBeTruthy()
      // Las 23 horas de «Cuándo te visitan» comparten la descripción de la primera.
      const sinDescripcion = d.columnas.filter((c) => !c.descripcion && !/^\d\d:00$/.test(c.titulo))
      expect(sinDescripcion.map((c) => c.titulo), clave).toEqual([])
    }
    expect(nombres.size).toBe(CLAVES_DE_HOJA.length)
    expect(nombreDeHoja('leeme')).toBe('Léeme')
  })

  it('«Léeme» trae la fecha, la zona, el período, cada hoja y cada columna descrita', () => {
    const filas = filasDelLeeme({
      ahora: new Date('2026-11-02T13:00:00Z'),
      zona: 'America/Santiago',
      desde: '2026-10-03',
      hasta: '2026-11-02',
      cuenta: null,
      pagina: null,
      bots: false,
      filas: { visitas: 3 },
      recortes: [],
    })
    const texto = filas.flat().map((c) => String(c.valor)).join('\n')
    expect(texto).toContain('America/Santiago')
    expect(texto).toContain('Del 2026-10-03 al 2026-11-02')
    expect(texto).toContain('YouTube')
    expect(texto).toContain('Cada hoja lleva todo lo que había')
    expect(filas.some((f) => f[0]?.valor === 'Exportada el' && typeof f[1]?.valor === 'number')).toBe(true)
    for (const clave of CLAVES_DE_HOJA) {
      if (clave === 'leeme') continue
      expect(texto).toContain(`Columnas de «${nombreDeHoja(clave)}»`)
      for (const c of definicion(clave).columnas) if (c.descripcion) expect(texto).toContain(c.descripcion)
    }
  })

  it('«Léeme» dice qué quedó fuera de cada hoja cortada', () => {
    const recorte = { hoja: 'visitas' as const, llevadas: 100_000, total: 340_512, porTiempo: false }
    expect(fraseDeRecorte(recorte)).toBe(
      'Visitas: lleva las más recientes, 100.000 de 340.512. Elige un período más corto para tenerla entera.',
    )
    expect(fraseDeRecorte({ ...recorte, porTiempo: true, llevadas: 40_000 })).toMatch(/se acabó el tiempo y llevó 40\.000 filas/)
  })
})

describe('YouTube: solo lo que da su API, nada calculado', () => {
  const claves = ['hook']

  it('una publicación de Instagram lleva lo ganado, el arrastre y «contra su cuenta»', () => {
    const f = filaDePublicacion(fila({}), 'UTC', cuenta, { hook: 'pregunta' }, claves, 2)
    expect(f[COLUMNA('publicaciones', 'Views ganadas')]).toBe(400)
    expect(f[COLUMNA('publicaciones', 'Interacciones ganadas')]).toBe(12)
    expect(f[COLUMNA('publicaciones', 'Contra su cuenta')]).toBe(2)
    expect(f[COLUMNA('publicaciones', 'Arrastre')]).toBe(0.05)
    expect(f[COLUMNA('publicaciones', 'CTR')]).toBe(0.25)
    expect(f.at(-1)).toBe('pregunta')
  })

  it('una de YouTube lleva sus contadores y deja vacío todo lo calculado, aunque le llegue un valor', () => {
    // Como la entrega `getPostRows`: lo ganado ya en null. «Contra su cuenta» llega con valor a
    // propósito, para ver que la hoja no lo deja pasar.
    const yt = fila({
      network: 'youtube',
      viewsChange: null,
      viewsA7Dias: null,
      likesChange: null,
      commentsChange: null,
      sharesChange: null,
      pull: null,
    })
    const f = filaDePublicacion(yt, 'UTC', cuenta, null, claves, 3)
    expect(f[COLUMNA('publicaciones', 'Views')]).toBe(1000)
    expect(f[COLUMNA('publicaciones', 'Likes')]).toBe(50)
    for (const titulo of ['Views ganadas', 'Interacciones ganadas', 'Views a los 7 días', 'Contra su cuenta', 'Arrastre']) {
      expect(f[COLUMNA('publicaciones', titulo)], titulo).toBeNull()
    }
    // Las visitas las mide Tu Parrilla: van.
    expect(f[COLUMNA('publicaciones', 'Visitas')]).toBe(20)
  })

  it('los suscriptores ganados de YouTube no se calculan, ni por día ni por período', () => {
    const lectura = {
      dia: '2026-10-10',
      red: 'youtube',
      handle: '@canal',
      followers: 120,
      followersAntes: 100,
      totalViews: 5000,
      videoCount: 12,
      profileViews: null,
      reach: null,
      views: null,
      accountsEngaged: null,
    }
    expect(filaDeSeguidores(lectura)[4]).toBeNull()
    expect(filaDeSeguidores(lectura)[3]).toBe(120)
    expect(filaDeSeguidores({ ...lectura, red: 'instagram' })[4]).toBe(20)

    const tarjeta = { network: 'youtube', accountId: 'acc-1', followers: 120, followersChange: 20, profileViews: null, reach: null, dayLabel: null }
    const deYoutube = filaDeCuenta({ ...cuenta, network: 'youtube' }, tarjeta, null, 'UTC')
    expect(deYoutube[COLUMNA('cuentas', 'Seguidores')]).toBe(120)
    expect(deYoutube[COLUMNA('cuentas', 'Seguidores ganados')]).toBeNull()
  })
})

describe('de la base a la fila', () => {
  it('una visita va sin coordenadas ni hash, con su etiqueta, sus UTM y la hora en la zona', () => {
    const f = filaDeVisita(
      {
        id: 'v-1',
        creadaEn: new Date('2026-11-02T13:00:00Z'),
        slug: 'yo',
        referrerNetwork: 'instagram',
        referrer: '=cmd|',
        campaign: 'reel-1',
        utmSource: 'ig',
        utmMedium: 'social',
        utmCampaign: 'otoño',
        utmContent: null,
        country: 'CL',
        region: 'RM',
        city: 'Santiago',
        timezone: 'America/Santiago',
        deviceType: 'mobile',
        os: 'iOS',
        browser: 'Instagram',
        language: 'es-CL',
        isBot: false,
      },
      'America/Santiago',
    )
    expect(f).toHaveLength(definicion('visitas').columnas.length)
    expect(f[0]).toBeCloseTo(46_328 + 10 / 24, 8)
    expect(f.slice(1, 9)).toEqual(['/yo', 'Instagram', '=cmd|', 'reel-1', 'ig', 'social', 'otoño', null])
    expect(f[13]).toBe('Celular')
    expect(f[17]).toBe('No')
  })

  it('cada constructor da tantas celdas como columnas tiene su hoja', () => {
    const destino: DestinoProgramado = {
      hora: new Date('2026-11-05T15:00:00Z'),
      status: 'failed',
      archivado: false,
      red: 'instagram',
      handle: '@prueba',
      texto: 'hola',
      lastError: 'Meta dijo que no',
      intentos: 3,
      externalId: null,
      aLaBandeja: false,
      videos: 1,
      imagenes: 2,
      atributos: { hook: 'pregunta' },
      referencia: null,
      creado: new Date('2026-11-01T15:00:00Z'),
    }
    const programado = filaDeDestino(destino, 'UTC')
    expect(programado).toHaveLength(definicion('programado').columnas.length)
    expect(programado[1]).toBe('Se quemó')
    expect(programado[6]).toBe('Meta dijo que no')
    expect(programado[9]).toBe('1 video, 2 imágenes')
    expect(programado[10]).toBe('{"hook":"pregunta"}')
    expect(filaDeDestino({ ...destino, status: 'scheduled' }, 'UTC')[1]).toBe('Reintentando')
    expect(filaDeDestino({ ...destino, status: 'published', lastError: null }, 'UTC')[6]).toBeNull()

    const comentario = filaDeComentario(
      {
        publicadoEn: new Date('2026-11-01T15:00:00Z'),
        red: 'instagram',
        handle: '@prueba',
        publicacion: 'hola',
        enlace: null,
        autor: 'alguien',
        texto: '@todos miren',
        estado: 'en_la_red',
        respuesta: 'gracias',
        automatico: true,
        palabra: 'guia',
        privado: 'fallido',
        error: null,
        errorPrivado: 'Instagram no dejó',
      },
      'UTC',
    )
    expect(comentario).toHaveLength(definicion('comentarios').columnas.length)
    expect(comentario[7]).toBe('Respondido desde la red')
    expect(comentario[11]).toBe('No salió')
    expect(comentario[12]).toBe('Instagram no dejó')

    expect(filasDelMapa([{ dow: 1, hour: 9, visits: 4 }])[0]).toHaveLength(definicion('cuando').columnas.length)
    for (const f of filasDelResumen({
      redes: { viewsGanadas: null, seguidoresGanados: 3, interacciones: 0, visitasDesdePublicaciones: 0, arrastre: null, publicaciones: 0 },
      pagina: {
        ahora: { visits: 1, uniques: 1, clicks: 0, ctr: 0, conClick: 0 },
        antes: { visits: 0, uniques: 0, clicks: 0, ctr: 0, conClick: 0 },
      },
    })) {
      expect(f).toHaveLength(definicion('resumen').columnas.length)
    }
  })
})
