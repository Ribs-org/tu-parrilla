import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as Updates from 'expo-updates'
import { Linking, Platform } from 'react-native'
import { conPlazo } from './api'
import { API_BASE } from './config'

// Si hay que ir a la tienda (`GET /api/mobile/version`, `src/lib/version-de-la-app.ts` en la raíz):
// por debajo de la versión recomendada, un aviso que se cierra; por debajo de la mínima, una
// pantalla que no deja seguir. Es puro JavaScript, así que llega por aire también a la 1.1.0:
// justamente a la que más le sirve.

/** Lo que dice el servidor para esta plataforma. */
export type VersionDelServidor = {
  recomendada: string
  minima: string
  tienda: string
  novedades: string
}

export type LoQueToca = 'obligada' | 'sugerida' | null

/** La última respuesta del servidor: con ella la pantalla de la mínima sale también sin señal. */
const CLAVE_VERSION = 'version-del-servidor'
/** La recomendada que ya se avisó, para no avisarla en cada apertura. */
const CLAVE_AVISADA = 'version-avisada'

/** El texto del botón que lleva a la tienda. */
export const IR_A_LA_TIENDA = Platform.OS === 'ios' ? 'Ir al App Store' : 'Ir a la Play Store'

/**
 * `-1`, `0` o `1`, número por número: «1.10.0» va después de «1.2.0», que como texto iría antes.
 * Lo que no es número cuenta como cero.
 */
export function compararVersiones(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  return 0
}

/** Si esta versión tiene que actualizarse, puede, o no hace falta. Sin alguna de las dos, nada. */
export function loQueToca(propia: string | null, servidor: VersionDelServidor | null): LoQueToca {
  if (!propia || !servidor) return null
  if (compararVersiones(propia, servidor.minima) < 0) return 'obligada'
  if (compararVersiones(propia, servidor.recomendada) < 0) return 'sugerida'
  return null
}

/**
 * La versión de este binario, la que se instaló desde la tienda. Es la `runtimeVersion`, que en
 * esta app es la versión (`"policy": "appVersion"` en `app.json`) y no cambia con lo que llega por
 * aire; en desarrollo no la hay, y vale la de `app.json`.
 */
export function versionPropia(): string | null {
  return Updates.runtimeVersion ?? Constants.expoConfig?.version ?? null
}

function esVersion(v: unknown): v is VersionDelServidor {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return ['recomendada', 'minima', 'tienda', 'novedades'].every((k) => typeof o[k] === 'string')
}

/** Lo de esta plataforma en una respuesta del servidor, o null si no trae o no se entiende. */
export function deLaPlataforma(cuerpo: unknown, plataforma: string = Platform.OS): VersionDelServidor | null {
  if (!cuerpo || typeof cuerpo !== 'object') return null
  const v = (cuerpo as Record<string, unknown>)[plataforma]
  return esVersion(v) ? v : null
}

/** La última respuesta que se guardó, para arrancar sin esperar a la red. */
export async function versionGuardada(): Promise<VersionDelServidor | null> {
  try {
    const guardada = await AsyncStorage.getItem(CLAVE_VERSION)
    return guardada ? deLaPlataforma({ [Platform.OS]: JSON.parse(guardada) }) : null
  } catch {
    return null
  }
}

/**
 * Lo que dice el servidor ahora, y lo guarda. Sin señal, o con un sitio de antes (404), devuelve
 * `undefined` para que se siga con lo guardado: una falla de red no levanta ni baja la pantalla de
 * la mínima.
 */
export async function leerVersion(): Promise<VersionDelServidor | null | undefined> {
  try {
    const cuerpo = await conPlazo(`${API_BASE}/api/mobile/version`, {}, async (r) => (r.ok ? ((await r.json()) as unknown) : undefined))
    if (cuerpo === undefined) return undefined
    const v = deLaPlataforma(cuerpo)
    await (v ? AsyncStorage.setItem(CLAVE_VERSION, JSON.stringify(v)) : AsyncStorage.removeItem(CLAVE_VERSION)).catch(() => {})
    return v
  } catch {
    return undefined
  }
}

/** Si esa recomendada todavía no se avisó en este teléfono. */
export async function faltaAvisar(recomendada: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CLAVE_AVISADA)) !== recomendada
  } catch {
    return false
  }
}

export async function marcarAvisada(recomendada: string): Promise<void> {
  await AsyncStorage.setItem(CLAVE_AVISADA, recomendada).catch(() => {})
}

/** Abre la página de la app en la tienda: Android la abre en la Play Store, no en el navegador. */
export async function abrirLaTienda(v: VersionDelServidor): Promise<void> {
  await Linking.openURL(v.tienda).catch(() => {})
}
