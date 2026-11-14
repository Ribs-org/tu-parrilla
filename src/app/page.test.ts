import { beforeEach, describe, expect, it, vi } from 'vitest'

// La raíz: en el dominio del producto, la portada para quien no tiene sesión y el panel para quien
// sí (como entrar a facebook.com con la sesión abierta). En el dominio propio de un creador, su
// página, con o sin sesión.

const h = vi.hoisted(() => ({ producto: true, usuario: null as null | { id: string } }))

vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'tu-parrilla.cl' }) }))
vi.mock('next/navigation', () => ({
  redirect: (destino: string) => {
    throw Object.assign(new Error('redirect'), { destino })
  },
}))
vi.mock('@/lib/dominios', () => ({ esDominioDelProducto: () => h.producto }))
vi.mock('@/lib/auth', () => ({ usuarioActual: async () => h.usuario }))
vi.mock('@/lib/portada-numeros', () => ({ numerosDeLaPortada: async () => null }))
vi.mock('@/lib/tema-servidor', () => ({ temaDeLaPortada: async () => ({ tema: 'noche', delEnlace: false }) }))
vi.mock('@/components/landing', () => ({ Landing: () => null, metadataLanding: () => ({}) }))
vi.mock('@/lib/usuarios', () => ({ adminId: async () => 'admin-1' }))
vi.mock('@/lib/profiles', () => ({ getDefaultProfile: async () => ({ id: 'perfil' }) }))
vi.mock('@/lib/serve-profile', () => ({
  FirstRun: () => null,
  profileMetadata: () => ({}),
  renderProfile: () => 'la página del creador',
}))

const { default: HomePage } = await import('./page')
const visitar = () => HomePage({ searchParams: Promise.resolve({}) })

beforeEach(() => {
  h.producto = true
  h.usuario = null
})

describe('la raíz', () => {
  it('sin sesión, en el dominio del producto: la portada', async () => {
    const pagina = (await visitar()) as { type?: unknown }
    expect(pagina.type).toBeDefined()
  })

  it('con la sesión abierta, en el dominio del producto: al panel', async () => {
    h.usuario = { id: 'u-1' }
    await expect(visitar()).rejects.toMatchObject({ destino: '/admin' })
  })

  it('en el dominio de un creador, su página, aunque haya sesión', async () => {
    h.producto = false
    h.usuario = { id: 'u-1' }
    expect(await visitar()).toBe('la página del creador')
  })
})
