import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'

// `server-only` no está en `node_modules` (solo lo entiende el bundler de Next).
vi.mock('server-only', () => ({}))

const { pasoParaBorrarComentariosTiktok, pasosParaBorrarYoutube } = await import('./desconectar')
const { pasosDeRetencion } = await import('./retencion-youtube')

describe('pasosParaBorrarYoutube', () => {
  const dialecto = new PgDialect()
  const ID = '6f1c1f8e-3a5b-4c2d-9e0f-1a2b3c4d5e6f'
  const pasos = pasosParaBorrarYoutube(ID).map((p) => dialecto.sqlToQuery(p))

  it('toca lo mismo que la retención de 30 días, en el mismo orden, sin esperar el plazo', () => {
    const tablaDe = (sql: string) => sql.match(/^(delete from|update) (\w+)/)?.slice(1).join(' ')
    expect(pasos.map((p) => tablaDe(p.sql))).toEqual(
      pasosDeRetencion(new Date()).map((p) => tablaDe(dialecto.sqlToQuery(p.sql).sql)),
    )
    expect(pasos[3]!.sql).toMatch(/update social_posts set caption = null, thumbnail_url = null/)
  })

  it('cada paso está acotado a esa cuenta, y a nada más', () => {
    for (const p of pasos) {
      expect(p.sql).toContain('account_id = $1')
      expect(p.params).toEqual([ID])
    }
  })

  it('la fila del video no se borra: une las visitas a su etiqueta', () => {
    expect(pasos.some((p) => /delete from social_posts/.test(p.sql))).toBe(false)
  })
})

describe('pasoParaBorrarComentariosTiktok', () => {
  it('borra solo la credencial de comentarios de esa cuenta y de ese dueño, con los dos como parámetros', () => {
    const { sql, params } = new PgDialect().sqlToQuery(pasoParaBorrarComentariosTiktok('owner-1', 'cuenta-1'))
    expect(sql).toBe("delete from ajustes where owner_id = $1 and clave = 'tiktok_comentarios:' || $2")
    expect(params).toEqual(['owner-1', 'cuenta-1'])
  })
})
