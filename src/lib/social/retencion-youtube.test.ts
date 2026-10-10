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
    expect(pasos.map((p) => p.clave)).toEqual(['lecturasDePosts', 'lecturasDeCuenta', 'comentarios', 'videosSinTitulo'])
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
      expect(p.params).toEqual(['2026-09-10T09:00:00.000Z'])
    }
  })

  it('la fila del video no se borra: une las visitas propias a su etiqueta', () => {
    expect(pasos.some((p) => /delete from social_posts/.test(p.sql))).toBe(false)
  })
})
