import AsyncStorage from '@react-native-async-storage/async-storage'

export type Cached<T> = { data: T; savedAt: number }

/**
 * La publicación que se acaba de tocar en Los Números: el detalle la busca acá primero,
 * porque esa lista no vive en ninguna de las cachés de «Tus publicaciones».
 */
export const POST_ABIERTO = 'post-abierto'

/** Cinco minutos: lo justo para que abrir dos veces seguidas no golpee la red. */
const FRESH_MS = 5 * 60_000

const PREFIJO = 'cache:'

/**
 * La forma de lo guardado. Sube cuando una ruta que se guarda acá cambia lo que devuelve: la
 * pantalla nueva leería el dato de antes al abrir —antes de que llegue el de la red— y un
 * campo que no está puede romperla. Con otra versión, lo de antes no se lee y se barre al
 * abrir la app (`barrerCachesViejas`).
 */
const VERSION = 1

function claveDe(key: string): string {
  return `${PREFIJO}v${VERSION}:${key}`
}

/** Las claves de caché de entre todas las del almacén, de cualquier versión. */
export function clavesDeCache(claves: readonly string[]): string[] {
  return claves.filter((c) => c.startsWith(PREFIJO))
}

/** Las claves de caché guardadas con otra versión, o sin versión: las de antes del 2026-10-21. */
export function clavesDeOtraVersion(claves: readonly string[]): string[] {
  return clavesDeCache(claves).filter((c) => !c.startsWith(claveDe('')))
}

/**
 * Qué decir del dato guardado y si conviene refrescar. La app siempre muestra lo que
 * tiene y refresca por detrás; esto solo decide el sello y si vale la pena la llamada.
 */
export function freshness(
  savedAt: number | null,
  now: number,
): { fresca: boolean; etiqueta: string | null } {
  if (savedAt === null) return { fresca: false, etiqueta: null }
  const edad = now - savedAt
  const etiqueta =
    edad < 60_000
      ? 'recién'
      : edad < 3600_000
        ? `hace ${Math.floor(edad / 60_000)} min`
        : edad < 86_400_000
          ? `hace ${Math.floor(edad / 3600_000)} h`
          : `hace ${Math.floor(edad / 86_400_000)} d`
  return { fresca: edad < FRESH_MS, etiqueta }
}

export async function readCache<T>(key: string): Promise<Cached<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(claveDe(key))
    return raw ? (JSON.parse(raw) as Cached<T>) : null
  } catch {
    return null
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(claveDe(key), JSON.stringify({ data, savedAt: Date.now() }))
  } catch {
    // Una caché que no se pudo escribir no es motivo para arruinar la pantalla.
  }
}

async function borrarDeEntre(elegir: (claves: readonly string[]) => string[]): Promise<void> {
  try {
    const claves = elegir(await AsyncStorage.getAllKeys())
    if (claves.length > 0) await AsyncStorage.multiRemove(claves)
  } catch {
    // Lo que no se pudo borrar ahora se intenta en la próxima vuelta.
  }
}

/** Todo lo guardado de las pantallas: al cerrar la sesión, y antes de reintentar una pantalla rota. */
export function borrarCaches(): Promise<void> {
  return borrarDeEntre(clavesDeCache)
}

/** Lo guardado con otra versión, que ya no se lee: al abrir la app. */
export function barrerCachesViejas(): Promise<void> {
  return borrarDeEntre(clavesDeOtraVersion)
}
