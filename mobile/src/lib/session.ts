import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

import { conPlazo } from './api'
import { borrarCaches } from './cache'
import { API_BASE } from './config'
import { SERVIDOR_FALLO, SIN_SENAL, fraseDeRechazo } from './ingreso'
import { CLAVE_TEMA_SIN_SUBIR } from './tema'

// El almacén seguro está respaldado por el llavero del sistema; la caché de datos
// vive en AsyncStorage, que es texto plano. El token nunca cruza esa frontera.
const KEY = 'mobile-token'

export function readToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY)
}

export function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(KEY, token)
}

export function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(KEY)
}

/**
 * Lo que la app guardó de una cuenta en este teléfono: lo último que mostró cada pantalla, y un
 * cambio de modo que no alcanzó a subir. Se borra al salir y también al entrar —quien canceló el
 * candado puede entrar con otro correo—, para que nadie vea en este teléfono nada de la cuenta de
 * antes ni le suba su modo. La copia del modo (`CLAVE_TEMA`) se queda: es del teléfono, y la
 * pantalla de entrada se dibuja con ella. Lo que falle al borrar no detiene el resto.
 */
async function borrarLoDeLaCuenta(): Promise<void> {
  await Promise.allSettled([borrarCaches(), AsyncStorage.removeItem(CLAVE_TEMA_SIN_SUBIR)])
}

/** Salir en este teléfono: el token y lo guardado de la cuenta. Termina aunque algo no se borre. */
export async function cerrarEnElTelefono(): Promise<void> {
  await Promise.allSettled([clearToken(), borrarLoDeLaCuenta()])
}

/** Frases fijas: el usuario ve qué pasó, no el detalle del transporte. */
async function postear(path: string, body: unknown): Promise<{ cuerpo: unknown } | { error: string }> {
  try {
    return await conPlazo(
      `${API_BASE}${path}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      async (response) => {
        const cuerpo: unknown = await response.json().catch(() => null)
        if (!response.ok) return { error: fraseDeRechazo(cuerpo) }
        return { cuerpo }
      },
    )
  } catch {
    return { error: SIN_SENAL }
  }
}

/** El mismo ingreso que el panel web: primero el correo, después el código que llega ahí. */
export async function pedirCodigo(correo: string): Promise<{ ok: true } | { error: string }> {
  const resultado = await postear('/api/mobile/session/codigo', { correo })
  return 'error' in resultado ? resultado : { ok: true }
}

export async function entrar(correo: string, codigo: string): Promise<{ token: string } | { error: string }> {
  const resultado = await postear('/api/mobile/session', { correo, codigo })
  if ('error' in resultado) return resultado
  const { cuerpo } = resultado
  const token = cuerpo && typeof cuerpo === 'object' && 'token' in cuerpo ? cuerpo.token : null
  if (typeof token !== 'string' || !token) return { error: SERVIDOR_FALLO }
  await borrarLoDeLaCuenta()
  await saveToken(token)
  return { token }
}
