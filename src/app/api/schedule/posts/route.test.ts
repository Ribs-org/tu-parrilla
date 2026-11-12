import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

// El lote que mueve fechas (`PATCH /api/schedule/posts`, issue #375), sin base: se dobla quién es
// el dueño de la llave y la regla de cada fila (`cambiarFecha`, que tiene su prueba contra una
// Postgres). Lo que se prueba acá es la puerta y el reparto: un resultado por fila, en orden, con
// los rechazos como datos y no como un error del lote.
const dueno = vi.fn()
vi.mock('@/lib/llaves', () => ({ duenoDeLaLlave: (...args: unknown[]) => dueno(...args) }))
vi.mock('@/lib/usuarios', () => ({ buscarPorId: async () => ({ zona: 'America/Santiago' }) }))
vi.mock('@/lib/schedule-leer', () => ({ leerProgramados: async () => [] }))
const mover = vi.fn()
vi.mock('@/lib/social/publish/cambiar-fecha', async (original) => ({
  ...(await original<typeof import('@/lib/social/publish/cambiar-fecha')>()),
  cambiarFecha: (...args: unknown[]) => mover(...args),
}))

const { PATCH } = await import('./route')

function lote(cuerpo: unknown): Request {
  return new Request('https://ejemplo.cl/api/schedule/posts', {
    method: 'PATCH',
    headers: { authorization: 'Bearer tp_llave', 'content-type': 'application/json' },
    body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  })
}

beforeEach(() => {
  dueno.mockReset()
  dueno.mockResolvedValue('usuario-7')
  mover.mockReset()
})

describe('PATCH /api/schedule/posts', () => {
  it('sin una llave válida es 401 y no mueve nada', async () => {
    dueno.mockResolvedValueOnce(null)
    expect((await PATCH(lote({ posts: [] }))).status).toBe(401)
    expect(mover).not.toHaveBeenCalled()
  })

  it('mueve cada fila a su fecha, en orden, y un rechazo es un resultado más', async () => {
    mover.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ error: 'Ya salió en alguna cuenta: su fecha ya no se cambia.', status: 409 })
    const r = await PATCH(
      lote({
        posts: [
          { id: 'a', fecha: '2030-11-25 10:00' },
          { id: 'b', fecha: '2030-11-26 10:00' },
        ],
      }),
    )
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({
      resultados: [
        { id: 'a', ok: true, fecha: '2030-11-25 10:00' },
        { id: 'b', ok: false, error: 'Ya salió en alguna cuenta: su fecha ya no se cambia.' },
      ],
    })
    expect(mover.mock.calls).toEqual([
      ['usuario-7', 'a', '2030-11-25 10:00', 'America/Santiago'],
      ['usuario-7', 'b', '2030-11-26 10:00', 'America/Santiago'],
    ])
  })

  it('una fila sin id, con algo más que la fecha o repetida se rechaza sin tocarla', async () => {
    mover.mockResolvedValue({ ok: true })
    const r = await PATCH(
      lote({
        posts: [
          { fecha: '2030-11-25 10:00' },
          { id: 'a', fecha: '2030-11-25 10:00', texto: 'otro' },
          { id: 'b', fecha: '2030-11-25 10:00' },
          { id: 'b', fecha: '2030-11-27 10:00' },
        ],
      }),
    )
    const { resultados } = (await r.json()) as { resultados: Array<{ id: string | null; ok: boolean; error?: string }> }
    expect(resultados.map((x) => [x.id, x.ok, x.error])).toEqual([
      [null, false, 'El cuerpo debe ser JSON con { posts: [{ id, fecha }] }.'],
      ['a', false, 'Solo se cambia «fecha»: el texto, la media y las cuentas no se editan por API.'],
      ['b', true, undefined],
      ['b', false, 'Ese post ya viene más arriba en el lote.'],
    ])
    expect(mover).toHaveBeenCalledTimes(1)
  })

  it('un cuerpo sin posts, o con más de 50, es 400', async () => {
    expect((await PATCH(lote('no es json'))).status).toBe(400)
    expect((await PATCH(lote({ fechas: [] }))).status).toBe(400)
    const r = await PATCH(lote({ posts: Array.from({ length: 51 }, (_, i) => ({ id: `p${i}`, fecha: '2030-11-25 10:00' })) }))
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({ error: 'Máximo 50 posts por lote.' })
    expect(mover).not.toHaveBeenCalled()
  })
})
