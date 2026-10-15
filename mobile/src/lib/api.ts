import { API_BASE } from './config'

export class SesionCaducada extends Error {}

/**
 * Un 401 no es un error de pantalla: es la sesión que dejó de valer (token revocado
 * o usuario quitado). Sube distinto para que la app vuelva a la pantalla de entrada
 * en vez de mostrar un mensaje rojo sin salida.
 */
export async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 401) throw new SesionCaducada()
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as T
}

/** La frase fija del servidor, lista para mostrarse tal cual, sea 400 o 500. */
export class RechazoApi extends Error {}

export async function apiPost<T>(path: string, token: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (response.status === 401) throw new SesionCaducada()
  if (!response.ok) {
    const cuerpo = (await response.json().catch(() => ({}))) as { error?: string }
    if (typeof cuerpo.error === 'string') throw new RechazoApi(cuerpo.error)
    throw new Error(`HTTP ${response.status}`)
  }
  return (await response.json()) as T
}
