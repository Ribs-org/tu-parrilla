import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'
import {
  ErrorDeAnalitica,
  PERMISO_ANALITICA,
  audienciaDe,
  consultaDeAudiencia,
  consultaDeDias,
  consultaDeVideos,
  consultar,
  diasDe,
  duracion,
  esSinPermiso,
  filasDeReporte,
  gruposDeVideos,
  nombreDeAudiencia,
  nombreDeFuente,
  paisesDe,
  pasosParaBorrarAnalitica,
  restarDias,
  sinAnalitica,
  tieneAnalitica,
  traficoDe,
  urlDeConsulta,
  videosDe,
} from './analitica-youtube'

const VERIFICADOS =
  'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl'

/** Una respuesta de `reports.query` como la da Google: cabeceras y filas posicionales. */
function reporte(columnas: string[], filas: unknown[][]) {
  return { kind: 'youtubeAnalytics#resultTable', columnHeaders: columnas.map((name) => ({ name })), rows: filas }
}

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), { status })
}

describe('el permiso', () => {
  it('se lee de lo que Google dijo conceder, no de lo pedido', () => {
    expect(tieneAnalitica(null)).toBe(false)
    expect(tieneAnalitica(VERIFICADOS)).toBe(false)
    expect(tieneAnalitica(`${VERIFICADOS} ${PERMISO_ANALITICA}`)).toBe(true)
  })

  it('sin él, quedan los demás', () => {
    expect(sinAnalitica(`${VERIFICADOS} ${PERMISO_ANALITICA}`)).toBe(VERIFICADOS)
    expect(sinAnalitica(PERMISO_ANALITICA)).toBeNull()
    expect(sinAnalitica(null)).toBeNull()
  })
})

describe('las consultas', () => {
  it('van siempre al canal del token, con sus métricas y dimensiones', () => {
    const url = new URL(urlDeConsulta(consultaDeDias('2026-10-09', '2026-11-08')))
    expect(url.origin + url.pathname).toBe('https://youtubeanalytics.googleapis.com/v2/reports')
    expect(url.searchParams.get('ids')).toBe('channel==MINE')
    expect(url.searchParams.get('dimensions')).toBe('day')
    expect(url.searchParams.get('metrics')).toBe(
      'views,engagedViews,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained,subscribersLost',
    )
  })

  it('por video: filtra por los ids, ordena por views y no pasa el tope de 200', () => {
    const ids = Array.from({ length: 250 }, (_, i) => `v${i}`)
    const c = consultaDeVideos(ids.slice(0, 3), '2026-10-01', '2026-11-08')
    expect(c.filters).toBe('video==v0,v1,v2')
    expect(c.sort).toBe('-views')
    expect(c.maxResults).toBe(3)
    expect(c.metrics).toContain('averageViewPercentage')
    expect(consultaDeVideos(ids, '2026-10-01', '2026-11-08').maxResults).toBe(200)
  })

  it('la audiencia pide solo el porcentaje de espectadores, que es lo único que ese reporte da', () => {
    expect(consultaDeAudiencia('2026-10-12', '2026-11-08')).toMatchObject({ metrics: ['viewerPercentage'], dimensions: 'ageGroup,gender' })
  })

  it('los videos se agrupan por edad, y cada grupo pide desde el día de su video más viejo', () => {
    const videos = Array.from({ length: 450 }, (_, i) => ({ externalId: `v${i}`, dia: restarDias('2026-11-08', i) }))
    const grupos = gruposDeVideos(videos)
    expect(grupos.map((g) => g.ids.length)).toEqual([200, 200, 50])
    expect(grupos[0]!.ids[0]).toBe('v0')
    expect(grupos[0]!.desde).toBe(restarDias('2026-11-08', 199))
    expect(grupos[2]!.desde).toBe(restarDias('2026-11-08', 449))
    expect(gruposDeVideos([])).toEqual([])
  })

  it('restarDias cuenta días del calendario', () => {
    expect(restarDias('2026-11-08', 27)).toBe('2026-10-12')
    expect(restarDias('2026-03-01', 1)).toBe('2026-02-28')
  })
})

describe('consultar, con Google doblado', () => {
  it('manda el token del dueño y devuelve filas con nombre', async () => {
    const fetchFalso = vi.fn(async () => respuesta(200, reporte(['day', 'views'], [['2026-11-07', 120]])))
    const filas = await consultar('token-del-dueno', consultaDeDias('2026-11-01', '2026-11-08'), fetchFalso as unknown as typeof fetch)
    expect(filas).toEqual([{ day: '2026-11-07', views: 120 }])
    const [, init] = fetchFalso.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).toEqual({ Authorization: 'Bearer token-del-dueno' })
  })

  it('si YouTube rechaza la combinación, repite una vez sin engagedViews', async () => {
    const pedidas: string[] = []
    const fetchFalso = vi.fn(async (url: string) => {
      pedidas.push(new URL(url).searchParams.get('metrics')!)
      return pedidas.length === 1
        ? respuesta(400, { error: { code: 400, message: 'Unknown identifier (engagedViews) given in field parameters.metrics.' } })
        : respuesta(200, reporte(['day', 'views'], [['2026-11-07', 5]]))
    })
    const filas = await consultar('t', consultaDeDias('2026-11-01', '2026-11-08'), fetchFalso as unknown as typeof fetch)
    expect(pedidas).toHaveLength(2)
    expect(pedidas[1]).not.toContain('engagedViews')
    expect(diasDe(filas)[0]).toMatchObject({ day: '2026-11-07', views: 5, engagedViews: null })
  })

  it('un 400 sin métrica opcional que quitar no se repite', async () => {
    const fetchFalso = vi.fn(async () => respuesta(400, 'mala consulta'))
    await expect(consultar('t', consultaDeAudiencia('2026-10-12', '2026-11-08'), fetchFalso as unknown as typeof fetch)).rejects.toThrow(
      ErrorDeAnalitica,
    )
    expect(fetchFalso).toHaveBeenCalledTimes(1)
  })

  it('un 401 o un 403 de permisos es «sin permiso»; uno de cuota, no', async () => {
    for (const [status, cuerpo, sinPermiso] of [
      [401, '{"error":{"status":"UNAUTHENTICATED"}}', true],
      [403, '{"error":{"errors":[{"reason":"insufficientPermissions"}]}}', true],
      [403, '{"error":{"details":[{"reason":"ACCESS_TOKEN_SCOPE_INSUFFICIENT"}]}}', true],
      [403, '{"error":{"errors":[{"reason":"quotaExceeded"}]}}', false],
      [500, 'backendError', false],
    ] as const) {
      expect(esSinPermiso(status, cuerpo)).toBe(sinPermiso)
      const fetchFalso = vi.fn(async () => respuesta(status, cuerpo))
      const error = await consultar('t', consultaDeAudiencia('a', 'b'), fetchFalso as unknown as typeof fetch).catch((e) => e)
      expect(error).toBeInstanceOf(ErrorDeAnalitica)
      expect(error.sinPermiso).toBe(sinPermiso)
    }
  })
})

describe('cómo se lee cada reporte', () => {
  it('sin filas, nada; con filas, cada columna por su nombre', () => {
    expect(filasDeReporte({ columnHeaders: [{ name: 'day' }] })).toEqual([])
    expect(filasDeReporte(reporte(['a', 'b'], [[1, 'x']]))).toEqual([{ a: 1, b: 'x' }])
  })

  it('un video trae su retención tal cual, aunque un Short repetido pase de 100', () => {
    const filas = filasDeReporte(
      reporte(
        ['video', 'views', 'estimatedMinutesWatched', 'averageViewDuration', 'averageViewPercentage', 'subscribersGained'],
        [['abc', 1500, 210.4, 27, 112.35, 3]],
      ),
    )
    expect(videosDe(filas)).toEqual([
      expect.objectContaining({ videoId: 'abc', views: 1500, minutosVistos: 210, duracionMedia: 27, porcentajeVisto: 112.35, suscriptoresGanados: 3, likes: null }),
    ])
  })

  it('tráfico, países y audiencia, con su tipo y su clave', () => {
    expect(traficoDe(filasDeReporte(reporte(['insightTrafficSourceType', 'views', 'estimatedMinutesWatched'], [['SHORTS', 900, 80]])))).toEqual([
      { tipo: 'trafico', clave: 'SHORTS', views: 900, minutosVistos: 80, porcentaje: null },
    ])
    const paises = paisesDe(
      filasDeReporte(reporte(['country', 'views', 'estimatedMinutesWatched'], Array.from({ length: 14 }, (_, i) => [`C${i}`, 100 - i, 1]))),
    )
    expect(paises).toHaveLength(10)
    expect(audienciaDe(filasDeReporte(reporte(['ageGroup', 'gender', 'viewerPercentage'], [['age25-34', 'female', 31.2]])))).toEqual([
      { tipo: 'audiencia', clave: 'age25-34|female', views: null, minutosVistos: null, porcentaje: 31.2 },
    ])
  })

  it('los nombres van como en YouTube Studio, y lo desconocido pasa tal cual', () => {
    expect(nombreDeFuente('SHORTS')).toBe('Feed de Shorts')
    expect(nombreDeFuente('YT_SEARCH')).toBe('Búsqueda de YouTube')
    expect(nombreDeFuente('NUEVA_FUENTE')).toBe('NUEVA_FUENTE')
    expect(nombreDeAudiencia('age25-34|female')).toBe('Mujeres · 25–34')
    expect(nombreDeAudiencia('age65-|male')).toBe('Hombres · 65 o más')
  })

  it('la duración, como la escribe YouTube Studio', () => {
    expect(duracion(27)).toBe('0:27')
    expect(duracion(65)).toBe('1:05')
    expect(duracion(3725)).toBe('1:02:05')
    expect(duracion(null)).toBe('—')
  })
})

describe('pasosParaBorrarAnalitica', () => {
  it('borra las tres tablas de la cuenta, y nada más', () => {
    const dialecto = new PgDialect()
    const pasos = pasosParaBorrarAnalitica('cuenta-1').map((p) => dialecto.sqlToQuery(p))
    expect(pasos.map((p) => p.sql.match(/^delete from (\w+)/)?.[1])).toEqual([
      'youtube_analitica_dias',
      'youtube_analitica_desgloses',
      'youtube_analitica_videos',
    ])
    for (const p of pasos) {
      expect(p.sql).toContain('account_id = $1')
      expect(p.params).toEqual(['cuenta-1'])
    }
  })
})
