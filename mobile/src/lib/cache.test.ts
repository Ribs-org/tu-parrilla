import { describe, expect, it } from 'vitest'

import { clavesDeCache, clavesDeOtraVersion, freshness } from './cache'

const now = new Date('2026-09-04T12:00:00Z').getTime()

describe('freshness', () => {
  it('recién guardado está fresco', () => {
    expect(freshness(now - 30_000, now)).toEqual({ fresca: true, etiqueta: 'recién' })
  })

  it('minutos y horas se cuentan en español', () => {
    expect(freshness(now - 20 * 60_000, now).etiqueta).toBe('hace 20 min')
    expect(freshness(now - 3 * 3600_000, now).etiqueta).toBe('hace 3 h')
    expect(freshness(now - 30 * 3600_000, now).etiqueta).toBe('hace 1 d')
  })

  it('pasados cinco minutos deja de estar fresca y se refresca al abrir', () => {
    expect(freshness(now - 4 * 60_000, now).fresca).toBe(true)
    expect(freshness(now - 6 * 60_000, now).fresca).toBe(false)
  })

  it('sin marca de tiempo no hay nada que mostrar', () => {
    expect(freshness(null, now)).toEqual({ fresca: false, etiqueta: null })
  })
})

describe('las versiones de lo guardado', () => {
  const claves = ['tema', 'tema-sin-subir', 'cache:calendario', 'cache:v1:calendario', 'cache:v1:numeros:30d:todas', 'cache:v0:fierros']

  it('las de caché son las que empiezan con «cache:», de cualquier versión', () => {
    expect(clavesDeCache(claves)).toEqual(['cache:calendario', 'cache:v1:calendario', 'cache:v1:numeros:30d:todas', 'cache:v0:fierros'])
  })

  it('al abrir se barren las de otra versión y las de antes de que hubiera versión; las de esta se quedan', () => {
    expect(clavesDeOtraVersion(claves)).toEqual(['cache:calendario', 'cache:v0:fierros'])
  })
})
