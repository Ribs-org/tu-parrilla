import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { contarRacha } = await import('./racha')

describe('la racha', () => {
  it('cuenta los días seguidos hasta hoy', () => {
    expect(contarRacha(new Set(['2026-11-09', '2026-11-10', '2026-11-11']), '2026-11-11')).toEqual({ dias: 3, hoy: true })
  })

  it('si hoy todavía no sale nada, cuenta hasta ayer: se apaga a medianoche', () => {
    expect(contarRacha(new Set(['2026-11-08', '2026-11-09', '2026-11-10']), '2026-11-11')).toEqual({ dias: 3, hoy: false })
  })

  it('un día sin nada la corta', () => {
    expect(contarRacha(new Set(['2026-11-07', '2026-11-08', '2026-11-10', '2026-11-11']), '2026-11-11')).toEqual({ dias: 2, hoy: true })
  })

  it('sin ayer ni hoy no hay racha', () => {
    expect(contarRacha(new Set(['2026-11-08', '2026-11-09']), '2026-11-11')).toEqual({ dias: 0, hoy: false })
    expect(contarRacha(new Set(), '2026-11-11')).toEqual({ dias: 0, hoy: false })
  })

  it('cruza el mes y el año', () => {
    expect(contarRacha(new Set(['2025-12-31', '2026-01-01']), '2026-01-01')).toEqual({ dias: 2, hoy: true })
  })
})
