import { beforeEach, describe, expect, it, vi } from 'vitest'

// La versión de la app contra la del servidor, sin teléfono: el almacén, la red y la tienda son de
// mentira. Lo que se prueba: que «1.10.0» va después de «1.2.0», qué toca con cada versión, que la
// versión propia es la del binario y no la de lo que llegó por aire, y que una falla de red no cambia
// lo que ya se sabía.
const h = vi.hoisted(() => ({
  runtime: '1.1.0' as string | null,
  almacen: new Map<string, string>(),
  respuesta: null as Response | Error | null,
  abiertas: [] as string[],
}))

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  Linking: { openURL: async (url: string) => void h.abiertas.push(url) },
}))
vi.mock('expo-updates', () => ({
  get runtimeVersion() {
    return h.runtime
  },
}))
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '9.9.9' } } }))
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => h.almacen.get(k) ?? null,
    setItem: async (k: string, v: string) => void h.almacen.set(k, v),
    removeItem: async (k: string) => void h.almacen.delete(k),
  },
}))
vi.mock('./api', () => ({
  conPlazo: async (_url: string, _init: RequestInit, leer: (r: Response) => Promise<unknown>) => {
    if (h.respuesta instanceof Error) throw h.respuesta
    return leer(h.respuesta!)
  },
}))

const v = await import('./version')

const ANDROID = {
  recomendada: '1.2.0',
  minima: '1.1.0',
  tienda: 'https://play.google.com/store/apps/details?id=cl.tuparrilla.app',
  novedades: 'Trae los avisos.',
}

beforeEach(() => {
  h.runtime = '1.1.0'
  h.almacen.clear()
  h.respuesta = null
  h.abiertas.length = 0
})

describe('compararVersiones', () => {
  it('compara número por número, no como texto', () => {
    expect(v.compararVersiones('1.10.0', '1.2.0')).toBe(1)
    expect(v.compararVersiones('1.2.0', '1.2.0')).toBe(0)
    expect(v.compararVersiones('1.2', '1.2.0')).toBe(0)
    expect(v.compararVersiones('1.1.9', '1.2.0')).toBe(-1)
    expect(v.compararVersiones('2.0.0', '1.99.99')).toBe(1)
  })
})

describe('loQueToca', () => {
  it('bajo la mínima obliga, bajo la recomendada sugiere, y desde ella nada', () => {
    expect(v.loQueToca('1.0.3', ANDROID)).toBe('obligada')
    expect(v.loQueToca('1.1.0', ANDROID)).toBe('sugerida')
    expect(v.loQueToca('1.2.0', ANDROID)).toBeNull()
    expect(v.loQueToca('1.3.0', ANDROID)).toBeNull()
  })

  it('sin la versión propia o sin la del servidor, nada', () => {
    expect(v.loQueToca(null, ANDROID)).toBeNull()
    expect(v.loQueToca('1.0.0', null)).toBeNull()
  })
})

describe('versionPropia', () => {
  it('es la del binario; la de app.json solo en desarrollo, sin runtime', () => {
    expect(v.versionPropia()).toBe('1.1.0')
    h.runtime = null
    expect(v.versionPropia()).toBe('9.9.9')
  })
})

describe('deLaPlataforma', () => {
  it('toma la de esta plataforma y descarta lo que no se entiende', () => {
    expect(v.deLaPlataforma({ android: ANDROID, ios: null })).toEqual(ANDROID)
    expect(v.deLaPlataforma({ android: ANDROID, ios: null }, 'ios')).toBeNull()
    expect(v.deLaPlataforma({ android: { ...ANDROID, minima: 1 } })).toBeNull()
    expect(v.deLaPlataforma('no')).toBeNull()
  })
})

describe('leerVersion', () => {
  it('guarda lo que dice el servidor, para arrancar con eso sin señal', async () => {
    h.respuesta = Response.json({ android: ANDROID, ios: null })
    expect(await v.leerVersion()).toEqual(ANDROID)
    expect(await v.versionGuardada()).toEqual(ANDROID)
  })

  it('sin señal o con un sitio de antes no dice nada, y lo guardado sigue', async () => {
    h.respuesta = Response.json({ android: ANDROID, ios: null })
    await v.leerVersion()
    h.respuesta = new Error('sin red')
    expect(await v.leerVersion()).toBeUndefined()
    h.respuesta = new Response('No encontrado', { status: 404 })
    expect(await v.leerVersion()).toBeUndefined()
    expect(await v.versionGuardada()).toEqual(ANDROID)
  })

  it('si el servidor ya no pide nada para esta plataforma, se borra lo guardado', async () => {
    h.respuesta = Response.json({ android: ANDROID, ios: null })
    await v.leerVersion()
    h.respuesta = Response.json({ android: null, ios: null })
    expect(await v.leerVersion()).toBeNull()
    expect(await v.versionGuardada()).toBeNull()
  })
})

describe('el aviso de la recomendada', () => {
  it('sale una vez por versión', async () => {
    expect(await v.faltaAvisar('1.2.0')).toBe(true)
    await v.marcarAvisada('1.2.0')
    expect(await v.faltaAvisar('1.2.0')).toBe(false)
    expect(await v.faltaAvisar('1.3.0')).toBe(true)
  })

  it('«Actualizar» abre la página de la tienda', async () => {
    await v.abrirLaTienda(ANDROID)
    expect(h.abiertas).toEqual([ANDROID.tienda])
  })
})
