import { describe, expect, it, vi } from 'vitest'

// `editar.ts` llega a `@/lib/usuarios` por `publish/batch`, que trae `server-only` (no resuelve
// bajo Vitest).
vi.mock('server-only', () => ({}))

const { bloqueoDe, limiteDeTexto, loQueSeConserva } = await import('./editar-movil')
const { EN_CURSO, YA_SALIO_EN_ALGUNA } = await import('./social/publish/editar')

const NADA = { archivos: 0, portada: false, atributos: false, palabra: null, redesConOpciones: [] }

describe('loQueSeConserva', () => {
  it('sin nada que el teléfono no edite, no hay nota', () => {
    expect(loQueSeConserva(NADA)).toBeNull()
  })

  it('nombra lo que queda como está, en una lista', () => {
    expect(loQueSeConserva({ ...NADA, archivos: 1 })).toBe(
      'Desde el teléfono no se cambia y queda como está: el archivo. Eso se cambia en el panel web.',
    )
    expect(
      loQueSeConserva({
        archivos: 3,
        portada: true,
        atributos: true,
        palabra: 'guia',
        redesConOpciones: ['tiktok', 'instagram', 'tiktok'],
      }),
    ).toBe(
      'Desde el teléfono no se cambia y queda como está: los 3 archivos, la portada, los atributos, la palabra clave «guia» y las opciones de TikTok y Instagram. Eso se cambia en el panel web.',
    )
  })
})

describe('bloqueoDe', () => {
  const ahora = new Date('2026-11-05T12:00:00Z')

  it('lo programado o quemado se edita', () => {
    expect(bloqueoDe([{ status: 'scheduled' }, { status: 'failed' }], ahora)).toBeNull()
  })

  it('lo que está saliendo, o reclamado por una corrida, espera', () => {
    expect(bloqueoDe([{ status: 'publishing' }], ahora)).toBe(EN_CURSO)
    expect(bloqueoDe([{ status: 'scheduled', reclamadoHasta: new Date('2026-11-05T12:01:00Z') }], ahora)).toBe(EN_CURSO)
  })

  it('lo que ya salió en alguna cuenta se corrige en el panel', () => {
    expect(bloqueoDe([{ status: 'published' }, { status: 'scheduled' }], ahora)).toBe(YA_SALIO_EN_ALGUNA)
  })
})

describe('limiteDeTexto', () => {
  it('las cifras de la validación de cada red', () => {
    expect(limiteDeTexto('x')).toBe(280)
    expect(limiteDeTexto('threads')).toBe(500)
    expect(limiteDeTexto('instagram')).toBe(2200)
  })
})
