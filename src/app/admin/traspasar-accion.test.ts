import { beforeEach, describe, expect, it, vi } from 'vitest'

// La acción cruza dueños: lo único que la separa de cualquier usuario es `requireAdmin`. El
// doble lanza como lanza el `redirect` de verdad, y el traspaso no debe ni empezar.

const dobles = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  traspasarCuenta: vi.fn(),
  revalidados: [] as string[],
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: (ruta: string) => dobles.revalidados.push(ruta) }))
vi.mock('next/navigation', () => ({ redirect: () => {} }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}))
vi.mock('@/lib/auth', () => ({
  requireUser: async () => ({ id: 'alguien' }),
  requireAdmin: dobles.requireAdmin,
  destroySession: async () => {},
}))
vi.mock('@/lib/social/traspasar', () => ({ traspasarCuenta: dobles.traspasarCuenta }))

const { traspasarCuentaAccion } = await import('./actions')

describe('traspasarCuentaAccion', () => {
  beforeEach(() => {
    dobles.requireAdmin.mockReset()
    dobles.traspasarCuenta.mockReset()
    dobles.revalidados.length = 0
  })

  it('quien no es admin no llega a traspasar nada', async () => {
    dobles.requireAdmin.mockRejectedValue(new Error('NEXT_REDIRECT'))

    await expect(traspasarCuentaAccion('cuenta', 'destino')).rejects.toThrow('NEXT_REDIRECT')
    expect(dobles.traspasarCuenta).not.toHaveBeenCalled()
  })

  it('el admin traspasa, y se refresca lo que la cuenta dejó y lo que recibió', async () => {
    dobles.requireAdmin.mockResolvedValue({ id: 'admin' })
    dobles.traspasarCuenta.mockResolvedValue({ nombre: '@cuenta', correo: 'bea@ejemplo.cl' })

    expect(await traspasarCuentaAccion('cuenta', 'destino')).toEqual({ nombre: '@cuenta', correo: 'bea@ejemplo.cl' })
    expect(dobles.traspasarCuenta).toHaveBeenCalledWith('cuenta', 'destino')
    expect(dobles.revalidados).toEqual(expect.arrayContaining(['/admin/usuarios', '/admin/accounts', '/admin/schedule']))
  })

  it('un traspaso rechazado devuelve la frase y no refresca nada', async () => {
    dobles.requireAdmin.mockResolvedValue({ id: 'admin' })
    dobles.traspasarCuenta.mockResolvedValue({ error: 'Esa cuenta ya es de esa persona.' })

    expect(await traspasarCuentaAccion('cuenta', 'destino')).toEqual({ error: 'Esa cuenta ya es de esa persona.' })
    expect(dobles.revalidados).toEqual([])
  })
})
