import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// El llavero y AsyncStorage, en memoria: lo que importa es qué queda en cada uno al salir.
const almacen = vi.hoisted(() => ({ llavero: new Map<string, string>(), disco: new Map<string, string>(), llaveroFalla: false }))

vi.mock('expo-secure-store', () => ({
  getItemAsync: async (clave: string) => almacen.llavero.get(clave) ?? null,
  setItemAsync: async (clave: string, valor: string) => void almacen.llavero.set(clave, valor),
  deleteItemAsync: async (clave: string) => {
    if (almacen.llaveroFalla) throw new Error('el llavero no contesta')
    almacen.llavero.delete(clave)
  },
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (clave: string) => almacen.disco.get(clave) ?? null,
    setItem: async (clave: string, valor: string) => void almacen.disco.set(clave, valor),
    removeItem: async (clave: string) => void almacen.disco.delete(clave),
    getAllKeys: async () => [...almacen.disco.keys()],
    multiRemove: async (claves: string[]) => claves.forEach((c) => almacen.disco.delete(c)),
  },
}))

const { cerrarEnElTelefono, entrar, readToken } = await import('./session')
const { writeCache, readCache } = await import('./cache')

beforeEach(() => {
  almacen.llavero = new Map([['mobile-token', 'token-de-ana']])
  almacen.disco = new Map([
    ['tema', 'dia'],
    ['tema-sin-subir', 'noche'],
    // Una caché de antes de que llevaran versión, que también es de la cuenta.
    ['cache:calendario', '{"data":{},"savedAt":1}'],
  ])
  almacen.llaveroFalla = false
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cerrarEnElTelefono', () => {
  it('borra el token y todo lo guardado de la cuenta; la copia del modo se queda', async () => {
    await writeCache('fierros', { cuentas: ['@ana'] })
    await cerrarEnElTelefono()
    expect(await readToken()).toBeNull()
    expect(await readCache('fierros')).toBeNull()
    expect([...almacen.disco.keys()]).toEqual(['tema'])
  })

  it('entrar también borra lo de la cuenta de antes: quien canceló el candado pudo entrar con otro correo', async () => {
    await writeCache('fierros', { cuentas: ['@ana'] })
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ token: 'token-de-beto' }), { status: 200 }))
    await expect(entrar('beto@ejemplo.cl', '123456')).resolves.toEqual({ token: 'token-de-beto' })
    expect(await readToken()).toBe('token-de-beto')
    expect(await readCache('fierros')).toBeNull()
    expect([...almacen.disco.keys()]).toEqual(['tema'])
  })

  it('si el llavero falla, lo guardado se borra igual', async () => {
    almacen.llaveroFalla = true
    await writeCache('fierros', { cuentas: ['@ana'] })
    await expect(cerrarEnElTelefono()).resolves.toBeUndefined()
    expect([...almacen.disco.keys()]).toEqual(['tema'])
  })
})
