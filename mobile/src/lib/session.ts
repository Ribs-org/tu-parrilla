import * as SecureStore from 'expo-secure-store'

import { API_BASE } from './config'
import { SERVIDOR_FALLO, SIN_SENAL, fraseDeRechazo } from './ingreso'

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

/** Frases fijas: el usuario ve qué pasó, no el detalle del transporte. */
async function postear(path: string, body: unknown): Promise<{ cuerpo: unknown } | { error: string }> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { error: SIN_SENAL }
  }
  const cuerpo: unknown = await response.json().catch(() => null)
  if (!response.ok) return { error: fraseDeRechazo(cuerpo) }
  return { cuerpo }
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
  await saveToken(token)
  return { token }
}
