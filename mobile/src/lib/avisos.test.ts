import { beforeEach, describe, expect, it, vi } from 'vitest'

// Los avisos al teléfono sin teléfono: el módulo nativo, el almacén y la API son de mentira. Lo que
// se prueba: que sin el módulo nativo (la 1.1.0) no se carga `expo-notifications`, adónde lleva cada
// aviso, y que el token sale del servidor al apagar y al cerrar sesión, aunque sea en la apertura
// siguiente si no había señal.
const h = vi.hoisted(() => ({
  nativo: null as object | null,
  pedidos: [] as string[],
  plataforma: 'android' as string,
  almacen: new Map<string, string>(),
  seguro: new Map<string, string>(),
  borrados: [] as { ruta: string; sesion: string }[],
  borrar: { falla: null as Error | null },
}))

vi.mock('expo', () => ({
  requireOptionalNativeModule: (nombre: string) => {
    h.pedidos.push(nombre)
    return h.nativo
  },
}))
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return h.plataforma
    },
  },
}))
vi.mock('expo-notifications', () => {
  throw new Error('expo-notifications no se debía cargar sin su módulo nativo')
})
vi.mock('expo-constants', () => ({ default: { easConfig: null, expoConfig: { extra: { eas: { projectId: 'p-1' } } } } }))
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => h.almacen.get(k) ?? null,
    setItem: async (k: string, v: string) => void h.almacen.set(k, v),
    removeItem: async (k: string) => void h.almacen.delete(k),
  },
}))
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => h.seguro.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void h.seguro.set(k, v),
  deleteItemAsync: async (k: string) => void h.seguro.delete(k),
}))
vi.mock('./api', () => {
  class SesionCaducada extends Error {}
  class RechazoApi extends Error {}
  return {
    SesionCaducada,
    RechazoApi,
    apiPost: vi.fn(),
    apiDelete: vi.fn(async (ruta: string, sesion: string) => {
      if (h.borrar.falla) throw h.borrar.falla
      h.borrados.push({ ruta, sesion })
      return { ok: true }
    }),
  }
})

const avisos = await import('./avisos')
const { SesionCaducada } = await import('./api')

const TOKEN = 'ExponentPushToken[abc123def456]'

beforeEach(() => {
  h.nativo = null
  h.pedidos.length = 0
  h.plataforma = 'android'
  h.almacen.clear()
  h.seguro.clear()
  h.borrados.length = 0
  h.borrar.falla = null
})

describe('el módulo nativo', () => {
  it('sin él (la 1.1.0) no hay avisos, y encender no carga expo-notifications', async () => {
    expect(avisos.hayAvisos()).toBe(false)
    expect(avisos.moduloDeAvisos()).toBeNull()
    expect(await avisos.encender('sesion')).toEqual({ ok: false, error: avisos.NO_SE_PUDO })
    expect(await avisos.leerPermiso()).toBeNull()
    await expect(avisos.alAbrir('sesion')).resolves.toBeUndefined()
  })

  it('con él (la 1.2.0) los reconoce, por los dos módulos que usa', () => {
    h.nativo = {}
    expect(avisos.hayAvisos()).toBe(true)
    expect(h.pedidos).toEqual(['ExpoPushTokenManager', 'ExpoNotificationPermissionsModule'])
  })

  it('en la web, nunca', () => {
    h.nativo = {}
    h.plataforma = 'web'
    expect(avisos.hayAvisos()).toBe(false)
  })
})

describe('adónde lleva tocar un aviso', () => {
  it('cada tipo a su pantalla (los comentarios, a La Mesa), y lo desconocido a La Parrilla', () => {
    expect(avisos.rutaDelAviso({ tipo: 'fierro' })).toEqual({ pathname: '/ajustes' })
    expect(avisos.rutaDelAviso({ tipo: 'sugerencia', id: 's' })).toEqual({ pathname: '/ajustes' })
    expect(avisos.rutaDelAviso({ tipo: 'pregunta' }, '7')).toEqual({ pathname: '/(tabs)/cocina', params: { vista: 'comandas', n: '7' } })
    expect(avisos.rutaDelAviso({ tipo: 'comanda' }, '8')).toEqual({ pathname: '/(tabs)/cocina', params: { vista: 'comandas', n: '8' } })
    expect(avisos.rutaDelAviso({ tipo: 'quemado' })).toEqual({ pathname: '/(tabs)' })
    expect(avisos.rutaDelAviso({ tipo: 'comentarios' })).toEqual({ pathname: '/mesa' })
    expect(avisos.rutaDelAviso(undefined)).toEqual({ pathname: '/(tabs)' })
  })

  it('el id del proyecto: el del build, o el de app.json', () => {
    expect(avisos.idDelProyecto({ easConfig: { projectId: 'build' }, expoConfig: { extra: { eas: { projectId: 'json' } } } })).toBe('build')
    expect(avisos.idDelProyecto({ easConfig: null, expoConfig: { extra: { eas: { projectId: 'json' } } } })).toBe('json')
    expect(avisos.idDelProyecto({})).toBeNull()
  })
})

describe('apagar y salir', () => {
  it('apagar borra el token del servidor, codificado en la ruta, y deja la preferencia en apagados', async () => {
    h.almacen.set(avisos.CLAVE_TOKEN, TOKEN)
    await avisos.apagar('sesion')
    expect(h.borrados).toEqual([{ ruta: `/api/mobile/push/${encodeURIComponent(TOKEN)}`, sesion: 'sesion' }])
    expect(h.almacen.get(avisos.CLAVE_TOKEN)).toBeUndefined()
    expect(await avisos.leerPreferencia()).toBe('apagados')
  })

  it('apagar sin señal lanza, para decirlo, y no cambia la preferencia', async () => {
    h.almacen.set(avisos.CLAVE_TOKEN, TOKEN)
    h.almacen.set(avisos.CLAVE_PREFERENCIA, 'encendidos')
    h.borrar.falla = new TypeError('Network request failed')
    await expect(avisos.apagar('sesion')).rejects.toThrow()
    expect(await avisos.leerPreferencia()).toBe('encendidos')
  })

  it('«Ahora no» deja la preferencia en apagados: no se vuelve a preguntar', async () => {
    expect(await avisos.leerPreferencia()).toBeNull()
    await avisos.ahoraNo()
    expect(await avisos.leerPreferencia()).toBe('apagados')
  })

  it('al salir, el token sale del servidor y la preferencia se olvida, para quien entre después', async () => {
    h.almacen.set(avisos.CLAVE_TOKEN, TOKEN)
    h.almacen.set(avisos.CLAVE_PREFERENCIA, 'encendidos')
    await avisos.olvidarAlSalir('sesion')
    expect(h.borrados).toHaveLength(1)
    expect(await avisos.leerPreferencia()).toBeNull()
    expect(h.seguro.size).toBe(0)
  })

  it('al salir sin señal, queda anotado y se borra al abrir la app la próxima vez', async () => {
    h.almacen.set(avisos.CLAVE_TOKEN, TOKEN)
    h.borrar.falla = new TypeError('Network request failed')
    await avisos.olvidarAlSalir('sesion')
    expect(h.borrados).toEqual([])
    expect(h.seguro.size).toBe(1)

    h.borrar.falla = null
    await avisos.reintentarBorrado()
    expect(h.borrados).toEqual([{ ruta: `/api/mobile/push/${encodeURIComponent(TOKEN)}`, sesion: 'sesion' }])
    expect(h.seguro.size).toBe(0)
  })

  it('una sesión que ya no vale no se reintenta: no hay con qué borrarlo', async () => {
    h.almacen.set(avisos.CLAVE_TOKEN, TOKEN)
    h.borrar.falla = new SesionCaducada()
    await avisos.olvidarAlSalir('sesion')
    expect(h.seguro.size).toBe(0)
  })

  it('sin avisos encendidos, salir no le pide nada al servidor', async () => {
    await avisos.olvidarAlSalir('sesion')
    expect(h.borrados).toEqual([])
  })
})
