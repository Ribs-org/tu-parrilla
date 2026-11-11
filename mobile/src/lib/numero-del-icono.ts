import { requireOptionalNativeModule } from 'expo'
import { Platform } from 'react-native'

// El número sobre el ícono de la app y sobre la pestaña La Parrilla: los cortes de «Lo que trajo»
// con algo nuevo más los comentarios que esperan respuesta en La Mesa. Lo cuenta el servidor
// (`numero`, en `GET /api/mobile/lo-que-trajo` y en `POST /api/mobile/cortes/{id}/visto`); acá se
// guarda en memoria para la pestaña y se le pasa al ícono.
//
// El ícono lo pone el módulo nativo de `expo-notifications` (`ExpoBadgeModule`), que entró en la
// 1.2.0. Se le habla directo, sin cargar `expo-notifications`: así la 1.1.0, que no lo trae ni en el
// binario ni en `package.json`, recibe esto por aire y simplemente no pone nada en el ícono
// (`requireOptionalNativeModule` devuelve null en vez de lanzar). Es lo mismo que hace
// `setBadgeCountAsync` en Android. No todos los lanzadores muestran el número: Samsung sí; un Pixel
// muestra un punto mientras haya un aviso sin abrir.

type ModuloDelIcono = { setBadgeCountAsync: (numero: number) => Promise<boolean> }

let numero = 0
/** Lo último que se le pasó al ícono; null al arrancar, para limpiar el de la vez anterior. */
let enElIcono: number | null = null
const oyentes = new Set<() => void>()

/** Para `useSyncExternalStore`: el número de ahora. */
export function leerNumero(): number {
  return numero
}

/** Para `useSyncExternalStore`: avisa cuando cambia. */
export function escucharNumero(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

/** El número nuevo, para la pestaña y para el ícono. Cero lo borra. */
export function ponerNumero(nuevo: number): void {
  const limpio = Number.isFinite(nuevo) ? Math.max(0, Math.floor(nuevo)) : 0
  if (limpio !== numero) {
    numero = limpio
    for (const oyente of oyentes) oyente()
  }
  if (limpio !== enElIcono) {
    enElIcono = limpio
    void alIcono(limpio)
  }
}

async function alIcono(n: number): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await requireOptionalNativeModule<ModuloDelIcono>('ExpoBadgeModule')?.setBadgeCountAsync(n)
  } catch {
    // Un lanzador que no sabe de números no es un error de la app.
  }
}
