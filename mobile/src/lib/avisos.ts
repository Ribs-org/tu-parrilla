import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'
import { requireOptionalNativeModule } from 'expo'
import { Platform } from 'react-native'
import type * as Notificaciones from 'expo-notifications'

import { RechazoApi, SesionCaducada, apiDelete, apiGet, apiPost, apiPut } from './api'

// Los avisos al teléfono: lo que se quemó, un fierro que se enfría o se apaga, la pregunta del chef,
// una comanda que terminó, la respuesta del equipo, el resumen de La Mesa y lo bueno de «Lo que
// trajo» —un hito, o lo que trajo el día—, que se apaga aparte (`leerLoBueno`). Los manda el servidor por
// el servicio de push de Expo (`src/lib/push/` en la raíz); acá se pide el permiso, se saca el token
// de este teléfono y se registra, y se borra al apagarlos o al cerrar sesión.
//
// `expo-notifications` entró en la 1.2.0, y un módulo nativo no llega por aire: un binario sin él
// revienta al cargar `expo-notifications`, que pide sus módulos nativos con `requireNativeModule`
// apenas se importa. Por eso no se importa arriba —el `import type` de arriba se borra al compilar—:
// se pregunta primero si el nativo está (`requireOptionalNativeModule`, que devuelve null en vez de
// lanzar) y solo entonces se carga con un `require` adentro de la función, como `reproductor.ts` con
// `expo-audio`. Sin el módulo, Ajustes dice que los avisos llegan con la versión nueva.

type Modulo = typeof Notificaciones

/** El canal de Android de los avisos. El servidor lo nombra igual (`CANAL_ANDROID`, en `src/lib/push/expo.ts`). */
export const CANAL = 'avisos'

/** Lo que eligió la persona en este teléfono: encendidos, apagados, o nada todavía (se le pregunta). */
export type Preferencia = 'encendidos' | 'apagados'
export const CLAVE_PREFERENCIA = 'avisos-telefono'
/** El token de Expo que este teléfono registró, para borrarlo al apagar o al salir sin preguntarle al sistema. */
export const CLAVE_TOKEN = 'avisos-token'
/** El token que no se alcanzó a borrar al salir, con la sesión con que se borra: se reintenta al abrir. */
const CLAVE_POR_BORRAR = 'avisos-por-borrar'

export const SIN_PERMISO = 'El teléfono no deja que Tu Parrilla te avise. Actívalo en los ajustes del teléfono, en Notificaciones.'
export const NO_SE_PUDO = 'No se pudieron encender los avisos. Revisa tu conexión y vuelve a intentarlo.'
export const NO_SE_PUDO_APAGAR = 'No se pudieron apagar los avisos. Revisa tu conexión y vuelve a intentarlo.'

/** Si esta app trae el módulo nativo de los avisos (la 1.2.0 en adelante). En la web, no. */
export function hayAvisos(): boolean {
  if (Platform.OS === 'web') return false
  try {
    return requireOptionalNativeModule('ExpoPushTokenManager') !== null && requireOptionalNativeModule('ExpoNotificationPermissionsModule') !== null
  } catch {
    return false
  }
}

function modulo(): Modulo | null {
  if (!hayAvisos()) return null
  // Recién acá, y solo si `hayAvisos()`: ver arriba.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as Modulo
}

/** Una pantalla de la app, como la recibe `router.navigate`. */
export type RutaDelAviso =
  | { pathname: '/(tabs)' }
  | { pathname: '/ajustes' }
  | { pathname: '/mesa' }
  | { pathname: '/corte/[id]'; params: { id: string } }
  | { pathname: '/(tabs)/cocina'; params: { vista: 'comandas'; n: string } }

/**
 * Adónde lleva tocar un aviso, según su tipo (`data.tipo`, que pone el servidor): el fierro y la
 * respuesta del equipo, a Ajustes (Los Fierros arriba, el libro al final); la pregunta del chef y la
 * comanda, a «Tus comandas» de La Cocina; el resumen de comentarios, a La Mesa; un hito, al detalle
 * de su corte (`data.id`); lo quemado y lo que trajo el día, a La Parrilla, y lo que no se
 * reconoce, igual. `n` cambia en cada
 * toque, para que La Cocina vuelva a «Tus comandas» aunque ya estuviera abierta en otra parte.
 */
export function rutaDelAviso(data: unknown, n: string = String(Date.now())): RutaDelAviso {
  const tipo = data && typeof data === 'object' ? (data as { tipo?: unknown }).tipo : null
  if (tipo === 'fierro' || tipo === 'sugerencia') return { pathname: '/ajustes' }
  if (tipo === 'comentarios') return { pathname: '/mesa' }
  if (tipo === 'hito') {
    const id = (data as { id?: unknown }).id
    if (typeof id === 'string' && id) return { pathname: '/corte/[id]', params: { id } }
  }
  if (tipo === 'pregunta' || tipo === 'comanda') return { pathname: '/(tabs)/cocina', params: { vista: 'comandas', n } }
  return { pathname: '/(tabs)' }
}

export async function leerPreferencia(): Promise<Preferencia | null> {
  try {
    const valor = await AsyncStorage.getItem(CLAVE_PREFERENCIA)
    return valor === 'encendidos' || valor === 'apagados' ? valor : null
  } catch {
    return null
  }
}

async function guardarPreferencia(valor: Preferencia): Promise<void> {
  await AsyncStorage.setItem(CLAVE_PREFERENCIA, valor).catch(() => undefined)
}

/** El id del proyecto de Expo, que pide el token: el del build, o el de `app.json`. */
export function idDelProyecto(constantes: {
  easConfig?: { projectId?: string } | null
  expoConfig?: { extra?: { eas?: { projectId?: string } } } | null
}): string | null {
  return constantes.easConfig?.projectId ?? constantes.expoConfig?.extra?.eas?.projectId ?? null
}

/** Cómo está el permiso: concedido, por preguntar, o negado sin vuelta (solo desde los ajustes del teléfono). */
export type Permiso = 'concedido' | 'por-preguntar' | 'negado'

export async function leerPermiso(): Promise<Permiso | null> {
  const N = modulo()
  if (!N) return null
  const p = await N.getPermissionsAsync()
  if (p.granted) return 'concedido'
  return p.canAskAgain ? 'por-preguntar' : 'negado'
}

/**
 * El canal de Android, antes de pedir el permiso y el token: en Android 13 en adelante el sistema no
 * pregunta mientras no haya un canal, y un aviso a un canal que no existe no se muestra.
 */
async function prepararCanal(N: Modulo): Promise<void> {
  if (Platform.OS !== 'android') return
  await N.setNotificationChannelAsync(CANAL, {
    name: 'Avisos',
    description: 'Lo que se quemó, las cuentas que se enfrían, el chef, La Mesa y lo bueno de tus cortes.',
    importance: N.AndroidImportance.HIGH,
  })
}

async function registrar(N: Modulo, sesion: string): Promise<void> {
  const projectId = idDelProyecto(Constants as Parameters<typeof idDelProyecto>[0])
  const { data: token } = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
  await apiPost('/api/mobile/push', sesion, { token, plataforma: Platform.OS === 'ios' ? 'ios' : 'android' })
  await AsyncStorage.setItem(CLAVE_TOKEN, token).catch(() => undefined)
}

export type AlEncender = { ok: true } | { ok: false; error: string; permiso?: 'negado' }

/**
 * Enciende los avisos: el canal, el permiso del sistema (en Android 13 en adelante,
 * `POST_NOTIFICATIONS`, que trae el propio `expo-notifications`) y el token registrado en el
 * servidor. Lo llama quien eligió encenderlos: la pregunta de la primera vez o Ajustes.
 */
export async function encender(sesion: string): Promise<AlEncender> {
  const N = modulo()
  if (!N) return { ok: false, error: NO_SE_PUDO }
  try {
    await prepararCanal(N)
    let permiso = await N.getPermissionsAsync()
    if (!permiso.granted && permiso.canAskAgain) permiso = await N.requestPermissionsAsync()
    if (!permiso.granted) return { ok: false, error: SIN_PERMISO, permiso: 'negado' }
    await registrar(N, sesion)
    await guardarPreferencia('encendidos')
    return { ok: true }
  } catch (error) {
    if (error instanceof SesionCaducada) throw error
    if (error instanceof RechazoApi) return { ok: false, error: error.message }
    return { ok: false, error: NO_SE_PUDO }
  }
}

/** La pregunta de la primera vez, contestada con «Ahora no»: no se vuelve a preguntar, y quedan en Ajustes. */
export async function ahoraNo(): Promise<void> {
  await guardarPreferencia('apagados')
}

/** Apaga los avisos en este teléfono: borra su token del servidor. Lanza si no se pudo, para decirlo. */
export async function apagar(sesion: string): Promise<void> {
  const token = await AsyncStorage.getItem(CLAVE_TOKEN).catch(() => null)
  if (token) await apiDelete(`/api/mobile/push/${encodeURIComponent(token)}`, sesion)
  await AsyncStorage.removeItem(CLAVE_TOKEN).catch(() => undefined)
  await guardarPreferencia('apagados')
}

/**
 * Al abrir la app con los avisos encendidos: vuelve a registrar el token, que Expo puede cambiar. En
 * silencio: sin permiso —se lo quitaron en los ajustes del teléfono— o sin señal, no hace nada.
 */
export async function alAbrir(sesion: string): Promise<void> {
  const N = modulo()
  if (!N || (await leerPreferencia()) !== 'encendidos') return
  try {
    const permiso = await N.getPermissionsAsync()
    if (!permiso.granted) return
    await prepararCanal(N)
    await registrar(N, sesion)
  } catch (error) {
    if (error instanceof SesionCaducada) throw error
  }
}

/** Lo que tarda como mucho borrar el token al cerrar sesión: salir no puede quedarse esperando la red. */
const PLAZO_AL_SALIR_MS = 5_000

async function borrarEnElServidor(token: string, sesion: string): Promise<'borrado' | 'reintentar'> {
  try {
    await Promise.race([
      apiDelete(`/api/mobile/push/${encodeURIComponent(token)}`, sesion),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('plazo')), PLAZO_AL_SALIR_MS)),
    ])
    return 'borrado'
  } catch (error) {
    // Una sesión que ya no vale, o un rechazo del servidor, no se arreglan reintentando.
    return error instanceof SesionCaducada || error instanceof RechazoApi ? 'borrado' : 'reintentar'
  }
}

/**
 * Al cerrar sesión: el token sale del servidor, para que este teléfono no siga mostrando los avisos de
 * la cuenta, y la preferencia se borra, para que quien entre después elija de nuevo. Sin señal, el
 * token queda anotado con la sesión y se borra al abrir la app la próxima vez (`reintentarBorrado`).
 */
export async function olvidarAlSalir(sesion: string | null): Promise<void> {
  const token = await AsyncStorage.getItem(CLAVE_TOKEN).catch(() => null)
  await Promise.allSettled([AsyncStorage.removeItem(CLAVE_TOKEN), AsyncStorage.removeItem(CLAVE_PREFERENCIA)])
  if (!token || !sesion) return
  if ((await borrarEnElServidor(token, sesion)) === 'reintentar') {
    await SecureStore.setItemAsync(CLAVE_POR_BORRAR, JSON.stringify({ token, sesion })).catch(() => undefined)
  }
}

/** Al abrir la app: el token que no se alcanzó a borrar al salir. */
export async function reintentarBorrado(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    const guardado = await SecureStore.getItemAsync(CLAVE_POR_BORRAR)
    if (!guardado) return
    const { token, sesion } = JSON.parse(guardado) as { token?: unknown; sesion?: unknown }
    if (typeof token !== 'string' || typeof sesion !== 'string' || (await borrarEnElServidor(token, sesion)) === 'borrado') {
      await SecureStore.deleteItemAsync(CLAVE_POR_BORRAR)
    }
  } catch {
    // Queda para la próxima vez.
  }
}

/** Lo que el componente de los avisos necesita del módulo, ya cargado; null sin el módulo. */
export function moduloDeAvisos(): Modulo | null {
  return modulo()
}

/**
 * Si a la cuenta le llegan los avisos de lo bueno (`GET /api/mobile/push/bueno`). Null sin señal o
 * con un sitio de antes que no tiene la ruta: Ajustes no muestra el botón.
 */
export async function leerLoBueno(token: string): Promise<boolean | null> {
  try {
    const { encendido } = await apiGet<{ encendido?: unknown }>('/api/mobile/push/bueno', token)
    return typeof encendido === 'boolean' ? encendido : null
  } catch (error) {
    if (error instanceof SesionCaducada) throw error
    return null
  }
}

/** Enciende o apaga los avisos de lo bueno para la cuenta, en todos sus teléfonos. Devuelve cómo quedaron. */
export async function guardarLoBueno(token: string, encendido: boolean): Promise<boolean> {
  const r = await apiPut<{ encendido: boolean }>('/api/mobile/push/bueno', token, { encendido })
  return r.encendido
}

export const NO_SE_PUDO_LO_BUENO = 'No se pudo cambiar. Revisa tu conexión y vuelve a intentarlo.'

