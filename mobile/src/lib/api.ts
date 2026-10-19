import { API_BASE } from './config'

export class SesionCaducada extends Error {}

/** La frase fija del servidor, lista para mostrarse tal cual, sea 400, 404 o 500. */
export class RechazoApi extends Error {}

/**
 * Un 401 no es un error de pantalla: es la sesión que dejó de valer (token revocado
 * o usuario quitado). Sube distinto para que la app vuelva a la pantalla de entrada
 * en vez de mostrar un mensaje rojo sin salida. Cualquier otra respuesta que no sea 2xx
 * sube como `RechazoApi` si el servidor mandó su frase, o como un error genérico si no.
 */
async function pedir<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  })
  if (response.status === 401) throw new SesionCaducada()
  if (!response.ok) {
    const cuerpo = (await response.json().catch(() => ({}))) as { error?: string }
    if (typeof cuerpo.error === 'string') throw new RechazoApi(cuerpo.error)
    throw new Error(`HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

export function apiGet<T>(path: string, token: string): Promise<T> {
  return pedir<T>(path, token)
}

export function apiPost<T>(path: string, token: string, body: unknown): Promise<T> {
  return pedir<T>(path, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiPut<T>(path: string, token: string, body: unknown): Promise<T> {
  return pedir<T>(path, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiDelete<T>(path: string, token: string): Promise<T> {
  return pedir<T>(path, token, { method: 'DELETE' })
}
