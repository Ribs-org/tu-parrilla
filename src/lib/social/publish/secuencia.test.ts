import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { lugarEnSecuencia, ordenarParaPublicar } = await import('./secuencia')

const hora = new Date('2026-11-02T22:00:00Z')
const fila = (id: string, network: string, opciones: unknown, scheduledAt = hora) => ({
  id,
  target: { network, opciones },
  post: { scheduledAt },
})

describe('lugarEnSecuencia', () => {
  it('solo una historia de una secuencia tiene lugar', () => {
    expect(lugarEnSecuencia('instagram', { historia: { secuencia: 's', orden: 2 } })).toEqual({ secuencia: 's', orden: 2 })
    expect(lugarEnSecuencia('facebook', { historia: { secuencia: 's', orden: 1 } })).toEqual({ secuencia: 's', orden: 1 })
    expect(lugarEnSecuencia('instagram', { historia: true })).toBeNull()
    expect(lugarEnSecuencia('instagram', { trialReel: true })).toBeNull()
    expect(lugarEnSecuencia('tiktok', { historia: { secuencia: 's', orden: 2 } })).toBeNull()
  })
})

describe('ordenarParaPublicar', () => {
  it('a la misma hora, las historias de una secuencia van por su lugar', () => {
    const filas = [
      fila('c', 'instagram', { historia: { secuencia: 's', orden: 3 } }),
      fila('a', 'instagram', { historia: { secuencia: 's', orden: 1 } }),
      fila('b', 'instagram', { historia: { secuencia: 's', orden: 2 } }),
    ]
    expect(ordenarParaPublicar(filas).map((f) => f.id)).toEqual(['a', 'b', 'c'])
  })

  it('la hora manda sobre el lugar, y lo demás conserva el orden que traía', () => {
    const antes = new Date(hora.getTime() - 60_000)
    const filas = [
      fila('historia-2', 'instagram', { historia: { secuencia: 's', orden: 2 } }),
      fila('reel', 'instagram', null, antes),
      fila('foto', 'facebook', null),
    ]
    expect(ordenarParaPublicar(filas).map((f) => f.id)).toEqual(['reel', 'foto', 'historia-2'])
  })
})

describe('ordenarParaPublicar con los planes', () => {
  it('lo del pagado sale primero aunque venza después; la secuencia de un dueño sigue en orden', () => {
    const antes = new Date(hora.getTime() - 60_000)
    const filas = [
      { ...fila('gratis-reel', 'instagram', null, antes), prioridad: 0 },
      { ...fila('pagado-2', 'instagram', { historia: { secuencia: 's', orden: 2 } }), prioridad: 1 },
      { ...fila('pagado-1', 'instagram', { historia: { secuencia: 's', orden: 1 } }), prioridad: 1 },
      fila('sin-prioridad', 'facebook', null, antes),
    ]
    expect(ordenarParaPublicar(filas).map((f) => f.id)).toEqual(['pagado-1', 'pagado-2', 'gratis-reel', 'sin-prioridad'])
  })
})
