import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'

// `server-only` no está en `node_modules` (solo lo entiende el bundler de Next), y el
// módulo bajo prueba lo importa: sin este doble, el import ni siquiera resuelve.
vi.mock('server-only', () => ({}))

const { corteDeRetencion, pasosDeRetencion } = await import('./retencion-youtube')
const { DIAS_RETENCION_YOUTUBE } = await import('./politica-youtube')

describe('corteDeRetencion', () => {
  it('son 30 días antes, contados en milisegundos y no en días del calendario', () => {
    expect(DIAS_RETENCION_YOUTUBE).toBe(30)
    expect(corteDeRetencion(new Date('2026-10-31T09:00:00Z')).toISOString()).toBe('2026-10-01T09:00:00.000Z')
  })
})

describe('pasosDeRetencion', () => {
  const dialecto = new PgDialect()
  const corte = new Date('2026-09-10T09:00:00Z')
  const pasos = pasosDeRetencion(corte).map((p) => ({ clave: p.clave, ...dialecto.sqlToQuery(p.sql) }))

  it('toca las cuatro clases de dato que vienen de YouTube, cada una con su marca de refresco', () => {
    expect(pasos.map((p) => p.clave).slice(0, 4)).toEqual(['lecturasDePosts', 'lecturasDeCuenta', 'comentarios', 'videosSinTitulo'])
    expect(pasos[0]!.sql).toMatch(/delete from post_metrics .* m\.captured_at < \$1/)
    expect(pasos[1]!.sql).toMatch(/delete from account_metrics .* captured_at < \$1/)
    expect(pasos[2]!.sql).toMatch(/delete from post_comments .* created_at < \$1/)
    expect(pasos[3]!.sql).toMatch(/update social_posts set caption = null, thumbnail_url = null .* updated_at < \$1/)
  })

  it('ningún paso sale de YouTube: las otras redes no tienen este plazo', () => {
    for (const p of pasos) {
      expect(p.sql).toContain("network = 'youtube'")
    }
  })

  it('la fecha va como texto ISO, que es lo que el driver sabe mandar en SQL crudo', () => {
    for (const p of pasos) {
      expect(p.params.length).toBeGreaterThan(0)
      for (const param of p.params) expect(param).toBe('2026-09-10T09:00:00.000Z')
    }
  })

  it('la analítica no vence por vieja: vence sin el permiso o sin una comprobación en el plazo', () => {
    const conAutorizacion = pasosDeRetencion(corte, new Date('2026-09-20T09:00:00Z')).map((p) => ({
      clave: p.clave,
      ...dialecto.sqlToQuery(p.sql),
    }))
    const [dias, desgloses, videos] = conAutorizacion.slice(4)
    expect([dias!.clave, desgloses!.clave, videos!.clave]).toEqual(['analiticaDias', 'analiticaDesgloses', 'analiticaVideos'])
    for (const p of [dias!, desgloses!]) {
      expect(p.sql).not.toMatch(/captured_at/)
      expect(p.sql).toMatch(/scopes is null or position\('https:\/\/www\.googleapis\.com\/auth\/yt-analytics\.readonly' in scopes\) = 0/)
      expect(p.sql).toMatch(/analitica_verificada_en is null or analitica_verificada_en < \$1/)
      expect(p.params).toEqual(['2026-09-20T09:00:00.000Z'])
    }
    // El video sí vence por no refrescarse, o por borrado, además de por la autorización.
    expect(videos!.sql).toMatch(/v\.captured_at < \$1 or p\.archived_at is not null or p\.account_id in/)
    expect(videos!.params).toEqual(['2026-09-10T09:00:00.000Z', '2026-09-20T09:00:00.000Z'])
  })

  it('la fila del video no se borra: une las visitas propias a su etiqueta', () => {
    expect(pasos.some((p) => /delete from social_posts/.test(p.sql))).toBe(false)
  })
})
